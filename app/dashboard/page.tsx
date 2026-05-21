"use client";

import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import Link from "next/link";
import ProtectedRoute from "@/components/ProtectedRoute";
import { motion } from "framer-motion";
import type { ReactNode } from "react";
import {
    AlertCircle,
    BarChart3,
    BookOpen,
    Calendar,
    CalendarCheck,
    CheckCircle2,
    Clock,
    Package,
    PenTool,
    ShieldAlert,
    Users,
    ArrowRight,
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

type Profile = {
    name?: string;
    role?: "admin" | "lecturer" | "student" | "maintenance";
};

type StatCardProps = {
    title: string;
    value: string;
    icon: ReactNode;
};

function StatCard({ title, value, icon }: StatCardProps) {
    return (
        <div className="bg-card backdrop-blur-xl p-6 rounded-2xl border border-slate-200 dark:border-border shadow-sm flex items-center gap-4 hover:border-cyan-500/30 transition-colors">
            <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-border">
                {icon}
            </div>
            <div>
                <p className="text-sm font-bold text-slate-500 dark:text-foreground/40 uppercase tracking-wider">{title}</p>
                <p className="text-3xl font-black text-foreground">{value}</p>
            </div>
        </div>
    );
}

function ActionButton({ href, label }: { href: string; label: string }) {
    return (
        <Link
            href={href}
            className="bg-card hover:bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-border hover:border-cyan-500/30 text-foreground font-bold text-sm py-3 px-4 rounded-xl text-center transition-all"
        >
            {label}
        </Link>
    );
}

function AdminDashboard({ profile }: { profile: Profile | null }) {
    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            <motion.header variants={fadeInUp} className="border-b border-slate-200 dark:border-border pb-6">
                <h1 className="text-3xl font-black text-foreground tracking-tight">Admin Console</h1>
                <p className="text-slate-600 dark:text-foreground/60 mt-2">
                    Welcome back, {profile?.name || "Admin"}. System overview is stable.
                </p>
            </motion.header>

            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <StatCard title="Active Users" value="842" icon={<Users className="w-6 h-6 text-cyan-400" />} />
                <StatCard title="Total Resources" value="156" icon={<Package className="w-6 h-6 text-blue-400" />} />
                <StatCard title="System Alerts" value="2" icon={<ShieldAlert className="w-6 h-6 text-red-400" />} />
            </motion.div>

            <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                <div className="bg-card backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-border p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-4">Recent Platform Activity</h3>
                    <div className="space-y-4">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-3 bg-slate-50 dark:bg-white/5 rounded-xl border border-slate-200 dark:border-border"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="bg-cyan-500/10 p-2 rounded-lg text-cyan-400">
                                        <BarChart3 className="w-4 h-4" />
                                    </div>
                                    <p className="text-sm font-semibold text-slate-600 dark:text-foreground/60">
                                        New user registration approved
                                    </p>
                                </div>
                                <span className="text-xs text-slate-500 dark:text-foreground/40">10m ago</span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-card backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-border p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-4">Management Actions</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <ActionButton href="/profile" label="Manage Users" />
                        <ActionButton href="/resources" label="Edit Resources" />
                        <ActionButton href="/maintenance" label="View Tickets" />
                        <ActionButton href="/bookings" label="All Bookings" />
                        <ActionButton href="/admin/analytics" label="View Analytics" />
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function LecturerDashboard({ profile }: { profile: Profile | null }) {
    const { user } = useAuth();
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
            const res = await fetch(`${API}/api/bookings/pending`, {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });
            if (!res.ok) throw new Error("Failed to load pending requests");
            const result = await res.json();
            if (result.status === "success") {
                setPendingBookings(result.data || []);
            } else {
                throw new Error(result.message || "Unknown error");
            }
        } catch (err: any) {
            console.error("fetchPending error:", err);
            setError(err.message || "Could not retrieve pending requests.");
        } finally {
            setLoading(false);
        }
    }, [user]);

    useEffect(() => {
        fetchPending();
    }, [fetchPending]);

    const handleApprove = async (bookingId: string) => {
        setActionLoading(bookingId);
        try {
            const token = user ? await user.getIdToken() : "dev-token";
            const res = await fetch(`${API}/api/bookings/${bookingId}/status`, {
                method: "PUT",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
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
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
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
        } catch (e) {
            return { dateStr: startTimeStr, timeStr: endTimeStr };
        }
    };

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            <motion.header
                variants={fadeInUp}
                className="bg-gradient-to-r from-blue-900/40 to-cyan-900/20 p-8 rounded-3xl border border-blue-500/20 relative overflow-hidden"
            >
                <div className="absolute top-0 right-0 w-64 h-64 bg-blue-500/10 blur-3xl rounded-full" />
                <h1 className="text-3xl font-black text-foreground tracking-tight relative z-10">Teacher Portal</h1>
                <p className="text-blue-500 dark:text-blue-200 mt-2 font-medium relative z-10">
                    Hello, Dr. {profile?.name || "Lecturer"}. You have
                    <span className="font-bold text-cyan-500 dark:text-cyan-400">
                        {" "}{pendingBookings.length} pending approval{pendingBookings.length !== 1 ? "s" : ""}
                    </span>.
                </p>
            </motion.header>

            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-border p-6 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-cyan-400" /> Pending Requests
                    </h3>
                    <div className="flex-grow space-y-3">
                        {loading ? (
                            <p className="text-sm text-slate-400 animate-pulse py-4 text-center">Loading pending approvals...</p>
                        ) : error ? (
                            <p className="text-sm text-red-400 py-4 text-center">{error}</p>
                        ) : pendingBookings.length === 0 ? (
                            <p className="text-sm text-slate-400 py-4 text-center">No pending approval requests.</p>
                        ) : (
                            pendingBookings.map((booking) => {
                                const { dateStr, timeStr } = formatBookingTime(booking.start_time, booking.end_time);
                                return (
                                    <div
                                        key={booking.id}
                                        className="p-4 border border-blue-500/20 bg-blue-500/5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4"
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
                                                <Calendar className="w-3.5 h-3.5 text-blue-400" />
                                                <span>{dateStr}</span>
                                                <Clock className="w-3.5 h-3.5 text-cyan-400 ml-1.5" />
                                                <span>{timeStr}</span>
                                            </p>
                                        </div>
                                        <div className="flex gap-2 w-full sm:w-auto shrink-0">
                                            <button
                                                onClick={() => setRejectingBooking(booking)}
                                                disabled={actionLoading !== null}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-border rounded-lg text-xs font-bold text-red-400 hover:bg-slate-100 dark:hover:bg-white/10 transition-colors disabled:opacity-50"
                                            >
                                                Deny
                                            </button>
                                            <button
                                                onClick={() => handleApprove(booking.id)}
                                                disabled={actionLoading !== null}
                                                className="flex-1 sm:flex-none px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:bg-cyan-500 transition-colors disabled:opacity-50"
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

                <div className="bg-card backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-border p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <BookOpen className="w-5 h-5 text-cyan-400" /> My Upcoming Classes
                    </h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-4 p-3 rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-white/5">
                            <div className="bg-blue-500/20 text-blue-500 dark:text-blue-300 font-bold p-3 rounded-lg text-center leading-tight border border-blue-500/20">
                                <span className="block text-xs uppercase tracking-wider">Oct</span>
                                <span className="block text-xl">12</span>
                            </div>
                            <div>
                                <p className="font-bold text-foreground">Quantum Mechanics 101</p>
                                <p className="text-sm text-slate-500 dark:text-foreground/40">Main Lecture Hall • 10:00 AM</p>
                            </div>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* Rejection Reason Modal */}
            {rejectingBooking && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setRejectingBooking(null)} />

                    {/* Modal Content */}
                    <div className="relative w-full max-w-md bg-card dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl p-6 shadow-2xl overflow-hidden animate-in fade-in zoom-in-95 text-foreground">
                        <h3 className="text-xl font-black mb-2 flex items-center gap-2 text-foreground">
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

function StudentDashboard({ profile }: { profile: Profile | null }) {
    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            <motion.header variants={fadeInUp} className="mb-8">
                <h1 className="text-4xl font-black text-foreground tracking-tight">Student Hub</h1>
                <p className="text-slate-600 dark:text-foreground/60 mt-2 text-lg">
                    Hi {profile?.name || "Student"}, ready to learn?
                </p>
            </motion.header>

            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="bg-gradient-to-br from-cyan-600 to-blue-700 dark:from-cyan-900 dark:to-blue-900 rounded-3xl p-8 text-white shadow-xl shadow-cyan-900/20 relative overflow-hidden border border-cyan-500/30">
                    <div className="absolute -top-10 -right-10 opacity-20 text-cyan-300">
                        <Calendar className="w-48 h-48" />
                    </div>
                    <h3 className="text-xl font-bold mb-2 relative z-10 text-cyan-100">Next Booking</h3>
                    <p className="text-3xl md:text-4xl font-black relative z-10 mb-2 leading-tight">Library Study Room B</p>
                    <p className="text-blue-100 relative z-10 font-medium">Today at 2:00 PM</p>
                    <button className="mt-8 bg-cyan-500 text-white px-6 py-3 rounded-xl font-bold text-sm relative z-10 hover:bg-cyan-400 transition-colors inline-flex items-center gap-2">
                        View Details <ArrowRight className="w-4 h-4" />
                    </button>
                </div>

                <div className="bg-card backdrop-blur-xl rounded-3xl border border-slate-200 dark:border-border p-8 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-6">Quick Links</h3>
                    <div className="grid grid-cols-2 gap-4">
                        <Link
                            href="/resources"
                            className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-slate-100 transition-colors border border-slate-200 dark:border-border group"
                        >
                            <BookOpen className="w-8 h-8 text-cyan-500 dark:text-cyan-400 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-slate-600 dark:text-foreground/60 text-sm">Browse Labs</span>
                        </Link>
                        <Link
                            href="/bookings"
                            className="flex flex-col items-center justify-center p-6 bg-slate-50 dark:bg-white/5 rounded-2xl hover:bg-slate-100 transition-colors border border-slate-200 dark:border-border group"
                        >
                            <Clock className="w-8 h-8 text-blue-500 dark:text-blue-400 mb-3 group-hover:scale-110 transition-transform" />
                            <span className="font-bold text-slate-600 dark:text-foreground/60 text-sm">My History</span>
                        </Link>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

function MaintenanceDashboard({ profile }: { profile: Profile | null }) {
    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            <motion.header
                variants={fadeInUp}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4 border-b border-slate-200 dark:border-border pb-6"
            >
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <PenTool className="w-8 h-8 text-red-500 dark:text-red-400" /> Operations Hub
                    </h1>
                    <p className="text-slate-600 dark:text-foreground/60 mt-2">
                        Maintenance team active. 2 High priority tickets.
                    </p>
                </div>
                <button className="bg-red-500/20 border border-red-500/30 text-red-400 px-5 py-2.5 rounded-xl font-bold text-sm hover:bg-red-500/30 transition-colors">
                    Report Incident
                </button>
            </motion.header>

            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-red-950/20 border border-red-900/30 rounded-2xl p-6">
                    <h3 className="text-red-400 font-bold text-lg mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" /> Critical Tasks
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-red-500/20 shadow-sm flex justify-between items-center">
                            <div>
                                <p className="font-bold text-foreground">Projector Malfunction</p>
                                <p className="text-xs text-slate-500 dark:text-foreground/40 mt-1">Lecture Hall A</p>
                            </div>
                            <span className="bg-red-500/20 text-red-500 dark:text-red-400 border border-red-500/30 text-xs font-black uppercase px-2 py-1 rounded">
                                Urgent
                            </span>
                        </div>
                    </div>
                </div>

                <div className="bg-card border border-slate-200 dark:border-border rounded-2xl p-6 shadow-sm">
                    <h3 className="text-foreground font-bold text-lg mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-cyan-400" /> Standard Queue
                    </h3>
                    <div className="space-y-3">
                        <div className="bg-slate-50 dark:bg-white/5 p-4 rounded-xl border border-slate-200 dark:border-border flex justify-between items-center">
                            <div>
                                <p className="font-bold text-foreground">AC Filter Replacement</p>
                                <p className="text-xs text-slate-500 dark:text-foreground/40 mt-1">Computer Lab 3</p>
                            </div>
                            <span className="bg-slate-100 dark:bg-white/10 text-slate-600 dark:text-foreground/60 border border-slate-200 dark:border-border text-xs font-black uppercase px-2 py-1 rounded">
                                Routine
                            </span>
                        </div>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}

export default function DashboardPage() {
    const { profile } = useAuth();
    const typedProfile = (profile as Profile | null) ?? null;
    const role = typedProfile?.role || "student";

    return (
        <ProtectedRoute>
            <div className="min-h-[calc(100vh-64px)] bg-background text-slate-600 dark:text-foreground/60 p-6 md:p-10">
                <div className="max-w-7xl mx-auto">
                    {role === "admin" && <AdminDashboard profile={typedProfile} />}
                    {role === "lecturer" && <LecturerDashboard profile={typedProfile} />}
                    {role === "student" && <StudentDashboard profile={typedProfile} />}
                    {role === "maintenance" && <MaintenanceDashboard profile={typedProfile} />}
                </div>
            </div>
        </ProtectedRoute>
    );
}
