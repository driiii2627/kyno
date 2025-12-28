'use server';

import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

const ALLOWED_DOMAINS = ['gmail.com', 'outlook.com', 'hotmail.com', 'live.com', 'yahoo.com', 'icloud.com', 'proton.me', 'protonmail.com'];

function isEmailAllowed(email: string) {
    const domain = email.split('@')[1]?.toLowerCase();
    return ALLOWED_DOMAINS.includes(domain);
}

export async function loginAction(formData: FormData) {
    const email = String(formData.get('email'));
    const password = String(formData.get('password'));
    const code = String(formData.get('code'));
    const turnstileToken = String(formData.get('cf-turnstile-response'));

    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1';

    // 0. Rate Limit Check (4 attempts, 2 minutes block)
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { }
                },
            },
        }
    );

    const { data: limitData, error: limitError } = await supabase.rpc('check_and_update_rate_limit', {
        request_ip: ip,
        request_email: email,
        request_type: 'login',
        max_attempts: 4,
        block_duration_seconds: 120
    });

    if (limitData && !limitData.allowed) {
        return {
            error: 'Muitas tentativas falhas. Tente novamente mais tarde.',
            blockedUntil: limitData.blocked_until
        };
    }

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

    // 2. Validate Credentials
    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('Login Error:', error.message);
        return { error: error.message };
    }

    // Success: Reset rate limit
    await supabase.rpc('reset_rate_limit', {
        request_ip: ip,
        request_type: 'login'
    });

    return { success: true };
}

export async function registerAction(formData: FormData) {
    const email = String(formData.get('email'));
    const password = String(formData.get('password'));
    const code = String(formData.get('code'));
    const turnstileToken = String(formData.get('cf-turnstile-response'));

    if (!isEmailAllowed(email)) {
        return { error: 'Domínio de e-mail não permitido. Use Gmail, Outlook, Yahoo, etc.' };
    }

    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1';

    // 0. Rate Limit Check (9 attempts, 2 minutes block)
    const cookieStore = await cookies();
    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() { return cookieStore.getAll(); },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        );
                    } catch { }
                },
            },
        }
    );

    const { data: limitData } = await supabase.rpc('check_and_update_rate_limit', {
        request_ip: ip,
        request_email: email,
        request_type: 'register',
        max_attempts: 9,
        block_duration_seconds: 120
    });

    if (limitData && !limitData.allowed) {
        return {
            error: 'Muitas tentativas de cadastro. Aguarde um momento.',
            blockedUntil: limitData.blocked_until
        };
    }

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
    const { data: isAllowed } = await supabase.rpc('check_ip_registration_rate_limit', {
        request_ip: ip
    });

    if (isAllowed === false) {
        return { error: 'Limite de contas atingido para este dispositivo.' };
    }

    // 3. Create Account
    let authData: { user: any; session: any } = { user: null, session: null };
    let authError: any = null;

    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (serviceRoleKey) {
        // Use Admin API to bypass email confirmation
        const { createClient } = await import('@supabase/supabase-js');
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            serviceRoleKey,
            {
                auth: {
                    autoRefreshToken: false,
                    persistSession: false
                }
            }
        );

        const { data: userData, error: createError } = await supabaseAdmin.auth.admin.createUser({
            email,
            password,
            email_confirm: true
        });

        if (createError) {
            authError = createError;
        } else if (userData.user) {
            authData.user = userData.user;
            // Now sign in to create the session for the user
            const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
                email,
                password
            });

            if (signInError) {
                console.error("Auto-login failed after admin creation", signInError);
            } else {
                authData.session = signInData.session;
            }
        }
    } else {
        // Fallback to standard flow
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
        });
        authData = data;
        authError = error;
    }

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

        // Reset rate limit on success
        await supabase.rpc('reset_rate_limit', {
            request_ip: ip,
            request_type: 'register'
        });
    }

    if (authData.session) {
        return { success: true, autoLogin: true };
    }

    return { success: true, autoLogin: false };
}
