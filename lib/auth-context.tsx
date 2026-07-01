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
    browserSessionPersistence,
} from "firebase/auth";
import { auth } from "./firebase";
import { getUserProfile, UserProfile, setSupabaseAuthHeaders, clearSupabaseAuthHeaders } from "./supabase";
import { BASE_URL } from "./apiClient";

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

    useEffect(() => {
        if (!auth) {
            setLoading(false);
            console.warn("Firebase Auth bypassed: Missing or invalid API key.");
            return;
        }

        // Set persistence to session-based to resolve auto-login when opening fresh
        setPersistence(auth, browserSessionPersistence).catch((err) => {
            console.error("Failed to set session persistence:", err);
        });

        const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
            setUser(firebaseUser);
            if (firebaseUser) {
                // Set temporary headers with UID so that Supabase RLS allows the user to query their own profile
                setSupabaseAuthHeaders(firebaseUser.uid, "student");
                
                let token = "";
                try {
                    token = await firebaseUser.getIdToken();
                    // Set cookie for middleware validation (session cookie)
                    document.cookie = `firebaseToken=${token}; path=/; SameSite=Lax; Secure`;
                } catch (tokenErr) {
                    console.error("Failed to retrieve Firebase ID token:", tokenErr);
                }

                let userProfile = await getUserProfile(firebaseUser.uid);
                
                // If user exists in Firebase but has no profile in Supabase yet,
                // call the backend profile endpoint which will trigger auto-sync/creation.
                if (!userProfile && token) {
                    try {
                        const res = await fetch(`${BASE_URL}/users/profile`, {
                            headers: { Authorization: `Bearer ${token}` }
                        });
                        if (res.ok) {
                            // Fetch again from Supabase now that the backend has auto-synced the user
                            userProfile = await getUserProfile(firebaseUser.uid);
                        }
                    } catch (err) {
                        console.error("Failed to auto-sync profile with backend:", err);
                    }
                }

                setProfile(userProfile);
                if (userProfile) {
                    setSupabaseAuthHeaders(userProfile.id, userProfile.role);
                }
            } else {
                setProfile(null);
                clearSupabaseAuthHeaders();
                // Clear cookie for middleware validation
                document.cookie = "firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
            }
            setLoading(false);
        });
        return unsubscribe;
    }, []);

    const signIn = async (email: string, password: string) => {
        if (!auth) throw new Error("Firebase is not initialized.");
        await signInWithEmailAndPassword(auth, email, password);
    };

    const signUp = async (email: string, password: string) => {
        if (!auth) throw new Error("Firebase is not initialized.");
        return await createUserWithEmailAndPassword(auth, email, password);
    };

    const signOut = async () => {
        if (auth) {
            await firebaseSignOut(auth);
        }
        setProfile(null);
        setUser(null);
        clearSupabaseAuthHeaders();
        document.cookie = "firebaseToken=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT";
    };

    const setMockUser = (role: UserProfile["role"]) => {
        // This is just for UI demonstration/demo purposes
        const mockProfile: UserProfile = {
            id: `mock-${role}`,
            name: `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`,
            email: `${role}@demo.lk`,
            role: role,
            created_at: new Date().toISOString()
        };
        setProfile(mockProfile);
        setSupabaseAuthHeaders(mockProfile.id, mockProfile.role);

        const mockToken = `mock-token:${mockProfile.id}:${mockProfile.role}`;
        document.cookie = `firebaseToken=${mockToken}; path=/; SameSite=Lax; Secure`;

        // We set a fake user object to pass ProtectedRoute checks
        setUser({ 
            uid: mockProfile.id, 
            email: mockProfile.email,
            getIdToken: async () => mockToken
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
