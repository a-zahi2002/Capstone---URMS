# OWASP Top 10 Security Audit & Remediation

## Overview
This document details the security vulnerabilities identified during the comprehensive OWASP Top 10 (2021) security audit of the University Resource Management System (URMS) and the architectural changes implemented to remediate them.

The audit covered both the Next.js frontend and the Express.js backend.

## 1. Security Logging and Monitoring Failures (OWASP A09)

### Issue
The Express backend relied on a basic `console.log` middleware that only recorded the HTTP method and request URL. It did not capture critical details like the client IP address or status codes, making it difficult to detect or investigate credential-stuffing attacks or unauthorized access (401/403 errors).

### Resolution
*   **Dependency Added:** Installed `morgan` and `@types/morgan` in the backend.
*   **Implementation:** Replaced the basic logger in `backend/src/app.ts` with `morgan('combined')`.
*   **Impact:** The backend now utilizes the standardized Apache combined log format. It captures the client IP, precise timestamp, HTTP method, URL, HTTP status code, response size, referrer, and User-Agent. This is crucial for monitoring API abuse and failed authentication attempts.

## 2. Security Misconfiguration (OWASP A05)

### Issue
The backend was missing a global error-handling middleware. Without it, unhandled exceptions and 500 Internal Server Errors could potentially expose raw stack traces and internal application structure to the client, especially when the Express default error handler kicks in.

### Resolution
*   **Implementation:** Appended a global error-handling middleware at the very end of the routing pipeline in `backend/src/app.ts`.
*   **Mechanism:** The handler intercepts all unhandled errors. It checks `process.env.NODE_ENV`. If the environment is set to `production`, it suppresses the `err.stack` and returns a generic "Internal Server Error" message to the client, while still logging the full stack trace internally to the server console.

```typescript
// ✅ Global Error Handler (Hides stack traces in production)
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error(`[Global Error] ${err.message}`, err.stack);
  
  res.status(err.status || 500).json({
    status: "error",
    message: process.env.NODE_ENV === 'production' ? "Internal Server Error" : err.message,
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack }),
  });
});
```

## 3. Identification and Authentication Failures (OWASP A07)

### Issue
While client-side routing guards (`ProtectedRoute.tsx`) were in place, there was no server-side edge middleware in Next.js to intercept requests to protected routes. This meant that unauthenticated users could theoretically request protected pages, resulting in a brief flash of content or unnecessary client-side rendering cycles before being kicked out.

### Resolution
*   **Implementation:** Created a new `middleware.ts` file at the root of the Next.js project.
*   **Mechanism:** The middleware leverages the Next.js Edge runtime. It listens for requests to protected paths (`/dashboard`, `/admin`, `/profile`, `/bookings`, `/resources`, `/maintenance`, `/notifications`). If a user attempts to access these paths without a valid authentication cookie (`session` or `firebaseToken`), the middleware immediately issues a 307 redirect to the `/login` page.
*   **Note:** Because Firebase Auth uses IndexedDB to store tokens on the client by default, the client-side authentication flow must be updated to set an HttpOnly `session` cookie upon successful sign-in to fully utilize this middleware.

## Summary of Audit Passes

During the audit, several existing implementations successfully passed the OWASP framework requirements:

*   **Broken Access Control (A01):** Supabase Row Level Security (RLS) is securely bypassed only when necessary using the Service Role Key, while standard operations use a scoped client. CORS is strictly defined.
*   **Cryptographic Failures (A02):** No hardcoded secrets were found in the source code. `helmet` is correctly enforcing `Strict-Transport-Security` (HSTS).
*   **Injection (A03):** The application safely uses `isomorphic-dompurify` to sanitize HTML before using React's `dangerouslySetInnerHTML`. The Supabase JS client inherently parameterizes all database queries.
*   **Insecure Design (A04):** `express-rate-limit` is actively protecting the API, with a strict `authLimiter` applied to password endpoints. Business logic successfully checks for time-slot conflicts to prevent resource over-booking.
