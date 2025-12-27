'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

export async function loginAction(formData: FormData) {
    const email = String(formData.get('email'));
    const password = String(formData.get('password'));
    const code = String(formData.get('code'));

    // 1. Validate Credentials
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                    }
                },
            },
        }
    );

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        // Retornar a mensagem exata do erro para ajudar no debug (ex: Email not confirmed)
        console.error('Login Error:', error.message);
        return { error: error.message };
    }

    return { success: true };
}

export async function registerAction(formData: FormData) {
    const email = String(formData.get('email'));
    const password = String(formData.get('password'));
    const code = String(formData.get('code'));
    const turnstileToken = String(formData.get('cf-turnstile-response'));

    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1';

    // 1. Verify Cloudflare Turnstile
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) return { error: 'Configuração de servidor inválida.' };

    const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            secret: secretKey,
            response: turnstileToken,
            remoteip: ip,
        }),
    });

    const verifyJson = await verifyRes.json();
    if (!verifyJson.success) {
        return { error: 'Falha na verificação de segurança (Captcha).' };
    }

    // 2. Check IP Limit && Create Account
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll();
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch {
                    }
                },
            },
        }
    );

    const { data: isAllowed, error: rpcError } = await supabase.rpc('check_ip_registration_rate_limit', {
        request_ip: ip
    });

    if (isAllowed === false) {
        return { error: 'Limite de contas atingido para este dispositivo.' };
    }

    // 3. Create Account
    const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        // Opções removidas para evitar fluxo de confirmação se o projeto estiver configurado para tal, 
        // ou mantidas se necessário. O user disse que NÃO quer confirmação.
        // Se a confirmação de email estiver ligada no Supabase, isso aqui vai criar o user mas exigir confirmação.
        // Se estiver desligada, vai logar direto.
    });

    if (authError) {
        return { error: authError.message };
    }

    if (authData.user) {
        // Log access
        await supabase.from('kyno_user_security_logs').insert({
            user_id: authData.user.id,
            unique_login_code: code,
            registration_ip: ip,
            last_ip: ip
        });
    }

    // Se tiver sessão, foi logado automaticamente
    if (authData.session) {
        return { success: true, autoLogin: true };
    }

    // Se não tiver sessão, provavelmente requer confirmação de email ou configuração do Supabase
    return { success: true, autoLogin: false };
}
