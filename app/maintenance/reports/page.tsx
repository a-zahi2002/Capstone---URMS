"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";
import {
    FileText,
    Activity,
    CheckCircle2,
    ListTodo,
    RefreshCcw,
    ShieldAlert,
    CalendarDays,
    Download,
    Eye,
    Loader2,
    Filter
} from "lucide-react";

/* ─── URMS Light Blue Design System ───────────────────────
   primary     : #0EA5E9  teal : #0D9488
   ink-main    : #0F172A  muted: #64748B
   surface     : #FFFFFF  bg   : #F8FAFC
   border      : #E2E8F0
──────────────────────────────────────────────────────────── */

interface Resource { id: string; name: string; }
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
    outcome?: string;
}

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
const STATUS_DISPLAY: Record<string, string> = {
    OPEN: "Pending", IN_PROGRESS: "In Progress", COMPLETED: "Completed"
};

const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.45, ease: "easeOut" as const } },
};
const stagger = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
};
const cardVariant = {
    hidden: { opacity: 0, y: 16 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export default function MaintenanceReportsPage() {
    const { user } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);

    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [resourceFilter, setResourceFilter] = useState("All");

    const getToken = useCallback(async () => {
        if (user && typeof user.getIdToken === "function") return user.getIdToken();
        return "dev-token";
    }, [user]);

    const fetchResources = async () => {
        try {
            const { data, error } = await supabase.from("resources").select("id, name").order("name");
            if (error) throw error;
            setResources((data || []).map(r => ({ id: r.id, name: r.name || `Resource #${r.id.slice(0, 8)}` })));
        } catch (e) { console.error("Failed to fetch resources:", e); }
    };

    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            const params = new URLSearchParams();
            if (statusFilter !== "All") params.append("status", statusFilter);
            if (priorityFilter !== "All") params.append("priority", priorityFilter);
            if (resourceFilter !== "All") params.append("resourceId", resourceFilter);

            const res = await fetch(`${API}/api/maintenance-tickets?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) throw new Error(`Server error: ${res.status}`);
            const resJson = await res.json();
            const data: MaintenanceTicket[] = Array.isArray(resJson) ? resJson : (resJson.data || []);
            setTickets(data);
        } catch (e) {
            console.error("Failed to fetch filtered tickets:", e);
            setTickets([]);
        } finally {
            setLoading(false);
        }
    }, [getToken, statusFilter, priorityFilter, resourceFilter]);

    useEffect(() => { fetchResources(); }, []);
    useEffect(() => { fetchTickets(); }, [fetchTickets]);

    const handleExport = async (format: "pdf" | "excel") => {
        setExporting(format);
        try {
            const token = await getToken();
            const endpoint = format === "pdf" ? "report/pdf" : "report/excel";
            const params = new URLSearchParams();
            if (statusFilter !== "All") params.append("status", statusFilter);
            if (priorityFilter !== "All") params.append("priority", priorityFilter);
            if (resourceFilter !== "All") params.append("resourceId", resourceFilter);

            const res = await fetch(`${API}/api/maintenance-tickets/${endpoint}?${params.toString()}`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            if (!res.ok) {
                if (res.status === 404) alert("No data available for export with current filters.");
                else throw new Error("Export failed");
                return;
            }
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = `maintenance-activity-report-${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "pdf" : "xlsx"}`;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            a.remove();
        } catch (e) {
            console.error("Report export failed:", e);
            alert("Export failed. Please try again.");
        } finally {
            setExporting(null);
        }
    };

    const metrics = useMemo(() => ({
        total: tickets.length,
        pending: tickets.filter(t => t.status === "OPEN").length,
        inProgress: tickets.filter(t => t.status === "IN_PROGRESS").length,
        completed: tickets.filter(t => t.status === "COMPLETED").length,
    }), [tickets]);

    const statCards = [
        { title: "Matched Records", value: metrics.total,     icon: ListTodo,    bg: "#F0F9FF", fg: "#0EA5E9" },
        { title: "Pending",         value: metrics.pending,   icon: ShieldAlert, bg: "#FFFBEB", fg: "#D97706" },
        { title: "In Progress",     value: metrics.inProgress,icon: Activity,    bg: "#EFF6FF", fg: "#3B82F6" },
        { title: "Completed",       value: metrics.completed, icon: CheckCircle2,bg: "#CCFBF1", fg: "#0D9488" },
    ];

    return (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-4 md:p-8">
            <div className="max-w-7xl mx-auto space-y-6">

                {/* ── Hero Banner ── */}
                <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] p-6 md:p-8 text-white shadow-lg shadow-sky-500/20">
                    <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
                    <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
                    <div className="absolute top-4 right-32 w-20 h-20 rounded-full bg-[#0D9488]/20 pointer-events-none" />

                    <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
                        <div>
                            <div className="flex items-center gap-2 mb-2">
                                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider">
                                    <Activity className="w-3 h-3" /> Reporting Engine
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Maintenance Activity Reports</h1>
                            <p className="mt-1.5 text-sky-100 text-sm font-medium max-w-xl">
                                Filter maintenance records, review status logs, and export high-fidelity PDF/Excel documents.
                            </p>
                        </div>
                        <div className="flex gap-3 shrink-0">
                            <button
                                onClick={() => handleExport("pdf")}
                                disabled={exporting !== null || tickets.length === 0}
                                className="bg-white text-[#0284C7] hover:bg-sky-50 disabled:opacity-50 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm"
                            >
                                <Download className="w-4 h-4" />
                                {exporting === "pdf" ? "Exporting…" : "Export PDF"}
                            </button>
                            <button
                                onClick={() => handleExport("excel")}
                                disabled={exporting !== null || tickets.length === 0}
                                className="bg-white/15 hover:bg-white/25 backdrop-blur-sm disabled:opacity-50 px-5 py-2.5 rounded-xl text-white font-semibold text-sm border border-white/20 flex items-center gap-2 transition-colors"
                            >
                                <Download className="w-4 h-4" />
                                {exporting === "excel" ? "Exporting…" : "Export Excel"}
                            </button>
                        </div>
                    </div>
                </motion.div>

                {/* ── Filters ── */}
                <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-sm p-5">
                    <div className="flex items-center gap-2 mb-4">
                        <Filter className="w-4 h-4 text-[#0EA5E9]" />
                        <h2 className="text-sm font-bold text-[#0F172A] dark:text-white">Filter Reports</h2>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <div>
                            <label className="block text-[11px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5">Status</label>
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="w-full px-3 py-2.5 bg-[#F8FAFC] dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 rounded-xl text-sm font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 transition-all">
                                <option value="All">All Statuses</option>
                                <option value="OPEN">Pending (Open)</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                            <select value={priorityFilter} onChange={e => setPriorityFilter(e.target.value)}
                                className="w-full px-3 py-2.5 bg-[#F8FAFC] dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 rounded-xl text-sm font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 transition-all">
                                <option value="All">All Priorities</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-[11px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5">Resource</label>
                            <select value={resourceFilter} onChange={e => setResourceFilter(e.target.value)}
                                className="w-full px-3 py-2.5 bg-[#F8FAFC] dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 rounded-xl text-sm font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 transition-all">
                                <option value="All">All Resources</option>
                                {resources.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                            </select>
                        </div>
                    </div>
                    <div className="flex justify-end mt-4">
                        <button onClick={fetchTickets}
                            className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-[#F0F9FF] dark:bg-sky-500/10 border border-[#E0F2FE] dark:border-sky-500/20 text-[#0EA5E9] font-semibold text-sm hover:bg-[#E0F2FE] dark:hover:bg-sky-500/20 transition-colors">
                            <RefreshCcw className="w-3.5 h-3.5" /> Reload Data
                        </button>
                    </div>
                </motion.div>

                {/* ── Stat Cards ── */}
                <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {statCards.map(({ title, value, icon: Icon, bg, fg }) => (
                        <motion.div key={title} variants={cardVariant}
                            className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-[#E2E8F0] dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
                            <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ backgroundColor: bg }}>
                                <Icon className="w-5 h-5" style={{ color: fg }} />
                            </div>
                            <p className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider">{title}</p>
                            <p className="text-3xl font-bold text-[#0F172A] dark:text-white mt-1">
                                {loading ? <Loader2 className="w-6 h-6 animate-spin opacity-30" /> : value}
                            </p>
                        </motion.div>
                    ))}
                </motion.div>

                {/* ── Preview Table ── */}
                <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-sm overflow-hidden">
                    <div className="px-6 py-5 border-b border-[#E2E8F0] dark:border-slate-700 flex items-center justify-between">
                        <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <Eye className="w-4 h-4 text-[#0EA5E9]" /> Report Preview
                        </h2>
                        <span className="text-[11px] font-semibold text-[#64748B] dark:text-slate-400 bg-[#F8FAFC] dark:bg-slate-700 px-3 py-1 rounded-full border border-[#E2E8F0] dark:border-slate-600">
                            {tickets.length} tickets matched
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#F8FAFC] dark:bg-slate-800/50 border-b border-[#E2E8F0] dark:border-slate-700">
                                    {["ID / Ticket", "Issue & Details", "Requested", "Status", "Priority", "Outcome"].map(h => (
                                        <th key={h} className="px-6 py-3.5 font-semibold text-[#64748B] dark:text-slate-400 text-[11px] uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 6 }).map((_, j) => (
                                                <td key={j} className="px-6 py-4">
                                                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse w-20" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="inline-flex flex-col items-center gap-3">
                                                <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] flex items-center justify-center">
                                                    <FileText className="w-7 h-7 text-[#0EA5E9]" />
                                                </div>
                                                <p className="font-semibold text-[#0F172A] dark:text-white">No records found</p>
                                                <p className="text-sm text-[#64748B] dark:text-slate-400">No tasks match the active filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map(ticket => {
                                        const dateStr = ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : "N/A";

                                        const statusClass =
                                            ticket.status === "COMPLETED" ? "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20" :
                                            ticket.status === "IN_PROGRESS" ? "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20" :
                                            "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20";

                                        const priorityClass =
                                            ticket.priority === "High" ? "text-rose-700 bg-rose-50 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20" :
                                            ticket.priority === "Medium" ? "text-amber-700 bg-amber-50 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20" :
                                            "text-slate-600 bg-slate-50 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20";

                                        return (
                                            <tr key={ticket.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-700/30 transition-colors">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-[#0F172A] dark:text-white text-sm">REQ-{ticket.id.slice(0, 8).toUpperCase()}</div>
                                                    <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">Resource: {ticket.resourceName || `#${ticket.resourceId.slice(0, 8)}`}</div>
                                                </td>
                                                <td className="px-6 py-4 max-w-sm">
                                                    <p className="font-semibold text-[#0F172A] dark:text-white text-sm line-clamp-1">{ticket.title}</p>
                                                    <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 line-clamp-1">{ticket.description}</p>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] dark:text-slate-400">
                                                        <CalendarDays className="w-3.5 h-3.5" /> {dateStr}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusClass}`}>
                                                        {STATUS_DISPLAY[ticket.status] || ticket.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${priorityClass}`}>
                                                        {ticket.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4 text-sm font-semibold text-[#64748B] dark:text-slate-400">
                                                    {ticket.status === "COMPLETED" ? (
                                                        <span className="text-teal-600 dark:text-teal-400">{ticket.outcome || "Fixed"}</span>
                                                    ) : "—"}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
}
