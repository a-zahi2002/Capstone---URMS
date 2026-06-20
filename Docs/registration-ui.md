# Registration Form UI Document

## Overview
This document outlines the implementation details for the newly created User Registration Form UI in the URMS (University Resource Management System) application. The registration form provides a clean, responsive interface for new users to request access to the platform, aligning with the existing design system established by the login page.

## File Structure & Routing
- The registration page is available at the `/register` route.
- **Component Path:** `app/register/page.tsx`
- **Modified Path:** `app/login/page.tsx` (Updated to link to the new registration page).

## Design Characteristics
The `RegisterPage` uses a split-screen layout similar to the `LoginPage` to maintain consistency across the authentication flow.

- **Left Pane (Visual Cover):** 
  - Hidden on smaller screens (`lg:hidden`).
  - Displays a full-height background image with the primary brand color overlay (`bg-brand-primary`).
  - Contains the URMS logo outlaid over the image and a compelling value proposition message for new users ("Join the Campus Network").
- **Right Pane (Form Container):**
  - Fully responsive, centered content.
  - Form elements styled consistent with existing input components (e.g., `rounded-2xl`, focus rings, matching typography).

## Core Functionality & Validation

The registration form consists of four primary fields:
1. **Full Name:** Standard text input. Required.
2. **Institutional Email:** Email input. Required. Must match typical email formatting, serving as the unique identifier for students and faculty.
3. **Password:** Password input. Required. Minimum 8 characters. Includes a toggleable visibility eye icon (`lucide-react`).
4. **Confirm Password:** Password input. Required. Must match the value in the "Password" field.

### Client-Side Validation Logic
Upon form submission (`handleSubmit`), the component triggers a `validateForm` function that performs the following checks in order:
- **Empty Fields:** Verifies that all four fields have been populated.
- **Email Format:** Uses a regular expression (`/^[^\s@]+@[^\s@]+\.[^\s@]+$/`) to ensure the email is structurally valid.
- **Password Strength:** Enforces a minimum length of 8 characters for the password.
- **Password Match:** Checks that the "Password" and "Confirm Password" entered strings are identical.

If any check fails, it sets the `error` state, which displays an animated, red alert banner below the form inputs outlining the specific validation failure. If the validation passes, the error state is cleared, and the form submission proceeds.

## User Flow
1. **Navigation:** A user starting from the `/login` page can click "Create Account" at the bottom of the form to navigate to `/register`.
2. **Data Entry:** The user inputs their details into the registration form.
3. **Submission:** Upon clicking the "Register" button:
   - The button enters a designated `loading` state, rendering a circular spinner and disabling further inputs to prevent duplicate submissions.
   - For UI demonstration purposes, a mock async registration process is simulated using a `setTimeout` of 1.5 seconds.
4. **Completion:** Upon successful mock registration, the user is navigated back to the `/login` page via `next/navigation`'s `useRouter`.

## Dependencies Used
- React (`useState`, `FormEvent`)
- Next.js Navigation (`useRouter`, `Link`)
- `lucide-react` (Icons: `User`, `AtSign`, `Lock`, `Eye`, `EyeOff`, `ArrowRight`, `X`)
- Tailwind CSS styling.
