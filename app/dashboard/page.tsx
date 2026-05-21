"use client";

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
                    <span className="font-bold text-cyan-500 dark:text-cyan-400"> 3 pending approvals</span>.
                </p>
            </motion.header>

            <motion.div variants={fadeInUp} className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="bg-card backdrop-blur-xl rounded-2xl border border-slate-200 dark:border-border p-6 shadow-sm flex flex-col">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <CheckCircle2 className="w-5 h-5 text-cyan-400" /> Pending Requests
                    </h3>
                    <div className="flex-grow space-y-3">
                        <div className="p-4 border border-blue-500/20 bg-blue-500/5 rounded-xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                            <div>
                                <p className="font-bold text-foreground text-sm">Advanced Physics Lab</p>
                                <p className="text-xs text-slate-500 dark:text-foreground/40 mt-1">Requested by John Doe</p>
                            </div>
                            <div className="flex gap-2 w-full sm:w-auto">
                                <button className="flex-1 sm:flex-none px-4 py-2 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-border rounded-lg text-xs font-bold text-red-400 hover:bg-slate-100 transition-colors">
                                    Deny
                                </button>
                                <button className="flex-1 sm:flex-none px-4 py-2 bg-cyan-600 text-white rounded-lg text-xs font-bold hover:bg-cyan-500 transition-colors">
                                    Approve
                                </button>
                            </div>
                        </div>
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
