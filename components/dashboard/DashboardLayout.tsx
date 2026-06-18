"use client";

import React, { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import DashboardSidebar from "./DashboardSidebar";
import StudentDashboard from "./StudentDashboard";
import LecturerDashboard from "./LecturerDashboard";
import MaintenanceDashboard from "./MaintenanceDashboard";
import AdminDashboard from "./AdminDashboard";
import { Menu } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import NotificationBell from "@/components/NotificationBell";

export default function DashboardLayout() {
    const { profile } = useAuth();
    const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);

    const role = profile?.role || "student";

    /* ── Render the correct sub-dashboard ── */
    const renderDashboard = () => {
        switch (role) {
            case "admin":
                return <AdminDashboard />;
            case "lecturer":
                return <LecturerDashboard />;
            case "maintenance":
                return <MaintenanceDashboard />;
            case "student":
            default:
                return <StudentDashboard />;
        }
    };

    return (
        <div className="flex h-screen bg-background overflow-hidden">
            {/* ── Sidebar ── */}
            <DashboardSidebar
                collapsed={sidebarCollapsed}
                onToggle={() => setSidebarCollapsed(!sidebarCollapsed)}
                mobileOpen={mobileOpen}
                onMobileClose={() => setMobileOpen(false)}
            />

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
                            <span className="text-slate-300 dark:text-foreground/20">/</span>
                            <span className="font-bold text-foreground">Dashboard</span>
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
                    <div className="max-w-7xl mx-auto p-6 lg:p-8">
                        {renderDashboard()}
                    </div>
                </main>
            </div>
        </div>
    );
}
