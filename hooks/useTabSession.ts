/**
 * useTabSession
 * ─────────────────────────────────────────────────────────────────────────────
 * Provides a truly tab-isolated session backed by sessionStorage.
 *
 * sessionStorage is cleared by the browser when the tab is closed (unlike
 * localStorage and IndexedDB which persist across tabs and restarts). This
 * makes it the correct storage primitive for per-tab auth sessions.
 *
 * Key design decisions:
 *  - Each tab gets a unique `tabId` (UUID) generated once and written to
 *    sessionStorage so it survives page reloads within the same tab.
 *  - Session data (Firebase token + user profile) is stored under a key
 *    namespaced by the tabId.
 *  - A `reloading` flag is set in sessionStorage during `beforeunload`.
 *    On mount, if the flag is present it means the page was reloaded (not
 *    the tab being freshly opened), so the existing session is valid.
 * ─────────────────────────────────────────────────────────────────────────────
 */

import { useRef, useEffect } from "react";
import { UserProfile } from "@/lib/supabase";

const TAB_ID_KEY = "urms_tab_id";
const RELOADING_KEY = "urms_reloading";
const SESSION_PREFIX = "urms_session_";

export interface TabSessionData {
    token: string;
    uid: string;
    profile: UserProfile;
    savedAt: number; // epoch ms — used to detect expired tokens (1 hr)
}

/** Returns the tab-scoped sessionStorage key for session data. */
function sessionKey(tabId: string): string {
    return `${SESSION_PREFIX}${tabId}`;
}

/** Generate or retrieve the persisted tab ID from sessionStorage. */
function getOrCreateTabId(): string {
    let id = sessionStorage.getItem(TAB_ID_KEY);
    if (!id) {
        id = crypto.randomUUID();
        sessionStorage.setItem(TAB_ID_KEY, id);
    }
    return id;
}

/**
 * Returns true if this mount is a page reload (not a fresh tab open).
 * A reload is detected by the presence of the RELOADING_KEY in sessionStorage,
 * which is set during `beforeunload` and cleared on mount.
 */
function isPageReload(): boolean {
    const flag = sessionStorage.getItem(RELOADING_KEY);
    // Clear the flag immediately so it does not persist across genuine closures
    if (flag) sessionStorage.removeItem(RELOADING_KEY);
    return flag === "1";
}

// ─── Public API ───────────────────────────────────────────────────────────────

export function useTabSession() {
    // Initialised lazily on first use (SSR-safe: only runs in browser).
    const tabIdRef = useRef<string | null>(null);

    // Register the `beforeunload` listener once on mount.
    useEffect(() => {
        const handleBeforeUnload = () => {
            // Set a flag so the next mount can tell it was a reload.
            sessionStorage.setItem(RELOADING_KEY, "1");
        };
        window.addEventListener("beforeunload", handleBeforeUnload);
        return () => window.removeEventListener("beforeunload", handleBeforeUnload);
    }, []);

    /** Lazily initialise and return the tab ID (only valid in the browser). */
    function getTabId(): string {
        if (!tabIdRef.current) {
            tabIdRef.current = getOrCreateTabId();
        }
        return tabIdRef.current;
    }

    /**
     * Save auth session data to sessionStorage.
     * Called after a successful Firebase sign-in.
     */
    function saveSession(token: string, uid: string, profile: UserProfile): void {
        const data: TabSessionData = { token, uid, profile, savedAt: Date.now() };
        sessionStorage.setItem(sessionKey(getTabId()), JSON.stringify(data));
    }

    /**
     * Load auth session data from sessionStorage.
     * Returns null if no session exists or if the token is older than 55 minutes
     * (Firebase tokens expire after 60 minutes; 55 min gives a safe margin).
     */
    function loadSession(): TabSessionData | null {
        try {
            const raw = sessionStorage.getItem(sessionKey(getTabId()));
            if (!raw) return null;
            const data: TabSessionData = JSON.parse(raw);
            const ageMs = Date.now() - data.savedAt;
            const TOKEN_TTL_MS = 55 * 60 * 1000; // 55 minutes
            if (ageMs > TOKEN_TTL_MS) {
                clearSession();
                return null;
            }
            return data;
        } catch {
            return null;
        }
    }

    /** Clear the session for this tab (on sign-out or token expiry). */
    function clearSession(): void {
        const id = tabIdRef.current ?? sessionStorage.getItem(TAB_ID_KEY);
        if (id) sessionStorage.removeItem(sessionKey(id));
    }

    /**
     * Returns true if this mount is a page reload within the same tab.
     * Used by AuthProvider to decide whether to require a fresh login.
     */
    function checkIsReload(): boolean {
        return isPageReload();
    }

    return { getTabId, saveSession, loadSession, clearSession, checkIsReload };
}
