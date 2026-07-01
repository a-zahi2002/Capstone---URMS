# CHANGELOG: Bcrypt Password Encryption

## Date: 2026-06-19

## Overview
Implemented bcrypt password encryption as a defense-in-depth security layer for user authentication. Passwords are now hashed with bcrypt (12 salt rounds) and stored in the Supabase `users` table during registration, then verified against the stored hash during login — on top of the existing Firebase Authentication flow.

## Changes Made

### New Files
- **`backend/src/services/password.service.ts`:**
  - Created a dedicated utility service encapsulating all bcrypt operations.
  - `hashPassword(plaintext)` — generates a bcrypt hash with 12 salt rounds using `bcrypt.genSalt()` and `bcrypt.hash()`.
  - `verifyPassword(plaintext, hash)` — compares a plaintext password against a stored hash using `bcrypt.compare()`.
  - Uses `bcryptjs` (pure JavaScript, no native compilation dependencies).

### Backend (`/backend/src/controllers/userCtrl.ts`)
- **Added `hashPasswordHandler`:** Accepts `{ password }` from the request body, validates minimum length (8 chars), generates a bcrypt hash via `password.service.ts`, and returns `{ password_hash }`.
- **Added `verifyPasswordHandler`:** Accepts `{ email, password }`, looks up the user's `password_hash` from Supabase, compares with bcrypt, and returns `{ valid: true/false }`. Gracefully handles legacy users without a stored hash by returning `{ valid: true, skipped: true }`.

### Backend (`/backend/src/routes/userRoutes.ts`)
- **Added `POST /api/users/hash-password`:** Protected route for generating bcrypt hashes during registration.
- **Added `POST /api/users/verify-password`:** Protected route for verifying passwords during login.
- Both routes are guarded by the existing `verifyToken` middleware.

### Database (`/backend/src/db/supabase-schema.sql`)
- **Added `password_hash TEXT` column** to the `users` table definition. Nullable to support existing/mock users without a stored hash.

### Frontend (`/lib/supabase.ts`)
- **Updated `UserProfile` interface:** Added optional `password_hash?: string` field.
- **Updated `createUserProfile()`:** Conditionally includes `password_hash` in the Supabase upsert when provided.

### Frontend (`/app/register/page.tsx`)
- **Integrated bcrypt hashing:** After Firebase creates the user, the plaintext password is sent to `POST /api/users/hash-password` to generate a bcrypt hash. The hash is then included in the `createUserProfile()` call for Supabase storage.
- **Graceful degradation:** If the hash endpoint is unreachable, registration completes via Firebase without a stored hash (console warning logged).

### Frontend (`/app/login/page.tsx`)
- **Integrated bcrypt verification:** After Firebase sign-in succeeds, the password is verified against the stored bcrypt hash via `POST /api/users/verify-password`.
- **Hash mismatch handling:** If verification returns `valid === false`, the user is signed out of Firebase and an error message is displayed.
- **Graceful degradation:** If the verify endpoint is unreachable, login proceeds with Firebase auth only (console warning logged).

### Dependencies (`/backend/package.json`)
- **Added `bcryptjs`** (runtime dependency) — Pure JavaScript bcrypt implementation.
- **Added `@types/bcryptjs`** (dev dependency) — TypeScript type definitions.

## Security Enhancements
- **Password hashing:** All new user passwords are hashed with bcrypt (12 salt rounds) before storage — plaintext passwords are never persisted.
- **Dual-layer authentication:** Firebase Auth handles primary verification; bcrypt hash acts as a secondary defense-in-depth check.
- **User enumeration prevention:** The verify endpoint returns a generic `{ valid: false }` for non-existent users.
- **Backward compatibility:** Legacy/mock users without a stored hash are gracefully handled (bcrypt check is skipped).

## Migration Required
Run the following SQL in the Supabase SQL Editor:
```sql
ALTER TABLE users ADD COLUMN IF NOT EXISTS password_hash TEXT;
```
