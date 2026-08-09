"use client";

import React, { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import ProtectedRoute from "@/components/ProtectedRoute";
import { supabase } from "@/lib/supabase";
import { motion, AnimatePresence } from "framer-motion";
import {
    Bell,
    Check,
    CheckCircle2,
    Clock,
    Search,
    Trash2,
    AlertCircle,
    Info,
    Inbox,
    ChevronLeft,
    ChevronRight,
    Filter,
    ShieldAlert,
} from "lucide-react";

/* ─── URMS Light Blue Design System ───────────────────────
   primary     : #0EA5E9 (Sky 500)
   primary-dark: #0284C7 (Sky 600)
   teal        : #0D9488
   teal-light  : #CCFBF1
   ink-main    : #0F172A
   ink-muted   : #64748B
   surface     : #FFFFFF
   bg-base     : #F8FAFC
   border      : #E2E8F0
──────────────────────────────────────────────────────────── */

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    createdAt: string;
    read: boolean;
}

const ITEMS_PER_PAGE = 10;

const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0 || diffMins < 1) return "Just now";
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays === 1) return "Yesterday";
    if (diffDays < 7) return `${diffDays}d ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" });
};

export default function NotificationsPage() {
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "unread">("all");
    const [typeFilter, setTypeFilter] = useState<"all" | "info" | "success" | "warning" | "error">("all");
    const [currentPage, setCurrentPage] = useState(1);

    const fetchNotifications = async () => {
        if (!profile?.id) return;
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("notifications")
                .select("*")
                .eq("user_id", profile.id)
                .order("timestamp", { ascending: false });

            if (error) throw error;

            if (data) {
                const mapped: Notification[] = data.map((n: any) => ({
                    id: n.id,
                    title: n.title || (n.type ? n.type.charAt(0).toUpperCase() + n.type.slice(1) : "Notification"),
                    message: n.message,
                    type: (n.type === "alert" ? "warning" : n.type) as any || "info",
                    createdAt: n.timestamp || new Date().toISOString(),
                    read: n.is_read ?? false,
                }));
                setNotifications(mapped);
            }
        } catch (err) {
            console.error("Error loading notifications:", err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchNotifications(); }, [profile?.id]);

    const toggleReadStatus = async (id: string, currentRead: boolean) => {
        setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !currentRead } : n)));
        try {
            await supabase.from("notifications").update({ is_read: !currentRead }).eq("id", id);
        } catch (err) {
            console.error("Error toggling notification status:", err);
        }
    };

    const deleteNotification = async (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        try {
            await supabase.from("notifications").delete().eq("id", id);
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    const markAllAsRead = async () => {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length === 0) return;
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        try {
            await supabase.from("notifications").update({ is_read: true }).eq("user_id", profile?.id).eq("is_read", false);
        } catch (err) {
            console.error("Error marking all read:", err);
        }
    };

    const deleteAllRead = async () => {
        const readIds = notifications.filter((n) => n.read).map((n) => n.id);
        if (readIds.length === 0) return;
        setNotifications((prev) => prev.filter((n) => !n.read));
        try {
            await supabase.from("notifications").delete().eq("user_id", profile?.id).eq("is_read", true);
        } catch (err) {
            console.error("Error deleting read notifications:", err);
        }
    };

    const clearAllHistory = async () => {
        if (!confirm("Are you sure you want to clear your entire notification history? This cannot be undone.")) return;
        setNotifications([]);
        try {
            await supabase.from("notifications").delete().eq("user_id", profile?.id);
        } catch (err) {
            console.error("Error clearing notifications:", err);
        }
    };

    const getIcon = (type: string) => {
        switch (type) {
            case "success": return <CheckCircle2 className="w-5 h-5 text-[#0D9488]" />;
            case "warning": return <AlertCircle className="w-5 h-5 text-amber-500" />;
            case "error": return <ShieldAlert className="w-5 h-5 text-rose-500" />;
            default: return <Info className="w-5 h-5 text-[#0EA5E9]" />;
        }
    };

    const totalCount = notifications.length;
    const unreadCount = notifications.filter((n) => !n.read).length;

    const filteredNotifications = notifications.filter((n) => {
        const matchesSearch =
            n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || !n.read;
        const matchesType = typeFilter === "all" || n.type === typeFilter;
        return matchesSearch && matchesStatus && matchesType;
    });

    const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    useEffect(() => { setCurrentPage(1); }, [searchTerm, statusFilter, typeFilter]);

    return (
        <ProtectedRoute>
            <div className="min-h-[calc(100vh-64px)] bg-[#F8FAFC] dark:bg-background p-6 md:p-8">
                <div className="max-w-4xl mx-auto space-y-6">

                    {/* ── Sky Gradient Header ── */}
                    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] p-6 md:p-8 text-white shadow-lg shadow-sky-500/20">
                        <div className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-white/10 pointer-events-none" />
                        <div className="absolute bottom-0 left-16 w-24 h-24 rounded-full bg-[#0D9488]/20 pointer-events-none" />

                        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                            <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center">
                                    <Bell className="w-5 h-5 text-white" />
                                </div>
                                <div>
                                    <h1 className="text-xl font-bold text-white">Notification Centre</h1>
                                    <p className="text-sky-200 text-xs">Account logs, alerts & booking updates</p>
                                </div>
                                {unreadCount > 0 && (
                                    <span className="ml-2 inline-flex items-center justify-center min-w-[24px] h-6 px-1.5 rounded-full bg-white text-[#0EA5E9] text-[11px] font-bold">
                                        {unreadCount}
                                    </span>
                                )}
                            </div>

                            <div className="flex flex-wrap gap-2">
                                {unreadCount > 0 && (
                                    <button
                                        onClick={markAllAsRead}
                                        className="flex items-center gap-1.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-95"
                                    >
                                        <Check className="w-4 h-4" /> Mark All Read
                                    </button>
                                )}
                                {notifications.some((n) => n.read) && (
                                    <button
                                        onClick={deleteAllRead}
                                        className="flex items-center gap-1.5 bg-white/15 hover:bg-white/25 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-95"
                                    >
                                        <Trash2 className="w-4 h-4" /> Clear Read
                                    </button>
                                )}
                                {totalCount > 0 && (
                                    <button
                                        onClick={clearAllHistory}
                                        className="flex items-center gap-1.5 bg-red-500/80 hover:bg-red-500 backdrop-blur-sm px-4 py-2 rounded-lg text-sm font-semibold text-white transition-all active:scale-95"
                                    >
                                        <Trash2 className="w-4 h-4" /> Clear All
                                    </button>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* ── Stat Cards ── */}
                    <div className="grid grid-cols-3 gap-4">
                        {[
                            { label: "Total", value: totalCount, bg: "#F0F9FF", fg: "#0EA5E9", icon: Inbox },
                            { label: "Unread", value: unreadCount, bg: "#FFFBEB", fg: "#D97706", icon: Bell },
                            { label: "Status", value: "Active", bg: "#CCFBF1", fg: "#0D9488", icon: CheckCircle2 },
                        ].map(({ label, value, bg, fg, icon: Icon }) => (
                            <div key={label} className="bg-white dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 p-5 shadow-sm flex items-center gap-4">
                                <div className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: bg }}>
                                    <Icon className="w-5 h-5" style={{ color: fg }} />
                                </div>
                                <div>
                                    <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">{label}</p>
                                    <p className="text-2xl font-bold text-[#0F172A] dark:text-white">{value}</p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* ── Filter & Search Bar ── */}
                    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 p-4 shadow-sm flex flex-col md:flex-row gap-4 items-start md:items-center flex-wrap">
                        {/* Status toggle */}
                        <div className="flex bg-[#F0F9FF] dark:bg-sky-500/10 p-1 rounded-lg">
                            <button
                                onClick={() => setStatusFilter("all")}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all ${
                                    statusFilter === "all"
                                        ? "bg-[#0EA5E9] text-white shadow-sm"
                                        : "text-[#0EA5E9] dark:text-sky-300 hover:bg-[#E0F2FE] dark:hover:bg-sky-500/20"
                                }`}
                            >
                                All
                            </button>
                            <button
                                onClick={() => setStatusFilter("unread")}
                                className={`px-4 py-1.5 rounded-md text-xs font-semibold transition-all relative ${
                                    statusFilter === "unread"
                                        ? "bg-[#0EA5E9] text-white shadow-sm"
                                        : "text-[#0EA5E9] dark:text-sky-300 hover:bg-[#E0F2FE] dark:hover:bg-sky-500/20"
                                }`}
                            >
                                Unread
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1.5 flex h-4 w-4 items-center justify-center rounded-full bg-[#0EA5E9] text-[9px] font-bold text-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Type pills */}
                        <div className="flex flex-wrap items-center gap-2">
                            <Filter className="w-3.5 h-3.5 text-[#64748B]" />
                            {(["all", "info", "success", "warning", "error"] as const).map((type) => {
                                const typeColors: Record<string, { active: string; inactive: string }> = {
                                    all: { active: "bg-[#0EA5E9] text-white", inactive: "bg-[#F0F9FF] text-[#0EA5E9] hover:bg-[#E0F2FE]" },
                                    info: { active: "bg-[#0EA5E9] text-white", inactive: "bg-[#F0F9FF] text-[#0EA5E9] hover:bg-[#E0F2FE]" },
                                    success: { active: "bg-[#0D9488] text-white", inactive: "bg-[#CCFBF1] text-[#0D9488] hover:bg-teal-100" },
                                    warning: { active: "bg-amber-500 text-white", inactive: "bg-amber-50 text-amber-700 hover:bg-amber-100" },
                                    error: { active: "bg-rose-500 text-white", inactive: "bg-rose-50 text-rose-600 hover:bg-rose-100" },
                                };
                                const c = typeColors[type];
                                return (
                                    <button
                                        key={type}
                                        onClick={() => setTypeFilter(type)}
                                        className={`px-3 py-1 rounded-full text-[11px] font-semibold transition-all ${
                                            typeFilter === type ? c.active : c.inactive
                                        }`}
                                    >
                                        {type.charAt(0).toUpperCase() + type.slice(1)}
                                    </button>
                                );
                            })}
                        </div>

                        {/* Search */}
                        <div className="relative flex-1 min-w-[180px]">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                            <input
                                type="text"
                                placeholder="Search notifications..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-[#F8FAFC] dark:bg-slate-900 border border-[#E2E8F0] dark:border-slate-600 rounded-lg pl-9 pr-4 py-2 text-sm font-medium text-[#0F172A] dark:text-white placeholder:text-[#94A3B8] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all"
                            />
                        </div>
                    </div>

                    {/* ── Notification List ── */}
                    <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-sm overflow-hidden">
                        {loading ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="w-8 h-8 rounded-full border-2 border-[#E2E8F0] border-t-[#0EA5E9] animate-spin" />
                                <p className="text-sm font-medium text-[#64748B]">Loading notifications…</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-16 gap-3">
                                <div className="w-16 h-16 rounded-2xl bg-[#F0F9FF] flex items-center justify-center">
                                    <Inbox className="w-8 h-8 text-[#0EA5E9]" />
                                </div>
                                <p className="font-semibold text-[#0F172A] dark:text-white">No notifications found</p>
                                <p className="text-sm text-[#64748B] dark:text-slate-400 text-center max-w-xs">
                                    {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                                        ? "Try adjusting your search or filters."
                                        : "You're all caught up! No notifications yet."}
                                </p>
                            </div>
                        ) : (
                            <AnimatePresence initial={false}>
                                {paginatedNotifications.map((notification) => {
                                    const typeConfig: Record<string, { bg: string; fg: string; borderClass: string }> = {
                                        success: { bg: "#CCFBF1", fg: "#0D9488", borderClass: "border-l-[#0D9488]" },
                                        warning: { bg: "#FFFBEB", fg: "#D97706", borderClass: "border-l-amber-400" },
                                        error: { bg: "#FFF1F2", fg: "#E11D48", borderClass: "border-l-rose-500" },
                                        info: { bg: "#F0F9FF", fg: "#0EA5E9", borderClass: "border-l-[#0EA5E9]" },
                                    };
                                    const tc = typeConfig[notification.type] || typeConfig.info;
                                    return (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, y: 8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -40 }}
                                            transition={{ duration: 0.2 }}
                                            className={`relative flex gap-4 p-5 border-b border-[#E2E8F0] dark:border-slate-700 last:border-0 transition-colors group border-l-4 ${
                                                notification.read
                                                    ? "border-l-transparent bg-transparent hover:bg-[#F8FAFC] dark:hover:bg-slate-700/20 opacity-70"
                                                    : `${tc.borderClass} bg-[#F8FAFC] dark:bg-slate-700/30 hover:bg-[#F0F9FF] dark:hover:bg-slate-700/40`
                                            }`}
                                        >
                                            {/* Type icon */}
                                            <div
                                                className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5"
                                                style={{ backgroundColor: tc.bg }}
                                            >
                                                {getIcon(notification.type)}
                                            </div>

                                            {/* Content */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-start justify-between gap-2">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <h3 className={`text-sm font-semibold ${
                                                            notification.read ? "text-[#64748B] dark:text-slate-400" : "text-[#0F172A] dark:text-white"
                                                        }`}>
                                                            {notification.title}
                                                        </h3>
                                                        {!notification.read && (
                                                            <span className="inline-flex items-center gap-1 bg-[#F0F9FF] text-[#0EA5E9] border border-sky-200 text-[10px] font-semibold px-2 py-0.5 rounded-full">
                                                                <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] animate-pulse" />
                                                                New
                                                            </span>
                                                        )}
                                                    </div>
                                                    <span className="text-[11px] text-[#94A3B8] dark:text-slate-500 font-medium flex items-center gap-1 shrink-0">
                                                        <Clock className="w-3 h-3" />
                                                        {formatRelativeTime(notification.createdAt)}
                                                    </span>
                                                </div>
                                                <p className={`text-xs mt-1.5 leading-relaxed ${
                                                    notification.read ? "text-[#94A3B8] dark:text-slate-500" : "text-[#64748B] dark:text-slate-300"
                                                }`}>
                                                    {notification.message}
                                                </p>
                                            </div>

                                            {/* Hover actions */}
                                            <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                                                <button
                                                    onClick={() => toggleReadStatus(notification.id, notification.read)}
                                                    className={`p-2 rounded-lg transition-all ${
                                                        notification.read
                                                            ? "text-[#64748B] hover:bg-[#F0F9FF] hover:text-[#0EA5E9]"
                                                            : "text-[#0D9488] hover:bg-[#CCFBF1]"
                                                    }`}
                                                    title={notification.read ? "Mark as unread" : "Mark as read"}
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="p-2 rounded-lg text-[#94A3B8] hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-all"
                                                    title="Delete"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    );
                                })}
                            </AnimatePresence>
                        )}

                        {/* Pagination */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 bg-[#F8FAFC] dark:bg-slate-900/40 border-t border-[#E2E8F0] dark:border-slate-700 flex items-center justify-between gap-4">
                                <span className="text-xs font-medium text-[#64748B] dark:text-slate-400">
                                    Page <strong className="text-[#0F172A] dark:text-white">{currentPage}</strong> of{" "}
                                    <strong className="text-[#0F172A] dark:text-white">{totalPages}</strong>{" "}
                                    · {filteredNotifications.length} items
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center justify-center w-8 h-8 border border-[#E2E8F0] dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg text-[#64748B] hover:text-[#0EA5E9] hover:border-[#0EA5E9] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center justify-center w-8 h-8 border border-[#E2E8F0] dark:border-slate-600 bg-white dark:bg-slate-800 rounded-lg text-[#64748B] hover:text-[#0EA5E9] hover:border-[#0EA5E9] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>

                </div>
            </div>
        </ProtectedRoute>
    );
}
