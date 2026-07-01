"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/lib/auth-context";
import {
    FileText,
    Activity,
    CheckCircle2,
    ListTodo,
    RefreshCcw,
    ShieldAlert,
    CalendarDays,
    Download,
    Eye
} from "lucide-react";

interface Resource {
    id: string;
    name: string;
}

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

export default function MaintenanceReportsPage() {
    const { user } = useAuth();
    const [resources, setResources] = useState<Resource[]>([]);
    const [tickets, setTickets] = useState<MaintenanceTicket[]>([]);
    const [loading, setLoading] = useState(true);
    const [exporting, setExporting] = useState<string | null>(null);

    // Filter states
    const [statusFilter, setStatusFilter] = useState("All");
    const [priorityFilter, setPriorityFilter] = useState("All");
    const [resourceFilter, setResourceFilter] = useState("All");

    const getToken = useCallback(async () => {
        if (user && typeof user.getIdToken === "function") return user.getIdToken();
        return "dev-token";
    }, [user]);

    // Fetch resources for filter dropdown
    const fetchResources = async () => {
        try {
            const { data, error } = await supabase
                .from("resources")
                .select("id, name")
                .order("name");
            if (error) throw error;
            setResources((data || []).map(r => ({ id: r.id, name: r.name || `Resource #${r.id.slice(0, 8)}` })));
        } catch (e) {
            console.error("Failed to fetch resources:", e);
        }
    };

    // Fetch tickets matching filters
    const fetchTickets = useCallback(async () => {
        setLoading(true);
        try {
            const token = await getToken();
            
            // Build query params
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

    useEffect(() => {
        fetchResources();
    }, []);

    useEffect(() => {
        fetchTickets();
    }, [fetchTickets]);

    // Export PDF or Excel
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
                if (res.status === 404) {
                    alert("No data available for export with current filters.");
                } else {
                    throw new Error("Export failed");
                }
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

    // Calculate metrics of filtered dataset
    const metrics = useMemo(() => {
        const total = tickets.length;
        const pending = tickets.filter(t => t.status === "OPEN").length;
        const inProgress = tickets.filter(t => t.status === "IN_PROGRESS").length;
        const completed = tickets.filter(t => t.status === "COMPLETED").length;
        return { total, pending, inProgress, completed };
    }, [tickets]);

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="relative overflow-hidden rounded-3xl bg-card border border-slate-200 dark:border-border p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <FileText className="w-64 h-64 rotate-6 text-brand-primary" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-brand-primary/10 rounded-full text-sm font-semibold text-brand-primary mb-4 border border-brand-primary/20">
                                <Activity className="w-4 h-4" /> Reporting Engine
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                                Activity <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-500">Reports</span>
                            </h1>
                            <p className="text-slate-600 dark:text-foreground/50 text-lg font-medium max-w-xl">
                                Filter maintenance records, review status logs, and export high-fidelity PDF/Excel documents.
                            </p>
                        </div>
                        <div className="flex gap-3">
                            <button
                                onClick={() => handleExport("pdf")}
                                disabled={exporting !== null || tickets.length === 0}
                                className="bg-brand-primary hover:opacity-90 disabled:opacity-50 px-6 py-3 rounded-xl text-white font-bold transition-all shadow-lg flex items-center gap-2"
                            >
                                <Download className="w-5 h-5" /> {exporting === "pdf" ? "Exporting PDF..." : "Export PDF"}
                            </button>
                            <button
                                onClick={() => handleExport("excel")}
                                disabled={exporting !== null || tickets.length === 0}
                                className="bg-emerald-500 hover:opacity-90 disabled:opacity-50 px-6 py-3 rounded-xl text-white font-bold transition-all shadow-lg flex items-center gap-2"
                            >
                                <Download className="w-5 h-5" /> {exporting === "excel" ? "Exporting Excel..." : "Export Excel"}
                            </button>
                        </div>
                    </div>
                </div>

                {/* Filters */}
                <div className="bg-card border border-slate-200 dark:border-border rounded-3xl p-6 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-grow mr-0 md:mr-8">
                        {/* Status */}
                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest mb-2">Status</label>
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                                <option value="All">All Statuses</option>
                                <option value="OPEN">Pending (Open)</option>
                                <option value="IN_PROGRESS">In Progress</option>
                                <option value="COMPLETED">Completed</option>
                            </select>
                        </div>
                        {/* Priority */}
                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest mb-2">Priority</label>
                            <select
                                value={priorityFilter}
                                onChange={e => setPriorityFilter(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                                <option value="All">All Priorities</option>
                                <option value="Low">Low</option>
                                <option value="Medium">Medium</option>
                                <option value="High">High</option>
                            </select>
                        </div>
                        {/* Resource */}
                        <div>
                            <label className="block text-xs font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest mb-2">Resource</label>
                            <select
                                value={resourceFilter}
                                onChange={e => setResourceFilter(e.target.value)}
                                className="w-full px-4 py-2.5 bg-slate-100 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                            >
                                <option value="All">All Resources</option>
                                {resources.map(r => (
                                    <option key={r.id} value={r.id}>{r.name}</option>
                                ))}
                            </select>
                        </div>
                    </div>
                    <button
                        onClick={fetchTickets}
                        title="Reload Data"
                        className="p-3 bg-slate-100 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl hover:bg-slate-200 transition-colors self-end md:self-auto"
                    >
                        <RefreshCcw className="w-5 h-5 text-slate-500" />
                    </button>
                </div>

                {/* Stats Summary cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { title: "Matched Records", value: metrics.total, icon: ListTodo, color: "blue" },
                        { title: "Pending", value: metrics.pending, icon: ShieldAlert, color: "amber" },
                        { title: "In Progress", value: metrics.inProgress, icon: Activity, color: "indigo" },
                        { title: "Completed", value: metrics.completed, icon: CheckCircle2, color: "emerald" },
                    ].map((m, idx) => (
                        <div key={idx} className="bg-card rounded-3xl p-6 shadow-xl border border-slate-200 dark:border-border flex items-center justify-between">
                            <div>
                                <p className="text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest mb-1">{m.title}</p>
                                <p className="text-4xl font-black text-foreground">{loading ? "—" : m.value}</p>
                            </div>
                            <div className={`p-3 rounded-2xl bg-${m.color}-500/10 text-${m.color}-500`}>
                                <m.icon className="w-6 h-6" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Preview Table */}
                <div className="bg-card rounded-3xl shadow-xl border border-slate-200 dark:border-border overflow-hidden">
                    <div className="p-6 md:p-8 border-b border-slate-200 dark:border-border flex items-center justify-between">
                        <h2 className="text-2xl font-black text-foreground flex items-center gap-2">
                            <Eye className="w-6 h-6 text-brand-primary" /> Report Preview
                        </h2>
                        <span className="text-xs font-black text-slate-400 dark:text-foreground/35 uppercase tracking-wider bg-slate-100 dark:bg-foreground/5 px-3.5 py-1.5 rounded-full border border-slate-200 dark:border-border">
                            {tickets.length} tickets matched
                        </span>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-foreground/[0.02] border-b border-slate-200 dark:border-border">
                                    {["ID / Ticket", "Issue & Details", "Requested", "Status", "Priority", "Outcome"].map(h => (
                                        <th key={h} className="px-6 py-4 font-black text-slate-505 dark:text-foreground/40 text-[10px] uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {loading ? (
                                    Array.from({ length: 4 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 6 }).map((_, j) => (
                                                <td key={j} className="px-6 py-5"><div className="h-4 bg-slate-200 dark:bg-foreground/10 rounded animate-pulse w-20" /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : tickets.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-16 text-center">
                                            <div className="inline-flex flex-col items-center gap-3">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-foreground/5 flex items-center justify-center"><FileText className="w-7 h-7 text-slate-400" /></div>
                                                <p className="font-black text-foreground">No records found</p>
                                                <p className="text-sm text-slate-500 dark:text-foreground/40 font-bold">No tasks match the active filters.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    tickets.map(ticket => {
                                        const dateStr = ticket.created_at ? new Date(ticket.created_at).toLocaleDateString() : 'N/A';
                                        
                                        // Status styling
                                        let statusBadge = "bg-slate-100 text-slate-700 border-slate-200";
                                        if (ticket.status === "COMPLETED") statusBadge = "bg-emerald-50 text-emerald-700 border-emerald-250";
                                        else if (ticket.status === "IN_PROGRESS") statusBadge = "bg-blue-50 text-blue-700 border-blue-250";

                                        // Priority styling
                                        let priorityBadge = "text-slate-600 bg-slate-100 border-slate-200";
                                        if (ticket.priority === "High") priorityBadge = "text-red-700 bg-red-50 border-red-250";
                                        else if (ticket.priority === "Medium") priorityBadge = "text-amber-700 bg-amber-50 border-amber-250";

                                        return (
                                            <tr key={ticket.id} className="hover:bg-foreground/[0.01] transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="font-black text-foreground text-sm">REQ-{ticket.id.slice(0, 8).toUpperCase()}</div>
                                                    <div className="text-[10px] font-bold text-slate-450 dark:text-foreground/30 uppercase tracking-widest mt-0.5">Resource: {ticket.resourceName || `#${ticket.resourceId.slice(0, 8)}`}</div>
                                                </td>
                                                <td className="px-6 py-5 max-w-sm">
                                                    <p className="font-bold text-slate-800 dark:text-foreground/80 text-sm line-clamp-1">{ticket.title}</p>
                                                    <p className="text-xs text-slate-400 dark:text-foreground/35 mt-0.5 line-clamp-1">{ticket.description}</p>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-foreground/60 font-bold">
                                                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> {dateStr}
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-bold border ${statusBadge}`}>
                                                        {STATUS_DISPLAY[ticket.status] || ticket.status}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex px-2.5 py-1 rounded-lg text-xs font-bold border ${priorityBadge}`}>
                                                        {ticket.priority}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 font-bold text-slate-700 dark:text-foreground/75 text-xs">
                                                    {ticket.status === "COMPLETED" ? (ticket.outcome || "Fixed") : "—"}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>

            </div>
        </div>
    );
}
