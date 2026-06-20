# Firebase Authentication Context Updates

## Overview
This document outlines the recent updates made to the global Authentication Context (`lib/auth-context.tsx`) within the URMS application. The primary goal of this update was to integrate the Firebase `createUserWithEmailAndPassword` method into the centralized context provider, aligning the registration logic with the existing sign-in and sign-out patterns.

## File Modified
- `lib/auth-context.tsx`

## Detailed Changes

### 1. Expanded Imports
We imported the necessary functions and types from the Firebase client SDK to support user registration:
- `createUserWithEmailAndPassword`: The core Firebase SDK function to register a new user using an email and password.
- `UserCredential`: The return type from the registration function, required for accurate TypeScript typings.

### 2. Updated `AuthContextValue` Interface
The context's type definition was expanded to include the new `signUp` method. This ensures that any component consuming the context via the `useAuth()` hook receives full TypeScript support and auto-completion.
```typescript
interface AuthContextValue {
    user: User | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<UserCredential>;
    signOut: () => Promise<void>;
}
```

### 3. Implemented `signUp` Method
Inside the `AuthProvider` component, we implemented the `signUp` function. This async function takes the user's email and password, passes them to the Firebase `createUserWithEmailAndPassword` method along with the initialized `auth` instance, and returns the resulting `UserCredential`.

```typescript
const signUp = async (email: string, password: string) => {
    return await createUserWithEmailAndPassword(auth, email, password);
};
```

### 4. Context Provider Export
Finally, the `signUp` function was added to the `value` object passed into the `AuthContext.Provider`. This exposes the method globally.

```typescript
return (
    <AuthContext.Provider value={{ user, loading, signIn, signUp, signOut }}>
        {children}
    </AuthContext.Provider>
);
```

## Usage
Client-side components can now easily access the registration method without needing to import Firebase dependencies directly:

```typescript
import { useAuth } from "@/lib/auth-context";

export default function MyComponent() {
    const { signUp } = useAuth();

    const handleRegister = async () => {
        try {
            const credential = await signUp("user@example.com", "securePassword123");
            console.log("Registered user:", credential.user);
        } catch (error) {
            console.error("Registration failed:", error);
        }
    };
    
    // ...
}
```

## Note on Existing Registration Page
As per the strict implementation requirements, the existing registration page (`app/register/page.tsx`) was **not** modified during this update. It currently still uses the direct Firebase imports to handle user creation. Future refactoring efforts may update that component to utilize this newly centralized `signUp` context method.
