# API Rate Limiting — Documentation

## Overview
This document explains the **API rate limiting** implementation in the University Resource Management System (URMS). The feature uses `express-rate-limit` to protect backend API endpoints from abuse — including brute-force attacks, credential stuffing, and denial-of-service (DoS) flooding — by capping the number of requests each client IP can make within a sliding time window.

## 1. Architecture Overview

The rate limiting is applied at **two tiers:**

1. **Global Limiter:** Broad protection for all `/api` routes — 100 requests per 15 minutes per IP.
2. **Auth Limiter:** Strict protection for password-sensitive endpoints — 5 requests per 15 minutes per IP.

### Rate Limiting Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                     REQUEST PROCESSING FLOW                          │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Client Request                                                      │
│    │                                                                 │
│    ├── 1. httpsRedirect     (production only)                        │
│    ├── 2. helmet            (HSTS + security headers)                │
│    ├── 3. cors              (origin validation)                      │
│    ├── 4. express.json()    (body parsing)                           │
│    ├── 5. logger            (request logging)                        │
│    │                                                                 │
│    ├── 6. globalLimiter ──────────────────────────────── ← NEW       │
│    │       └── /api/* routes: 100 req / 15 min / IP                  │
│    │       └── Exceeded? → 429 JSON response                         │
│    │                                                                 │
│    ├── 7. authLimiter (POST only) ────────────────────── ← NEW       │
│    │       └── /api/users/verify-password: 5 req / 15 min / IP       │
│    │       └── /api/users/hash-password:   5 req / 15 min / IP       │
│    │       └── Exceeded? → 429 JSON response                         │
│    │                                                                 │
│    └── 8. Route handlers     (controllers)                           │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

> **Note:** The auth limiter fires **before** the user router. If a client exceeds the 5-request cap, the request is rejected at the middleware layer — the route controller and `verifyToken` middleware are never invoked.

---

## 2. Why Rate Limiting?

| Threat | How Rate Limiting Helps |
|---|---|
| **Brute-force login** | The auth limiter restricts password verification attempts to 5 per 15 minutes per IP, making automated password guessing infeasible |
| **Credential stuffing** | Attackers testing lists of stolen credentials are blocked after 5 attempts |
| **API flooding / DoS** | The global limiter prevents any single IP from consuming excessive server resources |
| **Resource enumeration** | Limits the rate at which an attacker can scrape or enumerate API resources |
| **Cost control** | Prevents runaway API usage that could increase hosting/database costs |

---

## 3. Files Modified / Created

| File | Change |
|---|---|
| `backend/src/middleware/rateLimiter.ts` | **NEW** — Defines and exports `globalLimiter` and `authLimiter` |
| `backend/src/app.ts` | **MODIFIED** — Added trust proxy, global limiter on `/api`, auth limiter on password routes |
| `backend/package.json` | **MODIFIED** — Added `express-rate-limit` dependency |

---

## 4. Implementation Details

### 4.1 Rate Limiter Middleware (`backend/src/middleware/rateLimiter.ts`)

This module exports two pre-configured `express-rate-limit` instances:

#### Global Limiter

```typescript
export const globalLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    limit: 100,                 // max 100 requests per window per IP
    standardHeaders: 'draft-8', // Send RateLimit-* headers (modern standard)
    legacyHeaders: false,       // Disable deprecated X-RateLimit-* headers

    message: {
        status: 'error',
        message: 'Too many requests from this IP. Please try again after 15 minutes.',
        retryAfter: '15 minutes',
    },
});
```

#### Auth Limiter

```typescript
export const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,  // 15 minutes
    limit: 5,                   // max 5 requests per window per IP
    standardHeaders: 'draft-8',
    legacyHeaders: false,

    message: {
        status: 'error',
        message: 'Too many authentication attempts from this IP. Please try again after 15 minutes.',
        retryAfter: '15 minutes',
    },
});
```

**Configuration breakdown:**

| Option | Value | Purpose |
|---|---|---|
| `windowMs` | `900000` (15 min) | The time window for counting requests. Resets after expiry |
| `limit` | `100` / `5` | Maximum requests allowed per IP within the window |
| `standardHeaders` | `'draft-8'` | Sends modern `RateLimit-Policy`, `RateLimit-Limit`, `RateLimit-Remaining`, and `RateLimit-Reset` headers per IETF draft-8 |
| `legacyHeaders` | `false` | Disables deprecated `X-RateLimit-Limit`, `X-RateLimit-Remaining`, and `X-RateLimit-Reset` headers |
| `message` | JSON object | Custom response body returned with HTTP 429 status |

### 4.2 Proxy Trust Configuration (`backend/src/app.ts`)

```typescript
app.set('trust proxy', 1 /* number of proxies */);
```

**Why this is critical:**

When deployed behind a reverse proxy (Nginx, Render, Heroku, AWS ALB), Express sees every incoming request as originating from the proxy's internal IP (e.g., `127.0.0.1`). Without `trust proxy`, `express-rate-limit` would use the proxy IP as the rate-limit key — meaning **all users share one rate-limit bucket**, causing false 429 errors for legitimate users.

Setting `trust proxy` to `1` tells Express to:
- Read the first IP address from the `X-Forwarded-For` header — the real client IP
- Use this IP for `req.ip`, which `express-rate-limit` uses as its default key

The value `1` means "trust one proxy hop." Adjust this number if your infrastructure has multiple proxies in the chain (e.g., CDN → load balancer → app = `2`).

### 4.3 Limiter Application (`backend/src/app.ts`)

```typescript
// Global limiter — all /api routes
app.use("/api", globalLimiter);

