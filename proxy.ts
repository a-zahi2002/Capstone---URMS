import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * Next.js Edge Middleware
 * ─────────────────────────────────────────────────────────────────────────────
 * Auth is now tab-isolated via inMemoryPersistence + sessionStorage.
 * Session tokens are NOT stored in shared cookies — they live in each tab's
 * JavaScript memory and sessionStorage, so the middleware cannot inspect them.
 *
 * Route protection is handled entirely by the client-side <ProtectedRoute>
 * component (which reads from the in-memory AuthContext). The middleware acts
 * as a lightweight pass-through for all routes.
 *
 * Static assets, API routes, and Next.js internals are excluded via the
 * matcher config below.
 * ─────────────────────────────────────────────────────────────────────────────
 */
export function proxy(request: NextRequest) {
    // Pass all requests through — client-side ProtectedRoute handles auth.
    return NextResponse.next();
}

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
