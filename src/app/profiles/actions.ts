'use server';

import { createServerClient } from '@supabase/ssr';
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

// Helper to get Supabase Client
async function getSupabase() {
    const cookieStore = await cookies();
    return createServerClient(
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
}

export async function getProfilesAction() {
    const supabase = await getSupabase();

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching profiles:', error);
        return { error: 'Erro ao carregar perfis.' };
    }

    return { profiles };
}

export async function createProfileAction(formData: FormData) {
    const name = String(formData.get('name'));
    const avatar = String(formData.get('avatar'));
    const turnstileToken = String(formData.get('cf-turnstile-response'));

    // 1. Verify Cloudflare Turnstile
    const secretKey = process.env.TURNSTILE_SECRET_KEY;
    if (!secretKey) return { error: 'Configuração de servidor inválida.' };

    const headerList = await headers();
    const ip = headerList.get('x-forwarded-for') || '127.0.0.1';

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
        return { error: 'Falha na verificação de segurança.' };
    }

    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Insert (Trigger will handle ID generation and Limit check)
    const { data, error } = await supabase
        .from('profiles')
        .insert({
            user_id: user.id,
            name,
            avatar_url: avatar
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating profile:', error);
        if (error.message.includes('Limite')) {
            return { error: 'Você já atingiu o limite de 3 perfis.' };
        }
        return { error: 'Erro ao criar perfil.' };
    }

    return { success: true, profile: data };
}

export async function switchProfileAction(profileId: string) {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    // Verify ownership
    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .eq('user_id', user.id)
        .single();

    if (!profile) return { error: 'Perfil inválido.' };

    // Set Cookie
    const cookieStore = await cookies();
    cookieStore.set('kyno_active_profile', profileId, {
        path: '/',
        httpOnly: false, // Accessible by client if needed, or secure
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return { success: true };
}

export async function getActiveProfileAction() {
    const supabase = await getSupabase();
    const cookieStore = await cookies();
    const profileId = cookieStore.get('kyno_active_profile')?.value;

    if (!profileId) return { profile: null };

    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

    return { profile };
}

export async function signOutAction() {
    const supabase = await getSupabase();
    await supabase.auth.signOut();
    const cookieStore = await cookies();
    cookieStore.delete('kyno_active_profile');
    cookieStore.delete('valid_login_code');
    redirect('/login');
}

export async function deleteProfileAction(profileId: string) {
    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user.id);

    if (error) return { error: 'Erro ao deletar perfil.' };

    return { success: true };
}

export async function updateProfileAction(formData: FormData) {
    const id = String(formData.get('id')); // Profile ID
    const name = String(formData.get('name'));
    const avatar = String(formData.get('avatar'));

    const supabase = await getSupabase();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Unauthorized' };

    const { error } = await supabase
        .from('profiles')
        .update({ name, avatar_url: avatar })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { error: 'Erro ao atualizar perfil.' };

    return { success: true };
}
