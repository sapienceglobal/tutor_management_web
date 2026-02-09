import { NextResponse } from 'next/server';

export function middleware(request) {
    const token = request.cookies.get('token')?.value;
    const role = request.cookies.get('user_role')?.value;
    const { pathname } = request.nextUrl;

    // 1. Redirect to login if accessing protected routes without token
    if (!token) {
        if (pathname.startsWith('/tutor') || pathname.startsWith('/student')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 2. Role-based protection
    if (token && role) {
        // If Tutor tries to access Student routes
        if (role === 'tutor' && pathname.startsWith('/student')) {
            return NextResponse.redirect(new URL('/tutor/dashboard', request.url));
        }

        // If Student tries to access Tutor routes
        if (role === 'student' && pathname.startsWith('/tutor')) {
            return NextResponse.redirect(new URL('/student/dashboard', request.url));
        }

        // If logged in user tries to access auth pages (login/register), redirect to their dashboard
        if (pathname === '/login' || pathname === '/register') {
            if (role === 'tutor') {
                return NextResponse.redirect(new URL('/tutor/dashboard', request.url));
            } else {
                return NextResponse.redirect(new URL('/student/dashboard', request.url));
            }
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/tutor/:path*',
        '/student/:path*',
        '/login',
        '/register'
    ],
};
