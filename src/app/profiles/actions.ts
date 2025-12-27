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

    // 1. Check Profile Limit (Max 3)
    const { count } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

    if (count !== null && count >= 3) {
        return { error: 'Limite máximo de 3 perfis atingido.' };
    }

    // 2. Check Creation Rate Limit (2 minutes)
    const { data: lastProfile } = await supabase
        .from('profiles')
        .select('created_at')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

    if (lastProfile) {
        const lastCreated = new Date(lastProfile.created_at).getTime();
        const now = Date.now();
        const diffMinutes = (now - lastCreated) / (1000 * 60);

        if (diffMinutes < 2) {
            const remainingSeconds = Math.ceil((2 - diffMinutes) * 60);
            return { error: `Aguarde ${remainingSeconds} segundos para criar outro perfil.` };
        }
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
    const newName = formData.get('name') as string;
    const newAvatar = formData.get('avatar') as string;

    // Fetch current profile data
    const { data: currentProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', id)
        .eq('user_id', user.id)
        .single();

    if (fetchError || !currentProfile) return { error: 'Perfil não encontrado.' };

    const updates: any = {};
    const now = new Date();

    // 1. Name Check (7 Hours)
    if (newName && newName !== currentProfile.name) {
        if (currentProfile.last_name_update) {
            const lastUpdate = new Date(currentProfile.last_name_update).getTime();
            const diffHours = (now.getTime() - lastUpdate) / (1000 * 60 * 60);

            if (diffHours < 7) {
                const remainingHours = Math.ceil(7 - diffHours);
                return { error: `Você só pode alterar o nome a cada 7 horas. Aguarde ${remainingHours}h.` };
            }
        }
        updates.name = newName;
        updates.last_name_update = now.toISOString();
    }

    // 2. Avatar Check (2 Minutes)
    if (newAvatar && newAvatar !== currentProfile.avatar_url) {
        if (currentProfile.last_avatar_update) {
            const lastUpdate = new Date(currentProfile.last_avatar_update).getTime();
            const diffMinutes = (now.getTime() - lastUpdate) / (1000 * 60);

            if (diffMinutes < 2) {
                const remainingSeconds = Math.ceil((2 - diffMinutes) * 60);
                return { error: `Você só pode alterar a foto a cada 2 minutos. Aguarde ${remainingSeconds}s.` };
            }
        }
        updates.avatar_url = newAvatar;
        updates.last_avatar_update = now.toISOString();
    }

    if (Object.keys(updates).length === 0) {
        return { success: true }; // No changes detected
    }

    const { error } = await supabase
        .from('profiles')
        .update(updates)
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
