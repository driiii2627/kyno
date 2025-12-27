'use server';

import { createClient } from '@/utils/supabase/server';
import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function getProfilesAction() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { profiles: [], error: 'User not logged in' };
    }

    const { data: profiles, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) {
        return { profiles: [], error: error.message };
    }

    return { profiles };
}

export async function createProfileAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return { error: 'Você precisa estar logado.' };
    }

    const name = formData.get('name') as string;
    const avatar = formData.get('avatar') as string;
    const turnstileToken = formData.get('cf-turnstile-response') as string;

    if (!name || !avatar) {
        return { error: 'Nome e avatar são obrigatórios.' };
    }

    // Verify Turnstile
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY) {
        const verifyRes = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
            method: 'POST',
            body: `secret=${process.env.TURNSTILE_SECRET_KEY}&response=${turnstileToken}`,
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded'
            }
        });
        const verifyData = await verifyRes.json();
        if (!verifyData.success) {
            return { error: 'Falha na verificação de segurança (Captcha).' };
        }
    }

    // Check Limit (Max 5 profiles is standard, user wanted a limit)
    const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    if (count !== null && count >= 5) {
        return { error: 'Limite máximo de 5 perfis atingido.' };
    }

    const { error } = await supabase
        .from('profiles')
        .insert({
            user_id: user.id,
            name,
            avatar_url: avatar
        });

    if (error) {
        return { error: 'Erro ao criar perfil: ' + error.message };
    }

    revalidatePath('/profiles');
    return { success: true };
}

export async function updateProfileAction(formData: FormData) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Não autorizado' };

    const id = formData.get('id') as string;
    const name = formData.get('name') as string;
    const avatar = formData.get('avatar') as string;

    const { error } = await supabase
        .from('profiles')
        .update({ name, avatar_url: avatar })
        .eq('id', id)
        .eq('user_id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/profiles');
    return { success: true };
}

export async function deleteProfileAction(profileId: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Não autorizado' };

    const { error } = await supabase
        .from('profiles')
        .delete()
        .eq('id', profileId)
        .eq('user_id', user.id);

    if (error) return { error: error.message };

    revalidatePath('/profiles');
    return { success: true };
}

export async function switchProfileAction(profileId: string) {
    // Set a cookie to remember the active profile
    const cookieStore = await cookies();
    // Verify profile belongs to user first
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { error: 'Not logged in' };

    const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', profileId)
        .eq('user_id', user.id)
        .single();

    if (!profile) return { error: 'Profile not found' };

    // Set cookie
    cookieStore.set('X-Profile-ID', profileId, {
        path: '/',
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30 // 30 days
    });

    return { success: true };
}

export async function signOutAction() {
    const supabase = await createClient();
    await supabase.auth.signOut();
    const cookieStore = await cookies();
    cookieStore.delete('X-Profile-ID');
    redirect('/login');
}

export async function getActiveProfileAction() {
    const cookieStore = await cookies();
    const profileId = cookieStore.get('X-Profile-ID')?.value;

    if (!profileId) return { profile: null };

    const supabase = await createClient();
    const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', profileId)
        .single();

    return { profile };
}
