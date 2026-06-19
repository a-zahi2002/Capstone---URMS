"use client";

import React, { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import {
    AlertCircle,
    CheckCircle2,
    Clock,
    Wrench,
    PenTool,
    ChevronRight,
    CalendarDays,
    Activity,
    Loader2,
    ListTodo,
    RefreshCcw,
    Search,
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

interface MaintenanceTicket {
    id: string;
    resourceId: string;
    resourceName?: string;
    title: string;
    description: string;
    status: "OPEN" | "IN_PROGRESS" | "COMPLETED";
    priority: "High" | "Medium" | "Low";
    createdBy: string;
    assignedTo?: string;
    created_at: string;
    completed_at?: string;
}

interface Task {
    id: string;
    rawId: string;
    resourceName: string;
    title: string;
    description: string;
    requestedDate: string;
    status: "Pending" | "In Progress" | "Completed";
    rawStatus: "OPEN" | "IN_PROGRESS" | "COMPLETED";
    priority: "High" | "Medium" | "Low";
    assignedTo?: string;
}

const STATUS_DISPLAY: Record<string, string> = {
    OPEN: "Pending", IN_PROGRESS: "In Progress", COMPLETED: "Completed"
};
const NEXT_STATUS: Record<string, "IN_PROGRESS" | "COMPLETED"> = {
    OPEN: "IN_PROGRESS", IN_PROGRESS: "COMPLETED"
};

export default function MaintenanceDashboard() {
    const { profile, user } = useAuth();
    const [tasks, setTasks] = useState<Task[]>([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState("");

    const getToken = useCallback(async () => {
        if (user && typeof user.getIdToken === "function") return user.getIdToken();
        return "dev-token";
    }, [user]);

    const fetchTasks = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const res = await fetch(`${API}/api/maintenance-tickets`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const data: MaintenanceTicket[] = await res.json();
            if (!Array.isArray(data)) throw new Error("Invalid response");

            setTasks(data.map(t => ({
                id: `REQ-${String(t.id).slice(0, 8).toUpperCase()}`,
                rawId: t.id,
                resourceName: t.resourceName || `Resource #${String(t.resourceId).slice(0, 8)}`,
                title: t.title,
                description: t.description || t.title,
                requestedDate: t.created_at ? new Date(t.created_at).toLocaleDateString() : "N/A",
                status: (STATUS_DISPLAY[t.status] || "Pending") as Task["status"],
                rawStatus: t.status,
                priority: t.priority,
                assignedTo: t.assignedTo,
            })));
        } catch (e) {
            console.error("Failed to fetch maintenance tasks:", e);
        } finally {
            setLoading(false);
        }
    }, [getToken]);

    useEffect(() => { fetchTasks(); }, [fetchTasks]);

    const handleAdvanceStatus = async (task: Task) => {
        if (task.rawStatus === "COMPLETED") return;
        const next = NEXT_STATUS[task.rawStatus];
        try {
            const token = await getToken();
            const res = await fetch(`${API}/api/maintenance-tickets/${task.rawId}/status`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify({ status: next }),
            });
            if (!res.ok) throw new Error("Status update failed");
            await fetchTasks();
        } catch {
            alert("Could not update status. Check permissions.");
        }
    };

    const stats = useMemo(() => ({
        total: tasks.length,
        open: tasks.filter(t => t.rawStatus === "OPEN").length,
        inProgress: tasks.filter(t => t.rawStatus === "IN_PROGRESS").length,
        completed: tasks.filter(t => t.rawStatus === "COMPLETED").length,
        highPriority: tasks.filter(t => t.priority === "High" && t.rawStatus !== "COMPLETED").length,
    }), [tasks]);

    const criticalTasks = useMemo(() => tasks.filter(t => t.priority === "High" && t.rawStatus !== "COMPLETED"), [tasks]);
    const activeTasks = useMemo(() => {
        let list = tasks.filter(t => t.rawStatus !== "COMPLETED");
        if (search.trim()) {
            const q = search.toLowerCase();
            list = list.filter(t =>
                t.title.toLowerCase().includes(q) ||
                t.resourceName.toLowerCase().includes(q) ||
                t.description.toLowerCase().includes(q)
            );
        }
        return list;
    }, [tasks, search]);

    const routineMaintenance = [
        { title: "HVAC Filter Check", location: "Engineering Block", due: "Tomorrow", status: "Scheduled" },
        { title: "Lab Equipment Calibration", location: "Chemistry Lab 2", due: "Oct 15", status: "Scheduled" },
        { title: "Fire Alarm Testing", location: "All Buildings", due: "Oct 20", status: "Upcoming" },
    ];

    return (
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-8">
            {/* ── Header ── */}
            <motion.header
                variants={fadeInUp}
                className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4"
            >
                <div>
                    <h1 className="text-3xl font-black text-foreground tracking-tight flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center">
                            <PenTool className="w-5 h-5 text-amber-500" />
                        </div>
                        Operations Hub
                    </h1>
                    <p className="text-slate-600 dark:text-foreground/50 mt-2 font-medium">
                        Welcome, {profile?.name || "Technician"}. {stats.highPriority > 0
                            ? <span className="text-amber-600 dark:text-amber-400 font-bold">{stats.highPriority} high priority ticket{stats.highPriority !== 1 ? "s" : ""} need attention.</span>
                            : <span className="text-emerald-600 dark:text-emerald-400 font-bold">All systems running smoothly.</span>
                        }
                    </p>
                </div>
                <button
                    onClick={fetchTasks}
                    className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 font-bold text-sm hover:bg-amber-500/20 transition-colors"
                >
                    <RefreshCcw className="w-4 h-4" /> Refresh
                </button>
            </motion.header>

            {/* ── Stat Cards ── */}
            <motion.div variants={fadeInUp} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: "Total Tickets", value: stats.total, icon: ListTodo, color: "blue" },
                    { label: "Open", value: stats.open, icon: AlertCircle, color: "red" },
                    { label: "In Progress", value: stats.inProgress, icon: Activity, color: "amber" },
                    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "emerald" },
                    { label: "High Priority", value: stats.highPriority, icon: AlertCircle, color: "red" },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-card border border-slate-200 dark:border-border rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow">
                        <div className={`w-9 h-9 rounded-xl bg-${color}-500/10 flex items-center justify-center mb-3`}>
                            <Icon className={`w-4 h-4 text-${color}-500`} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest">{label}</p>
                        <p className="text-2xl font-black text-foreground mt-1">{loading ? "—" : value}</p>
                    </div>
                ))}
            </motion.div>

            {/* ── Main Grid ── */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Critical Tasks */}
                <div className="bg-card border border-red-200 dark:border-red-500/20 rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <AlertCircle className="w-5 h-5 text-red-500" />
                        Critical Tasks
                        {criticalTasks.length > 0 && (
                            <span className="ml-auto text-xs font-black bg-red-500/10 text-red-500 px-2 py-0.5 rounded-full border border-red-500/20">
                                {criticalTasks.length}
                            </span>
                        )}
                    </h3>
                    <div className="space-y-3">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                            </div>
                        ) : criticalTasks.length === 0 ? (
                            <div className="text-center py-8">
                                <CheckCircle2 className="w-10 h-10 text-emerald-300 dark:text-emerald-500/30 mx-auto mb-3" />
                                <p className="text-sm text-slate-500 dark:text-foreground/40 font-bold">No critical tasks</p>
                            </div>
                        ) : (
                            criticalTasks.slice(0, 4).map(task => (
                                <div key={task.rawId} className="bg-red-50 dark:bg-red-500/5 p-4 rounded-xl border border-red-200 dark:border-red-500/15 flex justify-between items-center gap-3">
                                    <div className="min-w-0">
                                        <p className="font-bold text-foreground text-sm truncate">{task.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-foreground/40 mt-0.5">{task.resourceName}</p>
                                    </div>
                                    <button
                                        onClick={() => handleAdvanceStatus(task)}
                                        className="shrink-0 flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-amber-600 dark:text-amber-400 hover:bg-amber-500/10 px-2.5 py-1.5 rounded-lg transition-all border border-transparent hover:border-amber-500/20"
                                    >
                                        {task.rawStatus === "OPEN" ? "Start" : "Complete"} <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            ))
                        )}
                    </div>
                </div>

                {/* Routine Maintenance Schedule */}
                <div className="bg-card border border-slate-200 dark:border-border rounded-3xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
                        <CalendarDays className="w-5 h-5 text-amber-500" />
                        Routine Maintenance
                    </h3>
                    <div className="space-y-3">
                        {routineMaintenance.map((item, idx) => (
                            <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-slate-200 dark:border-border bg-slate-50 dark:bg-white/[0.03] gap-3">
                                <div className="flex items-center gap-3 min-w-0">
                                    <div className="w-9 h-9 rounded-lg bg-amber-500/10 flex items-center justify-center shrink-0">
                                        <Wrench className="w-4 h-4 text-amber-500" />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="font-bold text-foreground text-sm truncate">{item.title}</p>
                                        <p className="text-xs text-slate-500 dark:text-foreground/40">{item.location}</p>
                                    </div>
                                </div>
                                <div className="text-right shrink-0">
                                    <p className="text-xs font-bold text-foreground">{item.due}</p>
                                    <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest">{item.status}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </motion.div>

            {/* ── Active Ticket Queue ── */}
            <motion.div variants={fadeInUp} className="bg-card border border-slate-200 dark:border-border rounded-3xl shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-slate-200 dark:border-border">
                    <h3 className="text-lg font-bold text-foreground">Active Ticket Queue</h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search tickets..."
                            className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl text-sm font-bold text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40 w-52"
                        />
                    </div>
                </div>
                <div className="divide-y divide-slate-100 dark:divide-border/50">
                    {loading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
                            <span className="ml-2 text-sm text-slate-400 font-medium">Loading tickets...</span>
                        </div>
                    ) : activeTasks.length === 0 ? (
                        <div className="text-center py-12">
                            <Wrench className="w-10 h-10 text-slate-300 dark:text-foreground/20 mx-auto mb-3" />
                            <p className="text-sm font-bold text-slate-500 dark:text-foreground/40">No active tickets</p>
                            <p className="text-xs text-slate-400 mt-1">All maintenance tasks are completed</p>
                        </div>
                    ) : (
                        activeTasks.map(task => {
                            const priorityColors: Record<string, string> = {
                                High: "bg-red-50 text-red-700 border-red-200 dark:bg-red-500/10 dark:text-red-400 dark:border-red-500/20",
                                Medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
                                Low: "bg-slate-100 text-slate-600 border-slate-200 dark:bg-white/5 dark:text-foreground/50 dark:border-border",
                            };
                            const statusColors: Record<string, string> = {
                                "Pending": "bg-slate-100 text-slate-700 border-slate-200 dark:bg-white/5 dark:text-foreground/50 dark:border-border",
                                "In Progress": "bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/20",
                            };
                            return (
                                <div key={task.rawId} className="flex items-center justify-between px-6 py-4 hover:bg-slate-50/50 dark:hover:bg-white/[0.02] transition-colors gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                                            <Wrench className="w-5 h-5 text-amber-500" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-bold text-foreground truncate">{task.title}</p>
                                            <p className="text-xs text-slate-500 dark:text-foreground/40 mt-0.5">
                                                {task.resourceName} • {task.requestedDate}
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${priorityColors[task.priority]}`}>
                                            {task.priority}
                                        </span>
                                        <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full border ${statusColors[task.status]}`}>
                                            {task.status}
                                        </span>
                                        <button
                                            onClick={() => handleAdvanceStatus(task)}
                                            className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-brand-primary/10 px-2.5 py-1.5 rounded-lg transition-all border border-transparent hover:border-brand-primary/20 ml-1"
                                        >
                                            {task.rawStatus === "OPEN" ? "Start" : "Complete"} <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </motion.div>
        </motion.div>
    );
}
