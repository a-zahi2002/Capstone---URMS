# HTTPS Enforcement & HSTS — Documentation

## Overview
This document explains the **HTTPS enforcement and HTTP Strict Transport Security (HSTS)** implementation in the University Resource Management System (URMS). This feature ensures all production traffic is encrypted by redirecting HTTP requests to HTTPS and instructing browsers to always use secure connections via the `Strict-Transport-Security` header.

## 1. Architecture Overview

The URMS security hardening is applied at **three layers:**

1. **Express Backend (`helmet` + HTTPS redirect):** Sets HSTS headers and redirects plaintext HTTP to HTTPS.
2. **Next.js Frontend (custom headers):** Sets the same HSTS headers on all server-rendered pages and static assets.
3. **Supabase Database (SSL connection):** Ensures the direct PostgreSQL connection string uses `sslmode=require`.

### Security Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                     PRODUCTION HTTPS FLOW                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Browser                                                             │
│    │                                                                 │
│    ├── GET http://urms.example.com/dashboard                         │
│    │       → Reverse Proxy (Vercel/Nginx/ALB) forwards to Express   │
│    │       → Express sees x-forwarded-proto: http                   │
│    │       → httpsRedirect middleware returns 301 → https://...      │
│    │                                                                 │
│    ├── GET https://urms.example.com/dashboard                        │
│    │       → Express sees x-forwarded-proto: https                  │
│    │       → httpsRedirect middleware calls next()                   │
│    │       → helmet sets Strict-Transport-Security header            │
│    │       → Response sent with HSTS header                         │
│    │                                                                 │
│    └── All subsequent requests (for 1 year)                          │
│            → Browser auto-upgrades http:// → https://                │
│            → No redirect round-trip needed                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                     DEVELOPMENT BYPASS FLOW                           │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Browser                                                             │
│    │                                                                 │
│    ├── GET http://localhost:3000/dashboard (Next.js)                  │
│    │       → NODE_ENV !== 'production'                               │
│    │       → No redirect — works normally over HTTP                  │
│    │                                                                 │
│    └── GET http://localhost:5000/api/health (Express)                 │
│            → httpsRedirect skips (not production)                    │
│            → Response served over HTTP as usual                      │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Why HSTS?

| Factor | Details |
|---|---|
| **Problem** | Without HSTS, the first request to a site may be over HTTP, creating a window for man-in-the-middle attacks (SSL stripping) |
| **Solution** | The `Strict-Transport-Security` header tells the browser: "For the next N seconds, always use HTTPS for this domain — even if the user types http://" |
| **max-age** | `31536000` seconds = 1 year (OWASP recommended minimum for production) |
| **includeSubDomains** | Extends HSTS to all subdomains (e.g., `api.urms.example.com`, `admin.urms.example.com`) |
| **preload** | Makes the domain eligible for browser HSTS preload lists — enforces HTTPS even on the very first visit before any header is received |

---

## 3. Files Modified

| File | Change Description |
|---|---|
| `backend/src/app.ts` | Added `httpsRedirect` middleware and `helmet` security package configuration |
| `backend/package.json` | Added `helmet` runtime dependency |
| `next.config.ts` | Added `async headers()` with HSTS and additional security headers for all routes |
| `backend/.env.example` | Added `DATABASE_URL` example with `?sslmode=require` for Supabase direct PG connections |

---

## 4. Backend Implementation

### HTTPS Redirect Middleware (`backend/src/app.ts`)

This custom middleware intercepts all incoming requests before any route handler processes them.

