"use client";

import React, { useState, useMemo, useEffect, useCallback } from "react";
import {
  AlertTriangle, CheckCircle2, Clock, ListTodo,
  CalendarDays, Wrench, Activity, ShieldAlert,
  Search, X, Plus, RefreshCcw, ChevronRight
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";

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

export default function AdminMaintenanceDashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState<"All" | "Pending" | "Completed" | "Overdue">("All");
  const [search, setSearch] = useState("");
  const [tasks, setTasks] = useState<MaintenanceTask[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [creating, setCreating] = useState(false);
  const [createError, setCreateError] = useState<string | null>(null);
  const [form, setForm] = useState({ resourceId: "", title: "", description: "", priority: "Medium" });

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
      const data: MaintenanceTicket[] = await res.json();

      if (!Array.isArray(data)) {
        throw new Error("Invalid response format: expected an array of tickets");
      }

      setTasks(data.map(t => ({
        id: `REQ-${String(t.id).slice(0, 8).toUpperCase()}`,
        rawId: t.id,
        resourceName: t.resourceName || `Resource #${String(t.resourceId).slice(0, 8)}`,
        title: t.title,
        description: t.description || t.title,
        requestedDate: t.created_at ? new Date(t.created_at).toLocaleDateString() : 'N/A',
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

  const handleAdvanceStatus = async (task: MaintenanceTask) => {
    if (task.rawStatus === "COMPLETED") return;
    const next = NEXT_STATUS[task.rawStatus];
    try {
      const token = await getToken();
      const res = await fetch(`${API}/api/maintenance-tickets/${task.rawId}/status`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ status: next })
      });
      if (!res.ok) throw new Error("Status update failed");
      await fetchTasks();
    } catch (e) {
      alert("Could not update status. Check permissions.");
    }
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

  const todayStr = new Date().toISOString().split("T")[0];
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

  return (
    <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">

        {/* Header */}
        <div className="relative overflow-hidden rounded-3xl bg-card border border-slate-200 dark:border-border p-8 shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none"><Wrench className="w-64 h-64 rotate-12" /></div>
          <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 bg-slate-100 dark:bg-foreground/5 rounded-full text-sm font-semibold text-brand-primary mb-4 border border-slate-200 dark:border-border">
                <ShieldAlert className="w-4 h-4" /> Admin Console
              </div>
              <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                Maintenance <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-cyan-500">Overview</span>
              </h1>
              <p className="text-slate-600 dark:text-foreground/50 text-lg font-medium max-w-xl">
                Monitor facility health, track repair requests, and manage maintenance workflows.
              </p>
            </div>
            <div className="flex flex-col gap-3">
              <button
                onClick={() => setShowCreate(true)}
                className="bg-brand-primary hover:opacity-90 px-6 py-3 rounded-xl text-white font-bold transition-all shadow-lg flex items-center gap-2"
              >
                <Plus className="w-5 h-5" /> Create Task
              </button>
              <div className="flex gap-2">
                <button onClick={() => handleExport("pdf")} className="flex-1 bg-card hover:bg-slate-100 dark:hover:bg-foreground/5 px-4 py-2.5 rounded-xl text-foreground text-xs font-bold border border-slate-200 dark:border-border flex items-center justify-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" /> Export PDF
                </button>
                <button onClick={() => handleExport("excel")} className="flex-1 bg-emerald-500/10 hover:bg-emerald-500/20 px-4 py-2.5 rounded-xl text-emerald-600 dark:text-emerald-400 text-xs font-bold border border-emerald-500/20 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-500" /> Export Excel
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {[
            { title: "Total Requests", value: stats.total, icon: ListTodo, color: "blue", f: "All" },
            { title: "Active / Pending", value: stats.pending, icon: Activity, color: "amber", f: "Pending" },
            { title: "Tasks Completed", value: stats.completed, icon: CheckCircle2, color: "emerald", f: "Completed" },
            { title: "Overdue Tasks", value: stats.overdue, icon: AlertTriangle, color: "red", f: "Overdue" },
          ].map(({ title, value, icon: Icon, color, f }) => (
            <StatCard key={f} title={title} value={value} icon={Icon} color={color} active={filter === f} onClick={() => setFilter(f as any)} />
          ))}
        </div>

        {/* Table */}
        <div className="bg-card rounded-3xl shadow-xl border border-slate-200 dark:border-border overflow-hidden">
          <div className="p-6 md:p-8 border-b border-slate-200 dark:border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
            <h2 className="text-2xl font-black text-foreground">Task Directory</h2>
            <div className="flex gap-3 flex-wrap">
              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Search tasks..."
                  className="pl-9 pr-4 py-2 bg-slate-100 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl text-sm font-bold text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/40 w-52"
                />
              </div>
              {/* Filter tabs */}
              <div className="flex bg-slate-100 dark:bg-foreground/5 p-1 rounded-xl border border-slate-200 dark:border-border">
                {["All", "Pending", "Completed"].map(f => (
                  <button key={f} onClick={() => setFilter(f as any)}
                    className={`px-3 py-1.5 text-xs font-black rounded-lg transition-all ${filter === f ? "bg-card text-foreground shadow-sm" : "text-slate-500 dark:text-foreground/40"}`}>
                    {f}
                  </button>
                ))}
              </div>
              <button onClick={fetchTasks} title="Refresh" className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-foreground/5 border border-slate-200 dark:border-border transition-colors">
                <RefreshCcw className="w-4 h-4 text-slate-500" />
              </button>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-foreground/[0.02] border-b border-slate-200 dark:border-border">
                  {["ID / Resource", "Issue", "Requested", "Status", "Priority", "Action"].map(h => (
                    <th key={h} className="px-6 py-4 font-black text-slate-500 dark:text-foreground/40 text-[10px] uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-border/50">
                {loading ? (
                  Array.from({ length: 5 }).map((_, i) => (
                    <tr key={i}>
                      {Array.from({ length: 6 }).map((_, j) => (
                        <td key={j} className="px-6 py-5"><div className="h-4 bg-slate-200 dark:bg-foreground/10 rounded animate-pulse w-24" /></td>
                      ))}
                    </tr>
                  ))
                ) : filteredTasks.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-16 text-center">
                      <div className="inline-flex flex-col items-center gap-3">
                        <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-foreground/5 flex items-center justify-center"><Wrench className="w-7 h-7 text-slate-400" /></div>
                        <p className="font-black text-foreground">No tasks found</p>
                        <p className="text-sm text-slate-500 dark:text-foreground/40 font-bold">No tasks match the current filter or search.</p>
                        <button onClick={() => { setFilter("All"); setSearch(""); }} className="text-brand-primary font-black text-sm hover:underline">Clear filters</button>
                      </div>
                    </td>
                  </tr>
                ) : filteredTasks.map(task => (
                  <tr key={task.rawId} className="hover:bg-foreground/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <div className="font-black text-foreground text-sm">{task.id}</div>
                      <div className="text-[10px] font-bold text-slate-500 dark:text-foreground/40 uppercase tracking-wider mt-0.5">{task.resourceName}</div>
                    </td>
                    <td className="px-6 py-5 max-w-xs">
                      <p className="font-bold text-slate-700 dark:text-foreground/80 text-sm line-clamp-2">{task.description}</p>
                      {task.assignedTo && <p className="text-[10px] text-slate-400 dark:text-foreground/30 font-bold mt-1 uppercase tracking-widest">→ {task.assignedTo}</p>}
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-2 text-xs text-slate-600 dark:text-foreground/60 font-bold">
                        <CalendarDays className="w-3.5 h-3.5 text-slate-400" /> {task.requestedDate}
                      </div>
                    </td>
                    <td className="px-6 py-5"><StatusBadge status={task.status} /></td>
                    <td className="px-6 py-5"><PriorityBadge priority={task.priority} /></td>
                    <td className="px-6 py-5">
                      {task.rawStatus !== "COMPLETED" ? (
                        <button
                          onClick={() => handleAdvanceStatus(task)}
                          title={`Advance to ${NEXT_STATUS[task.rawStatus]?.replace("_", " ")}`}
                          className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-brand-primary hover:bg-blue-500/10 px-2.5 py-1.5 rounded-lg transition-all border border-transparent hover:border-blue-500/20"
                        >
                          {task.rawStatus === "OPEN" ? "Start" : "Complete"} <ChevronRight className="w-3 h-3" />
                        </button>
                      ) : (
                        <span className="text-[10px] font-bold text-slate-400 dark:text-foreground/20 uppercase tracking-widest">Done</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Create Task Modal */}
      {showCreate && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-card border border-slate-200 dark:border-border rounded-3xl shadow-2xl w-full max-w-md">
            <div className="flex items-center justify-between p-6 border-b border-slate-200 dark:border-border">
              <h3 className="text-xl font-black text-foreground">Create Maintenance Task</h3>
              <button onClick={() => { setShowCreate(false); setCreateError(null); }} className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-foreground/5"><X className="w-5 h-5 text-slate-500" /></button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {createError && (
                <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0" /> {createError}
                </div>
              )}
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-foreground/60 uppercase tracking-widest mb-2">Resource ID *</label>
                <input value={form.resourceId} onChange={e => setForm(p => ({ ...p, resourceId: e.target.value }))}
                  placeholder="e.g. a3f2..." className="w-full px-4 py-3 bg-slate-50 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-foreground/60 uppercase tracking-widest mb-2">Title *</label>
                <input value={form.title} onChange={e => setForm(p => ({ ...p, title: e.target.value }))}
                  placeholder="Brief issue title" className="w-full px-4 py-3 bg-slate-50 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-foreground/60 uppercase tracking-widest mb-2">Description</label>
                <textarea value={form.description} onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
                  rows={3} placeholder="Describe the issue in detail..."
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 resize-none text-foreground" />
              </div>
              <div>
                <label className="block text-xs font-black text-slate-600 dark:text-foreground/60 uppercase tracking-widest mb-2">Priority</label>
                <select value={form.priority} onChange={e => setForm(p => ({ ...p, priority: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-50 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500/40 text-foreground">
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => { setShowCreate(false); setCreateError(null); }}
                  className="flex-1 px-4 py-3 rounded-xl border border-slate-200 dark:border-border text-foreground font-black text-sm hover:bg-slate-50 dark:hover:bg-foreground/5 transition-all">
                  Cancel
                </button>
                <button type="submit" disabled={creating}
                  className="flex-1 px-4 py-3 rounded-xl bg-brand-primary text-white font-black text-sm hover:opacity-90 transition-all disabled:opacity-50 flex items-center justify-center gap-2">
                  {creating ? <><RefreshCcw className="w-4 h-4 animate-spin" /> Creating…</> : <><Plus className="w-4 h-4" /> Create Task</>}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function StatCard({ title, value, icon: Icon, color, active, onClick }: any) {
  const colors: Record<string, string> = {
    blue: `bg-blue-500/10 text-blue-500 ${active ? "ring-2 ring-blue-500 border-blue-500" : "border-slate-200 dark:border-border"}`,
    amber: `bg-amber-500/10 text-amber-500 ${active ? "ring-2 ring-amber-500 border-amber-500" : "border-slate-200 dark:border-border"}`,
    emerald: `bg-emerald-500/10 text-emerald-500 ${active ? "ring-2 ring-emerald-500 border-emerald-500" : "border-slate-200 dark:border-border"}`,
    red: `bg-red-500/10 text-red-500 ${active ? "ring-2 ring-red-500 border-red-500" : "border-slate-200 dark:border-border"}`,
  };
  const iconBg: Record<string, string> = {
    blue: "bg-blue-500/10 text-blue-500", amber: "bg-amber-500/10 text-amber-500",
    emerald: "bg-emerald-500/10 text-emerald-500", red: "bg-red-500/10 text-red-500",
  };
  return (
    <div onClick={onClick} className={`cursor-pointer bg-card rounded-3xl p-6 shadow-xl border-2 transition-all hover:-translate-y-1 ${colors[color]}`}>
      <div className={`p-3 rounded-2xl w-fit mb-4 ${iconBg[color]}`}><Icon className="w-6 h-6" /></div>
      <p className="text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest mb-1">{title}</p>
      <p className="text-4xl font-black text-foreground">{value}</p>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    "Pending": "bg-slate-100 text-slate-700 border-slate-200",
    "In Progress": "bg-blue-50 text-blue-700 border-blue-200",
    "Completed": "bg-emerald-50 text-emerald-700 border-emerald-200",
  };
  const dot: Record<string, string> = {
    "Pending": "bg-slate-400", "In Progress": "bg-blue-500 animate-pulse", "Completed": "bg-emerald-500"
  };
  return (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${map[status] || "bg-slate-100 text-slate-700 border-slate-200"}`}>
      <span className={`w-1.5 h-1.5 rounded-full ${dot[status] || "bg-slate-400"}`} />{status}
    </span>
  );
}

function PriorityBadge({ priority }: { priority: string }) {
  const map: Record<string, string> = {
    High: "text-red-700 bg-red-50 border border-red-200",
    Medium: "text-amber-700 bg-amber-50 border border-amber-200",
    Low: "text-slate-600 bg-slate-100 border border-slate-200",
  };
  return <span className={`inline-flex px-3 py-1 rounded-lg text-xs font-bold ${map[priority] || ""}`}>{priority}</span>;
}
