# Bcrypt Password Encryption — Documentation

## Overview
This document explains the **bcrypt password encryption** mechanism implemented in the University Resource Management System (URMS). This feature adds a defense-in-depth security layer by hashing user passwords with the bcrypt algorithm and storing the resulting hash in the Supabase `users` table, alongside the existing Firebase Authentication flow.

## 1. Architecture Overview

The URMS authentication uses a **dual-layer** approach:

1. **Primary Layer — Firebase Auth:** Firebase's GoTrue service handles the core email/password authentication, token issuance, and session management.
2. **Secondary Layer — Bcrypt (New):** During registration, the plaintext password is hashed using bcrypt (12 salt rounds) and stored in the Supabase `password_hash` column. During login, the password is verified against this stored hash as an additional validation step.

### Security Flow Diagram

```
┌──────────────────────────────────────────────────────────────────────┐
│                        REGISTRATION FLOW                             │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Client (Register Page)                                              │
│    │                                                                 │
│    ├── 1. Firebase createUserWithEmailAndPassword(email, password)    │
│    │       → Firebase stores password internally (GoTrue)            │
│    │       → Returns UserCredential + idToken                        │
│    │                                                                 │
│    ├── 2. POST /api/users/hash-password  { password }                │
│    │       → Backend hashes with bcrypt (12 salt rounds)             │
│    │       → Returns { password_hash: "$2a$12$..." }                 │
│    │                                                                 │
│    └── 3. Supabase upsert into `users` table                        │
│            → Stores profile + password_hash                          │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────┐
│                          LOGIN FLOW                                  │
├──────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  Client (Login Page)                                                 │
│    │                                                                 │
│    ├── 1. Firebase signInWithEmailAndPassword(email, password)        │
│    │       → Firebase validates credentials (Primary check)          │
│    │       → Returns UserCredential + idToken                        │
│    │                                                                 │
│    ├── 2. POST /api/users/verify-password  { email, password }       │
│    │       → Backend looks up password_hash from Supabase            │
│    │       → Compares plaintext with bcrypt hash (Secondary check)   │
│    │       → Returns { valid: true/false }                           │
│    │                                                                 │
│    ├── IF valid === false:                                            │
│    │       → Firebase signOut() (revoke session)                     │
│    │       → Display "Password verification failed" error            │
│    │                                                                 │
│    └── IF valid === true:                                            │
│            → Redirect to /dashboard                                  │
│                                                                      │
└──────────────────────────────────────────────────────────────────────┘
```

---

## 2. Why Bcrypt?

| Factor | Details |
|---|---|
| **Algorithm** | bcrypt — adaptive hash function designed for password storage |
| **Salt rounds** | 12 (OWASP recommends a minimum of 10; 12 provides ~250ms per hash) |
| **Library** | `bcryptjs` — pure JavaScript implementation (no native C++ bindings required) |
| **Why not SHA-256?** | SHA is a fast hash; bcrypt is intentionally slow to resist brute-force attacks |
| **Why not Argon2?** | Argon2 is newer but requires native bindings; bcryptjs is more portable across dev environments |
| **Why `bcryptjs` over `bcrypt`?** | `bcryptjs` is a pure JS implementation that avoids native compilation issues across macOS, Windows, and Linux. Functionally identical API |

---

## 3. Files Created / Modified

### New Files

| File | Description |
|---|---|
| `backend/src/services/password.service.ts` | Utility service encapsulating bcrypt `hashPassword()` and `verifyPassword()` functions |

### Modified Files

| File | Change Description |
|---|---|
| `backend/package.json` | Added `bcryptjs` (dependency) and `@types/bcryptjs` (devDependency) |
| `backend/src/db/supabase-schema.sql` | Added `password_hash TEXT` column to the `users` table |
| `backend/src/controllers/userCtrl.ts` | Added `hashPasswordHandler` and `verifyPasswordHandler` controller functions |
| `backend/src/routes/userRoutes.ts` | Added `POST /hash-password` and `POST /verify-password` routes |
| `lib/supabase.ts` | Added `password_hash` to `UserProfile` interface and `createUserProfile()` function |
| `app/register/page.tsx` | Integrated bcrypt hashing API call during user registration |
| `app/login/page.tsx` | Integrated bcrypt verification API call during user login |

---

## 4. Backend Implementation

### Password Service (`backend/src/services/password.service.ts`)

This utility centralizes all bcrypt operations. No other file should import `bcryptjs` directly.

```typescript
import bcrypt from "bcryptjs";

const SALT_ROUNDS = 12;

// Hash a plaintext password
export async function hashPassword(plaintext: string): Promise<string> {
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    return bcrypt.hash(plaintext, salt);
}

// Verify a plaintext password against a stored hash
export async function verifyPassword(plaintext: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plaintext, hash);
}
```

### API Endpoints

Both endpoints are protected by the `verifyToken` middleware — only authenticated users with a valid Firebase JWT can call them.

#### `POST /api/users/hash-password`

Used during **registration** to generate a bcrypt hash.

**Request:**
```json
{
    "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
    "password_hash": "$2a$12$LJ3m5ZQ..."
}
```

**Error Responses:**
- `400` — Password missing or less than 8 characters
- `500` — Server error during hashing

#### `POST /api/users/verify-password`