```typescript
function httpsRedirect(req: Request, res: Response, next: NextFunction): void {
  const isProduction = process.env.NODE_ENV === 'production';
  const proto = (req.headers['x-forwarded-proto'] as string) || req.protocol;

  if (isProduction && proto !== 'https') {
    const secureUrl = `https://${req.hostname}${req.originalUrl}`;
    res.redirect(301, secureUrl);
    return;
  }
  next();
}
```

**Key design decisions:**

| Decision | Rationale |
|---|---|
| Checks `x-forwarded-proto` first | In production, TLS is terminated at the reverse proxy (Vercel, Nginx, AWS ALB). The Express server receives plain HTTP internally. The proxy communicates the original protocol via this header |
| Falls back to `req.protocol` | Handles cases where Express is directly exposed without a proxy (rare in production, common in testing) |
| `NODE_ENV !== 'production'` guard | Prevents the redirect from breaking local development on `http://localhost` |
| 301 (Permanent Redirect) | Tells browsers and search engines to cache the redirect and always use HTTPS. More efficient than 302 (temporary) |

### Helmet Configuration (`backend/src/app.ts`)

```typescript
app.use(
  helmet({
    strictTransportSecurity: {
      maxAge: 31536000,        // 1 year in seconds
      includeSubDomains: true, // apply to *.yourdomain.com
      preload: true,           // eligible for browser preload lists
    },
  })
);
```

**Headers set automatically by helmet:**

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Forces HTTPS for 1 year |
| `X-Content-Type-Options` | `nosniff` | Prevents MIME-type sniffing attacks |
| `X-Frame-Options` | `SAMEORIGIN` | Prevents clickjacking via iframes |
| `X-DNS-Prefetch-Control` | `off` | Prevents browsers from leaking visited hostnames via DNS prefetch |
| `X-Download-Options` | `noopen` | Prevents IE from executing downloads in the site's context |
| `X-Permitted-Cross-Domain-Policies` | `none` | Blocks Flash/PDF cross-domain requests |

### Middleware Execution Order

```
Request
  │
  ├── 1. httpsRedirect    ← Redirect HTTP → HTTPS (production only)
  ├── 2. helmet           ← Set all security headers (HSTS, etc.)
  ├── 3. cors             ← Handle CORS preflight and allowed origins
  ├── 4. express.json()   ← Parse JSON request bodies
  ├── 5. express.urlencoded() ← Parse URL-encoded bodies
  ├── 6. logger           ← Log request method and URL
  └── 7. routes           ← Route handlers (resources, users, etc.)
```

---

## 5. Frontend Implementation

### Next.js Security Headers (`next.config.ts`)

```typescript
const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",  // Apply to ALL routes
        headers: [
          {
            key: "Strict-Transport-Security",
            value: "max-age=31536000; includeSubDomains; preload",
          },
          {
            key: "X-Content-Type-Options",
            value: "nosniff",
          },
          {
            key: "X-Frame-Options",
            value: "DENY",
          },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
        ],
      },
    ];
  },
};
```

**Why this is needed in addition to the Express backend:**

Users may access Next.js pages directly (server-side rendered pages, static pages) without going through the Express API. The `headers()` configuration ensures the HSTS header is present on **every** response from the Next.js server — covering pages, API routes, and static assets.

**Header explanations:**

| Header | Value | Purpose |
|---|---|---|
| `Strict-Transport-Security` | `max-age=31536000; includeSubDomains; preload` | Mirrors the backend HSTS policy for consistency |
| `X-Content-Type-Options` | `nosniff` | Prevents browsers from MIME-sniffing responses away from the declared `Content-Type` |
| `X-Frame-Options` | `DENY` | Blocks the page from being embedded in any iframe (stricter than `SAMEORIGIN`) |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Sends full URL as referrer for same-origin requests, but only the origin (not path) for cross-origin requests |

---

## 6. Supabase SSL Configuration

### Current State
The URMS backend uses the Supabase JavaScript client (`@supabase/supabase-js`) which connects over the **Supabase REST API via HTTPS**. SSL is inherently enforced — no additional configuration is needed for this client.

### Direct PostgreSQL Connection (Future Use)
If the project ever uses a direct PostgreSQL connection (via `pg`, Prisma, Drizzle, or `knex`), the connection string must enforce SSL:

```
DATABASE_URL=postgresql://postgres.[your-project-ref]:[your-password]@aws-0-[region].pooler.supabase.com:6543/postgres?sslmode=require
```

