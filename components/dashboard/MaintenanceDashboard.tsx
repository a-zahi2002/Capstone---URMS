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
    Star,
    ArrowRight
} from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const fadeInUp = {
    hidden: { opacity: 0, y: 24 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" as const } },
};
const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
};
const cardVariant = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
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
    const [completingTask, setCompletingTask] = useState<Task | null>(null);
    const [outcome, setOutcome] = useState<"Fixed" | "Faulty" | "Decommissioned">("Fixed");
    const [greeting, setGreeting] = useState("Hello");

    useEffect(() => {
        const h = new Date().getHours();
        if (h < 12) setGreeting("Good morning");
        else if (h < 17) setGreeting("Good afternoon");
        else setGreeting("Good evening");
    }, []);

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
            const resJson = await res.json();
            const data: MaintenanceTicket[] = Array.isArray(resJson) ? resJson : (resJson.data || []);

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

    const updateStatus = async (ticketId: string, status: string, outcomeVal?: string) => {
        try {
            const token = await getToken();
            const body: any = { status };
            if (outcomeVal) body.outcome = outcomeVal;

            const res = await fetch(`${API}/api/maintenance-tickets/${ticketId}/status`, {
                method: "PUT",
                headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
                body: JSON.stringify(body),
            });
            if (!res.ok) throw new Error("Status update failed");
            await fetchTasks();
        } catch {
            alert("Could not update status. Check permissions.");
        }
    };

    const handleAdvanceStatus = async (task: Task) => {
        if (task.rawStatus === "COMPLETED") return;
        const next = NEXT_STATUS[task.rawStatus];
        if (next === "COMPLETED") {
            setCompletingTask(task);
            setOutcome("Fixed");
            return;
        }
        await updateStatus(task.rawId, next);
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
        <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="space-y-6">

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
                                <PenTool className="w-3 h-3" /> Operations Hub
                            </span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-bold tracking-tight">
                            {greeting}, {profile?.name?.split(" ")[0] || "Technician"} 👋
                        </h1>
                        <p className="mt-1.5 text-sky-100 text-sm font-medium">
                            {new Date().toLocaleDateString("en-US", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
                        </p>
                        {stats.highPriority > 0 ? (
                            <p className="mt-2 text-sky-200 text-sm">
                                You have <span className="text-white font-bold">{stats.highPriority} high priority ticket{stats.highPriority !== 1 ? "s" : ""}</span> to attend to.
                            </p>
                        ) : (
                            <p className="mt-2 text-sky-200 text-sm font-medium">
                                All systems are running smoothly.
                            </p>
                        )}
                    </div>

                    <button
                        onClick={fetchTasks}
                        className="bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-xl p-3 border border-white/20 flex items-center justify-center transition-colors shadow-sm"
                        title="Refresh Tasks"
                    >
                        <RefreshCcw className="w-5 h-5 text-white" />
                    </button>
                </div>
            </motion.div>

            {/* ── Stat Cards ── */}
            <motion.div variants={staggerContainer} className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: "Total Tickets", value: stats.total, icon: ListTodo, bg: "#F0F9FF", fg: "#0EA5E9" },
                    { label: "Open", value: stats.open, icon: AlertCircle, bg: "#FFF1F2", fg: "#E11D48" },
                    { label: "In Progress", value: stats.inProgress, icon: Activity, bg: "#FFFBEB", fg: "#D97706" },
                    { label: "Completed", value: stats.completed, icon: CheckCircle2, bg: "#CCFBF1", fg: "#0D9488" },
                    { label: "High Priority", value: stats.highPriority, icon: AlertCircle, bg: "#FFF1F2", fg: "#E11D48" },
                ].map(({ label, value, icon: Icon, bg, fg }) => (
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

            {/* ── Main Grid ── */}
            <motion.div variants={fadeInUp} className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Critical Tasks */}
                <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] dark:border-slate-700">
                        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <AlertCircle className="w-4 h-4 text-[#E11D48]" /> Critical Tasks
                        </h3>
                        {criticalTasks.length > 0 && (
                            <span className="text-[11px] font-semibold bg-rose-100 text-rose-700 dark:bg-rose-500/10 dark:text-rose-400 px-2.5 py-0.5 rounded-full">
                                {criticalTasks.length} pending
                            </span>
                        )}
                    </div>
                    
                    <div className="p-4 flex-1">
                        {loading ? (
                            <div className="flex items-center justify-center py-8">
                                <Loader2 className="w-5 h-5 animate-spin text-[#0EA5E9]" />
                            </div>
                        ) : criticalTasks.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-8 text-center px-4">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center mb-3">
                                    <CheckCircle2 className="w-7 h-7 text-emerald-500" />
                                </div>
                                <p className="font-semibold text-[#0F172A] dark:text-white">No critical tasks</p>
                                <p className="text-sm text-[#64748B] dark:text-slate-400 mt-1">All high-priority issues resolved</p>
                            </div>
                        ) : (
                            <div className="space-y-3">
                                {criticalTasks.slice(0, 4).map(task => (
                                    <div key={task.rawId} className="bg-rose-50/50 dark:bg-rose-500/5 p-4 rounded-xl border border-rose-100 dark:border-rose-500/15 flex justify-between items-center gap-3 hover:bg-rose-50 dark:hover:bg-rose-500/10 transition-colors">
                                        <div className="min-w-0">
                                            <p className="font-semibold text-[#0F172A] dark:text-white text-sm truncate">{task.title}</p>
                                            <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-1">{task.resourceName}</p>
                                        </div>
                                        <button
                                            onClick={() => handleAdvanceStatus(task)}
                                            className="shrink-0 flex items-center gap-1 text-[11px] font-semibold text-[#0EA5E9] bg-sky-50 hover:bg-sky-100 dark:bg-sky-500/10 dark:hover:bg-sky-500/20 px-3 py-1.5 rounded-lg transition-colors"
                                        >
                                            {task.rawStatus === "OPEN" ? "Start" : "Complete"} <ChevronRight className="w-3 h-3" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>

                {/* Routine Maintenance Schedule */}
                <div className="bg-white dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-sm overflow-hidden flex flex-col">
                    <div className="px-6 py-4 border-b border-[#E2E8F0] dark:border-slate-700">
                        <h3 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <CalendarDays className="w-4 h-4 text-[#0EA5E9]" /> Routine Maintenance
                        </h3>
                    </div>
                    <div className="p-4 flex-1">
                        <div className="space-y-3">
                            {routineMaintenance.map((item, idx) => (
                                <div key={idx} className="flex items-center justify-between p-4 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-slate-50/50 dark:bg-white/[0.02] gap-3">
                                    <div className="flex items-center gap-3 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] dark:bg-sky-500/10 flex items-center justify-center shrink-0">
                                            <Wrench className="w-4.5 h-4.5 text-[#0EA5E9]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="font-semibold text-[#0F172A] dark:text-white text-sm truncate">{item.title}</p>
                                            <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">{item.location}</p>
                                        </div>
                                    </div>
                                    <div className="text-right shrink-0">
                                        <p className="text-sm font-semibold text-[#0F172A] dark:text-white">{item.due}</p>
                                        <p className="text-[11px] font-semibold text-[#0EA5E9] mt-0.5">{item.status}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ── Active Ticket Queue ── */}
            <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-sm overflow-hidden">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 px-6 py-5 border-b border-[#E2E8F0] dark:border-slate-700">
                    <h3 className="text-sm font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                        <ListTodo className="w-4 h-4 text-[#0EA5E9]" /> Active Ticket Queue
                    </h3>
                    <div className="relative">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="Search tickets..."
                            className="pl-9 pr-4 py-2 bg-slate-50 dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg text-sm text-[#0F172A] dark:text-white placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 w-full sm:w-64 transition-all"
                        />
                    </div>
                </div>
                <div className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                    {loading ? (
                        <div className="flex items-center justify-center py-12 text-[#64748B]">
                            <Loader2 className="w-5 h-5 animate-spin text-[#0EA5E9]" />
                            <span className="ml-2 text-sm font-medium">Loading tickets...</span>
                        </div>
                    ) : activeTasks.length === 0 ? (
                        <div className="text-center py-12 px-4">
                            <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] flex items-center justify-center mx-auto mb-3">
                                <Wrench className="w-7 h-7 text-[#0EA5E9]" />
                            </div>
                            <p className="font-semibold text-[#0F172A] dark:text-white">No active tickets</p>
                            <p className="text-sm text-[#64748B] mt-1">All maintenance tasks are completed.</p>
                        </div>
                    ) : (
                        activeTasks.map(task => {
                            const priorityColors: Record<string, string> = {
                                High: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/20",
                                Medium: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/20",
                                Low: "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20",
                            };
                            const statusColors: Record<string, string> = {
                                "Pending": "bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20",
                                "In Progress": "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-400 dark:border-sky-500/20",
                            };
                            return (
                                <div key={task.rawId} className="flex flex-col sm:flex-row sm:items-center justify-between px-6 py-4 hover:bg-[#F8FAFC] dark:hover:bg-slate-700/30 transition-colors gap-4">
                                    <div className="flex items-center gap-4 min-w-0">
                                        <div className="w-10 h-10 rounded-xl bg-[#F0F9FF] dark:bg-sky-500/10 flex items-center justify-center shrink-0">
                                            <Wrench className="w-5 h-5 text-[#0EA5E9]" />
                                        </div>
                                        <div className="min-w-0">
                                            <p className="text-sm font-semibold text-[#0F172A] dark:text-white truncate">{task.title}</p>
                                            <div className="flex items-center gap-2 mt-0.5">
                                                <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">
                                                    {task.resourceName}
                                                </p>
                                                <span className="text-[#E2E8F0] dark:text-slate-600">·</span>
                                                <p className="text-[11px] text-[#64748B] dark:text-slate-400 flex items-center gap-1">
                                                    <Clock className="w-3 h-3" /> {task.requestedDate}
                                                </p>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-2 shrink-0">
                                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${priorityColors[task.priority]}`}>
                                            {task.priority}
                                        </span>
                                        <span className={`text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${statusColors[task.status]}`}>
                                            {task.status}
                                        </span>
                                        <button
                                            onClick={() => handleAdvanceStatus(task)}
                                            className="flex items-center gap-1 text-[11px] font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] px-3 py-1.5 rounded-lg transition-colors ml-2 shadow-sm shadow-sky-500/20"
                                        >
                                            {task.rawStatus === "OPEN" ? "Start" : "Complete"}
                                        </button>
                                    </div>
                                </div>
                            );
                        })
                    )}
                </div>
            </motion.div>

            {/* Outcome Selection Modal */}
            {completingTask && (
                <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                    <motion.div 
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-white dark:bg-slate-800 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 shadow-xl w-full max-w-md overflow-hidden text-left"
                    >
                        <div className="p-6 border-b border-[#E2E8F0] dark:border-slate-700">
                            <h3 className="text-lg font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                                <CheckCircle2 className="w-5 h-5 text-[#0EA5E9]" />
                                Complete Maintenance
                            </h3>
                            <p className="text-[#64748B] text-sm mt-1">Specify resolution to update resource status</p>
                        </div>
                        <div className="p-6 space-y-4">
                            <div className="space-y-3">
                                {[
                                    { value: "Fixed", label: "Fixed (Available)", desc: "Set resource availability status to 'Available'" },
                                    { value: "Faulty", label: "Faulty (Under Maintenance)", desc: "Keep resource status as 'Under Maintenance'" },
                                    { value: "Decommissioned", label: "Decommissioned (Inactive)", desc: "Set resource status to 'Inactive' (retired)" }
                                ].map(opt => (
                                    <label key={opt.value} className={`flex items-start gap-3 p-4 rounded-xl border cursor-pointer transition-all ${
                                        outcome === opt.value 
                                            ? "border-[#0EA5E9] bg-[#F0F9FF] dark:bg-sky-500/10 dark:border-sky-500/50 text-[#0F172A] dark:text-white" 
                                            : "border-[#E2E8F0] dark:border-slate-700 text-[#0F172A] dark:text-white hover:bg-slate-50 dark:hover:bg-slate-700/50"
                                    }`}>
                                        <input 
                                            type="radio" 
                                            name="outcome" 
                                            value={opt.value} 
                                            checked={outcome === opt.value} 
                                            onChange={() => setOutcome(opt.value as any)}
                                            className="mt-1 accent-[#0EA5E9]"
                                        />
                                        <div>
                                            <div className="font-semibold text-sm">{opt.label}</div>
                                            <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">{opt.desc}</div>
                                        </div>
                                    </label>
                                ))}
                            </div>
                            <div className="flex gap-3 pt-4">
                                <button 
                                    type="button" 
                                    onClick={() => setCompletingTask(null)}
                                    className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 text-[#0F172A] dark:text-white font-semibold text-sm hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                                >
                                    Cancel
                                </button>
                                <button 
                                    type="button" 
                                    onClick={async () => {
                                        await updateStatus(completingTask.rawId, "COMPLETED", outcome);
                                        setCompletingTask(null);
                                    }}
                                    className="flex-1 px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-sm transition-colors flex items-center justify-center gap-2 shadow-sm shadow-sky-500/20"
                                >
                                    Confirm
                                </button>
                            </div>
                        </div>
                    </motion.div>
                </div>
            )}
        </motion.div>
    );
}
