"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import SessionProvider from "./SessionProvider";
import { Clock, XCircle, LogOut } from "lucide-react";

export default function ProtectedRoute({
    children,
    allowedRoles,
    fallbackPath,
}: {
    children: React.ReactNode;
    allowedRoles?: string[];
    fallbackPath?: string;
}) {
    const { user, profile, loading, signOut } = useAuth();
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
            const approvalStatus = profile?.approval_status || "Approved";
            
            // Only redirect if they are approved (otherwise they stay on the approval screen)
            if (approvalStatus === "Approved" && !allowedRoles.includes(userRole)) {
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

    // Intercept Pending or Rejected approval status
    const approvalStatus = profile?.approval_status;
    if (approvalStatus && approvalStatus !== "Approved") {
        const isPending = approvalStatus === "Pending";
        
        return (
            <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex items-center justify-center relative p-4 overflow-hidden">
                {/* Radial Gradient Background */}
                <div className="absolute inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.03),transparent_70%)]" />
                
                {/* Card Container */}
                <div className="relative z-10 w-full max-w-md bg-white/75 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 sm:p-10 text-center space-y-6">
                    {/* Glowing status icon */}
                    <div className="relative">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mx-auto border shadow-lg ${
                            isPending 
                                ? "bg-amber-500/10 border-amber-500/20 text-amber-500 shadow-amber-500/5 animate-pulse" 
                                : "bg-rose-500/10 border-rose-500/20 text-rose-500 shadow-rose-500/5"
                        }`}>
                            {isPending ? (
                                <Clock className="w-8 h-8" />
                            ) : (
                                <XCircle className="w-8 h-8" />
                            )}
                        </div>
                    </div>

                    {/* Headers */}
                    <div className="space-y-2">
                        <h2 className="text-2xl font-black tracking-tight text-slate-900 dark:text-white">
                            {isPending ? "Pending Admin Approval" : "Registration Rejected"}
                        </h2>
                        <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm leading-relaxed">
                            {isPending 
                                ? "Your registration request is currently awaiting review by the system administrator. Please ask your administrator to approve your account." 
                                : "Your registration request for UniLink has been rejected by the administrator. Please contact your department head if you believe this is an error."
                            }
                        </p>
                    </div>

                    {/* User Metadata Overview */}
                    {profile && (
                        <div className="bg-slate-50 dark:bg-slate-950/40 border border-slate-200/50 dark:border-slate-800/60 rounded-2xl p-4 text-left text-xs font-semibold space-y-2.5 text-slate-600 dark:text-slate-350">
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-1.5">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Name</span>
                                <span className="font-bold text-slate-800 dark:text-foreground">{profile.name}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-1.5">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Email</span>
                                <span className="font-bold text-slate-800 dark:text-foreground">{profile.email}</span>
                            </div>
                            <div className="flex justify-between items-center border-b border-slate-100 dark:border-slate-900 pb-1.5">
                                <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Requested Role</span>
                                <span className="font-bold uppercase tracking-wider text-brand-primary text-[10px]">{profile.role}</span>
                            </div>
                            {profile.department && (
                                <div className="flex justify-between items-center">
                                    <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Department</span>
                                    <span className="font-bold text-slate-800 dark:text-foreground">{profile.department}</span>
                                </div>
                            )}
                        </div>
                    )}

                    {/* Actions */}
                    <button
                        onClick={() => signOut()}
                        className="w-full flex items-center justify-center gap-2 py-3.5 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-foreground/5 dark:hover:bg-foreground/10 border border-slate-200 dark:border-border text-slate-700 dark:text-foreground/80 font-bold text-sm rounded-2xl transition-all active:scale-[0.98] group"
                    >
                        <LogOut className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Sign Out & Go Home
                    </button>
                </div>
            </div>
        );
    }

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
