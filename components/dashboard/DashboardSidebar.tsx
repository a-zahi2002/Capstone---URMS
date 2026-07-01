"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion, AnimatePresence } from "framer-motion";
import {
    LayoutDashboard,
    BookOpen,
    CalendarCheck,
    PackagePlus,
    ClipboardList,
    CheckCircle2,
    Clock,
    Users,
    BarChart3,
    Package,
    Settings,
    Wrench,
    ListTodo,
    CalendarDays,
    FileText,
    ChevronLeft,
    ChevronRight,
    LogOut,
    X,
    PanelLeftClose,
    PanelLeftOpen,
} from "lucide-react";

/* ─── Role metadata ─────────────────────────────────────── */
const roleMeta: Record<string, { label: string; color: string; accent: string; gradient: string; dot: string }> = {
    admin:       { label: "Administrator", color: "text-purple-500",  accent: "purple", gradient: "from-purple-600 to-violet-600", dot: "bg-purple-500" },
    lecturer:    { label: "Lecturer",      color: "text-emerald-500", accent: "emerald", gradient: "from-emerald-600 to-teal-600", dot: "bg-emerald-500" },
    student:     { label: "Student",       color: "text-blue-500",    accent: "blue",    gradient: "from-blue-600 to-cyan-600",    dot: "bg-blue-500" },
    maintenance: { label: "Maintenance",   color: "text-amber-500",   accent: "amber",   gradient: "from-amber-600 to-orange-600", dot: "bg-amber-500" },
};

/* ─── Nav item type ─────────────────────────────────────── */
interface NavItem {
    label: string;
    href: string;
    icon: React.ComponentType<{ className?: string }>;
    badge?: number;
}

