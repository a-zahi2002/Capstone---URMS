# CHANGELOG: API Rate Limiting (express-rate-limit)

## Date: 2026-06-19

## Overview
Implemented API abuse protection using `express-rate-limit` to defend the URMS backend against brute-force attacks, credential stuffing, and denial-of-service (DoS) abuse. Two rate-limiting tiers are applied: a **global limiter** (100 requests per 15 minutes per IP) covering all `/api` routes, and a **strict auth limiter** (5 requests per 15 minutes per IP) targeting password-sensitive endpoints. The Express app is also configured to trust the reverse proxy so rate limiting keys on the real client IP.

## Changes Made

### New Files
- **`backend/src/middleware/rateLimiter.ts`:**
  - Created a dedicated rate-limiting middleware module exporting two pre-configured limiters.
  - `globalLimiter` — allows 100 requests per 15-minute window per IP. Applied to all `/api` routes.
  - `authLimiter` — allows only 5 requests per 15-minute window per IP. Applied to authentication-sensitive endpoints (`/api/users/verify-password`, `/api/users/hash-password`).
  - Both limiters return a clean JSON response with HTTP 429 status, a user-friendly message, and a `retryAfter` field.
  - Both use `standardHeaders: 'draft-8'` to send modern `RateLimit-*` response headers and disable deprecated `X-RateLimit-*` headers.

### Backend (`/backend/src/app.ts`)
- **Added `app.set('trust proxy', 1)`:** Configures Express to trust the first reverse proxy in the `X-Forwarded-For` header chain. Without this, all users behind a proxy (Nginx, Render, Heroku, AWS ALB) would share the proxy's IP as their rate-limit key, causing false 429 errors for legitimate users. Placed immediately after the `express()` call, before any middleware.
- **Added `globalLimiter` on `/api`:** Mounted via `app.use("/api", globalLimiter)` after the logger middleware and before route registrations. All API endpoints inherit the 100 req/15 min cap.
- **Added `authLimiter` on sensitive routes:** Mounted via `app.post()` on `/api/users/verify-password` and `/api/users/hash-password` before the user router. These endpoints are capped at 5 req/15 min to prevent brute-force password attacks.

### Dependencies (`/backend/package.json`)
- **Added `express-rate-limit`** (runtime dependency) — Flexible rate-limiting middleware for Express. Ships with built-in TypeScript declarations, so no `@types/express-rate-limit` is required.

## Security Enhancements
- **Brute-force prevention:** The strict auth limiter caps password verification and hashing endpoints at 5 requests per 15 minutes per IP, blocking credential-stuffing and brute-force login attempts.
- **DoS mitigation:** The global limiter prevents any single IP from flooding the API with more than 100 requests per 15-minute window.
- **Correct client IP identification:** The `trust proxy` configuration ensures rate limiting uses the real client IP (`X-Forwarded-For`) rather than the reverse proxy's internal IP — critical for production deployments behind Nginx, Render, Heroku, or AWS ALB.
- **Standard-compliant headers:** `RateLimit-*` response headers (draft-8 standard) inform clients of their remaining quota, enabling well-behaved clients to self-throttle.
- **Consistent error format:** 429 responses use the same `{ status, message }` JSON structure as the existing 404 handler and other error responses.

## No Migration Required
This change only affects Express middleware and HTTP headers — no database schema changes, no new API endpoints, and no frontend UI modifications.
