/**
 * rateLimiter.ts
 * ─────────────────────────────────────────────────────────────
 * API abuse protection middleware using express-rate-limit.
 *
 * Exports two pre-configured rate limiters:
 *   • globalLimiter — broad cap for all /api routes.
 *   • authLimiter   — strict cap for authentication-sensitive
 *                      endpoints to prevent brute-force and
 *                      credential-stuffing attacks.
 *
 * NOTE: For these limiters to key on the real client IP (not
 *       the reverse-proxy IP), the app MUST call:
 *           app.set('trust proxy', 1)
 *       before any middleware is mounted. This is done in app.ts.
 * ─────────────────────────────────────────────────────────────
 */
import rateLimit from 'express-rate-limit';

/**
 * Global Rate Limiter
 * Applies to every /api route.
 * Allows a generous 100 requests per 15-minute window per IP.
 */
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    limit: (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') ? 100 : 10000, // relaxed limit for local development
    standardHeaders: 'draft-8', // Send RateLimit-* headers (modern standard)
    legacyHeaders: false,       // Disable deprecated X-RateLimit-* headers

    message: {
        status: 'error',
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
        retryAfter: '15 minutes',
    },
});

/**
 * Authentication / Sensitive-Route Rate Limiter
 * Much stricter — designed for endpoints like password verification,
 * login, and registration to block brute-force attempts.
 * Allows only 5 requests per 15-minute window per IP.
 */
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    limit: (process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test') ? 5 : 10000, // relaxed limit for local development
    standardHeaders: 'draft-8',
    legacyHeaders: false,

    message: {
        status: 'error',
        message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
        retryAfter: '15 minutes',
    },
});
