# CHANGELOG: HTTPS Enforcement & HSTS

## Date: 2026-06-19

## Overview
Implemented strict HTTPS enforcement and HTTP Strict Transport Security (HSTS) across the full URMS stack. All production HTTP traffic is now automatically redirected to HTTPS via a custom Express middleware, and the `Strict-Transport-Security` header is set on every response from both the Express backend (via `helmet`) and the Next.js frontend (via `next.config.ts` headers). Supabase SSL best practices are documented in the backend `.env.example`.

## Changes Made

### Backend (`/backend/src/app.ts`)
- **Added `httpsRedirect` middleware:** Intercepts all incoming requests and checks the `x-forwarded-proto` header (or `req.protocol` as fallback). If the protocol is `http` and `NODE_ENV === 'production'`, responds with a **301 Permanent Redirect** to the `https://` equivalent URL. The redirect is **bypassed entirely in development** so `localhost` testing works without TLS certificates.
- **Added `helmet` security package:** Configures the `Strict-Transport-Security` header with `max-age=31536000` (1 year), `includeSubDomains`, and `preload`. Helmet also automatically sets additional hardening headers: `X-Content-Type-Options: nosniff`, `X-Frame-Options: SAMEORIGIN`, `X-DNS-Prefetch-Control: off`, and `X-Permitted-Cross-Domain-Policies: none`.
- **Middleware execution order:** `httpsRedirect → helmet → cors → body parsers → logger → routes`.

### Dependencies (`/backend/package.json`)
- **Added `helmet`** (runtime dependency) — Express security middleware for HTTP header hardening. Version 8+ includes built-in TypeScript declarations, so no `@types/helmet` is required.

### Frontend (`/next.config.ts`)
- **Added `async headers()` configuration:** Injects security headers into all Next.js responses (pages, API routes, static assets) via the `source: "/(.*)"` pattern.
- **Headers added:**
  - `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
  - `X-Content-Type-Options: nosniff`
  - `X-Frame-Options: DENY`
  - `Referrer-Policy: strict-origin-when-cross-origin`

### Environment (`/backend/.env.example`)
- **Added `DATABASE_URL` example:** Demonstrates the Supabase direct PostgreSQL connection string with `?sslmode=require` appended for SSL enforcement. Includes inline documentation explaining `sslmode=require` vs `sslmode=verify-full`.

## Security Enhancements
- **HTTPS enforcement:** All production HTTP traffic is permanently redirected to HTTPS (301 redirect).
- **HSTS header:** Browsers that receive this header will automatically upgrade future HTTP requests to HTTPS for 1 year — eliminating the redirect round-trip after the first visit.
- **Preload eligibility:** The `preload` directive makes the domain eligible for inclusion in browser HSTS preload lists (e.g., Chrome, Firefox), which enforces HTTPS even on the very first visit.
- **Defense-in-depth headers:** Helmet sets multiple additional security headers beyond HSTS, protecting against MIME-type sniffing, clickjacking, and DNS prefetch leaks.
- **Development safety:** The HTTPS redirect middleware is completely disabled when `NODE_ENV !== 'production'`, ensuring local development with `http://localhost` continues to work without any changes.

## No Migration Required
This change only affects HTTP headers and middleware — no database schema changes, no new API endpoints, and no frontend UI modifications.
