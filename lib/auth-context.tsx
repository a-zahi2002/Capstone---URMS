"use client";

import React, {
    createContext,
    useContext,
    useEffect,
    useState,
    ReactNode,
} from "react";
import {
    User,
    UserCredential,
    onAuthStateChanged,
    signInWithEmailAndPassword,
    createUserWithEmailAndPassword,
    signOut as firebaseSignOut,
    setPersistence,
    inMemoryPersistence,
} from "firebase/auth";
import { auth } from "./firebase";
import { getUserProfile, UserProfile, setSupabaseAuthHeaders, clearSupabaseAuthHeaders } from "./supabase";
import { BASE_URL } from "./apiClient";
import { useTabSession } from "@/hooks/useTabSession";

// ─── Types ────────────────────────────────────────────────────────────────────

interface AuthContextValue {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signIn: (email: string, password: string) => Promise<void>;
    signUp: (email: string, password: string) => Promise<UserCredential>;
    signOut: () => Promise<void>;
    setMockUser: (role: UserProfile["role"]) => void;
}

// ─── Context ──────────────────────────────────────────────────────────────────

const AuthContext = createContext<AuthContextValue | null>(null);

// ─── Provider ─────────────────────────────────────────────────────────────────

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    // Tab-scoped session utilities (backed by sessionStorage)
    const tabSession = useTabSession();

    // ─── Set Firebase to in-memory persistence once on mount ────────────────
    // inMemoryPersistence means Firebase keeps auth state only in the current
    // JavaScript execution context (i.e. this tab's memory).  It is NOT shared
    // via IndexedDB or localStorage, so each tab is fully isolated.
    useEffect(() => {
        if (!auth) {
            setLoading(false);
            console.warn("Firebase Auth bypassed: Missing or invalid API key.");
            return;
        }

        setPersistence(auth, inMemoryPersistence).catch((err) => {
            console.error("Failed to set in-memory persistence:", err);
        });
    }, []);

    // ─── Restore session from sessionStorage on mount ────────────────────────
    // Because inMemoryPersistence does NOT survive page reloads, we cache the
    // Firebase ID token + user profile in sessionStorage (which DOES survive
    // reloads but is cleared when the tab closes).  On mount we check for a
    // cached session and restore it so the user stays logged in after F5.
    useEffect(() => {
        if (!auth) return;

        let unsubscribeAuth: (() => void) | null = null;

        const restoreSession = async () => {
            const isReload = tabSession.checkIsReload();
            const cachedSession = tabSession.loadSession();

            if (isReload && cachedSession) {
                // ── Page reload in same tab: restore the existing session ──
                // We have the cached Firebase ID token.  Re-authenticate via
                // the /users/restore-session endpoint which exchanges the token
                // for the user profile.  If the token is still valid we get
                // the profile back and can set the auth state directly.
                try {
                    const res = await fetch(`${BASE_URL}/users/profile`, {
                        headers: { Authorization: `Bearer ${cachedSession.token}` },
                    });

                    if (res.ok) {
                        // Token is still valid — restore profile from cache
                        // (the fetch was just a liveness check)
                        const restoredProfile = cachedSession.profile;
                        setProfile(restoredProfile);
                        setSupabaseAuthHeaders(restoredProfile.id, restoredProfile.role);

                        // Create a synthetic user object so ProtectedRoute passes
                        const syntheticUser = {
                            uid: cachedSession.uid,
                            email: restoredProfile.email,
                            getIdToken: async () => cachedSession.token,
                        } as unknown as User;
                        setUser(syntheticUser);
                        setLoading(false);
                        return; // Skip the onAuthStateChanged listener below
                    }
                } catch {
                    // Backend unreachable or token expired — fall through to
                    // fresh login flow below.
                }

                // If we reach here, the cached token is invalid — clear it.
                tabSession.clearSession();
            }

            // ── Fresh tab open (or cache expired): require login ──────────
            // Listen for Firebase auth state.  With inMemoryPersistence there
            // will be no authenticated user here, so this immediately resolves
            // to null and sets loading = false, causing ProtectedRoute to
            // redirect to /login.
            unsubscribeAuth = onAuthStateChanged(auth, async (firebaseUser) => {
                setUser(firebaseUser);

                if (firebaseUser) {
                    let token = "";
                    try {
                        token = await firebaseUser.getIdToken();
                    } catch (tokenErr) {
                        console.error("Failed to retrieve Firebase ID token:", tokenErr);
                    }

                    // Set temporary headers so Supabase RLS can identify the user
                    setSupabaseAuthHeaders(firebaseUser.uid, "student");

                    let userProfile = await getUserProfile(firebaseUser.uid);

                    // Auto-sync profile if it doesn't exist yet in Supabase
                    if (!userProfile && token) {
                        try {
                            const res = await fetch(`${BASE_URL}/users/profile`, {
                                headers: { Authorization: `Bearer ${token}` },
                            });
                            if (res.ok) {
                                userProfile = await getUserProfile(firebaseUser.uid);
                            }
                        } catch (err) {
                            console.error("Failed to auto-sync profile with backend:", err);
                        }
                    }

                    setProfile(userProfile);
                    if (userProfile) {
                        setSupabaseAuthHeaders(userProfile.id, userProfile.role);
                        // Cache the session in sessionStorage for reload resilience
                        tabSession.saveSession(token, firebaseUser.uid, userProfile);
                    }
                } else {
                    setProfile(null);
                    clearSupabaseAuthHeaders();
                    tabSession.clearSession();
                }

                setLoading(false);
            });
        };

        restoreSession();

        return () => {
            if (unsubscribeAuth) unsubscribeAuth();
        };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // ─── Tab-close logout ────────────────────────────────────────────────────
    // When the tab is closed (not reloaded — reload is detected via the
    // RELOADING_KEY flag set by useTabSession's beforeunload listener),
    // we clear the session so the next open of the app requires a fresh login.
    //
    // Note: We cannot reliably call async Firebase signOut in beforeunload
    // because browsers terminate the page immediately.  Instead we rely on:
    //   1. sessionStorage being cleared by the browser on tab close.
    //   2. inMemoryPersistence ensuring Firebase state is never persisted.
    // Both together guarantee that a new tab always starts unauthenticated.
    //
    // The clearSession() call in useTabSession's beforeunload does the cleanup.
    // No extra listener is needed here.

    // ─── Auth Actions ─────────────────────────────────────────────────────────

    const signIn = async (email: string, password: string): Promise<void> => {
        if (!auth) throw new Error("Firebase is not initialized.");
        // Ensure persistence is in-memory for this sign-in
        await setPersistence(auth, inMemoryPersistence);
        await signInWithEmailAndPassword(auth, email, password);
        // The onAuthStateChanged listener above will pick up the new user,
        // fetch the profile and save the session to sessionStorage.
    };

    const signUp = async (email: string, password: string): Promise<UserCredential> => {
        if (!auth) throw new Error("Firebase is not initialized.");
        return await createUserWithEmailAndPassword(auth, email, password);
    };

    const signOut = async (): Promise<void> => {
        if (auth) {
            await firebaseSignOut(auth);
        }
        setProfile(null);
        setUser(null);
        clearSupabaseAuthHeaders();
        tabSession.clearSession();
    };

    const setMockUser = (role: UserProfile["role"]): void => {
        // Demo / UI development helper — not for production use
        const mockProfile: UserProfile = {
            id: `mock-${role}`,
            name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            email: `${role}@demo.lk`,
            role: role,
            created_at: new Date().toISOString(),
        };
        setProfile(mockProfile);
        setSupabaseAuthHeaders(mockProfile.id, mockProfile.role);

        const mockToken = `mock-token:${mockProfile.id}:${mockProfile.role}`;

        // Store in sessionStorage so mock sessions survive reloads within the tab
        tabSession.saveSession(mockToken, mockProfile.id, mockProfile);

        setUser({
            uid: mockProfile.id,
            email: mockProfile.email,
            getIdToken: async () => mockToken,
        } as unknown as User);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signIn, signUp, signOut, setMockUser }}>
            {children}
        </AuthContext.Provider>
    );
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useAuth(): AuthContextValue {
    const ctx = useContext(AuthContext);
    if (!ctx) throw new Error("useAuth must be used inside <AuthProvider>");
    return ctx;
}
