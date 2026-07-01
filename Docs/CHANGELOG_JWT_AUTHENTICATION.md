# Changelog: Secure JWT Authentication Flow

## Date: 2026-06-19

## Overview
Implemented a secure Firebase JWT authentication flow between the Next.js frontend and Node.js backend to ensure all API requests are properly authenticated and authorized.

## Changes Made

### Frontend (`/lib/apiClient.ts`)
- **Added `apiClient.ts` Utility:** Created a wrapper around the native `fetch` API.
- **Automatic Token Injection:** The client automatically retrieves the Firebase `idToken` using `auth.currentUser.getIdToken()` and injects it as a `Bearer` token in the `Authorization` header.
- **Auto-refresh Mechanism:** Leverages Firebase's built-in token expiration handling (which automatically refreshes tokens that are within 5 minutes of expiring) by calling `getIdToken(false)`.

### Backend (`/backend/src/middleware/auth.middleware.ts` & `/backend/src/config/firebase.config.ts`)
- **Verified Admin Initialization:** Confirmed `firebase-admin` is securely initialized either via `serviceAccountKey.json` or Environment Variables (for production safety).
- **Verified Token Middleware:** Confirmed the `verifyToken` Express middleware properly extracts the Bearer token and verifies its signature via `admin.auth().verifyIdToken()`.
- **User Context Injection:** Verified that the middleware successfully attaches the decoded user payload to `req.user` for downstream route handlers to consume.

## Security Enhancements
- **Service Account Key Protection:** Established guidelines to ensure the `serviceAccountKey.json` is never committed to version control and that environment variables are strictly used in production.
- **SSR HttpOnly Strategy:** Formulated a strategy for passing the auth state to Next.js Server Components securely using a Route Handler and `admin.auth().createSessionCookie()` for HttpOnly, Secure session cookies.