Used during **login** to verify the password against the stored hash.

**Request:**
```json
{
    "email": "user@university.ac.lk",
    "password": "SecurePassword123"
}
```

**Response (200):**
```json
{
    "valid": true
}
```

**Edge Cases:**
| Scenario | Response |
|---|---|
| User not found | `{ "valid": false }` — prevents user enumeration |
| User has no stored hash (legacy/mock user) | `{ "valid": true, "skipped": true }` — graceful pass-through |
| Hash mismatch | `{ "valid": false }` |

---

## 5. Database Schema Change

### Column Added to `users` Table

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

| Column | Type | Nullable | Description |
|---|---|---|---|
| `password_hash` | `TEXT` | Yes | Bcrypt hash string (e.g., `$2a$12$...`). Null for legacy users created before this feature |

> **Migration Required:** Run the `ALTER TABLE` statement above in the Supabase SQL Editor to add the column to your existing database.

---

## 6. Frontend Integration

### Registration Page (`app/register/page.tsx`)

After Firebase creates the user, the registration page:

1. Retrieves the Firebase ID token from the newly created user
2. Calls `POST /api/users/hash-password` with the plaintext password
3. Receives the bcrypt hash
4. Passes `password_hash` to `createUserProfile()` for Supabase storage

```typescript
// Hash the password using bcrypt via the backend API
const token = await userCredential.user.getIdToken();
const hashResponse = await fetch(`${API_URL}/users/hash-password`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ password }),
});
const { password_hash } = await hashResponse.json();

// Store with profile
await createUserProfile({
    id: uid,
    name: fullName,
    email: email,
    role: role,
    department: department,
    password_hash: password_hash,  // ← NEW
});
```

**Graceful Degradation:** If the hash endpoint is unreachable, registration still completes via Firebase. A console warning is logged.

### Login Page (`app/login/page.tsx`)

After Firebase sign-in succeeds, the login page:

1. Retrieves the Firebase ID token
2. Calls `POST /api/users/verify-password` with `{ email, password }`
3. If `valid === false`: signs out from Firebase and displays an error
4. If valid: redirects to `/dashboard`

```typescript
const verifyResponse = await fetch(`${API_URL}/users/verify-password`, {
    method: "POST",
    headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify({ email, password }),
});
const { valid } = await verifyResponse.json();

if (valid === false) {
    await firebaseSignOut(auth);
    setError("Password verification failed. Please reset your password.");
    return;
}
```

**Graceful Degradation:** If the verify endpoint is unreachable, login proceeds with Firebase auth only. A console warning is logged.

---

## 7. Security Considerations

### Password Never Stored in Plaintext
- The plaintext password is transmitted over HTTPS to the backend `/hash-password` endpoint
- It is immediately hashed with bcrypt and only the hash is stored
- The plaintext is never logged, persisted, or cached

### Salt Rounds Configuration
- **Current setting:** 12 rounds
- Each additional round doubles the computation time
- 12 rounds ≈ 250ms per hash (good balance of security and performance)
- The salt round count can be adjusted in `password.service.ts` by modifying the `SALT_ROUNDS` constant

### Defense-in-Depth Strategy
This implementation follows a defense-in-depth approach:
- Firebase Auth remains the primary authentication mechanism
- Bcrypt hash verification acts as a secondary check
- Even if Firebase credentials are compromised, the bcrypt hash provides an additional audit trail

### Backward Compatibility
- Existing users without a `password_hash` (mock users, demo accounts) are not affected
- The verify endpoint returns `{ valid: true, skipped: true }` for users without a stored hash
- New registrations automatically populate the `password_hash` column

---

## 8. Setup Instructions

### Step 1 — Run the Database Migration

Open the **Supabase SQL Editor** and run:

```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
```

### Step 2 — Install Backend Dependencies

```bash
cd backend
npm install
```

`bcryptjs` and `@types/bcryptjs` are already listed in `package.json`.

### Step 3 — Restart the Backend

```bash
npm run dev
```

### Step 4 — Test

1. **Register** a new user → verify the `password_hash` column is populated in the Supabase `users` table
2. **Login** with the new user → verify successful redirect to `/dashboard`
3. **Existing mock users** → verify they can still log in via the Quick Operator Access buttons (hash check is skipped)

---

## 9. Limitations & Assumptions

1. **Bcrypt hash is only generated for new registrations.** Users who registered before this feature will have a `NULL` `password_hash` — the system gracefully skips verification for these users.

2. **Password changes via Firebase Auth** (e.g., forgot-password flow) will **not** automatically update the bcrypt hash in Supabase. A future enhancement should intercept password resets and re-hash.

3. **The hash endpoint requires authentication.** A valid Firebase JWT is needed to call `/api/users/hash-password`. This means the user must be authenticated before requesting a hash — which is guaranteed since Firebase `createUserWithEmailAndPassword` is called first.

4. **Rate limiting** is not implemented on the hash/verify endpoints in this version. Consider adding Express rate-limiting middleware for production deployments.

---

## 10. Author & Date

- **Feature implemented:** 2026-06-19
- **Scope:** Authentication security layer (backend service, API routes, frontend integration)
- **Firebase:** Preserved (unchanged)
- **API surface:** Two new endpoints added (`/hash-password`, `/verify-password`)