| SSL Mode | Behavior |
|---|---|
| `sslmode=require` | Encrypts the connection. Trusts the server certificate without full CA validation |
| `sslmode=verify-full` | Encrypts the connection AND verifies the server's certificate against a trusted CA. Most secure option |
| No `sslmode` parameter | May fall back to unencrypted connection depending on server configuration (not recommended) |

This example is documented in `backend/.env.example` for reference.

---

## 7. Security Considerations

### HTTPS Redirect Security
- The redirect uses **301 (Permanent)** — browsers cache this redirect, reducing future round-trips
- The middleware checks `x-forwarded-proto` to correctly identify the client's original protocol behind TLS-terminating proxies
- The redirect preserves the full URL path and query string via `req.originalUrl`

### HSTS Preload
- The `preload` directive does **not** automatically add the domain to preload lists
- To be included, the domain must be submitted to [hstspreload.org](https://hstspreload.org/)
- Once preloaded, browsers enforce HTTPS from the very first visit — no initial HTTP request is needed

### Development Safety
- The `httpsRedirect` middleware is completely disabled when `NODE_ENV !== 'production'`
- Local development on `http://localhost:3000` (Next.js) and `http://localhost:5000` (Express) works without any changes
- No TLS certificates are needed for local development

### Interaction with Existing Security
- **CORS:** The HTTPS redirect fires **before** CORS. Once the client follows the redirect to HTTPS, CORS processing continues normally
- **Firebase Auth:** No impact. Firebase tokens are transmitted over HTTPS in the `Authorization` header
- **Bcrypt verification:** No impact. The `/verify-password` endpoint works identically over HTTPS

---

## 8. Setup Instructions

### Step 1 — Install Backend Dependencies

```bash
cd backend
npm install
```

`helmet` is already listed in `package.json`.

### Step 2 — Restart the Development Server

```bash
npm run dev
```

### Step 3 — Verify in Development

1. Access `http://localhost:5000/api/health` → should respond normally (no redirect)
2. Access `http://localhost:3000` → should load the Next.js app normally (no redirect)

### Step 4 — Verify in Production

After deploying to a production environment with `NODE_ENV=production`:

1. Access `http://your-domain.com/api/health` → should 301 redirect to `https://your-domain.com/api/health`
2. Check response headers → should include `Strict-Transport-Security: max-age=31536000; includeSubDomains; preload`
3. Subsequent visits → browser should automatically upgrade to HTTPS without the redirect

---

## 9. Limitations & Assumptions

1. **Reverse proxy required in production.** The `x-forwarded-proto` header must be set by the reverse proxy (Vercel, Nginx, AWS ALB). Without it, the middleware falls back to `req.protocol`, which may not reflect the client's actual protocol.

2. **HSTS preload requires manual submission.** Adding `preload` to the header makes the domain eligible but does not automatically enroll it. Submit at [hstspreload.org](https://hstspreload.org/) when ready.

3. **First visit vulnerability.** Until the browser receives the HSTS header (or the domain is preloaded), the very first HTTP request is still vulnerable to SSL stripping. This is inherent to HSTS and mitigated by preloading.

4. **HSTS cannot be easily undone.** Once a browser caches the HSTS policy, it will enforce HTTPS for the full `max-age` duration. If HTTPS is disabled before `max-age` expires, users will see connection errors. To remove HSTS, first reduce `max-age` to `0` and deploy, then wait for browser caches to expire.

5. **No Content-Security-Policy (CSP) header added.** CSP requires careful tuning to avoid breaking inline scripts, styles, and third-party integrations (Firebase, Supabase, Chart.js). This can be added as a future enhancement.

---

## 10. Author & Date

- **Feature implemented:** 2026-06-19
- **Scope:** Transport-layer security (HTTPS enforcement, HSTS headers, SSL connection guidance)
- **Express backend:** `helmet` security package + custom HTTPS redirect middleware
- **Next.js frontend:** Security headers via `next.config.ts`
- **Database:** SSL guidance for direct PostgreSQL connections
