'use server';

import { createAdminClient } from '@/utils/supabase/admin';

export async function sendNotification(data: any) {
    try {
        const supabase = await createAdminClient();

        // Data validation could happen here

        const { error } = await supabase.from('notifications').insert({
            title: data.title,
            message: data.message,
            image_url: data.image_url || null,
            action_buttons: data.action_buttons || [],
            type: data.type || 'info',
            target_audience: data.target_audience || 'all',
            is_active: true
        });

        if (error) {
            console.error('Supabase Error:', error);
            return { success: false, error: error.message };
        }

        return { success: true };
    } catch (err) {
        console.error('Server Action Error:', err);
        return { success: false, error: 'Internal Server Error' };
    }
}
