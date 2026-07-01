# Secure JWT Authentication Flow Documentation

This document explains the secure authentication and authorization mechanism implemented in the University Resource Management System (URMS). The architecture relies on **Firebase Authentication** on the Next.js frontend and the **Firebase Admin SDK** on the Node.js/Express backend.

## 1. Architecture Overview

1. **Client Login:** The user logs in via the frontend using Firebase Client SDK (`signInWithEmailAndPassword` or Google Auth).
2. **Token Generation:** Upon successful authentication, Firebase issues a short-lived JSON Web Token (JWT) called an `idToken`.
3. **API Requests:** When the frontend needs to request protected data from the backend, it uses the `apiClient` utility. This utility automatically fetches the current user's `idToken` and attaches it to the `Authorization` header as a `Bearer` token.
4. **Backend Verification:** The Express backend intercepts the request using the `verifyToken` middleware, extracts the token, and verifies its cryptographic signature using the Firebase Admin SDK.
5. **Context Injection:** If valid, the decoded user data (like `uid`, `email`, and `role`) is attached to `req.user` and the request proceeds to the route handler.

---

## 2. Frontend Implementation

### The `apiClient` Utility (`lib/apiClient.ts`)

This utility is a wrapper around the native `fetch` API. It handles token retrieval and injection automatically.

```typescript
import { apiClient } from '@/lib/apiClient';

// Example Usage
const fetchDashboardData = async () => {
    try {
        const data = await apiClient('/api/dashboard/stats');
        console.log("Protected Data:", data);
    } catch (error) {
        console.error("Failed to fetch data:", error);
    }
}
```

**Key Features:**
- **Auto-Refresh:** It calls `auth.currentUser.getIdToken(false)`. The Firebase SDK handles token refreshing under the hood automatically if the token is close to expiring.
- **Error Handling:** Automatically parses JSON responses and throws errors if the response status is not `ok`.

---

## 3. Backend Implementation

### Firebase Admin Initialization (`backend/src/config/firebase.config.ts`)
The Admin SDK requires elevated privileges. It initializes using a Service Account Key. It first looks for a local `serviceAccountKey.json` file. If not found, it gracefully falls back to using environment variables:
- `FIREBASE_PROJECT_ID`
- `FIREBASE_CLIENT_EMAIL`
- `FIREBASE_PRIVATE_KEY`

### The `verifyToken` Middleware (`backend/src/middleware/auth.middleware.ts`)
This middleware protects your API routes.

```typescript
import express from 'express';
import { verifyToken, requireAdmin } from '../middleware/auth.middleware';

const router = express.Router();

// Route protected by JWT verification
router.get('/profile', verifyToken, (req, res) => {
    res.json({ message: "Success", user: req.user });
});

// Route protected by JWT verification AND Admin custom claim / role
router.post('/settings', verifyToken, requireAdmin, (req, res) => {
    res.json({ message: "Admin actions executed" });
});
```

---

## 4. Security Best Practices

### A. Protecting the Service Account Key
The `serviceAccountKey.json` provides full administrative access to your Firebase project.
- **Never commit it to version control.** Ensure it is listed in `.gitignore`.
- **Production Deployments:** When deploying the Node.js backend (e.g., to Render, Heroku, AWS), inject the credentials directly via Environment Variables instead of uploading the JSON file.

### B. Next.js Server Components (SSR) & HttpOnly Cookies
Because Firebase Client SDK state lives in the browser's IndexedDB/LocalStorage, Next.js Server Components cannot directly read who is logged in during a server-side render.

If your Server Components need access to the user state, you must sync it to an HttpOnly Session Cookie:
1. When the user logs in on the client, grab their `idToken`.
2. `POST` this token to a Next.js API Route Handler (e.g., `/api/auth/session`).
3. In that Route Handler, use the Firebase Admin SDK to create a session cookie:
   ```typescript
   const sessionCookie = await admin.auth().createSessionCookie(idToken, { expiresIn: 60 * 60 * 24 * 5 * 1000 }); // 5 days
   ```
4. Attach this cookie to the response with `HttpOnly`, `Secure`, and `SameSite=Strict` flags.
5. Your Next.js Server Components can now securely read this cookie via `cookies().get('session')` and verify it using `admin.auth().verifySessionCookie()`.
6. Ensure you have an equivalent `/api/auth/logout` route to clear the cookie when the user signs out.