/* ─── Role-based navigation links ───────────────────────── */
function getNavItems(role: string): NavItem[] {
    switch (role) {
        case "student":
            return [
                { label: "Dashboard",        href: "/dashboard",  icon: LayoutDashboard },
                { label: "My Bookings",      href: "/bookings?view=my",   icon: CalendarCheck },
                { label: "Reserve Resources", href: "/resources",  icon: PackagePlus },
                { label: "Booking Status",   href: "/bookings?view=status",   icon: ClipboardList },
                { label: "Notifications",    href: "/notifications", icon: Clock },
            ];
        case "lecturer":
            return [
                { label: "Dashboard",           href: "/dashboard",      icon: LayoutDashboard },
                { label: "Dept. Resources",     href: "/resources",      icon: Package },
                { label: "Approval Queue",      href: "/dashboard?tab=approvals",      icon: CheckCircle2 },
                { label: "Schedule Overview",   href: "/bookings?view=all",       icon: CalendarDays },
                { label: "My Bookings",         href: "/bookings?view=my",       icon: BookOpen },
                { label: "Notifications",       href: "/notifications",  icon: Clock },
            ];
        case "maintenance":
            return [
                { label: "Dashboard",            href: "/dashboard",             icon: LayoutDashboard },
                { label: "Ticket Queue",         href: "/maintenance",           icon: ListTodo },
                { label: "Update Resources",     href: "/maintenance/resources",  icon: Wrench },
                { label: "Maint. Schedule",      href: "/maintenance/timeline",   icon: CalendarDays },
                { label: "Reports",              href: "/maintenance/reports",    icon: FileText },
            ];
        case "admin":
            return [
                { label: "Dashboard",          href: "/dashboard",         icon: LayoutDashboard },
                { label: "System Analytics",   href: "/admin/analytics",   icon: BarChart3 },
                { label: "User Management",    href: "/admin/users",       icon: Users },
                { label: "Resource Catalog",   href: "/resources",         icon: Package },
                { label: "All Bookings",       href: "/bookings",          icon: CalendarCheck },
                { label: "Maintenance",        href: "/maintenance",       icon: Wrench },
                { label: "Settings",           href: "/profile",           icon: Settings },
            ];
        default:
            return [
                { label: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
            ];
    }
}

/* ─── Sidebar Component ─────────────────────────────────── */
interface DashboardSidebarProps {
    collapsed: boolean;
    onToggle: () => void;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

export default function DashboardSidebar({
    collapsed,
    onToggle,
    mobileOpen,
    onMobileClose,
}: DashboardSidebarProps) {
    const pathname = usePathname();
    const searchParams = useSearchParams();
    const { profile, signOut } = useAuth();
    const role = profile?.role || "student";
    const meta = roleMeta[role] || roleMeta.student;
    const navItems = getNavItems(role);

    const initials = profile?.name
        ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : "U";

    /* ── Sidebar content (shared between desktop & mobile) ── */
    const SidebarContent = ({ isMobile = false }: { isMobile?: boolean }) => (
        <div className="flex flex-col h-full">
            {/* ── Header / Logo ── */}
            <div className={`flex items-center gap-3 px-5 h-16 border-b border-slate-200/80 dark:border-white/[0.06] shrink-0 ${collapsed && !isMobile ? "justify-center px-3" : ""}`}>
                {(!collapsed || isMobile) && (
                    <Link href="/" className="flex items-center gap-2.5 group min-w-0">
                        <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg shrink-0`}>
                            <LayoutDashboard className="w-4 h-4 text-white" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-black text-foreground truncate leading-tight">UniLink</p>
                            <p className={`text-[10px] font-bold ${meta.color} uppercase tracking-widest truncate`}>{meta.label}</p>
                        </div>
                    </Link>
                )}
                {collapsed && !isMobile && (
                    <div className={`w-9 h-9 rounded-xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-lg`}>
                        <LayoutDashboard className="w-4.5 h-4.5 text-white" />
                    </div>
                )}
                {isMobile && (
                    <button onClick={onMobileClose} className="ml-auto p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-white/5 transition-colors">
                        <X className="w-5 h-5 text-slate-500" />
                    </button>
                )}
            </div>

            {/* ── Navigation ── */}
            <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1">
                {(!collapsed || isMobile) && (
                    <p className="text-[10px] font-black text-slate-400 dark:text-foreground/30 uppercase tracking-[0.15em] px-3 mb-3">
                        Navigation
                    </p>
                )}
                {navItems.map((item) => {
                    const isActive = (() => {
                        const [itemPath, itemQuery] = item.href.split("?");
                        if (pathname !== itemPath) return false;
                        if (!itemQuery) {
                            return !searchParams.get("tab") && !searchParams.get("view");
                        }
                        const navParams = new URLSearchParams(itemQuery);
                        for (const [key, value] of Array.from(navParams.entries())) {
                            if (searchParams.get(key) !== value) {
                                return false;
                            }
                        }
                        return true;
                    })();
                    const Icon = item.icon;
                    return (
                        <Link
                            key={item.label}
                            href={item.href}
                            onClick={isMobile ? onMobileClose : undefined}
                            title={collapsed && !isMobile ? item.label : undefined}
                            className={`
                                group relative flex items-center gap-3 rounded-xl transition-all duration-200
                                ${collapsed && !isMobile
                                    ? "justify-center px-0 py-3 mx-auto w-11 h-11"
                                    : "px-3 py-2.5"
                                }
                                ${isActive
                                    ? `bg-gradient-to-r from-${meta.accent}-500/10 to-${meta.accent}-500/5 ${meta.color} font-black`
                                    : "text-slate-600 dark:text-foreground/50 hover:text-foreground hover:bg-slate-50 dark:hover:bg-white/[0.04] font-semibold"
                                }
                            `}
                        >
                            {/* Active bar */}
                            {isActive && (
                                <motion.span
                                    layoutId={isMobile ? "mobile-active-bar" : "sidebar-active-bar"}
                                    className={`absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 rounded-r-full bg-gradient-to-b ${meta.gradient}`}
                                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                                />
                            )}
                            <Icon className={`w-[18px] h-[18px] shrink-0 transition-colors ${isActive ? meta.color : "text-slate-400 dark:text-foreground/40 group-hover:text-foreground/70"}`} />
                            {(!collapsed || isMobile) && (
                                <span className="text-[13px] truncate">{item.label}</span>
                            )}
                            {item.badge && item.badge > 0 && (!collapsed || isMobile) && (
                                <span className={`ml-auto text-[10px] font-black bg-${meta.accent}-500/15 ${meta.color} px-2 py-0.5 rounded-full`}>
                                    {item.badge}
                                </span>
                            )}
                            {/* Tooltip for collapsed state */}
                            {collapsed && !isMobile && (
                                <div className="absolute left-full ml-3 px-2.5 py-1.5 bg-slate-900 dark:bg-slate-700 text-white text-xs font-bold rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 pointer-events-none whitespace-nowrap z-50 shadow-xl">
                                    {item.label}
                                    <div className="absolute right-full top-1/2 -translate-y-1/2 w-0 h-0 border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent border-r-[5px] border-r-slate-900 dark:border-r-slate-700" />
                                </div>
                            )}
                        </Link>
                    );
                })}
            </nav>

            {/* ── User Section ── */}
            <div className="shrink-0 border-t border-slate-200/80 dark:border-white/[0.06] p-3 space-y-2">
                {/* User card */}
                <div className={`flex items-center gap-3 rounded-xl p-2.5 bg-slate-50 dark:bg-white/[0.03] ${collapsed && !isMobile ? "justify-center p-2" : ""}`}>
                    <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${meta.gradient} flex items-center justify-center text-white text-xs font-black shadow shrink-0`}>
                        {initials}
                    </div>
                    {(!collapsed || isMobile) && (
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-foreground truncate">{profile?.name || "User"}</p>
                            <p className="text-[10px] text-slate-500 dark:text-foreground/40 truncate">{profile?.email}</p>
                        </div>
                    )}
                </div>

                {/* Sign out */}
                <button
                    onClick={signOut}
                    className={`w-full flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold text-red-500/80 hover:text-red-500 hover:bg-red-500/5 transition-all ${collapsed && !isMobile ? "justify-center px-0" : ""}`}
                    title={collapsed && !isMobile ? "Sign Out" : undefined}
                >
                    <LogOut className="w-[18px] h-[18px] shrink-0" />
                    {(!collapsed || isMobile) && <span className="text-[13px]">Sign Out</span>}
                </button>
            </div>

            {/* ── Collapse toggle (desktop only) ── */}
            {!isMobile && (
                <div className="shrink-0 border-t border-slate-200/80 dark:border-white/[0.06] p-3">
                    <button
                        onClick={onToggle}
                        className="w-full flex items-center justify-center gap-2 rounded-xl px-3 py-2 text-slate-400 dark:text-foreground/30 hover:text-foreground hover:bg-slate-50 dark:hover:bg-white/[0.04] transition-all"
                    >
                        {collapsed ? <PanelLeftOpen className="w-4 h-4" /> : <PanelLeftClose className="w-4 h-4" />}
                        {!collapsed && <span className="text-xs font-bold">Collapse</span>}
                    </button>
                </div>
            )}
        </div>
    );

    return (
        <>
            {/* ─── Desktop sidebar ─── */}
            <motion.aside
                initial={false}
                animate={{ width: collapsed ? 72 : 260 }}
                transition={{ type: "spring", stiffness: 300, damping: 30 }}
                className="hidden lg:flex flex-col h-screen sticky top-0 bg-white dark:bg-[#0c0a14] border-r border-slate-200/80 dark:border-white/[0.06] z-30 overflow-hidden shrink-0"
            >
                <SidebarContent />
            </motion.aside>

            {/* ─── Mobile drawer overlay ─── */}
            <AnimatePresence>
                {mobileOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 lg:hidden"
                            onClick={onMobileClose}
                        />
                        {/* Drawer */}
                        <motion.aside
                            initial={{ x: -280 }}
                            animate={{ x: 0 }}
                            exit={{ x: -280 }}
                            transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            className="fixed left-0 top-0 bottom-0 w-[280px] bg-white dark:bg-[#0c0a14] border-r border-slate-200/80 dark:border-white/[0.06] z-50 lg:hidden overflow-hidden"
                        >
                            <SidebarContent isMobile />
                        </motion.aside>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
