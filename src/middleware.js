import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Secret must match the backend JWT_SECRET. Next.js Edge requires it to be encoded.
const secretKey = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback_secret_for_dev_only'
);

export async function middleware(request) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    // 1. Redirect to login if accessing protected routes without token
    if (!token) {
        if (pathname.startsWith('/tutor') || pathname.startsWith('/student') || pathname.startsWith('/admin')) {
            return NextResponse.redirect(new URL('/login', request.url));
        }
    }

    // 2. Cryptographic Role Verification (Edge Runtime)
    if (token) {
        let role = null;
        try {
            // Verify and decode token securely
            const { payload } = await jwtVerify(token, secretKey);
            role = payload.role; // This cannot be spoofed by the client!
        } catch (error) {
            // Invalid or expired token -> Kick back to login immediately
            console.error('Frontend Edge Security: JWT verification failed', error);
            if (pathname.startsWith('/tutor') || pathname.startsWith('/student') || pathname.startsWith('/admin')) {
                return NextResponse.redirect(new URL('/login', request.url));
            }
            return NextResponse.next();
        }

        // 3. Strict Role-based Routing Checks
        // If Tutor tries to access Student routes (allow `/student/courses/` and `/student/exams/` for Preview Mode)
        if (role === 'tutor' && pathname.startsWith('/student')) {
            if (!pathname.startsWith('/student/courses/') && !pathname.startsWith('/student/exams/')) {
                return NextResponse.redirect(new URL('/tutor/dashboard', request.url));
            }
        }

        // If Student tries to access Tutor routes
        if (role === 'student' && pathname.startsWith('/tutor')) {
            return NextResponse.redirect(new URL('/student/dashboard', request.url));
        }

        // Admin Route Protection
        if (pathname.startsWith('/admin') && role !== 'admin') {
            if (role === 'tutor') return NextResponse.redirect(new URL('/tutor/dashboard', request.url));
            return NextResponse.redirect(new URL('/student/dashboard', request.url));
        }

        // Prevent Admin from accessing Tutor/Student dashboards
        if (role === 'admin' && (pathname.startsWith('/tutor') || pathname.startsWith('/student'))) {
            return NextResponse.redirect(new URL('/admin/dashboard', request.url));
        }

        // If logged in user tries to access auth pages (login/register), redirect to their Dashboard
        if (pathname === '/login' || pathname === '/register') {
            if (role === 'admin') return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            if (role === 'tutor') return NextResponse.redirect(new URL('/tutor/dashboard', request.url));
            return NextResponse.redirect(new URL('/student/dashboard', request.url));
        }
    }

    return NextResponse.next();
}

export const config = {
    matcher: [
        '/tutor/:path*',
        '/student/:path*',
        '/admin/:path*',
        '/login',
        '/register'
    ],
};
