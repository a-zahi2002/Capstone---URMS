import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware
 * ─────────────────────────────────────────────────────────────
 * Protects routes by checking for an authentication session.
 * 
 * Note: Since Firebase Auth primarily uses IndexedDB on the client,
 * this middleware checks for a 'session' or 'firebaseToken' cookie.
 * To make this fully functional with Firebase, ensure that your
 * client-side login logic (e.g., inside auth-context.tsx) sets
 * an HttpOnly cookie containing the token.
 * ─────────────────────────────────────────────────────────────
 */
export function middleware(request: NextRequest) {
    const { pathname } = request.nextUrl;

    // Define protected routes (add or remove paths as needed)
    const protectedPaths = [
        '/dashboard',
        '/admin',
        '/profile',
        '/bookings',
        '/resources',
        '/maintenance',
        '/notifications'
    ];

    const isProtectedRoute = protectedPaths.some((path) => pathname.startsWith(path));

    if (isProtectedRoute) {
        // Check for a session cookie (adjust the cookie name to match your setup)
        const sessionCookie = request.cookies.get('session') || request.cookies.get('firebaseToken');

        if (!sessionCookie) {
            // User is not authenticated, redirect to login
            const loginUrl = new URL('/login', request.url);
            // Optionally, save the return URL so they can be redirected back after login
            loginUrl.searchParams.set('callbackUrl', pathname);
            
            return NextResponse.redirect(loginUrl);
        }
    }

    return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - api (API routes)
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico, sitemap.xml, robots.txt (metadata files)
         */
        '/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
    ],
};
