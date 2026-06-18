# CHANGELOG: Session Management & Idle Timeout

## Overview of Changes
Implemented a comprehensive Session Management and Auto-Logout (Idle Timeout) feature to enhance the platform's security and user session lifecycle management.

### Features Added
- **`lib/session-utils.ts`**:
  - Added utility functions to interface with Firebase Authentication's token mechanisms.
  - Implemented `forceTokenRefresh` for on-demand JWT token refresh.
  - Implemented `setupTokenRefreshListener` using `onIdTokenChanged` to handle token refresh lifecycles automatically.

- **`hooks/useIdleTimeout.ts`**:
  - Developed a custom React hook to track user interactivity (`mousemove`, `keydown`, `scroll`, `click`, `touchstart`).
  - Implemented a 1-second event throttle to ensure excellent UI performance during rapid interactivity.
  - Exposes `isIdle` (15 minutes), `isWarning` (14 minutes), and a `resetTimers` function.

- **`components/SessionProvider.tsx`**:
  - Created a global UI wrapper component that listens to the `useIdleTimeout` hook.
  - Renders a responsive, glassmorphic Tailwind CSS warning modal at the 14-minute warning threshold.
  - Executes a secure `signOut()` and login redirect at the 15-minute idle threshold.

### Components Modified
- **`components/ProtectedRoute.tsx`**:
  - Wrapped the authenticated children rendering inside the new `<SessionProvider>`.
  - Ensures every authenticated route (Dashboard, Bookings, Maintenance, etc.) automatically inherits the idle timeout and token lifecycle protection without requiring any manual route-by-route additions.

### Security Enhancements
- Enforced automated logouts for forgotten or abandoned active sessions.
- Ensured proper cleanup of global event listeners when components unmount, eliminating potential memory leaks.
