# Session Management & Idle Timeout Implementation

This document details the architecture, functionality, and implementation of the Secure Session Management and Idle Timeout features built for the University Resource Management System (URMS). 

## Overview

To improve the security and resource management of the URMS platform, an auto-logout feature was added. This feature tracks user inactivity and safely logs out users who have left their dashboards unattended for prolonged periods (15 minutes by default). Additionally, it manages Firebase Authentication token refreshes explicitly.

## Core Components

The feature is built using three primary components:

### 1. Token Management (`lib/session-utils.ts`)
This utility file wraps Firebase Auth's ID token mechanisms.
- **`forceTokenRefresh`**: A helper function to force a token refresh immediately. This can be invoked before highly sensitive API calls to ensure the token hasn't expired.
- **`setupTokenRefreshListener`**: Demonstrates the usage of `onIdTokenChanged`, showing how Firebase implicitly refreshes the token behind the scenes ~5 minutes before it expires, preventing abrupt, unauthorized API errors.

### 2. Idle Tracking Hook (`hooks/useIdleTimeout.ts`)
A highly optimized React hook designed to track user activity without blocking the main UI thread.
- **Tracked Events**: `mousemove`, `keydown`, `scroll`, `click`, `touchstart`.
- **Throttling**: To prevent React from firing thousands of re-renders or function calls per second when a user moves the mouse, the hook utilizes a throttle that ignores events happening within 1000ms of the last recorded activity.
- **States**: 
  - `isWarning` (Triggered at 14 minutes).
  - `isIdle` (Triggered at 15 minutes).
- **Cleanup**: Uses `useEffect` return functions to meticulously clear `setTimeout` instances and remove window event listeners upon unmounting, preventing memory leaks.

### 3. Session Warning Provider (`components/SessionProvider.tsx`)
A Next.js global context wrapper component that sits around authenticated routes.
- **Warning Phase**: When the 14-minute warning is triggered, a Tailwind CSS warning modal renders via a fixed overlay on the screen. It informs the user their session is expiring and offers a "Stay Logged In" button to reset the timer.
- **Logout Phase**: If the modal is ignored for 1 minute (reaching the 15-minute threshold), the provider immediately calls `auth.signOut()`, securely clears all local state, and redirects the user to the `/login` page.

## Integration

To ensure the timeout functionality covers all secure areas of the app automatically, the `SessionProvider` was integrated into the root protection layer:

**`components/ProtectedRoute.tsx`**
```tsx
export default function ProtectedRoute({ children, ... }) {
    // Auth & role checking logic...
    
    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    );
}
```

Because `ProtectedRoute` guards all inner routes (e.g., `/dashboard`, `/bookings`), wrapping `SessionProvider` here means developers do not need to manually add the idle timeout feature to new pages—it happens automatically.

## How to Test

For developers testing this feature:
1. Open `components/SessionProvider.tsx`.
2. Locate the line: `const { isIdle, isWarning, resetTimers } = useIdleTimeout(15, 14);`
3. Change the parameters to smaller values, such as `useIdleTimeout(2, 1)` (timeout at 2 minutes, warn at 1 minute).
4. Save and step away from your input devices for 1 minute.
5. You should see the modal. Clicking the button will reset the timer.
6. Leaving the mouse for 2 minutes will result in a forced redirect to the login screen.

*Be sure to change the timings back to `(15, 14)` before committing to production.*
