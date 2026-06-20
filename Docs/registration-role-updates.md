# Role Selection Feature Updates

## Overview
This document outlines the recent enhancements made to the User Registration Form (`app/register/page.tsx`) in the URMS application. Specifically, a Role Selection dropdown has been implemented to enforce Role-Based Access Control (RBAC) categorizations (Admin, Lecturer, Student, Maintenance) during the user sign-up process.

## File Modified
- `app/register/page.tsx`

## Detailed Changes

### 1. New State Variable
A new piece of state was introduced using React's `useState` hook to track the user's role selection.
```typescript
const [role, setRole] = useState("");
```

### 2. Enhanced Form Validation
The `validateForm` function was updated to include a strict check ensuring that the user has selected a role before they can successfully submit the registration form. If left blank, it triggers the same generic validation error ("All fields are required.") protecting the form against incomplete submissions.
```typescript
const validateForm = () => {
    if (!fullName || !email || !role || !password || !confirmPassword) {
        setError("All fields are required.");
        return false;
    }
    // ...
}
```

### 3. Role Selection Dropdown UI
A fully responsive, Tailwind CSS styled dropdown menu (`<select>`) was integrated directly into the form hierarchy, placed between the "Institutional Email" and "Password" fields.
- It utilizes the existing premium glass/slate aesthetic (rounded corners, focus rings, hover state).
- The dropdown includes the following options mapping to the system's core RBAC groups:
  - `Admin`
  - `Lecturer`
  - `Student`
  - `Maintenance`

### 4. Iconography Integration
To maintain strict visual consistency with the surrounding input fields, the `BadgeCheck` icon from the `lucide-react` library was imported and placed absolutely within the dropdown container.
```typescript
import { User, AtSign, Lock, Eye, EyeOff, ArrowRight, X, CheckCircle, BadgeCheck } from "lucide-react";
```

## Current Behavior & Future Scope
Currently, the form successfully captures the selected role and validates its presence. Because Firebase's client-side `createUserWithEmailAndPassword` method natively accepts only the `email` and `password` properties, the selected `role` is held securely in the component state until the form submission finishes. 

**Next Steps / Future Integration:** 
To persistently save the user's role across sessions, the backend/registration flow will need to be updated. Future integrations might include:
1. Pushing the `role` to a designated Firestore collection (e.g., `users` collection) alongside the generated `uid`.
2. Hitting an authenticated Node.js backend endpoint that leverages the Firebase Admin SDK to attach the role directly to the user identity via **Custom Claims**.