// Strict auth limiter — password-sensitive endpoints only
app.post("/api/users/verify-password", authLimiter);
app.post("/api/users/hash-password", authLimiter);
```

**Key design decisions:**

| Decision | Rationale |
|---|---|
| Global limiter on `/api` prefix | Covers all current and future API routes automatically. Non-API routes (health check, static assets) are unaffected |
| Auth limiter uses `app.post()` | Only POST requests to these specific paths are rate-limited. GET requests to the same paths (if any) are not affected |
| Auth limiter placed before routers | The limiter fires before `verifyToken` and the controller, minimizing server workload for rejected requests |
| Separate limiter instances | Each has its own counter store. Hitting the auth limit does not count toward the global limit and vice versa |

---

## 5. Response Format

### Successful Request (within limit)

Response headers include rate-limit information:

```
RateLimit-Policy: 100;w=900
RateLimit-Limit: 100
RateLimit-Remaining: 97
RateLimit-Reset: 842
```

### Rate-Limited Request (429 Too Many Requests)

**Global limiter response:**
```json
{
    "status": "error",
    "message": "Too many requests from this IP. Please try again after 15 minutes.",
    "retryAfter": "15 minutes"
}
```

**Auth limiter response:**
```json
{
    "status": "error",
    "message": "Too many authentication attempts from this IP. Please try again after 15 minutes.",
    "retryAfter": "15 minutes"
}
```

Both include a `Retry-After` HTTP header (in seconds) automatically set by `express-rate-limit`.

---

## 6. Protected Routes Summary

| Route | Method | Limiter | Max Requests | Window |
|---|---|---|---|---|
| `/api/*` (all routes) | ALL | `globalLimiter` | 100 | 15 min |
| `/api/users/verify-password` | POST | `authLimiter` | 5 | 15 min |
| `/api/users/hash-password` | POST | `authLimiter` | 5 | 15 min |

> **Future routes:** When `/api/login` or `/api/register` endpoints are added, apply the `authLimiter` to them by adding similar `app.post()` lines in `app.ts`.

---

## 7. Security Considerations

### Reverse Proxy Configuration
- The `trust proxy = 1` setting is essential for production deployments. Without it, rate limiting is effectively broken behind a proxy.
- The value should match the exact number of trusted proxy hops. Setting it too high could allow clients to spoof their IP via the `X-Forwarded-For` header.

### Storage Backend
- By default, `express-rate-limit` uses an **in-memory store**. This is appropriate for single-instance deployments.
- For **multi-instance deployments** (e.g., clustered or horizontally scaled), consider using an external store like `rate-limit-redis` or `rate-limit-memcached` to share rate-limit counters across instances.

### Bypassing Rate Limits
- Rate limiting is keyed on `req.ip` by default. Sophisticated attackers using rotating IP addresses or botnets may circumvent IP-based limits.
- For enhanced protection, consider combining rate limiting with CAPTCHA challenges, account lockout policies, or anomaly detection.

### Interaction with Existing Security
- **CORS:** Rate limiting fires after CORS. A CORS-rejected request is never rate-limited.
- **Helmet/HSTS:** No interaction. Security headers are set independently.
- **Firebase Auth (`verifyToken`):** The auth limiter fires before `verifyToken`. A rate-limited request never reaches the token verification middleware, reducing server load during attacks.
- **RBAC (`authorizeRoles`):** No interaction. Authorization runs after rate limiting passes.

---

## 8. Setup Instructions

### Step 1 — Install Dependencies

```bash
cd backend
npm install
```

`express-rate-limit` is already listed in `package.json`.

### Step 2 — Restart the Development Server

```bash
npm run dev
```

The server starts with rate limiting active. In development, it uses `localhost` IP for rate counting.

### Step 3 — Verify Rate Limit Headers

```bash
curl -i http://localhost:5000/api/health
```

Check for `RateLimit-*` headers in the response:

```
RateLimit-Policy: 100;w=900
RateLimit-Limit: 100
RateLimit-Remaining: 99
RateLimit-Reset: 900
```

### Step 4 — Test Rate Limiting (Optional)

To simulate exceeding the auth limit:

```bash
for i in {1..6}; do
  curl -s -o /dev/null -w "Request $i: HTTP %{http_code}\n" \
    -X POST http://localhost:5000/api/users/verify-password \
    -H "Content-Type: application/json" \
    -d '{"email":"test@test.com","password":"test"}'
done
```

Requests 1–5 should return their normal status code. Request 6 should return **HTTP 429**.

---

## 9. Limitations & Assumptions

1. **In-memory store:** Rate-limit counters are stored in memory and reset on server restart. In a multi-instance deployment, each instance maintains its own counters — an attacker could send `limit × instances` requests total. Use `rate-limit-redis` for shared counters if scaling horizontally.

2. **IP-based keying:** Rate limiting is keyed on client IP address. Users behind the same NAT (e.g., a university campus) share the same limit. If this causes false positives, consider increasing the global limit or using a composite key (IP + user ID).

3. **No persistent store:** Rate-limit state is lost on server restart. An attacker could trigger a restart to reset their counter. This is acceptable for most deployments but should be noted for high-security environments.

4. **Clock-based windows:** The time window uses the server's system clock. Ensure server time is synchronized via NTP in production.

5. **No per-user rate limiting:** Current implementation is per-IP only. Authenticated per-user rate limiting (e.g., based on Firebase UID) can be added in the future using a custom `keyGenerator`.

---

## 10. Author & Date

- **Feature implemented:** 2026-06-19
- **Scope:** API abuse protection (rate limiting, brute-force prevention, proxy trust configuration)
- **Library:** `express-rate-limit` with in-memory store
- **Files affected:** `rateLimiter.ts` (new), `app.ts` (modified), `package.json` (modified)
