import { NextResponse } from 'next/server';
import { jwtVerify } from 'jose';

// Secret must match the backend JWT_SECRET. Next.js Edge requires it to be encoded.
const secretKey = new TextEncoder().encode(
    process.env.JWT_SECRET || 'fallback_secret_for_dev_only'
);

// Helper: Get dashboard URL for a role
function getDashboard(role) {
    switch (role) {
        case 'superadmin': return '/superadmin';
        case 'admin': return '/admin/dashboard';
        case 'tutor': return '/tutor/dashboard';
        default: return '/student/dashboard';
    }
}

export async function middleware(request) {
    const token = request.cookies.get('token')?.value;
    const { pathname } = request.nextUrl;

    const isProtected = pathname.startsWith('/tutor') || pathname.startsWith('/student')
        || pathname.startsWith('/admin') || pathname.startsWith('/superadmin');

    // 1. Redirect to login if accessing protected routes without token
    if (!token && isProtected) {
        return NextResponse.redirect(new URL('/login', request.url));
    }

    // 2. Cryptographic Role Verification (Edge Runtime)
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

        // 3. Strict Role-based Routing

        // Superadmin can access everything — no restrictions
        if (role === 'superadmin') {
            // If trying to visit /login or /register, redirect to superadmin dashboard
            if (pathname === '/login' || pathname === '/register') {
                return NextResponse.redirect(new URL('/superadmin', request.url));
            }
            return NextResponse.next();
        }

        // Admin: can access /admin, NOT /superadmin, /tutor, /student
        if (role === 'admin') {
            if (pathname.startsWith('/superadmin') || pathname.startsWith('/tutor') || pathname.startsWith('/student')) {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
            if (pathname === '/login' || pathname === '/register') {
                return NextResponse.redirect(new URL('/admin/dashboard', request.url));
            }
            return NextResponse.next();
        }

        // Tutor: can access /tutor, NOT /admin, /superadmin
        // Allow /student/courses/ and /student/exams/ for Preview Mode
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

        // Student: can access /student only
        if (role === 'student') {
            if (pathname.startsWith('/tutor') || pathname.startsWith('/admin') || pathname.startsWith('/superadmin')) {
                return NextResponse.redirect(new URL('/student/dashboard', request.url));
            }
            if (pathname === '/login' || pathname === '/register') {
                return NextResponse.redirect(new URL('/student/dashboard', request.url));
            }
            return NextResponse.next();
        }

        // Unknown role — redirect to login
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
        '/register'
    ],
};

