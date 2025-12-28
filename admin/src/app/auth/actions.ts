'use server'

import { revalidatePath } from 'next/cache'
import { redirect } from 'next/navigation'
import { createAdminClient } from '@/utils/supabase/admin'
import { createClient } from '@/utils/supabase/server'

export async function login(formData: FormData) {
    const supabase = await createClient()
    const adminSupabase = await createAdminClient()

    const email = formData.get('email') as string
    const password = formData.get('password') as string

    // 1. Check if email is in the admin whitelist (Security Layer 1)
    const { data: whitelistEntry } = await adminSupabase
        .from('admin_whitelist')
        .select('email')
        .eq('email', email)
        .single()

    if (!whitelistEntry) {
        redirect('/login?error=Acesso negado. Este email não é administrador.')
    }

    const { error } = await supabase.auth.signInWithPassword({
        email,
        password,
    })

    if (error) {
        redirect('/login?error=Invalid credentials')
    }

    revalidatePath('/', 'layout')
    redirect('/')
}
