"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";

export default function ProtectedRoute({
    children,
    allowedRoles,
}: {
    children: React.ReactNode;
    allowedRoles?: string[];
}) {
    const { user, profile, loading } = useAuth();
    const router = useRouter();

    useEffect(() => {
        if (!loading && !user) {
            router.replace("/login");
        }
    }, [user, loading, router]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <span className="text-slate-500 text-sm animate-pulse">
                    Loading…
                </span>
            </div>
        );
    }

    if (!user) return null; // redirect in progress

    // Role check: if allowedRoles is specified, verify the user has one of them
    if (allowedRoles && allowedRoles.length > 0) {
        const userRole = profile?.role || 'student';
        if (!allowedRoles.includes(userRole)) {
            return (
                <div className="flex items-center justify-center min-h-screen flex-col gap-4">
                    <p className="text-slate-700 font-bold text-lg">Access Denied</p>
                    <p className="text-slate-500 text-sm">You don&apos;t have permission to view this page.</p>
                </div>
            );
        }
    }

    return <>{children}</>;
}
