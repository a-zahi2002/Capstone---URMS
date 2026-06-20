"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import SessionProvider from "./SessionProvider";

export default function ProtectedRoute({
    children,
    allowedRoles,
    fallbackPath,
}: {
    children: React.ReactNode;
    allowedRoles?: string[];
    fallbackPath?: string;
}) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    // Role-based redirect: if user is authenticated but has the wrong role,
    // redirect them to their correct dashboard instead of showing static "Access Denied"
    useEffect(() => {
        if (!loading && user && allowedRoles && allowedRoles.length > 0) {
            const userRole = profile?.role || "student";
            if (!allowedRoles.includes(userRole)) {
                router.replace(fallbackPath || "/dashboard");
            }
        }
    }, [user, profile, loading, allowedRoles, fallbackPath, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
                    <span className="text-slate-500 dark:text-foreground/40 text-sm font-medium animate-pulse">
                        Loading…
                    </span>
                </div>
            </div>
        );
    }

    if (!user) return null; // redirect in progress

    // Role check: if allowedRoles is specified, verify the user has one of them
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = profile?.role || "student";
        if (!allowedRoles.includes(userRole)) {
            // Redirect is in progress via useEffect above — show nothing
            return null;
        }
    }

    return (
        <SessionProvider>
            {children}
        </SessionProvider>
    );
}
