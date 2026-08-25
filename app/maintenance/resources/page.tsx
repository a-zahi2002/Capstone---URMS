"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import {
    Search,
    Wrench,
    Activity,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    Database,
    ShieldAlert,
    Building2,
    FlaskConical,
    DoorOpen,
    Package,
    Loader2,
    MapPin
} from "lucide-react";

/* ─── URMS Light Blue Design System ───────────────────────
   primary     : #0EA5E9  teal : #0D9488
   ink-main    : #0F172A  muted: #64748B
   surface     : #FFFFFF  bg   : #F8FAFC
   border      : #E2E8F0
──────────────────────────────────────────────────────────── */

interface Resource {
    id: string;
    name: string;
    type: string;
    capacity: string;
    location: string;
    availability_status: string;
}

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

export default function MaintenanceResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState<string | null>(null);
    const [search, setSearch] = useState("");
    const [typeFilter, setTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [error, setError] = useState<string | null>(null);

    const fetchResources = async () => {
        setLoading(true);
        setError(null);
        try {
            const { data, error: err } = await supabase
                .from("resources")
                .select("id, name, type, capacity, location, availability_status")
                .order("name");
            if (err) throw err;
            setResources((data || []).map(r => ({
                id: r.id,
                name: r.name || "",
                type: r.type || "Lecture Halls",
                capacity: r.capacity?.toString() || "0",
                location: r.location || "N/A",
                availability_status: r.availability_status || "Available"
            })));
        } catch (err: any) {
            console.error("Error fetching resources:", err);
            setError(err.message || "Failed to load resources");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchResources(); }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        setError(null);
        try {
            const { error: err } = await supabase
                .from("resources")
                .update({ availability_status: newStatus })
                .eq("id", id);
            if (err) throw err;
            setResources(prev => prev.map(r => r.id === id ? { ...r, availability_status: newStatus } : r));
        } catch (err: any) {
            console.error("Error updating resource status:", err);
            setError(err.message || "Failed to update resource status");
        } finally {
            setUpdatingId(null);
        }
    };

    const stats = useMemo(() => ({
        total: resources.length,
        available: resources.filter(r => r.availability_status === "Available").length,
        inMaintenance: resources.filter(r => r.availability_status === "Maintenance" || r.availability_status === "Under Maintenance").length,
        inactive: resources.filter(r => r.availability_status === "Inactive" || r.availability_status === "Decommissioned").length,
    }), [resources]);

    const filteredResources = useMemo(() => {
        return resources.filter(r => {
            const q = search.toLowerCase();
            const matchesSearch = r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
            const matchesType = typeFilter === "All" || r.type === typeFilter;
            const matchesStatus =
                statusFilter === "All" ||
                (statusFilter === "Maintenance" && (r.availability_status === "Maintenance" || r.availability_status === "Under Maintenance")) ||
                (statusFilter === "Inactive" && (r.availability_status === "Inactive" || r.availability_status === "Decommissioned")) ||
                (statusFilter === r.availability_status);
            return matchesSearch && matchesType && matchesStatus;
        });
    }, [resources, search, typeFilter, statusFilter]);

    const getCategoryIcon = (category: string) => {
        switch (category) {
            case "Labs": return <FlaskConical className="w-4 h-4" />;
            case "Lecture Halls": return <Building2 className="w-4 h-4" />;
            case "Rooms": return <DoorOpen className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    const getCategoryColor = (category: string) => {
        switch (category) {
            case "Labs": return "bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-300 dark:border-purple-500/20";
            case "Lecture Halls": return "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20";
            case "Rooms": return "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20";
            default: return "bg-slate-50 text-slate-600 border-slate-200 dark:bg-slate-500/10 dark:text-slate-300 dark:border-slate-500/20";
        }
    };

    const getStatusBadge = (status: string) => {
        if (status === "Available")
            return { cls: "bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20", dot: "bg-teal-500" };
        if (status === "Booked")
            return { cls: "bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-500/10 dark:text-sky-300 dark:border-sky-500/20", dot: "bg-sky-500 animate-pulse" };
        if (status === "Maintenance" || status === "Under Maintenance")
            return { cls: "bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20", dot: "bg-amber-500 animate-pulse" };
        if (status === "Inactive" || status === "Decommissioned")
            return { cls: "bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20", dot: "bg-rose-500" };
        return { cls: "bg-slate-50 text-slate-600 border-slate-200", dot: "bg-slate-400" };
    };

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
                                    <ShieldAlert className="w-3 h-3" /> Resource Management
                                </span>
                            </div>
                            <h1 className="text-2xl md:text-3xl font-bold tracking-tight">Resource Condition Updates</h1>
                            <p className="mt-1.5 text-sky-100 text-sm font-medium max-w-xl">
                                Instantly modify availability status, mark units under repair, and record decommissioned equipment.
                            </p>
                        </div>
                        <button
                            onClick={fetchResources}
                            className="bg-white/15 hover:bg-white/25 backdrop-blur-sm px-5 py-2.5 rounded-xl text-white font-semibold text-sm border border-white/20 flex items-center gap-2 transition-colors self-start md:self-auto"
                        >
                            <RefreshCcw className="w-4 h-4" /> Refresh List
                        </button>
                    </div>
                </motion.div>

                {/* ── Stat Cards ── */}
                <motion.div variants={stagger} className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                    {[
                        { label: "Total Assets",        value: stats.total,         icon: Database,    bg: "#F0F9FF", fg: "#0EA5E9" },
                        { label: "Available / Active",  value: stats.available,     icon: CheckCircle2,bg: "#CCFBF1", fg: "#0D9488" },
                        { label: "Under Maintenance",   value: stats.inMaintenance, icon: Wrench,      bg: "#FFFBEB", fg: "#D97706" },
                        { label: "Inactive / Retired",  value: stats.inactive,      icon: XCircle,     bg: "#FFF1F2", fg: "#E11D48" },
                    ].map(({ label, value, icon: Icon, bg, fg }) => (
                        <motion.div key={label} variants={cardVariant}
                            className="bg-white dark:bg-slate-800/60 rounded-xl p-5 border border-[#E2E8F0] dark:border-slate-700 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200">
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

                {/* ── Error Banner ── */}
                {error && (
                    <div className="p-4 bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 rounded-xl text-rose-700 dark:text-rose-300 text-sm font-semibold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                )}

                {/* ── Table ── */}
                <motion.div variants={fadeInUp} className="bg-white dark:bg-slate-800/60 rounded-xl border border-[#E2E8F0] dark:border-slate-700 shadow-sm overflow-hidden">
                    {/* Table header / filters */}
                    <div className="px-6 py-5 border-b border-[#E2E8F0] dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-base font-bold text-[#0F172A] dark:text-white flex items-center gap-2">
                            <Database className="w-4 h-4 text-[#0EA5E9]" /> Operational Catalog
                        </h2>
                        <div className="flex gap-3 flex-wrap w-full md:w-auto">
                            {/* Search */}
                            <div className="relative flex-grow md:flex-grow-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#64748B]" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search resources..."
                                    className="w-full md:w-56 pl-9 pr-4 py-2 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg text-sm text-[#0F172A] dark:text-white placeholder:text-[#64748B] focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 transition-all"
                                />
                            </div>
                            {/* Type Filter */}
                            <select value={typeFilter} onChange={e => setTypeFilter(e.target.value)}
                                className="px-3 py-2 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg text-sm font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 transition-all">
                                <option value="All">All Types</option>
                                <option value="Lecture Halls">Lecture Halls</option>
                                <option value="Labs">Labs</option>
                                <option value="Rooms">Rooms</option>
                                <option value="Equipment">Equipment</option>
                                <option value="Vehicles">Vehicles</option>
                            </select>
                            {/* Status Filter */}
                            <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
                                className="px-3 py-2 bg-[#F8FAFC] dark:bg-slate-800 border border-[#E2E8F0] dark:border-slate-700 rounded-lg text-sm font-semibold text-[#0F172A] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]/50 transition-all">
                                <option value="All">All Statuses</option>
                                <option value="Available">Available</option>
                                <option value="Booked">Booked</option>
                                <option value="Maintenance">Under Maintenance</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-[#F8FAFC] dark:bg-slate-800/50 border-b border-[#E2E8F0] dark:border-slate-700">
                                    {["Resource Name", "Location", "Category", "Operational Status", "Quick Status Update"].map(h => (
                                        <th key={h} className="px-6 py-3.5 font-semibold text-[#64748B] dark:text-slate-400 text-[11px] uppercase tracking-wider">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-[#E2E8F0] dark:divide-slate-700">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <td key={j} className="px-6 py-4">
                                                    <div className="h-4 bg-slate-100 dark:bg-slate-700 rounded-lg animate-pulse w-24" />
                                                </td>
                                            ))}
                                        </tr>
                                    ))
                                ) : filteredResources.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <div className="inline-flex flex-col items-center gap-3">
                                                <div className="w-14 h-14 rounded-2xl bg-[#F0F9FF] flex items-center justify-center">
                                                    <Database className="w-7 h-7 text-[#0EA5E9]" />
                                                </div>
                                                <p className="font-semibold text-[#0F172A] dark:text-white">No resources found</p>
                                                <p className="text-sm text-[#64748B] dark:text-slate-400">Try adjusting your filters or search query.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResources.map(resource => {
                                        const isUpdating = updatingId === resource.id;
                                        const currentStatus = resource.availability_status;
                                        const { cls: statusCls, dot: statusDot } = getStatusBadge(currentStatus);

                                        return (
                                            <tr key={resource.id} className="hover:bg-[#F8FAFC] dark:hover:bg-slate-700/30 transition-colors group">
                                                <td className="px-6 py-4">
                                                    <div className="font-semibold text-[#0F172A] dark:text-white text-sm">{resource.name}</div>
                                                    <div className="text-[11px] text-[#64748B] dark:text-slate-400 mt-0.5 font-mono">ID: {resource.id.slice(0, 8)}</div>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className="text-sm text-[#64748B] dark:text-slate-300 flex items-center gap-1.5">
                                                        <MapPin className="w-3.5 h-3.5 text-[#0EA5E9] shrink-0" />
                                                        {resource.location}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-0.5 rounded-full border ${getCategoryColor(resource.type)}`}>
                                                        {getCategoryIcon(resource.type)}
                                                        {resource.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${statusCls}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusDot}`} />
                                                        {currentStatus === "Maintenance" ? "Under Maintenance" :
                                                         currentStatus === "Inactive" ? "Decommissioned" : currentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-4">
                                                    <div className="flex gap-2 flex-wrap">
                                                        {[
                                                            { label: "Available",   status: "Available",   cls: "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 dark:bg-teal-500/10 dark:text-teal-300 dark:border-teal-500/20 dark:hover:bg-teal-500/20" },
                                                            { label: "Maintenance", status: "Maintenance", cls: "bg-amber-50 text-amber-700 border-amber-200 hover:bg-amber-100 dark:bg-amber-500/10 dark:text-amber-300 dark:border-amber-500/20 dark:hover:bg-amber-500/20" },
                                                            { label: "Inactive",    status: "Inactive",    cls: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100 dark:bg-rose-500/10 dark:text-rose-300 dark:border-rose-500/20 dark:hover:bg-rose-500/20" },
                                                        ].map(action => (
                                                            <button
                                                                key={action.status}
                                                                onClick={() => handleUpdateStatus(resource.id, action.status)}
                                                                disabled={isUpdating || currentStatus === action.status}
                                                                className={`px-3 py-1.5 border text-[11px] font-semibold rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed ${action.cls} ${
                                                                    currentStatus === action.status ? "ring-1 ring-offset-0" : ""
                                                                }`}
                                                            >
                                                                {isUpdating && updatingId === resource.id ? (
                                                                    <Loader2 className="w-3 h-3 animate-spin inline" />
                                                                ) : action.label}
                                                            </button>
                                                        ))}
                                                    </div>
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
