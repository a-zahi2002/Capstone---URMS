"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import {
    BookOpen,
    Calendar,
    CalendarDays,
    CheckCircle2,
    Clock,
    Package,
    ShieldAlert,
    Users,
    ArrowRight,
    Loader2,
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

export default function LecturerDashboard() {
    const { profile, user } = useAuth();
    const searchParams = useSearchParams();
    const activeTab = searchParams.get("tab") || "overview";
    const [deptResourcesCount, setDeptResourcesCount] = useState<number | string>("—");
    const [upcomingClassesCount, setUpcomingClassesCount] = useState<number | string>("—");
    const [studentsActiveCount, setStudentsActiveCount] = useState<number | string>("—");
    const [pendingBookings, setPendingBookings] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [rejectingBooking, setRejectingBooking] = useState<any | null>(null);
    const [rejectionReason, setRejectionReason] = useState("");
    const [actionLoading, setActionLoading] = useState<string | null>(null);

    const fetchPending = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const token = user ? await user.getIdToken() : "dev-token";
            const headers = { Authorization: `Bearer ${token}` };

            const [pendingRes, allResourcesRes, allBookingsRes] = await Promise.allSettled([
                fetch(`${API}/api/bookings/pending`, { headers }),
                fetch(`${API}/api/resources`, { headers }),
                fetch(`${API}/api/bookings`, { headers }),
            ]);

            if (pendingRes.status === "fulfilled" && pendingRes.value.ok) {
                const result = await pendingRes.value.json();
                setPendingBookings(result.data || []);
            }

            let resources: any[] = [];
            if (allResourcesRes.status === "fulfilled" && allResourcesRes.value.ok) {
                const data = await allResourcesRes.value.json();
                resources = Array.isArray(data) ? data : data.data || [];
                const deptRes = resources.filter((r: any) => r.department === profile?.department);
                setDeptResourcesCount(deptRes.length);
            }

            if (allBookingsRes.status === "fulfilled" && allBookingsRes.value.ok && resources.length > 0) {
                const resJson = await allBookingsRes.value.json();
                const bookings = Array.isArray(resJson.data) ? resJson.data : (Array.isArray(resJson) ? resJson : []);
                
                const deptResIds = new Set(resources.filter((r: any) => r.department === profile?.department).map((r: any) => r.id));
                
                const now = new Date();
                const upcoming = bookings.filter((b: any) => 
                    deptResIds.has(b.resource_id) && 
                    b.status === "Approved" && 
                    new Date(b.start_time) > now
                );
                setUpcomingClassesCount(upcoming.length);

                const activeStudents = new Set(
                    bookings
                        .filter((b: any) => deptResIds.has(b.resource_id) && b.users?.role === "student")
                        .map((b: any) => b.user_id)
                );
                setStudentsActiveCount(activeStudents.size);
            }
        } catch (err: any) {
            console.error("fetchPending error:", err);
            setError(err.message || "Could not retrieve pending requests.");
        } finally {
            setLoading(false);
        }
    }, [user, profile]);

    useEffect(() => { fetchPending(); }, [fetchPending]);

    const handleApprove = async (bookingId: string) => {
        setActionLoading(bookingId);
        try {
            const token = user ? await user.getIdToken() : "dev-token";
            const res = await fetch(`${API}/api/bookings/${bookingId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: "Approved" }),
            });
            if (!res.ok) throw new Error("Failed to approve booking");
            const result = await res.json();
            if (result.status === "success") {
                setPendingBookings((prev) => prev.filter((b) => b.id !== bookingId));
            } else {
                throw new Error(result.message || "Failed to approve booking");
            }
        } catch (err: any) {
            alert(err.message || "An error occurred");
        } finally {
            setActionLoading(null);
        }
    };

    const handleDenySubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rejectingBooking) return;
        const bookingId = rejectingBooking.id;
        setActionLoading(bookingId);
        try {
            const token = user ? await user.getIdToken() : "dev-token";
            const res = await fetch(`${API}/api/bookings/${bookingId}/status`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ status: "Rejected", rejectionReason }),
            });
            if (!res.ok) throw new Error("Failed to decline booking");
            const result = await res.json();
            if (result.status === "success") {
                setPendingBookings((prev) => prev.filter((b) => b.id !== bookingId));
                setRejectingBooking(null);
                setRejectionReason("");
            } else {
                throw new Error(result.message || "Failed to decline booking");
            }
        } catch (err: any) {
            alert(err.message || "An error occurred");
        } finally {
            setActionLoading(null);
        }
    };

    const formatBookingTime = (startTimeStr: string, endTimeStr: string) => {
        try {
            const start = new Date(startTimeStr);
            const end = new Date(endTimeStr);
            const dateStr = start.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
            const timeStr = `${start.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })} - ${end.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: false })}`;
            return { dateStr, timeStr };
        } catch {
            return { dateStr: startTimeStr, timeStr: endTimeStr };
        }
    };

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            {/* ── Welcome Header ── */}
            <motion.header
                variants={fadeInUp}
                className="bg-gradient-to-r from-emerald-600/10 to-teal-600/5 dark:from-emerald-900/30 dark:to-teal-900/15 p-8 rounded-3xl border border-emerald-200 dark:border-emerald-500/20 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-3xl rounded-full" />
                <h1 className="text-3xl font-black text-foreground tracking-tight relative z-10">
                    {activeTab === "approvals" ? "Approval Queue" : "Teacher Portal"}
                </h1>
                <p className="text-emerald-700 dark:text-emerald-200 mt-2 font-medium relative z-10">
                    {activeTab === "approvals" ? (
                        "Review and manage pending student bookings for department resources."
                    ) : (
                        <>
                            Hello, Dr. {profile?.name || "Lecturer"}. You have{" "}
                            <span className="font-bold text-emerald-600 dark:text-emerald-400">
                                {pendingBookings.length} pending approval{pendingBookings.length !== 1 ? "s" : ""}
                            </span>.
                        </>
                    )}
                </p>
            </motion.header>

            {activeTab === "overview" ? (
                <>
                    {/* ── Stat Cards ── */}
                    <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                        {[
                            { label: "Pending Approvals", value: pendingBookings.length, icon: Clock, color: "amber", link: "/dashboard?tab=approvals" },
                            { label: "Dept. Resources", value: deptResourcesCount, icon: Package, color: "emerald" },
                            { label: "Upcoming Classes", value: upcomingClassesCount, icon: CalendarDays, color: "blue", link: "/bookings?view=all" },
                            { label: "Students Active", value: studentsActiveCount, icon: Users, color: "purple" },
                        ].map(({ label, value, icon: Icon, color, link }) => {
                            const card = (
                                <div className="bg-card border border-slate-200 dark:border-border rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-500/30 transition-all h-full">
                                    <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-3`}>
                                        <Icon className={`w-5 h-5 text-${color}-500`} />
                                    </div>
                                    <p className="text-[10px] font-black text-slate-500 dark:text-foreground/45 uppercase tracking-widest">{label}</p>
                                    <p className="text-3xl font-black text-foreground mt-1">{value}</p>
                                </div>
                            );
                            return link ? (
                                <Link key={label} href={link} className="block h-full">
                                    {card}
                                </Link>
                            ) : (
                                <div key={label} className="h-full">{card}</div>
                            );
                        })}
                    </motion.div>

                    {/* ── Main Content (Overview mode) ── */}
                    <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Summary Approval Card */}
                        <div className="bg-card border border-slate-200 dark:border-border rounded-3xl p-6 shadow-sm flex flex-col justify-between">
                            <div>
                                <h3 className="text-lg font-bold text-foreground mb-3 flex items-center gap-2">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Pending Approvals
                                </h3>
                                <p className="text-sm text-slate-500 dark:text-foreground/50 mb-4">
                                    There are currently {pendingBookings.length} booking request{pendingBookings.length !== 1 ? "s" : ""} waiting for your review.
                                </p>
                            </div>
                            <Link
                                href="/dashboard?tab=approvals"
                                className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-emerald-600 text-white text-sm font-bold hover:bg-emerald-500 transition-all shadow-lg shadow-emerald-600/10"
                            >
                                Open Approval Queue <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>

                        {/* Upcoming Classes */}
                        <div className="bg-card border border-slate-200 dark:border-border rounded-3xl p-6 shadow-sm">
                            <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                                <BookOpen className="w-5 h-5 text-emerald-500" /> My Upcoming Classes
                            </h3>
                            <div className="space-y-3">
                                {[
                                    { month: "Oct", day: "12", title: "Quantum Mechanics 101", location: "Main Lecture Hall", time: "10:00 AM" },
                                    { month: "Oct", day: "14", title: "Advanced Physics Lab", location: "Lab Block C", time: "2:00 PM" },
                                    { month: "Oct", day: "16", title: "Seminar: Particle Theory", location: "Room 205", time: "11:00 AM" },
                                ].map((cls, idx) => (
                                    <div key={idx} className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-white/[0.03]">
                                        <div className="bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 font-bold p-3 rounded-lg text-center leading-tight border border-emerald-500/20 shrink-0">
                                            <span className="block text-xs uppercase tracking-wider">{cls.month}</span>
                                            <span className="block text-xl">{cls.day}</span>
                                        </div>
                                        <div>
                                            <p className="font-bold text-foreground">{cls.title}</p>
                                            <p className="text-sm text-slate-500 dark:text-foreground/40">{cls.location} • {cls.time}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <Link
                                href="/bookings?view=all"
                                className="mt-5 w-full inline-flex items-center justify-center gap-2 py-3 px-4 rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-white/[0.03] text-sm font-bold text-slate-600 dark:text-foreground/60 hover:bg-slate-100 dark:hover:bg-white/[0.06] transition-colors"
                            >
                                View Full Schedule <ArrowRight className="w-4 h-4" />
                            </Link>
                        </div>
                    </motion.div>
                </>
            ) : (
                /* ── Approval Queue view (takes full width) ── */
                <motion.div variants={fadeInUp} className="w-full">
                    <div className="bg-card border border-slate-200 dark:border-border rounded-3xl p-6 shadow-sm flex flex-col w-full animate-in fade-in slide-in-from-bottom-4 duration-300">
                        <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                            <CheckCircle2 className="w-5 h-5 text-emerald-500" /> Pending Requests ({pendingBookings.length})
                        </h3>
                        <div className="space-y-3">
                            {loading ? (
                                <div className="flex items-center justify-center py-8">
                                    <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                                    <span className="ml-2 text-sm text-slate-400">Loading approvals...</span>
                                </div>
                            ) : error ? (
                                <p className="text-sm text-red-400 py-4 text-center">{error}</p>
                            ) : pendingBookings.length === 0 ? (
                                <div className="text-center py-12">
                                    <CheckCircle2 className="w-12 h-12 text-emerald-300 dark:text-emerald-500/30 mx-auto mb-3" />
                                    <p className="text-sm text-slate-500 dark:text-foreground/45 font-bold">All caught up!</p>
                                    <p className="text-xs text-slate-400 mt-1">No pending approval requests.</p>
                                </div>
                            ) : (
                                pendingBookings.map((booking) => {
                                    const { dateStr, timeStr } = formatBookingTime(booking.start_time, booking.end_time);
                                    return (
                                        <div
                                            key={booking.id}
                                            className="p-4 border border-emerald-200 dark:border-emerald-500/20 bg-emerald-50 dark:bg-emerald-500/5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 hover:shadow-sm transition-all"
                                        >
                                            <div className="space-y-1">
                                                <p className="font-bold text-foreground text-sm">{booking.resources?.name || "Resource"}</p>
                                                <p className="text-xs text-slate-500 dark:text-foreground/40">
                                                    Requested by{" "}
                                                    <span className="font-semibold text-slate-700 dark:text-slate-300">
                                                        {booking.users?.name || "Unknown Student"}
                                                    </span>
                                                </p>
                                                <p className="text-[11px] text-slate-400 flex items-center gap-1.5 mt-1">
                                                    <Calendar className="w-3.5 h-3.5 text-emerald-400" />
                                                    <span>{dateStr}</span>
                                                    <Clock className="w-3.5 h-3.5 text-teal-400 ml-1.5" />
                                                    <span>{timeStr}</span>
                                                </p>
                                            </div>
                                            <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                                <button
                                                    onClick={() => setRejectingBooking(booking)}
                                                    disabled={actionLoading !== null}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-border rounded-lg text-xs font-bold text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 transition-colors disabled:opacity-50"
                                                >
                                                    Deny
                                                </button>
                                                <button
                                                    onClick={() => handleApprove(booking.id)}
                                                    disabled={actionLoading !== null}
                                                    className="flex-1 sm:flex-none px-4 py-2 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-500 transition-colors disabled:opacity-50"
                                                >
                                                    {actionLoading === booking.id ? "Approving..." : "Approve"}
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })
                            )}
                        </div>
                    </div>
                </motion.div>
            )}

            {/* ── Rejection Reason Modal ── */}
            {rejectingBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectingBooking(null)} />
                    <div className="relative w-full max-w-md bg-card dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden text-foreground">
                        <h3 className="text-xl font-black mb-2 flex items-center gap-2">
                            <ShieldAlert className="w-5 h-5 text-red-500" /> Decline Booking Request
                        </h3>
                        <p className="text-sm text-slate-500 dark:text-foreground/60 mb-4">
                            Provide a reason for declining the request for{" "}
                            <span className="font-bold text-foreground">{rejectingBooking.resources?.name}</span> by{" "}
                            <span className="font-bold text-foreground">{rejectingBooking.users?.name}</span>.
                        </p>
                        <form onSubmit={handleDenySubmit} className="space-y-4">
                            <div>
                                <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                    Reason for Decline
                                </label>
                                <textarea
                                    value={rejectionReason}
                                    onChange={(e) => setRejectionReason(e.target.value)}
                                    placeholder="e.g. The lab is reserved for scheduled examinations during this hour."
                                    required
                                    rows={3}
                                    className="w-full px-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-800 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-red-500/10 transition-all resize-none text-foreground"
                                />
                            </div>
                            <div className="flex justify-end gap-3">
                                <button
                                    type="button"
                                    onClick={() => setRejectingBooking(null)}
                                    className="px-5 py-2.5 border border-slate-200 dark:border-slate-800 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={actionLoading === rejectingBooking.id}
                                    className="px-5 py-2.5 bg-red-600 hover:bg-red-500 text-white rounded-xl text-xs font-bold transition-all shadow-lg shadow-red-600/10 disabled:opacity-50"
                                >
                                    {actionLoading === rejectingBooking.id ? "Declining..." : "Decline Booking"}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </motion.div>
    );
}
