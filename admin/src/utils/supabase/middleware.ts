import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function updateSession(request: NextRequest) {
    let supabaseResponse = NextResponse.next({
        request,
    })

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return request.cookies.getAll()
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) =>
                        request.cookies.set(name, value)
                    )
                    supabaseResponse = NextResponse.next({
                        request,
                    })
                    cookiesToSet.forEach(({ name, value, options }) =>
                        supabaseResponse.cookies.set(name, value, options)
                    )
                },
            },
        }
    )

    // Do not run Supabase middleware on static files or images
    if (request.nextUrl.pathname.startsWith('/_next') ||
        request.nextUrl.pathname.includes('.')) {
        return supabaseResponse;
    }

    const {
        data: { user },
    } = await supabase.auth.getUser()

    const isLoginPage = request.nextUrl.pathname === '/login';

    if (!user && !isLoginPage) {
        // Redirect to login if no user and trying to access protected route
        return NextResponse.redirect(new URL('/login', request.url))
    }

    if (user) {
        // Security Check: Database Driven Whitelist
        // We use the authenticated client. The RLS policy "Admins can read their own entry" 
        // ensures that if the user can find themselves in this table, they are authorized.
        const { data: isWhitelisted, error: whitelistError } = await supabase
            .from('admin_whitelist')
            .select('email')
            .eq('email', user.email)
            .single()

        if (whitelistError || !isWhitelisted) {
            await supabase.auth.signOut();
            return NextResponse.redirect(new URL('/login?error=unauthorized', request.url));
        }

        // If already logged in and at login page, go to dashboard
        if (isLoginPage) {
            return NextResponse.redirect(new URL('/', request.url))
        }
    }

    return supabaseResponse
}
