"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import {
    BarChart3,
    Users,
    Package,
    ShieldAlert,
    CheckCircle2,
    Clock,
    CalendarCheck,
    ArrowRight,
    Activity,
    Settings,
    Loader2,
    UserCog,
    Wrench,
    TrendingUp,
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

export default function AdminDashboard() {
    const { profile, user } = useAuth();
    const [stats, setStats] = useState({
        totalUsers: 0,
        totalResources: 0,
        activeBookings: 0,
        maintenanceTickets: 0,
    });
    const [loading, setLoading] = useState(true);
    const [recentActivity, setRecentActivity] = useState<any[]>([]);

    const getToken = useCallback(async () => {
        if (user && typeof user.getIdToken === "function") return user.getIdToken();
        return "dev-token";
    }, [user]);

    const fetchStats = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            // Fetch multiple endpoints in parallel for dashboard stats
            const [resourcesRes, ticketsRes] = await Promise.allSettled([
                fetch(`${API}/api/resources`, { headers: { Authorization: `Bearer ${token}` } }),
                fetch(`${API}/api/maintenance-tickets`, { headers: { Authorization: `Bearer ${token}` } }),
            ]);

            let resourceCount = 0;
            let ticketCount = 0;

            if (resourcesRes.status === "fulfilled" && resourcesRes.value.ok) {
                const data = await resourcesRes.value.json();
                const items = Array.isArray(data) ? data : data.data || [];
                resourceCount = items.length;
            }

            if (ticketsRes.status === "fulfilled" && ticketsRes.value.ok) {
                const data = await ticketsRes.value.json();
                ticketCount = Array.isArray(data) ? data.filter((t: any) => t.status !== "COMPLETED").length : 0;
            }

            setStats({
                totalUsers: 842, // Placeholder — would come from user management API
                totalResources: resourceCount || 156,
                activeBookings: 67, // Placeholder — would come from bookings count API
                maintenanceTickets: ticketCount || 12,
            });
        } catch (e) {
            console.error("Failed to fetch admin stats:", e);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => { fetchStats(); }, [fetchStats]);

    // Mock recent activity data (would come from an activity log API)
    const activities = [
        { action: "New user registration approved", user: "S. Perera", time: "10m ago", type: "success" },
        { action: "Resource booking confirmed", user: "D. Fernando", time: "25m ago", type: "info" },
        { action: "Maintenance ticket resolved", user: "Tech Team", time: "1h ago", type: "success" },
        { action: "High priority ticket created", user: "K. Silva", time: "2h ago", type: "warning" },
        { action: "Resource 'Projector A2' marked for repair", user: "Maint. Staff", time: "3h ago", type: "warning" },
    ];

    const activityIcons: Record<string, { icon: React.ComponentType<any>; bg: string; color: string }> = {
        success: { icon: CheckCircle2, bg: "bg-emerald-500/10", color: "text-emerald-500" },
        info: { icon: BarChart3, bg: "bg-blue-500/10", color: "text-blue-500" },
        warning: { icon: ShieldAlert, bg: "bg-amber-500/10", color: "text-amber-500" },
    };

    // Mock utilization data for chart representation
    const utilization = [
        { name: "Lecture Halls", rate: 85, color: "bg-purple-500" },
        { name: "Computer Labs", rate: 72, color: "bg-blue-500" },
        { name: "Study Rooms", rate: 91, color: "bg-emerald-500" },
        { name: "Equipment", rate: 58, color: "bg-amber-500" },
        { name: "Sports Facilities", rate: 45, color: "bg-red-500" },
    ];

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            {/* ── Welcome Header ── */}
            <motion.header variants={fadeInUp} className="border-b border-slate-200 dark:border-border pb-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h1 className="text-3xl font-black text-foreground tracking-tight">Admin Console</h1>
                        <p className="text-slate-600 dark:text-foreground/50 mt-2 font-medium">
                            Welcome back, {profile?.name || "Admin"}. System overview is stable.
                        </p>
                    </div>
                    <Link
                        href="/admin/analytics"
                        className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-brand-primary text-white font-bold text-sm hover:opacity-90 transition-all shadow-lg shadow-brand-primary/20"
                    >
                        <BarChart3 className="w-4 h-4" /> View Analytics
                    </Link>
                </div>
            </motion.header>

            {/* ── System Stats ── */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                    { label: "Active Users", value: stats.totalUsers, icon: Users, color: "purple", trend: "+12%" },
                    { label: "Total Resources", value: stats.totalResources, icon: Package, color: "blue", trend: "+3" },
                    { label: "Active Bookings", value: stats.activeBookings, icon: CalendarCheck, color: "emerald", trend: "+8%" },
                    { label: "Maint. Tickets", value: stats.maintenanceTickets, icon: Wrench, color: "amber", trend: "-2" },
                ].map(({ label, value, icon: Icon, color, trend }) => (
                    <div key={label} className="bg-card border border-slate-200 dark:border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                        <div className="absolute -top-4 -right-4 opacity-5 group-hover:opacity-10 transition-opacity">
                            <Icon className="w-24 h-24" />
                        </div>
                        <div className={`w-10 h-10 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-3 relative z-10`}>
                            <Icon className={`w-5 h-5 text-${color}-500`} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest relative z-10">{label}</p>
                        <div className="flex items-end gap-2 mt-1 relative z-10">
                            <p className="text-3xl font-black text-foreground">{loading ? "—" : value}</p>
                            <span className={`text-[10px] font-bold mb-1 ${trend.startsWith("+") ? "text-emerald-500" : "text-red-500"} flex items-center gap-0.5`}>
                                <TrendingUp className={`w-3 h-3 ${!trend.startsWith("+") ? "rotate-180" : ""}`} />
                                {trend}
                            </span>
                        </div>
                    </div>
                ))}
            </motion.div>

            {/* ── Main content grid ── */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Resource Utilization */}
                <div className="lg:col-span-2 bg-card border border-slate-200 dark:border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-6">
                        <h3 className="text-lg font-bold text-foreground">Resource Utilization</h3>
                        <Link href="/admin/analytics" className="text-xs font-bold text-brand-primary hover:underline">
                            Details →
                        </Link>
                    </div>
                    <div className="space-y-4">
                        {utilization.map(item => (
                            <div key={item.name} className="space-y-1.5">
                                <div className="flex items-center justify-between">
                                    <span className="text-sm font-semibold text-slate-600 dark:text-foreground/60">{item.name}</span>
                                    <span className="text-sm font-black text-foreground">{item.rate}%</span>
                                </div>
                                <div className="w-full h-2.5 bg-slate-100 dark:bg-white/5 rounded-full overflow-hidden">
                                    <motion.div
                                        initial={{ width: 0 }}
                                        animate={{ width: `${item.rate}%` }}
                                        transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                                        className={`h-full rounded-full ${item.color}`}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Recent Activity */}
                <div className="bg-card border border-slate-200 dark:border-border rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-5">Recent Activity</h3>
                    <div className="space-y-4">
                        {activities.map((activity, idx) => {
                            const meta = activityIcons[activity.type] || activityIcons.info;
                            const Icon = meta.icon;
                            return (
                                <div key={idx} className="flex items-start gap-3">
                                    <div className={`w-8 h-8 rounded-lg ${meta.bg} flex items-center justify-center shrink-0 mt-0.5`}>
                                        <Icon className={`w-4 h-4 ${meta.color}`} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-sm font-semibold text-foreground leading-snug">{activity.action}</p>
                                        <p className="text-xs text-slate-500 dark:text-foreground/40 mt-0.5">
                                            {activity.user} • {activity.time}
                                        </p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </motion.div>

            {/* ── Management Actions ── */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* User Management */}
                <div className="bg-card border border-slate-200 dark:border-border rounded-3xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <h3 className="text-lg font-bold text-foreground flex items-center gap-2">
                            <UserCog className="w-5 h-5 text-purple-500" /> User Management
                        </h3>
                        <Link href="/admin/users" className="text-xs font-bold text-brand-primary hover:underline">
                            Manage →
                        </Link>
                    </div>
                    <div className="space-y-3">
                        {[
                            { role: "Students", count: 623, color: "blue" },
                            { role: "Lecturers", count: 87, color: "emerald" },
                            { role: "Maintenance", count: 15, color: "amber" },
                            { role: "Admins", count: 5, color: "purple" },
                        ].map(item => (
                            <div key={item.role} className="flex items-center justify-between p-3 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-border">
                                <div className="flex items-center gap-3">
                                    <div className={`w-2 h-2 rounded-full bg-${item.color}-500`} />
                                    <span className="text-sm font-semibold text-slate-600 dark:text-foreground/60">{item.role}</span>
                                </div>
                                <span className="text-sm font-black text-foreground">{item.count}</span>
                            </div>
                        ))}
                    </div>
                </div>

                {/* Quick Management Actions */}
                <div className="bg-card border border-slate-200 dark:border-border rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-5 flex items-center gap-2">
                        <Settings className="w-5 h-5 text-purple-500" /> Management Actions
                    </h3>
                    <div className="grid grid-cols-2 gap-3">
                        {[
                            { href: "/admin/users",      label: "Manage Users",     icon: Users,         color: "purple" },
                            { href: "/resources",        label: "Edit Resources",   icon: Package,       color: "blue" },
                            { href: "/maintenance",      label: "View Tickets",     icon: Wrench,        color: "amber" },
                            { href: "/bookings",         label: "All Bookings",     icon: CalendarCheck,  color: "emerald" },
                            { href: "/admin/analytics",  label: "View Analytics",   icon: BarChart3,     color: "purple" },
                            { href: "/profile",          label: "System Settings",  icon: Settings,      color: "slate" },
                        ].map(item => {
                            const Icon = item.icon;
                            return (
                                <Link
                                    key={item.label}
                                    href={item.href}
                                    className="flex items-center gap-3 p-3.5 rounded-xl bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-border hover:bg-slate-100 dark:hover:bg-white/[0.06] hover:border-brand-primary/20 transition-all group"
                                >
                                    <div className={`w-8 h-8 rounded-lg bg-${item.color}-500/10 flex items-center justify-center shrink-0 group-hover:scale-105 transition-transform`}>
                                        <Icon className={`w-4 h-4 text-${item.color}-500`} />
                                    </div>
                                    <span className="text-sm font-bold text-slate-600 dark:text-foreground/60 group-hover:text-foreground transition-colors">{item.label}</span>
                                </Link>
                            );
                        })}
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
