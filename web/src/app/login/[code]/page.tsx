import AuthForm from '@/components/auth/AuthForm';
import { loginAction, registerAction } from '@/app/auth/actions';
import { redirect } from 'next/navigation';
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import styles from '@/components/auth/AuthForm.module.css'; // Reusing container styles for wrapper

// Force dynamic to handle the [code] param and headers
export const dynamic = 'force-dynamic';

export default async function LoginPage({ params }: { params: Promise<{ code: string }> }) {
    const { code } = await params;
    const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

    if (!siteKey) {
        return <div style={{ color: 'white', textAlign: 'center', padding: '50px' }}>Erro: Site Key não configurada.</div>;
    }

    // Check if already logged in
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

    const { data: { session } } = await supabase.auth.getSession();

    if (session) {
        redirect('/');
    }

    // Bind server actions with the code? The form handles passing the code.
    // We pass the raw actions to the client component, which calls them.

    return (
        <div style={{
            minHeight: '100vh',
            background: 'linear-gradient(rgba(0,0,0,0.7), rgba(0,0,0,0.9)), url(/images/login-bg.jpg) no-repeat center center/cover',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '1rem'
        }}>
            <AuthForm
                loginCode={code}
                onLogin={loginAction}
                onRegister={registerAction}
                siteKey={siteKey}
            />
        </div>
    );
}
