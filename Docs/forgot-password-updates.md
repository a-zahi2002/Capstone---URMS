# Password Reset Feature

## Overview
This document outlines the recent implementation of the "Forgot Password" functionality in the URMS application. The flow allows users to securely request a password reset link via email utilizing Firebase Authentication.

## Files Created & Modified
- **New Feature Page**: `app/forgot-password/page.tsx`
- **Updated Page**: `app/login/page.tsx`

---

## Detailed Changes

### 1. The Forgot Password Page (`app/forgot-password/page.tsx`)
A dedicated Next.js route was created to host the password reset form.

- **UI/UX Consistency**: 
  - The page mirrors the premium split-pane layout of the existing authentication pages (Login & Registration), complete with the university visual cover, gradient overlays, and glassmorphic elements.
  - Form fields use the established global design language (rounded inputs, consistent focus rings, `lucide-react` iconography).
- **Core Functionality**:
  - The form imports and utilizes the `sendPasswordResetEmail` function directly from the `firebase/auth` SDK.
  - A single input is provided for the user's "Institutional Email".
- **State Management & Feedback**:
  - `loading`: Disables inputs and renders a spinner on the submit button while the Firebase request is inflight.
  - `error`: Catches and beautifully renders specific Firebase errors (e.g., alerting the user if the entered email is not registered in the system).
  - `success`: Provides clear, color-coded confirmation that the reset email has been dispatched.
- **Navigation**: Includes a stylized "Back to sign in" link allowing users to easily return to the login flow.

### 2. Login Page Integration (`app/login/page.tsx`)
To make the new feature discoverable:
- The previously inert "Forgot?" link positioned above the password field on the login page was updated.
- Its `href` attribute was changed from `"#"` to `"/forgot-password"`, establishing a seamless UX flow for users who cannot remember their credentials.

## Future Enhancements
The current flow handles the request generation completely client-side via Firebase Auth. Since Firebase automatically handles the email dispatch and the destination landing page (the default Firebase action handler page), no further backend API development was required for this sprint. If custom email templates or a custom action-handler domain are needed in the future, those can be configured within the Firebase Console.
