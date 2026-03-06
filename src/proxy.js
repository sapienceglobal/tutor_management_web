import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Secret must match backend JWT_SECRET. In production, JWT_SECRET is required.
const rawSecret = process.env.JWT_SECRET;
if (process.env.NODE_ENV === 'production' && !rawSecret) {
    throw new Error('JWT_SECRET is required in production. Set it in your environment.');
}
const secretKey = new TextEncoder().encode(rawSecret || 'fallback_secret_for_dev_only');

export async function proxy(request) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    const isProtected = pathname.startsWith('/tutor')
        || pathname.startsWith('/student')
        || pathname.startsWith('/admin')
        || pathname.startsWith('/superadmin');

    if (!token && isProtected) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    if (token) {
        let role = null;
        try {
            const { payload } = await jwtVerify(token, secretKey);
            role = payload.role;
        } catch (error) {
            console.error('Frontend Edge Security: JWT verification failed', error);
            if (isProtected) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
            return NextResponse.next();
        }

        if (role === 'superadmin') {
            if (pathname === '/login' || pathname === '/register') {
                return NextResponse.redirect(new URL('/superadmin', request.url));
            }
            return NextResponse.next();
        }

        if (role === 'admin') {
            if (pathname.startsWith('/superadmin') || pathname.startsWith('/tutor') || pathname.startsWith('/student')) {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
            if (pathname === '/login' || pathname === '/register') {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
            return NextResponse.next();
        }

        if (role === 'tutor') {
            if (pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) {
                return NextResponse.redirect(new URL('/tutor/dashboard', request.url));
            }
            if (pathname.startsWith('/student') && !pathname.startsWith('/student/courses/') && !pathname.startsWith('/student/exams/')) {
                return NextResponse.redirect(new URL('/tutor/dashboard', request.url));
            }
            if (pathname === '/login' || pathname === '/register') {
                return NextResponse.redirect(new URL('/tutor/dashboard', request.url));
            }
            return NextResponse.next();
        }

        if (role === 'student') {
            if (pathname.startsWith('/tutor') || pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) {
                return NextResponse.redirect(new URL('/student/dashboard', request.url));
            }
            if (pathname === '/login' || pathname === '/register') {
                return NextResponse.redirect(new URL('/student/dashboard', request.url));
            }
            return NextResponse.next();
        }

        if (isProtected) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/tutor/:path*',
        '/student/:path*',
        '/admin/:path*',
        '/superadmin/:path*',
        '/superadmin',
        '/login',
        '/register',
    ],
};
