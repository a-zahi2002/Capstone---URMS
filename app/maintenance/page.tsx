"use client";

import React, { useState, useMemo, useEffect, useCallback, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { motion } from "framer-motion";
import {
  AlertTriangle, CheckCircle2, Clock, ListTodo,
  CalendarDays, Wrench, Activity, ShieldAlert,
  Search, X, Plus, RefreshCcw, ChevronRight, DownloadCloud, Loader2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import Pagination from "@/components/Pagination";
import SavedSearches from "@/components/SavedSearches";
import { exportToCSV } from "@/lib/exportCsv";

/* ─── URMS Light Blue Design System ────────────────────────
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
  outcome?: string;
}

interface MaintenanceTask {
  id: string;
  rawId: string;
  resourceName: string;
  description: string;
  title: string;
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
const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Pending":     "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    "In Progress": "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20",
    "Completed":   "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20",
  };
  const dot: Record<string, string> = {
    "Pending": "bg-amber-400", "In Progress": "bg-sky-500 animate-pulse", "Completed": "bg-teal-500"
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold border ${map[status] || map["Pending"]}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] || "bg-amber-400"}`} />
      {status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    High:   "text-rose-700 bg-rose-50 border border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20",
    Medium: "text-amber-700 bg-amber-50 border border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20",
    Low:    "text-slate-600 bg-slate-50 border border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20",
  };
  return <span className={`inline-flex px-2.5 py-0.5 rounded-full text-[11px] font-semibold ${map[priority] || ""}`}>{priority}</span>;
}

function AdminMaintenanceDashboardContent() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const pathname = usePathname();

  const urlPage = parseInt(searchParams.get("page") || "1", 10);
  const urlPageSize = parseInt(searchParams.get("pageSize") || "10", 10);

  const [filter, setFilter] = useState<"All" | "Pending" | "Completed" | "Overdue">("All");
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({ resourceId: "", title: "", description: "", priority: "Medium" });
  const [completingTask, setCompletingTask] = useState<MaintenanceTask | null>(null);
  const [outcome, setOutcome] = useState<"Fixed" | "Faulty" | "Decommissioned">("Fixed");

  const [currentPage, setCurrentPage] = useState(urlPage);
  const [pageSize, setPageSize] = useState(urlPageSize);

  const updateUrlParams = (newPage: number, newPageSize: number) => {
    const params = new URLSearchParams(searchParams.toString());
    params.set("page", newPage.toString());
    params.set("pageSize", newPageSize.toString());
    router.push(`${pathname}?${params.toString()}`);
  };

  useEffect(() => {
    const pageVal = parseInt(searchParams.get("page") || "1", 10);
    const pageSizeVal = parseInt(searchParams.get("pageSize") || "10", 10);
    setCurrentPage(pageVal);
    setPageSize(pageSizeVal);
  }, [searchParams]);

  const getToken = useCallback(async () => {
    if (user && typeof user.getIdToken === "function") return user.getIdToken();
    return "dev-token";
  }, [user]);

  const fetchTasks = useCallback(async () => {
    setLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/maintenance-tickets`, {
        headers: { Authorization: `Bearer ${token}` }
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
        status: (STATUS_DISPLAY[t.status] || "Pending") as MaintenanceTask["status"],
        rawStatus: t.status,
        priority: t.priority,
        assignedTo: t.assignedTo
      })));
    } catch (e: any) {
      console.error("Failed to fetch maintenance tasks:", e);
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => { fetchTasks(); }, [fetchTasks]);

  const handleExport = async (format: "pdf" | "excel") => {
    try {
      const token = await getToken();
      const endpoint = format === "pdf" ? "report/pdf" : "report/excel";
      const res = await fetch(`${API}/api/maintenance-tickets/${endpoint}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `maintenance-report-${new Date().toISOString().split("T")[0]}.${format === "pdf" ? "pdf" : "xlsx"}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      a.remove();
    } catch (e) {
      alert("Export failed. Please try again.");
    }
  };

  const updateStatus = async (ticketId: string, status: string, outcomeVal?: string) => {
    try {
      const token = await getToken();
      const body: any = { status };
      if (outcomeVal) body.outcome = outcomeVal;

      const res = await fetch(`${API}/api/maintenance-tickets/${ticketId}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      if (!res.ok) throw new Error("Status update failed");
      await fetchTasks();
    } catch (e) {
      alert("Could not update status. Check permissions.");
    }
  };

  const handleAdvanceStatus = async (task: MaintenanceTask) => {
    if (task.rawStatus === "COMPLETED") return;
    const next = NEXT_STATUS[task.rawStatus];
    if (next === "COMPLETED") {
      setCompletingTask(task);
      setOutcome("Fixed");
      return;
    }
    await updateStatus(task.rawId, next);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.resourceId || !form.title) { setCreateError("Resource ID and title are required."); return; }
    setCreating(true);
    setCreateError(null);
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/maintenance-tickets`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(form)
      });
      if (!res.ok) { const d = await res.json(); throw new Error(d.message || "Create failed"); }
      setShowCreate(false);
      setForm({ resourceId: "", title: "", description: "", priority: "Medium" });
      await fetchTasks();
    } catch (e: any) {
      setCreateError(e.message);
    } finally {
      setCreating(false);
    }
  };

  const stats = useMemo(() => ({
    total: tasks.length,
    pending: tasks.filter(t => t.status !== "Completed").length,
    completed: tasks.filter(t => t.status === "Completed").length,
    overdue: 0,
  }), [tasks]);

  const filteredTasks = useMemo(() => {
    let list = tasks;
    if (filter === "Pending") list = list.filter(t => t.status !== "Completed");
    else if (filter === "Completed") list = list.filter(t => t.status === "Completed");
    if (search.trim()) {
      const q = search.toLowerCase();
      list = list.filter(t =>
        t.id.toLowerCase().includes(q) ||
        t.description.toLowerCase().includes(q) ||
        t.title.toLowerCase().includes(q) ||
        (t.assignedTo || "").toLowerCase().includes(q) ||
        t.resourceName.toLowerCase().includes(q)
      );
    }
    return list;
  }, [filter, tasks, search]);

  const paginatedTasks = useMemo(() => {
    return filteredTasks.slice(
      (currentPage - 1) * pageSize,
      currentPage * pageSize
    );
  }, [filteredTasks, currentPage, pageSize]);

  const statCards = [
    { title: "Total Requests", value: stats.total, icon: ListTodo, bg: "#F0F9FF", fg: "#0EA5E9", f: "All" },
    { title: "Active / Pending", value: stats.pending, icon: Activity, bg: "#FFFBEB", fg: "#D97706", f: "Pending" },
    { title: "Tasks Completed", value: stats.completed, icon: CheckCircle2, bg: "#CCFBF1", fg: "#0D9488", f: "Completed" },
    { title: "Overdue Tasks", value: stats.overdue, icon: AlertTriangle, bg: "#FFF1F2", fg: "#E11D48", f: "Overdue" },
  ];

  return (
    <motion.div variants={stagger} initial="hidden" animate="visible" className="min-h-screen bg-[#F8FAFC] dark:bg-[#0F172A] p-4 md:p-8">
      <div className="max-w-7xl mx-auto space-y-6">

        {/* ── Hero Banner ── */}
        <motion.div variants={fadeInUp} className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-[#0EA5E9] to-[#0284C7] p-6 md:p-8 text-white shadow-lg shadow-sky-500/20">
          <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full bg-white/10 pointer-events-none" />
          <div className="absolute -bottom-8 -left-8 w-36 h-36 rounded-full bg-white/5 pointer-events-none" />
          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <span className="inline-flex items-center gap-1.5 bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full text-[11px] font-semibold uppercase tracking-wider">
                  <ShieldAlert className="w-3 h-3" /> Admin Console
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Maintenance Ticket Queue</h1>
              <p className="mt-1.5 text-sky-100 text-sm font-medium max-w-xl">
                Monitor facility health, track repair requests, and manage maintenance workflows.
              </p>
            </div>
            <div className="flex flex-col gap-3 shrink-0">
              <button
                onClick={() => setShowCreate(true)}
                className="bg-white text-[#0284C7] hover:bg-sky-50 px-5 py-2.5 rounded-xl font-semibold text-sm transition-colors flex items-center gap-2 shadow-sm"
              >
                <Plus className="w-4 h-4" /> Create Task
              </button>
              <div className="flex gap-2">
                <button onClick={() => handleExport("pdf")} className="flex-1 bg-white/15 hover:bg-white/25 backdrop-blur-sm px-3 py-2 rounded-xl text-white text-xs font-semibold border border-white/20 flex items-center justify-center gap-1.5 transition-colors">
                  <Activity className="w-3.5 h-3.5" /> PDF
                </button>
                <button onClick={() => handleExport("excel")} className="flex-1 bg-white/15 hover:bg-white/25 backdrop-blur-sm px-3 py-2 rounded-xl text-white text-xs font-semibold border border-white/20 flex items-center justify-center gap-1.5 transition-colors">
                  <CheckCircle2 className="w-3.5 h-3.5" /> Excel
                </button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ── Stat Cards ── */}
        <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {statCards.map(({ title, value, icon: Icon, bg, fg, f }) => (
            <motion.div
              key={f}
              variants={cardVariant}
              onClick={() => setFilter(f as any)}
              className={`cursor-pointer bg-white dark:bg-slate-800/60 rounded-xl p-5 border shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 ${
                filter === f
                  ? "border-[#0EA5E9] ring-1 ring-[#0EA5E9]/30"
                  : "border-[#E2E8F0] dark:border-slate-700"
              }`}
            >
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

        {/* ── Table ── */}
        <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-sm overflow-hidden">
          {/* Table Header */}
          <div className="px-6 py-5 border-b border-[#E2E8F0] dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-[#0EA5E9]" /> Task Directory
            </h2>
            <div className="flex gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                <input
                  value={search}
                  onChange={e => { setSearch(e.target.value); updateUrlParams(1, pageSize); }}
                  placeholder="Search tasks..."
                  className="pl-9 pr-4 py-2 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg text-sm text-[#0F172A] dark:text-white placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 w-52 transition-all"
                />
              </div>
              {/* Filter tabs */}
              <div className="flex bg-[#F8FAFC] dark:bg-slate-800 p-1 rounded-lg border border-[#E2E8F0] dark:border-slate-700 gap-0.5">
                {["All", "Pending", "Completed"].map(f => (
                  <button key={f} onClick={() => { setFilter(f as any); updateUrlParams(1, pageSize); }}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-all ${
                      filter === f
                        ? "bg-white dark:bg-slate-700 text-[#0EA5E9] shadow-sm"
                        : "text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white"
                    }`}>
                    {f}
                  </button>
                ))}
              </div>
              <button onClick={fetchTasks} title="Refresh" className="p-2 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-slate-700 border border-[#E2E8F0] dark:border-slate-700 transition-colors">
                <RefreshCcw className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
          </div>

          {/* Saved Searches & CSV Export */}
          <div className="px-6 py-3 border-b border-[#E2E8F0] dark:border-slate-700 flex items-center justify-between gap-4 bg-[#F8FAFC]/60 dark:bg-slate-800/30">
            <SavedSearches
              pageKey="maintenance"
              currentFilters={{ search, filter }}
              onLoadFilters={(filters) => {
                if (filters.search !== undefined) setSearch(filters.search);
                if (filters.filter !== undefined) setFilter(filters.filter);
                updateUrlParams(1, pageSize);
              }}
            />
            <button
              onClick={() => {
                exportToCSV(
                  filteredTasks.map(t => ({
                    id: t.id, resourceName: t.resourceName, title: t.title,
                    description: t.description, requestedDate: t.requestedDate,
                    status: t.status, priority: t.priority, assignedTo: t.assignedTo || ""
                  })),
                  ["Task ID", "Resource", "Title", "Description", "Requested Date", "Status", "Priority", "Assigned To"],
                  ["id", "resourceName", "title", "description", "requestedDate", "status", "priority", "assignedTo"],
                  "maintenance_tasks"
                );
              }}
              className="inline-flex items-center gap-2 bg-white dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 hover:bg-[#F8FAFC] dark:hover:bg-slate-600 text-[#0F172A] dark:text-white font-semibold px-4 py-2 rounded-lg shadow-sm transition-all text-sm"
            >
              <DownloadCloud className="w-4 h-4 text-[#0D9488]" />
              <span>Export CSV</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-[#F8FAFC] dark:bg-slate-800/50 border-b border-[#E2E8F0] dark:border-slate-700">
                  {["ID / Resource", "Issue", "Requested", "Status", "Priority", "Action"].map(h => (
                    <th key={h} className="px-6 py-3.5 font-semibold text-[#64748B] dark:text-slate-400 text-[11px] uppercase tracking-wider">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-4">
                          <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse w-24" />
                        </td>
                      ))}
                    </tr>
                  ))
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] flex items-center justify-center">
                          <Wrench className="w-7 h-7 text-[#0EA5E9]" />
                        </div>
                        <p className="font-semibold text-[#0F172A] dark:text-white">No tasks found</p>
                        <p className="text-sm text-[#64748B] dark:text-slate-400">No tasks match the current filter or search.</p>
                        <button onClick={() => { setFilter("All"); setSearch(""); }} className="text-[#0EA5E9] font-semibold text-sm hover:underline">
                          Clear filters
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : paginatedTasks.map(task => (
                  <tr key={task.rawId} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-700/30 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-semibold text-[#0F172A] dark:text-white text-sm">{task.id}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">{task.resourceName}</div>
                    </td>
                    <td className="px-6 py-4 max-w-xs">
                      <p className="font-semibold text-[#0F172A] dark:text-white text-sm line-clamp-1">{task.title}</p>
                      <p className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 line-clamp-1">{task.description}</p>
                      {task.assignedTo && <p className="text-[11px] text-[#0EA5E9] font-semibold mt-1">→ {task.assignedTo}</p>}
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-1.5 text-[11px] text-[#64748B] dark:text-slate-400">
                        <CalendarDays className="w-3.5 h-3.5" /> {task.requestedDate}
                      </div>
                    </td>
                    <td className="px-6 py-4"><StatusBadge status={task.status} /></td>
                    <td className="px-6 py-4"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-6 py-4">
                      {task.rawStatus !== "COMPLETED" ? (
                        <button
                          onClick={() => handleAdvanceStatus(task)}
                          className="flex items-center gap-1 text-[11px] font-semibold text-white bg-[#0EA5E9] hover:bg-[#0284C7] px-3 py-1.5 rounded-lg transition-colors shadow-sm shadow-sky-500/20"
                        >
                          {task.rawStatus === "OPEN" ? "Start" : "Complete"}
                        </button>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-600 dark:text-teal-400">
                          <CheckCircle2 className="w-3.5 h-3.5" /> Done
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination
            currentPage={currentPage}
            pageSize={pageSize}
            totalItems={filteredTasks.length}
            onPageChange={(p) => updateUrlParams(p, pageSize)}
            onPageSizeChange={(sz) => updateUrlParams(1, sz)}
          />
        </motion.div>
      </div>

      {/* ── Create Task Modal ── */}
      {showCreate && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 py-5 border-b border-[#E2E8F0] dark:border-slate-700">
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-[#0EA5E9]" /> Create Maintenance Task
              </h3>
              <button onClick={() => { setShowCreate(false); setCreateError(null); }}
                className="p-1.5 rounded-lg hover:bg-[#F8FAFC] dark:hover:bg-slate-700 transition-colors">
                <X className="w-4 h-4 text-[#64748B]" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {createError}
                </div>
              )}
              {[
                { label: "Resource ID *", field: "resourceId", placeholder: "e.g. a3f2...", type: "input" },
                { label: "Title *", field: "title", placeholder: "Brief issue title", type: "input" },
              ].map(({ label, field, placeholder }) => (
                <div key={field}>
                  <label className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5">{label}</label>
                  <input value={(form as any)[field]} onChange={e => setForm(p => ({ ...p, [field]: e.target.value }))}
                    placeholder={placeholder}
                    className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 rounded-xl text-sm text-[#0F172A] dark:text-white placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 transition-all" />
                </div>
              ))}
              <div>
                <label className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Describe the issue in detail..."
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 rounded-xl text-sm text-[#0F172A] dark:text-white placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 resize-none transition-all" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-[#64748B] dark:text-slate-400 uppercase tracking-wider mb-1.5">Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-4 py-2.5 bg-[#F8FAFC] dark:bg-slate-700 border border-[#E2E8F0] dark:border-slate-600 rounded-xl text-sm text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 transition-all">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setCreateError(null); }}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 text-[#0F172A] dark:text-white font-semibold text-sm hover:bg-[#F8FAFC] dark:hover:bg-slate-700/50 transition-colors">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-sm disabled:opacity-50 flex items-center justify-center gap-2 transition-colors shadow-sm shadow-sky-500/20">
                  {creating ? <><Loader2 className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create Task</>}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* ── Outcome Modal ── */}
      {completingTask && (
        <div className="fixed inset-0 bg-[#0F172A]/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-white dark:bg-slate-800 rounded-2xl border border-[#E2E8F0] dark:border-slate-700 shadow-xl w-full max-w-md overflow-hidden">
            <div className="px-6 py-5 border-b border-[#E2E8F0] dark:border-slate-700">
              <h3 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0EA5E9]" /> Select Maintenance Outcome
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
                      ? "border-[#0EA5E9] bg-[#F0F9FF] dark:bg-sky-500/10 dark:border-sky-500/50"
                      : "border-[#E2E8F0] dark:border-slate-700 hover:bg-[#F8FAFC] dark:hover:bg-slate-700/50"
                  }`}>
                    <input type="radio" name="outcome" value={opt.value} checked={outcome === opt.value}
                      onChange={() => setOutcome(opt.value as any)} className="mt-1 accent-[#0EA5E9]" />
                    <div>
                      <div className="font-semibold text-sm text-[#0F172A] dark:text-white">{opt.label}</div>
                      <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5">{opt.desc}</div>
                    </div>
                  </label>
                ))}
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setCompletingTask(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl border border-[#E2E8F0] dark:border-slate-700 text-[#0F172A] dark:text-white font-semibold text-sm hover:bg-[#F8FAFC] dark:hover:bg-slate-700/50 transition-colors">
                  Cancel
                </button>
                <button type="button" onClick={async () => {
                  await updateStatus(completingTask.rawId, "COMPLETED", outcome);
                  setCompletingTask(null);
                }}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-[#0EA5E9] hover:bg-[#0284C7] text-white font-semibold text-sm flex items-center justify-center gap-2 transition-colors shadow-sm shadow-sky-500/20">
                  <CheckCircle2 className="w-4 h-4" /> Confirm & Complete
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </motion.div>
  );
}

export default function AdminMaintenanceDashboard() {
  return (
    <Suspense fallback={
      <div className="max-w-7xl mx-auto px-4 py-16 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-[#0EA5E9]" />
      </div>
    }>
      <AdminMaintenanceDashboardContent />
    </Suspense>
  );
}
