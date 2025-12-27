import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    let res = NextResponse.next({
        request: {
            headers: req.headers,
        },
    });

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return req.cookies.getAll();
                },
                setAll(cookiesToSet) {
                    cookiesToSet.forEach(({ name, value, options }) => req.cookies.set(name, value));
                    res = NextResponse.next({
                        request: {
                            headers: req.headers,
                        },
                    });
                    cookiesToSet.forEach(({ name, value, options }) =>
                        res.cookies.set(name, value, options)
                    );
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    const { pathname } = req.nextUrl;

    // Configurações de rotas
    const isLoginPage = pathname === '/login' || pathname.startsWith('/login/');
    const isAuthRoute = pathname.startsWith('/auth');
    const isPublicRoute = isLoginPage || isAuthRoute;

    // 1. Enforce Login: Se não estiver logado e tentar acessar rota protegida -> Redirect Login
    if (!user && !isPublicRoute) {
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
    }

    // 2. Se estiver logado e tentar acessar login -> Redirect Home
    if (user && isLoginPage) {
        const url = req.nextUrl.clone();
        url.pathname = '/';
        return NextResponse.redirect(url);
    }

    // 3. Logic for Unique Login Code
    // Caso 3a: Acesso a /login (raiz) -> Gera código, define cookie e redireciona
    if (pathname === '/login') {
        const randomCode = crypto.randomUUID();
        const url = req.nextUrl.clone();
        url.pathname = `/login/${randomCode}`;

        // Criamos a resposta de redirecionamento
        const redirectRes = NextResponse.redirect(url);

        // Definimos o cookie seguro para validar esse código
        redirectRes.cookies.set('valid_login_code', randomCode, {
            path: '/',
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            maxAge: 1800 // 30 minutos
        });

        return redirectRes;
    }

    // Caso 3b: Acesso a /login/[codigo] -> Valida se o código da URL bate com o cookie
    if (pathname.startsWith('/login/')) {
        const codeInUrl = pathname.split('/').pop();
        const codeInCookie = req.cookies.get('valid_login_code')?.value;

        // Se o código não bater ou não existir cookie -> Redireciona para /login para gerar novo
        if (!codeInUrl || codeInUrl !== codeInCookie) {
            const url = req.nextUrl.clone();
            url.pathname = '/login';
            return NextResponse.redirect(url);
        }
    }

    return res;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder files (images, etc)
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};
