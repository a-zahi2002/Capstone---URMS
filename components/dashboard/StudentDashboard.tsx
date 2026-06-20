"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import {
    Calendar,
    Clock,
    BookOpen,
    ArrowRight,
    PackagePlus,
    AlertCircle,
    CheckCircle2,
    XCircle,
    Loader2,
    CalendarCheck,
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45 } },
};
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } },
};

interface Booking {
    id: string;
    resource_name?: string;
    resources?: { name: string };
    start_time: string;
    end_time: string;
    status: string;
}

export default function StudentDashboard() {
    const { profile, user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);

    const fetchBookings = useCallback(async () => {
        setLoading(true);
        try {
            const token = user ? await user.getIdToken() : "dev-token";
            const res = await fetch(`${API}/api/bookings/my`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (res.ok) {
                const result = await res.json();
                setBookings(Array.isArray(result.data) ? result.data : Array.isArray(result) ? result : []);
            }
        } catch (e) {
            console.error("Failed to fetch bookings:", e);
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => { fetchBookings(); }, [fetchBookings]);

    const pending = bookings.filter(b => b.status === "Pending");
    const approved = bookings.filter(b => b.status === "Approved");
    const rejected = bookings.filter(b => b.status === "Rejected");
    const nextBooking = approved[0];

    const formatTime = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString("en-US", {
                weekday: "short", month: "short", day: "numeric",
                hour: "2-digit", minute: "2-digit", hour12: true,
            });
        } catch { return dateStr; }
    };

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            {/* ── Welcome Header ── */}
            <motion.header variants={fadeInUp}>
                <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight">
                    Student Hub
                </h1>
                <p className="text-slate-600 dark:text-foreground/50 mt-2 text-lg font-medium">
                    Hi {profile?.name?.split(" ")[0] || "Student"}, ready to learn? 📚
                </p>
            </motion.header>

            {/* ── Status Alerts ── */}
            {pending.length > 0 && (
                <motion.div
                    variants={fadeInUp}
                    className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/20 rounded-2xl"
                >
                    <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-xl shrink-0">
                        <AlertCircle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div>
                        <p className="text-sm font-bold text-amber-800 dark:text-amber-300">
                            {pending.length} booking{pending.length !== 1 ? "s" : ""} pending approval
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400/70 mt-0.5">
                            Waiting for lecturer/admin review
                        </p>
                    </div>
                </motion.div>
            )}

            {/* ── Stat Cards ── */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Total Bookings", value: bookings.length, icon: CalendarCheck, color: "blue" },
                    { label: "Approved", value: approved.length, icon: CheckCircle2, color: "emerald" },
                    { label: "Pending", value: pending.length, icon: Clock, color: "amber" },
                    { label: "Rejected", value: rejected.length, icon: XCircle, color: "red" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-card border border-slate-200 dark:border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-3`}>
                            <Icon className={`w-5 h-5 text-${color}-500`} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest">{label}</p>
                        <p className="text-3xl font-black text-foreground mt-1">{loading ? "—" : value}</p>
                    </div>
                ))}
            </motion.div>

            {/* ── Main content grid ── */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Next Booking hero card */}
                <div className="bg-gradient-to-br from-blue-600 to-cyan-600 dark:from-blue-800 dark:to-cyan-800 rounded-3xl p-8 text-white shadow-xl shadow-blue-900/20 relative overflow-hidden border border-blue-500/30">
                    <div className="absolute -top-10 -right-10 opacity-15">
                        <Calendar className="w-48 h-48" />
                    </div>
                    {nextBooking ? (
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-2 text-blue-100">Next Booking</h3>
                            <p className="text-2xl md:text-3xl font-black mb-2 leading-tight">
                                {nextBooking.resources?.name || nextBooking.resource_name || "Resource"}
                            </p>
                            <p className="text-blue-100 font-medium">{formatTime(nextBooking.start_time)}</p>
                            <Link
                                href="/bookings"
                                className="mt-6 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                            >
                                View Details <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    ) : (
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold mb-2 text-blue-100">No Upcoming Bookings</h3>
                            <p className="text-blue-200 font-medium">Browse resources to make your first reservation</p>
                            <Link
                                href="/resources"
                                className="mt-6 inline-flex items-center gap-2 bg-white/20 hover:bg-white/30 backdrop-blur-sm text-white px-5 py-2.5 rounded-xl font-bold text-sm transition-colors"
                            >
                                Browse Resources <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    )}
                </div>

                {/* Quick Actions */}
                <div className="bg-card border border-slate-200 dark:border-border rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-5">Quick Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href="/resources"
                            className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-white/[0.03] rounded-2xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all border border-slate-200 dark:border-border group"
                        >
                            <PackagePlus className="w-7 h-7 text-blue-500 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-slate-600 dark:text-foreground/60 text-sm text-center">Reserve Resource</span>
                        </Link>
                        <Link
                            href="/bookings"
                            className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-white/[0.03] rounded-2xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all border border-slate-200 dark:border-border group"
                        >
                            <BookOpen className="w-7 h-7 text-emerald-500 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-slate-600 dark:text-foreground/60 text-sm text-center">My Bookings</span>
                        </Link>
                        <Link
                            href="/resources"
                            className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-white/[0.03] rounded-2xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all border border-slate-200 dark:border-border group"
                        >
                            <Calendar className="w-7 h-7 text-purple-500 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-slate-600 dark:text-foreground/60 text-sm text-center">Browse Labs</span>
                        </Link>
                        <Link
                            href="/notifications"
                            className="flex flex-col items-center justify-center p-5 bg-slate-50 dark:bg-white/[0.03] rounded-2xl hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-all border border-slate-200 dark:border-border group"
                        >
                            <Clock className="w-7 h-7 text-amber-500 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-slate-600 dark:text-foreground/60 text-sm text-center">Notifications</span>
                        </Link>
                    </div>
                </div>
            </motion.div>

            {/* ── Recent Bookings ── */}
            <motion.div variants={fadeInUp} className="bg-card border border-slate-200 dark:border-border rounded-3xl shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-200 dark:border-border">
                    <h3 className="text-lg font-bold text-foreground">Recent Bookings</h3>
                    <Link href="/bookings" className="text-sm font-bold text-brand-primary hover:underline">
                        View All →
                    </Link>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-border/50">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                            <span className="ml-2 text-sm text-slate-400 font-medium">Loading bookings...</span>
                        </div>
                    ) : bookings.length === 0 ? (
                        <div className="text-center py-12">
                            <CalendarCheck className="w-10 h-10 text-slate-300 dark:text-foreground/20 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-500 dark:text-foreground/40">No bookings yet</p>
                            <p className="text-xs text-slate-400 dark:text-foreground/30 mt-1">Reserve a resource to get started</p>
                        </div>
                    ) : (
                        bookings.slice(0, 5).map((booking) => {
                            const statusColors: Record<string, string> = {
                                Approved: "bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/20",
                                Pending: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
                                Rejected: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
                            };
                            return (
                                <div key={booking.id} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center shrink-0">
                                            <BookOpen className="w-5 h-5 text-blue-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate">
                                                {booking.resources?.name || booking.resource_name || "Resource"}
                                            </p>
                                            <p className="text-xs text-slate-500 dark:text-foreground/40 mt-0.5">
                                                {formatTime(booking.start_time)}
                                            </p>
                                        </div>
                                    </div>
                                    <span className={`text-xs font-bold px-3 py-1 rounded-full border shrink-0 ${statusColors[booking.status] || statusColors.Pending}`}>
                                        {booking.status}
                                    </span>
                                </div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
