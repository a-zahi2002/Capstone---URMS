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

interface Notification {
    id: string;
    title: string;
    message: string;
    type: "info" | "success" | "warning" | "error";
    createdAt: string;
    read: boolean;
}

const ITEMS_PER_PAGE = 10;

// Helper to format date in a premium relative format
const formatRelativeTime = (dateStr: string) => {
    const now = new Date();
    const date = new Date(dateStr);
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMs < 0 || diffMins < 1) {
        return "Just now";
    }
    if (diffMins < 60) {
        return `${diffMins}m ago`;
    }
    if (diffHours < 24) {
        return `${diffHours}h ago`;
    }
    if (diffDays === 1) {
        return "Yesterday";
    }
    if (diffDays < 7) {
        return `${diffDays}d ago`;
    }
    return date.toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
    });
};

export default function NotificationsPage() {
    const { profile } = useAuth();
    const [notifications, setNotifications] = useState<Notification[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<"all" | "unread">("all");
    const [typeFilter, setTypeFilter] = useState<"all" | "info" | "success" | "warning" | "error">("all");
    const [currentPage, setCurrentPage] = useState(1);

    // Fetch notifications
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

    useEffect(() => {
        fetchNotifications();
    }, [profile?.id]);

    // Handle single read
    const toggleReadStatus = async (id: string, currentRead: boolean) => {
        setNotifications((prev) =>
            prev.map((n) => (n.id === id ? { ...n, read: !currentRead } : n))
        );
        try {
            await supabase
                .from("notifications")
                .update({ is_read: !currentRead })
                .eq("id", id);
        } catch (err) {
            console.error("Error toggling notification status:", err);
        }
    };

    // Delete single notification
    const deleteNotification = async (id: string) => {
        setNotifications((prev) => prev.filter((n) => n.id !== id));
        try {
            await supabase
                .from("notifications")
                .delete()
                .eq("id", id);
        } catch (err) {
            console.error("Error deleting notification:", err);
        }
    };

    // Mark all as read
    const markAllAsRead = async () => {
        const unreadIds = notifications.filter((n) => !n.read).map((n) => n.id);
        if (unreadIds.length === 0) return;

        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        try {
            await supabase
                .from("notifications")
                .update({ is_read: true })
                .eq("user_id", profile?.id)
                .eq("is_read", false);
        } catch (err) {
            console.error("Error marking all read:", err);
        }
    };

    // Delete all read notifications
    const deleteAllRead = async () => {
        const readIds = notifications.filter((n) => n.read).map((n) => n.id);
        if (readIds.length === 0) return;

        setNotifications((prev) => prev.filter((n) => !n.read));
        try {
            await supabase
                .from("notifications")
                .delete()
                .eq("user_id", profile?.id)
                .eq("is_read", true);
        } catch (err) {
            console.error("Error deleting read notifications:", err);
        }
    };

    // Clear entire history
    const clearAllHistory = async () => {
        if (!confirm("Are you sure you want to clear your entire notification history? This cannot be undone.")) {
            return;
        }

        setNotifications([]);
        try {
            await supabase
                .from("notifications")
                .delete()
                .eq("user_id", profile?.id);
        } catch (err) {
            console.error("Error clearing notifications:", err);
        }
    };

    // Icons mapped to type
    const getIcon = (type: string) => {
        switch (type) {
            case "success":
                return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
            case "warning":
                return <AlertCircle className="w-5 h-5 text-amber-500 shrink-0" />;
            case "error":
                return <ShieldAlert className="w-5 h-5 text-red-500 shrink-0" />;
            default:
                return <Info className="w-5 h-5 text-blue-500 shrink-0" />;
        }
    };

    // Count states
    const totalCount = notifications.length;
    const unreadCount = notifications.filter((n) => !n.read).length;

    // Filtered lists
    const filteredNotifications = notifications.filter((n) => {
        const matchesSearch =
            n.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
            n.message.toLowerCase().includes(searchTerm.toLowerCase());
        const matchesStatus = statusFilter === "all" || !n.read;
        const matchesType = typeFilter === "all" || n.type === typeFilter;

        return matchesSearch && matchesStatus && matchesType;
    });

    // Pagination bounds
    const totalPages = Math.ceil(filteredNotifications.length / ITEMS_PER_PAGE) || 1;
    const startIndex = (currentPage - 1) * ITEMS_PER_PAGE;
    const paginatedNotifications = filteredNotifications.slice(startIndex, startIndex + ITEMS_PER_PAGE);

    // Reset pagination if filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchTerm, statusFilter, typeFilter]);

    return (
        <ProtectedRoute>
            <div className="min-h-[calc(100vh-64px)] bg-background p-6 md:p-10">
                <div className="max-w-6xl mx-auto space-y-8">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-200 dark:border-border pb-6">
                        <div>
                            <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                                <Bell className="w-8 h-8 text-brand-primary" /> Notification Center
                            </h1>
                            <p className="text-slate-600 dark:text-foreground/60 mt-2">
                                Manage and view your account logs, system alerts, and resource booking statuses.
                            </p>
                        </div>
                        <div className="flex flex-wrap gap-2 w-full md:w-auto">
                            {unreadCount > 0 && (
                                <button
                                    onClick={markAllAsRead}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-card hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-border px-4 py-2.5 rounded-xl text-sm font-bold text-foreground transition-all active:scale-95"
                                >
                                    <Check className="w-4 h-4" /> Mark All Read
                                </button>
                            )}
                            {notifications.some((n) => n.read) && (
                                <button
                                    onClick={deleteAllRead}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-card hover:bg-slate-50 dark:hover:bg-white/5 border border-slate-200 dark:border-border px-4 py-2.5 rounded-xl text-sm font-bold text-foreground transition-all active:scale-95"
                                >
                                    <Trash2 className="w-4 h-4 text-slate-500" /> Clear Read
                                </button>
                            )}
                            {totalCount > 0 && (
                                <button
                                    onClick={clearAllHistory}
                                    className="flex-1 md:flex-none flex items-center justify-center gap-2 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 px-4 py-2.5 rounded-xl text-sm font-bold text-red-500 transition-all active:scale-95"
                                >
                                    <Trash2 className="w-4 h-4" /> Clear All
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Stats Dashboard */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                        <div className="bg-card p-6 rounded-2xl border border-slate-200 dark:border-border shadow-sm flex items-center gap-4">
                            <div className="bg-blue-500/10 p-4 rounded-xl text-blue-500 border border-blue-500/20 shrink-0">
                                <Inbox className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-foreground/40 uppercase tracking-widest">
                                    Total Logs
                                </p>
                                <p className="text-3xl font-black text-foreground">{totalCount}</p>
                            </div>
                        </div>

                        <div className="bg-card p-6 rounded-2xl border border-slate-200 dark:border-border shadow-sm flex items-center gap-4">
                            <div className="bg-amber-500/10 p-4 rounded-xl text-amber-500 border border-amber-500/20 shrink-0">
                                <Bell className="w-6 h-6" />
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-foreground/40 uppercase tracking-widest">
                                    Unread Logs
                                </p>
                                <p className="text-3xl font-black text-foreground">{unreadCount}</p>
                            </div>
                        </div>

                        <div className="bg-card p-6 rounded-2xl border border-slate-200 dark:border-border shadow-sm flex items-center gap-4">
                            <div className="bg-emerald-500/10 p-4 rounded-xl text-emerald-500 border border-emerald-500/20 shrink-0 flex items-center justify-center">
                                <span className="relative flex h-3 w-3">
                                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                                    <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
                                </span>
                            </div>
                            <div>
                                <p className="text-xs font-bold text-slate-500 dark:text-foreground/40 uppercase tracking-widest">
                                    System Status
                                </p>
                                <p className="text-lg font-black text-foreground">Active & Healthy</p>
                            </div>
                        </div>
                    </div>

                    {/* Filter & Control Bar */}
                    <div className="bg-card border border-slate-200 dark:border-border rounded-2xl p-4 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
                        {/* Status Toggle Filter */}
                        <div className="flex bg-slate-100 dark:bg-foreground/5 p-1 rounded-xl w-full md:w-auto">
                            <button
                                onClick={() => setStatusFilter("all")}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all ${
                                    statusFilter === "all"
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-slate-500 hover:text-foreground"
                                }`}
                            >
                                All Status
                            </button>
                            <button
                                onClick={() => setStatusFilter("unread")}
                                className={`flex-1 md:flex-none px-4 py-2 rounded-lg text-xs font-bold transition-all relative ${
                                    statusFilter === "unread"
                                        ? "bg-card text-foreground shadow-sm"
                                        : "text-slate-500 hover:text-foreground"
                                }`}
                            >
                                Unread
                                {unreadCount > 0 && (
                                    <span className="absolute -top-1.5 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-black text-white">
                                        {unreadCount}
                                    </span>
                                )}
                            </button>
                        </div>

                        {/* Type Selector Pills */}
                        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto justify-start md:justify-center">
                            <span className="text-xs font-black text-slate-400 dark:text-foreground/40 uppercase tracking-wider mr-1.5 flex items-center gap-1">
                                <Filter className="w-3.5 h-3.5" /> Type:
                            </span>
                            {(["all", "info", "success", "warning", "error"] as const).map((type) => (
                                <button
                                    key={type}
                                    onClick={() => setTypeFilter(type)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-bold border transition-all ${
                                        typeFilter === type
                                            ? "bg-brand-primary text-white border-brand-primary shadow-sm shadow-brand-primary/10"
                                            : "bg-card border-slate-200 dark:border-border text-slate-600 dark:text-foreground/60 hover:border-slate-300 dark:hover:border-foreground/30 hover:text-foreground"
                                    }`}
                                >
                                    {type.charAt(0).toUpperCase() + type.slice(1)}
                                </button>
                            ))}
                        </div>

                        {/* Search Input */}
                        <div className="relative w-full md:w-64">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-foreground/30" />
                            <input
                                type="text"
                                placeholder="Search notification contents..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full bg-slate-100 dark:bg-foreground/5 border border-transparent hover:border-slate-300 dark:hover:border-white/10 focus:border-brand-primary focus:bg-card focus:ring-1 focus:ring-brand-primary pl-10 pr-4 py-2.5 rounded-xl text-xs font-semibold text-foreground placeholder:text-slate-400 dark:placeholder:text-foreground/30 outline-none transition-all"
                            />
                        </div>
                    </div>

                    {/* Notifications Log List */}
                    <div className="bg-card border border-slate-200 dark:border-border rounded-3xl overflow-hidden shadow-sm min-h-[300px] flex flex-col justify-between">
                        {loading ? (
                            <div className="p-20 text-center flex flex-col items-center justify-center text-slate-500 dark:text-foreground/40 flex-grow">
                                <div className="w-8 h-8 rounded-full border-2 border-brand-primary border-t-transparent animate-spin mb-4" />
                                <p className="text-sm font-semibold">Loading notifications...</p>
                            </div>
                        ) : filteredNotifications.length === 0 ? (
                            <div className="p-20 text-center flex flex-col items-center justify-center text-slate-500 dark:text-foreground/40 flex-grow">
                                <Inbox className="w-16 h-16 mb-4 opacity-20" />
                                <p className="text-base font-bold text-foreground">No matching notifications</p>
                                <p className="text-sm mt-1 max-w-md">
                                    {searchTerm || typeFilter !== "all" || statusFilter !== "all"
                                        ? "Try adjusting your search keywords or filters to find what you are looking for."
                                        : "Your notification history log is completely empty."}
                                </p>
                            </div>
                        ) : (
                            <div className="divide-y divide-slate-100 dark:divide-border/30 flex-grow">
                                <AnimatePresence initial={false}>
                                    {paginatedNotifications.map((notification) => (
                                        <motion.div
                                            key={notification.id}
                                            initial={{ opacity: 0, y: 10 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: -50 }}
                                            transition={{ duration: 0.2 }}
                                            className={`p-5 flex gap-4 transition-all relative group ${
                                                notification.read
                                                    ? "bg-transparent opacity-85"
                                                    : "bg-slate-500/5 hover:bg-slate-500/10 border-l-[3px] border-brand-primary pl-[17px]"
                                            }`}
                                        >
                                            {/* Left icon wrapper */}
                                            <div className="shrink-0 mt-0.5">
                                                <div className="w-10 h-10 rounded-xl bg-slate-100 dark:bg-foreground/5 flex items-center justify-center border border-slate-200 dark:border-border/30">
                                                    {getIcon(notification.type)}
                                                </div>
                                            </div>

                                            {/* Details body */}
                                            <div className="flex-1 min-w-0">
                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <h3
                                                        className={`text-sm font-extrabold truncate ${
                                                            notification.read
                                                                ? "text-slate-600 dark:text-foreground/75"
                                                                : "text-foreground"
                                                        }`}
                                                    >
                                                        {notification.title}
                                                    </h3>
                                                    {!notification.read && (
                                                        <span className="bg-brand-primary/10 text-brand-primary border border-brand-primary/20 text-[9px] font-black uppercase px-2 py-0.5 rounded-full tracking-wide">
                                                            New
                                                        </span>
                                                    )}
                                                    <span className="text-[10px] text-slate-400 dark:text-foreground/30 font-medium ml-auto flex items-center gap-1 shrink-0">
                                                        <Clock className="w-3 h-3" />
                                                        {formatRelativeTime(notification.createdAt)}
                                                    </span>
                                                </div>
                                                <p
                                                    className={`text-xs mt-1.5 leading-relaxed break-words whitespace-pre-wrap ${
                                                        notification.read
                                                            ? "text-slate-500 dark:text-foreground/50"
                                                            : "text-slate-600 dark:text-foreground/80 font-medium"
                                                    }`}
                                                >
                                                    {notification.message}
                                                </p>
                                                <div className="flex items-center gap-4 mt-3">
                                                    <span className="text-[10px] text-slate-400 dark:text-foreground/30 font-semibold uppercase tracking-wider">
                                                        Logged: {new Date(notification.createdAt).toLocaleString()}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Float action tools */}
                                            <div className="flex items-center gap-1 bg-card/95 border border-slate-200 dark:border-border p-1 rounded-xl opacity-0 group-hover:opacity-100 shadow-md shadow-black/5 absolute right-4 top-1/2 -translate-y-1/2 transition-all">
                                                <button
                                                    onClick={() => toggleReadStatus(notification.id, notification.read)}
                                                    className={`p-2 rounded-lg text-xs font-bold transition-all ${
                                                        notification.read
                                                            ? "text-slate-500 hover:text-foreground hover:bg-slate-100 dark:hover:bg-white/5"
                                                            : "text-emerald-500 hover:bg-emerald-500/10"
                                                    }`}
                                                    title={notification.read ? "Mark as unread" : "Mark as read"}
                                                >
                                                    <Check className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => deleteNotification(notification.id)}
                                                    className="p-2 rounded-lg text-red-500 hover:bg-red-500/10 transition-all"
                                                    title="Delete permanently"
                                                >
                                                    <Trash2 className="w-4 h-4" />
                                                </button>
                                            </div>
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>
                        )}

                        {/* Pagination footer controls */}
                        {totalPages > 1 && (
                            <div className="px-6 py-4 bg-slate-50 dark:bg-foreground/5 border-t border-slate-200 dark:border-border flex items-center justify-between gap-4">
                                <span className="text-xs font-semibold text-slate-500 dark:text-foreground/40">
                                    Showing page <strong className="text-foreground">{currentPage}</strong> of{" "}
                                    <strong className="text-foreground">{totalPages}</strong> ({filteredNotifications.length} items)
                                </span>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                                        disabled={currentPage === 1}
                                        className="flex items-center justify-center p-2 border border-slate-200 dark:border-border bg-card rounded-lg text-foreground hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                                        disabled={currentPage === totalPages}
                                        className="flex items-center justify-center p-2 border border-slate-200 dark:border-border bg-card rounded-lg text-foreground hover:bg-slate-50 dark:hover:bg-white/5 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
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
