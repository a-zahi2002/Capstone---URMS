"use client";

import React, { useEffect } from "react";
import { useIdleTimeout } from "@/hooks/useIdleTimeout";
import { useAuth } from "@/lib/auth-context";
import { AlertTriangle } from "lucide-react";

export default function SessionProvider({ children }: { children: React.ReactNode }) {
    // 15 minutes to timeout, 14 minutes to warning
    const { isIdle, isWarning, resetTimers } = useIdleTimeout(15, 14);
    const { signOut, user, loading } = useAuth();
    
    useEffect(() => {
        if (isIdle && user && !loading) {
            signOut();
        }
    }, [isIdle, signOut, user, loading]);

    // Do not mount the session tracker if user isn't authenticated yet
    if (!user || loading) {
        return <>{children}</>;
    }

    return (
        <>
            {children}
            
            {/* Warning Modal */}
            {isWarning && !isIdle && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 " />
                    
                    {/* Modal Content */}
                    <div className="relative w-full max-w-sm bg-white dark:bg-slate-900 rounded-none border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] border border-amber-200 dark:border-amber-500/20 overflow-hidden animate-in fade-in zoom-in-95 p-6 text-center">
                        <div className="w-12 h-12 rounded-none bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                            <AlertTriangle className="w-6 h-6 text-amber-600 dark:text-amber-400" />
                        </div>
                        
                        <h3 className="text-xl font-black text-slate-900 dark:text-foreground tracking-tight mb-2">
                            Session Expiring Soon
                        </h3>
                        
                        <p className="text-sm font-medium text-slate-600 dark:text-foreground/60 mb-6">
                            Your session is about to expire due to inactivity. Click below to stay logged in.
                        </p>
                        
                        <button
                            onClick={resetTimers}
                            className="w-full bg-brand-primary text-white font-bold py-3 rounded-none hover:bg-brand-secondary transition-all active:scale-95 border-2 border-foreground shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)] shadow-brand-primary/20"
                        >
                            Stay Logged In
                        </button>
                    </div>
                </div>
            )}
        </>
    );
}
