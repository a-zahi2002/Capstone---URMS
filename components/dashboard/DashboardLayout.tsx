"use client";

import React, { useState, useEffect, Suspense } from "react";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import DashboardSidebar from "./DashboardSidebar";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";

interface DashboardLayoutProps {
    children: React.ReactNode;
}

export default function DashboardLayout({ children }: DashboardLayoutProps) {
    const { profile } = useAuth();
    const pathname = usePathname();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const [isMounted, setIsMounted] = useState(false);

    // Load sidebar collapse preference from localStorage
    useEffect(() => {
        setIsMounted(true);
        const saved = localStorage.getItem("sidebarCollapsed");
        if (saved !== null) {
            setSidebarCollapsed(JSON.parse(saved));
        }
    }, []);

    const handleToggleCollapsed = () => {
        const nextState = !sidebarCollapsed;
        setSidebarCollapsed(nextState);
        localStorage.setItem("sidebarCollapsed", JSON.stringify(nextState));
    };

    // Close mobile menu on path changes
    useEffect(() => {
        setMobileOpen(false);
    }, [pathname]);

    // Parse breadcrumbs
    const pathParts = pathname.split("/").filter(Boolean);

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* ── Sidebar ── */}
            <Suspense fallback={<div className="w-16 bg-[#0c0a14]" />}>
                <DashboardSidebar
                    collapsed={sidebarCollapsed}
                    onToggle={handleToggleCollapsed}
                    mobileOpen={mobileOpen}
                    onMobileClose={() => setMobileOpen(false)}
                />
            </Suspense>

            {/* ── Main content area ── */}
            <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
                {/* ── Top bar ── */}
                <header className="sticky top-0 z-20 h-14 bg-white/80 dark:bg-[#0c0a14]/80 backdrop-blur-lg border-b border-slate-200/80 dark:border-white/[0.06] flex items-center justify-between px-4 lg:px-6 shrink-0">
                    {/* Left: mobile menu + breadcrumb */}
                    <div className="flex items-center gap-3">
                        <button
                            onClick={() => setMobileOpen(true)}
                            className="lg:hidden p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-white/5 transition-colors"
                            aria-label="Open sidebar"
                        >
                            <Menu className="w-5 h-5 text-slate-600 dark:text-foreground/60" />
                        </button>
                        <div className="hidden sm:flex items-center gap-2 text-sm">
                            <span className="text-slate-400 dark:text-foreground/30 font-medium">UniLink</span>
                            {pathParts.map((part, index) => {
                                const isLast = index === pathParts.length - 1;
                                const formatted = part
                                    .split("-")
                                    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
                                    .join(" ");

                                return (
                                    <React.Fragment key={part}>
                                        <span className="text-slate-300 dark:text-foreground/20">/</span>
                                        <span
                                            className={
                                                isLast
                                                    ? "font-bold text-foreground"
                                                    : "text-slate-400 dark:text-foreground/30 font-medium"
                                            }
                                        >
                                            {formatted}
                                        </span>
                                    </React.Fragment>
                                );
                            })}
                        </div>
                    </div>

                    {/* Right: actions */}
                    <div className="flex items-center gap-2">
                        <NotificationBell />
                        <div className="w-px h-5 bg-slate-200 dark:bg-white/10 mx-1" />
                        <ThemeToggle />
                    </div>
                </header>

                {/* ── Scrollable content ── */}
                <main className="flex-1 overflow-y-auto">
                    {children}
                </main>
            </div>
        </div>
    );
}

