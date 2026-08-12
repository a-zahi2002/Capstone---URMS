import { User, Auth, onIdTokenChanged } from "firebase/auth";

/**
 * Forces an immediate token refresh.
 * Use this right before performing highly sensitive actions to ensure
 * the token is fresh and claims are up to date.
 */
export const forceTokenRefresh = async (user: User | null): Promise<string | null> => {
    if (!user) return null;
    try {
        // Passing true forces a refresh regardless of current expiry time
        const token = await user.getIdToken(true);
        return token;
    } catch (error) {
        console.error("Failed to force token refresh:", error);
        return null;
    }
};

/**
 * Sets up a listener for token changes.
 * Firebase SDK automatically refreshes the token before it expires (~5 mins before).
 * This observer will trigger whenever a new token is minted, a user signs in, or signs out.
 * 
 * In a Next.js environment, you can use this listener to sync the fresh token
 * with a custom backend or an HttpOnly cookie via Next.js API routes.
 */
export const setupTokenRefreshListener = (auth: Auth | null, onTokenRefreshed?: (token: string | null) => void) => {
    if (!auth) return () => {};
    
    const unsubscribe = onIdTokenChanged(auth, async (user) => {
        if (user) {
            try {
                // Grab the current active token (will not force a network request unless necessary)
                const token = await user.getIdToken();
                if (onTokenRefreshed) {
                    onTokenRefreshed(token);
                }
            } catch (error) {
                console.error("Error retrieving ID token in listener:", error);
            }
        } else {
            if (onTokenRefreshed) {
                onTokenRefreshed(null);
            }
        }
    });

    // Return the unsubscribe function to clean up the listener when the component unmounts
    return unsubscribe;
};
