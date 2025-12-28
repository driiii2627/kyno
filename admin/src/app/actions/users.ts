'use server';

import { createAdminClient } from '@/utils/supabase/admin';
import { revalidatePath } from 'next/cache';

/**
 * Deletes a user by ID.
 * This will trigger Supabase's cascade delete for related data (profiles, etc.) if configured in DB,
 * otherwise it just deletes the auth user which usually orphaned rows or triggers.
 */
export async function deleteUserAction(userId: string) {
    if (!userId) return { error: 'ID do usuário inválido.' };

    try {
        const admin = await createAdminClient();

        // Prevent deleting the main admin itself (optional safety)
        const { data: { user: adminUser } } = await admin.auth.getUser();
        if (adminUser?.id === userId) {
            return { error: 'Você não pode deletar sua própria conta de admin aqui.' };
        }

        const { error } = await admin.auth.admin.deleteUser(userId);

        if (error) {
            console.error('Error deleting user:', error);
            return { error: error.message };
        }

        revalidatePath('/'); // Refresh the dashboard
        return { success: true };
    } catch (err: any) {
        return { error: err.message || 'Erro interno ao deletar usuário.' };
    }
}

/**
 * Updates a user's email.
 */
export async function updateUserEmailAction(userId: string, newEmail: string) {
    if (!userId || !newEmail) return { error: 'Dados inválidos.' };

    try {
        const admin = await createAdminClient();

        const { error } = await admin.auth.admin.updateUserById(userId, {
            email: newEmail,
            email_confirm: true // Auto-confirm the new email
        });

        if (error) {
            console.error('Error updating email:', error);
            return { error: error.message };
        }

        revalidatePath('/');
        return { success: true };
    } catch (err: any) {
        return { error: err.message || 'Erro interno ao atualizar email.' };
    }
}

/**
 * Deletes a specific profile by ID.
 */
export async function deleteProfileAction(profileId: string) {
    if (!profileId) return { error: 'ID do perfil inválido.' };

    try {
        const admin = await createAdminClient();

        // Delete the profile from the 'profiles' table
        // Since we are admin, we bypass RLS policies that might restrict this
        const { error } = await admin
            .from('profiles')
            .delete()
            .eq('id', profileId);

        if (error) {
            console.error('Error deleting profile:', error);
            return { error: error.message };
        }

        revalidatePath('/');
        return { success: true };
    } catch (err: any) {
        return { error: err.message || 'Erro interno ao deletar perfil.' };
    }
}
