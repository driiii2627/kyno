
import { createClient } from '@supabase/supabase-js'

export async function createAdminClient() {
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY
    if (!serviceKey) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing')

    // Using core supabase-js client instead of ssr to ensure no cookies/sessions are auto-injected.
    // This guarantees we are acting as the Service Role (Super Admin).
    return createClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        serviceKey,
        {
            auth: {
                autoRefreshToken: false,
                persistSession: false
            }
        }
    )
}
