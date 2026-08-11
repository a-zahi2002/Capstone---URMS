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
    Bell,
    TrendingUp,
    Zap,
    Star,
    ChevronRight,
    MapPin,
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

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const cardVariant = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

interface Booking {
    id: string;
    resource_name?: string;
    resources?: { name: string; type?: string; location?: string };
    start_time: string;
    end_time: string;
    status: string;
    purpose?: string;
}

const fmt = (d: string) => {
    try {
        return new Date(d).toLocaleString("en-US", {
            weekday: "short", month: "short", day: "numeric",
            hour: "2-digit", minute: "2-digit", hour12: true,
        });
    } catch { return d; }
};

const fmtDate = (d: string) => {
    try {
        return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric" });
    } catch { return d; }
};

const fmtTime = (d: string) => {
    try {
        return new Date(d).toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true });
    } catch { return d; }
};

// Status pill component
const StatusPill = ({ status }: { status: string }) => {
    const map: Record<string, string> = {
        Approved: "bg-teal-50 text-teal-700 border border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
        Pending: "bg-amber-50 text-amber-700 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
        Rejected: "bg-red-50 text-red-700 border border-red-200 dark:bg-red-500/10 dark:text-red-300 dark:border-red-500/20",
    };
    return (
        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${map[status] || map.Pending}`}>
            {status}
        </span>
    );
};

export default function StudentDashboard() {
    const { profile, user } = useAuth();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [greeting, setGreeting] = useState("Hello");

    useEffect(() => {
        const h = new Date().getHours();
        if (h < 12) setGreeting("Good morning");
        else if (h < 17) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

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
    const nextBooking = approved.find(b => new Date(b.start_time) > new Date());
    const todayCount = bookings.filter(b => {
        const d = new Date(b.start_time);
        const today = new Date();
        return d.toDateString() === today.toDateString();
    }).length;

    const stats = [
        { label: "Total Bookings", value: bookings.length, icon: CalendarCheck, color: "sky", bg: "#F0F9FF", fg: "#0EA5E9" },
        { label: "Approved", value: approved.length, icon: CheckCircle2, color: "teal", bg: "#CCFBF1", fg: "#0D9488" },
        { label: "Pending", value: pending.length, icon: Clock, color: "amber", bg: "#FFFBEB", fg: "#D97706" },
        { label: "Rejected", value: rejected.length, icon: XCircle, color: "rose", bg: "#FFF1F2", fg: "#E11D48" },
    ];

    const quickActions = [
        { href: "/resources", label: "Reserve Resource", icon: PackagePlus, color: "#0EA5E9", bg: "#F0F9FF", desc: "Book a lab or hall" },
        { href: "/bookings?view=my", label: "My Bookings", icon: BookOpen, color: "#0D9488", bg: "#CCFBF1", desc: "View all reservations" },
        { href: "/bookings?view=status", label: "Booking Status", icon: CalendarCheck, color: "#7C3AED", bg: "#F5F3FF", desc: "Track approvals" },
        { href: "/notifications", label: "Notifications", icon: Bell, color: "#D97706", bg: "#FFFBEB", desc: "Updates & alerts" },
    ];

    return (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-6">

            {/* ── Welcome Hero Banner ── */}
            <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] p-6 md:p-8 text-white shadow-lg shadow-sky-500/20">
                {/* Decorative circles */}
                <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
                <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
                <div className="absolute top-4 right-32 w-20 h-20 rounded-full bg-[#0D9488]/20 pointer-events-none" />

                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider">
                                <Star className="w-3 h-3" /> Student Hub
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            {greeting}, {profile?.name?.split(" ")[0] || "Student"} 👋
                        </h1>
                        <p className="mt-1.5 text-sky-100 text-sm font-medium">
                            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                        {todayCount > 0 && (
                            <p className="mt-2 text-sky-200 text-sm">
                                You have <span className="text-white font-bold">{todayCount} booking{todayCount !== 1 ? "s" : ""}</span> today
                            </p>
                        )}
                    </div>

                    {/* Next Booking Preview */}
                    {nextBooking && (
                        <div className="bg-white/15 backdrop-blur-sm rounded-xl p-4 min-w-[220px] border border-white/20">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-sky-200 mb-1">Next Booking</p>
                            <p className="font-bold text-white text-sm leading-tight">
                                {nextBooking.resources?.name || nextBooking.resource_name || "Resource"}
                            </p>
                            <p className="text-sky-200 text-xs mt-1 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {fmtDate(nextBooking.start_time)} · {fmtTime(nextBooking.start_time)}
                            </p>
                            <Link href="/bookings?view=my" className="mt-3 inline-flex items-center gap-1 text-[11px] font-semibold text-white bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg transition-colors">
                                View Details <ArrowRight className="w-3 h-3" />
                            </Link>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ── Pending Alert ── */}
            {pending.length > 0 && (
                <motion.div variants={fadeInUp} className="flex items-center gap-3 p-4 bg-amber-50 dark:bg-amber-500/10 border border-amber-200 dark:border-amber-500/25 rounded-xl">
                    <div className="w-9 h-9 rounded-lg bg-amber-100 dark:bg-amber-500/20 flex items-center justify-center shrink-0">
                        <AlertCircle className="w-4.5 h-4.5 text-amber-600 dark:text-amber-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-amber-800 dark:text-amber-300">
                            {pending.length} booking{pending.length !== 1 ? "s" : ""} awaiting approval
                        </p>
                        <p className="text-xs text-amber-600 dark:text-amber-400/70 mt-0.5">
                            Your request is being reviewed by a lecturer or admin
                        </p>
                    </div>
                    <Link href="/bookings?view=status" className="shrink-0 text-xs font-semibold text-amber-700 dark:text-amber-400 hover:underline flex items-center gap-0.5">
                        View <ChevronRight className="w-3.5 h-3.5" />
                    </Link>
                </motion.div>
            )}

            {/* ── Stat Cards ── */}
            <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {stats.map(({ label, value, icon: Icon, bg, fg }) => (
                    <motion.div
                        key={label}
                        variants={cardVariant}
                        className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-[#E2E8F0] dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200"
                    >
                        <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: bg }}>
                            <Icon className="w-5 h-5" style={{ color: fg }} />
                        </div>
                        <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">{label}</p>
                        <p className="text-3xl font-bold text-[#0F172A] dark:text-white mt-1">
                            {loading ? <Loader2 className="w-6 h-6 animate-spin opacity-30" /> : value}
                        </p>
                    </motion.div>
                ))}
            </motion.div>

            {/* ── Quick Actions ── */}
            <motion.div variants={fadeInUp}>
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <Zap className="w-4 h-4 text-[#0EA5E9]" /> Quick Actions
                    </h2>
                </div>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                    {quickActions.map(({ href, label, icon: Icon, color, bg, desc }) => (
                        <Link
                            key={label}
                            href={href}
                            className="group relative bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-[#E2E8F0] dark:border-slate-700 shadow-sm hover:shadow-lg hover:-translate-y-1 transition-all duration-200 overflow-hidden"
                        >
                            <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl" style={{ background: `radial-gradient(circle at top left, ${bg}, transparent 70%)` }} />
                            <div className="relative z-10">
                                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3 transition-transform group-hover:scale-110 duration-200" style={{ backgroundColor: bg }}>
                                    <Icon className="w-5 h-5" style={{ color }} />
                                </div>
                                <p className="font-semibold text-[#0F172A] dark:text-white text-sm leading-tight">{label}</p>
                                <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">{desc}</p>
                            </div>
                            <ChevronRight className="absolute bottom-4 right-4 w-4 h-4 text-slate-300 group-hover:text-slate-500 dark:text-slate-600 dark:group-hover:text-slate-400 transition-colors" />
                        </Link>
                    ))}
                </div>
            </motion.div>

            {/* ── Recent Bookings ── */}
            <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-slate-700">
                    <h2 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-[#0EA5E9]" /> Recent Bookings
                    </h2>
                    <Link href="/bookings?view=my" className="text-xs font-semibold text-[#0EA5E9] hover:text-[#0284C7] flex items-center gap-0.5 transition-colors">
                        View all <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                </div>

                {loading ? (
                    <div className="flex items-center justify-center gap-2 py-12 text-[#64748B]">
                        <Loader2 className="w-5 h-5 animate-spin text-[#0EA5E9]" />
                        <span className="text-sm font-medium">Loading bookings…</span>
                    </div>
                ) : bookings.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-12 text-center px-4">
                        <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] flex items-center justify-center mb-3">
                            <CalendarCheck className="w-7 h-7 text-[#0EA5E9]" />
                        </div>
                        <p className="font-semibold text-[#0F172A] dark:text-white">No bookings yet</p>
                        <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">Reserve a resource to get started</p>
                        <Link href="/resources" className="mt-4 inline-flex items-center gap-2 bg-[#0EA5E9] hover:bg-[#0284C7] text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors shadow-sm shadow-sky-500/20">
                            <PackagePlus className="w-4 h-4" /> Browse Resources
                        </Link>
                    </div>
                ) : (
                    <div className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                        {bookings.slice(0, 6).map((booking) => (
                            <div key={booking.id} className="flex items-center gap-4 px-6 py-3.5 hover:bg-[#F8FAFC] dark:hover:bg-slate-700/30 transition-colors group">
                                {/* Status left border */}
                                <div className={`w-1 h-10 rounded-full shrink-0 ${booking.status === "Approved" ? "bg-[#0D9488]" : booking.status === "Pending" ? "bg-amber-400" : "bg-red-400"}`} />

                                {/* Icon */}
                                <div className="w-9 h-9 rounded-xl bg-[#F0F9FF] dark:bg-sky-500/10 flex items-center justify-center shrink-0">
                                    <BookOpen className="w-4.5 h-4.5 text-[#0EA5E9]" />
                                </div>

                                {/* Details */}
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">
                                        {booking.resources?.name || booking.resource_name || "Resource"}
                                    </p>
                                    <div className="flex items-center gap-2 mt-0.5">
                                        <span className="text-[11px] text-[#64748B] dark:text-slate-400 flex items-center gap-1">
                                            <Calendar className="w-3 h-3" /> {fmtDate(booking.start_time)}
                                        </span>
                                        <span className="text-[#E2E8F0] dark:text-slate-600">·</span>
                                        <span className="text-[11px] text-[#64748B] dark:text-slate-400 flex items-center gap-1">
                                            <Clock className="w-3 h-3" /> {fmtTime(booking.start_time)}
                                        </span>
                                        {booking.resources?.location && (
                                            <>
                                                <span className="text-[#E2E8F0] dark:text-slate-600">·</span>
                                                <span className="text-[11px] text-[#64748B] dark:text-slate-400 flex items-center gap-1">
                                                    <MapPin className="w-3 h-3" /> {booking.resources.location}
                                                </span>
                                            </>
                                        )}
                                    </div>
                                </div>

                                <StatusPill status={booking.status} />
                            </div>
                        ))}
                    </div>
                )}
            </motion.div>
        </motion.div>
    );
}
