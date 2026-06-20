"use client";

import React, { useState, useEffect, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import {
    Search,
    Wrench,
    Activity,
    CheckCircle2,
    XCircle,
    RefreshCcw,
    Database,
    ShieldAlert,
    ChevronDown,
    Building2,
    FlaskConical,
    DoorOpen,
    Package
} from "lucide-react";
import { motion } from "framer-motion";

interface Resource {
    id: string;
    name: string;
    type: string;
    capacity: string;
    location: string;
    availability_status: string;
}

const fadeInUp = {
    hidden: { opacity: 0, y: 15 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

const staggerContainer = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.08 } },
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

    useEffect(() => {
        fetchResources();
    }, []);

    const handleUpdateStatus = async (id: string, newStatus: string) => {
        setUpdatingId(id);
        setError(null);
        try {
            const { error: err } = await supabase
                .from("resources")
                .update({ availability_status: newStatus })
                .eq("id", id);
            if (err) throw err;
            
            setResources(prev =>
                prev.map(r => r.id === id ? { ...r, availability_status: newStatus } : r)
            );
        } catch (err: any) {
            console.error("Error updating resource status:", err);
            setError(err.message || "Failed to update resource status");
        } finally {
            setUpdatingId(null);
        }
    };

    // Calculate metrics
    const stats = useMemo(() => {
        const total = resources.length;
        const available = resources.filter(r => r.availability_status === "Available").length;
        const inMaintenance = resources.filter(r => r.availability_status === "Maintenance" || r.availability_status === "Under Maintenance").length;
        const inactive = resources.filter(r => r.availability_status === "Inactive" || r.availability_status === "Decommissioned").length;
        return { total, available, inMaintenance, inactive };
    }, [resources]);

    const filteredResources = useMemo(() => {
        return resources.filter(r => {
            const q = search.toLowerCase();
            const matchesSearch = r.name.toLowerCase().includes(q) || r.location.toLowerCase().includes(q) || r.id.toLowerCase().includes(q);
            const matchesType = typeFilter === "All" || r.type === typeFilter;
            const matchesStatus = statusFilter === "All" || 
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
            case "Labs": return "bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20";
            case "Lecture Halls": return "bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20";
            case "Rooms": return "bg-teal-500/10 text-teal-600 dark:text-teal-400 border border-teal-500/20";
            default: return "bg-slate-500/10 text-slate-600 dark:text-foreground/60 border border-slate-550/20";
        }
    };

    return (
        <div className="min-h-screen bg-background p-4 md:p-8 font-sans">
            <div className="max-w-7xl mx-auto space-y-8">
                
                {/* Header */}
                <div className="relative overflow-hidden rounded-3xl bg-card border border-slate-200 dark:border-border p-8 shadow-2xl">
                    <div className="absolute top-0 right-0 p-8 opacity-5 pointer-events-none">
                        <Wrench className="w-64 h-64 rotate-45 text-amber-500" />
                    </div>
                    <div className="relative z-10 flex flex-col md:flex-row md:items-end justify-between gap-6">
                        <div>
                            <div className="inline-flex items-center gap-2 px-3 py-1 bg-amber-500/10 rounded-full text-sm font-semibold text-amber-600 dark:text-amber-400 mb-4 border border-amber-500/20">
                                <ShieldAlert className="w-4 h-4" /> Resource Management
                            </div>
                            <h1 className="text-4xl md:text-5xl font-black tracking-tight mb-2">
                                Resource <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-500 to-orange-500">Condition</span> Updates
                            </h1>
                            <p className="text-slate-600 dark:text-foreground/50 text-lg font-medium max-w-xl">
                                Instantly modify availability status, mark units under repair, and record decommissioned equipment.
                            </p>
                        </div>
                        <button
                            onClick={fetchResources}
                            className="bg-card hover:bg-slate-100 dark:hover:bg-foreground/5 px-6 py-3 rounded-xl text-foreground font-bold border border-slate-200 dark:border-border flex items-center justify-center gap-2 self-start md:self-auto transition-colors"
                        >
                            <RefreshCcw className="w-5 h-5 text-amber-500" /> Refresh List
                        </button>
                    </div>
                </div>

                {/* Statistics Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
                    {[
                        { label: "Total Assets", value: stats.total, icon: Database, color: "text-blue-500 bg-blue-500/10 border-blue-500/20" },
                        { label: "Available / Active", value: stats.available, icon: CheckCircle2, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
                        { label: "Under Maintenance", value: stats.inMaintenance, icon: Wrench, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
                        { label: "Inactive / Retired", value: stats.inactive, icon: XCircle, color: "text-red-500 bg-red-500/10 border-red-500/20" }
                    ].map((card, idx) => (
                        <div key={idx} className={`bg-card rounded-3xl p-6 shadow-xl border-2 flex items-center justify-between ${card.color}`}>
                            <div>
                                <p className="text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest mb-1">{card.label}</p>
                                <p className="text-4xl font-black text-foreground">{loading ? "—" : card.value}</p>
                            </div>
                            <div className="p-3.5 rounded-2xl bg-white/10 dark:bg-black/10">
                                <card.icon className="w-6 h-6" />
                            </div>
                        </div>
                    ))}
                </div>

                {/* Error Banner */}
                {error && (
                    <div className="p-4 bg-red-500/10 border border-red-500/20 rounded-2xl text-red-600 dark:text-red-400 text-sm font-bold flex items-center gap-2">
                        <ShieldAlert className="w-4 h-4 flex-shrink-0" /> {error}
                    </div>
                )}

                {/* Table Container */}
                <div className="bg-card rounded-3xl shadow-xl border border-slate-200 dark:border-border overflow-hidden">
                    {/* Filters Header */}
                    <div className="p-6 md:p-8 border-b border-slate-200 dark:border-border flex flex-col md:flex-row md:items-center justify-between gap-4">
                        <h2 className="text-2xl font-black text-foreground">Operational Catalog</h2>
                        <div className="flex gap-3 flex-wrap w-full md:w-auto">
                            {/* Search */}
                            <div className="relative flex-grow md:flex-grow-0">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    value={search}
                                    onChange={e => setSearch(e.target.value)}
                                    placeholder="Search resources..."
                                    className="w-full md:w-56 pl-9 pr-4 py-2.5 bg-slate-100 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl text-sm font-bold text-foreground placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                                />
                            </div>
                            {/* Type Filter */}
                            <select
                                value={typeFilter}
                                onChange={e => setTypeFilter(e.target.value)}
                                className="px-4 py-2.5 bg-slate-100 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                            >
                                <option value="All">All Types</option>
                                <option value="Lecture Halls">Lecture Halls</option>
                                <option value="Labs">Labs</option>
                                <option value="Rooms">Rooms</option>
                                <option value="Equipment">Equipment</option>
                                <option value="Vehicles">Vehicles</option>
                            </select>
                            {/* Status Filter */}
                            <select
                                value={statusFilter}
                                onChange={e => setStatusFilter(e.target.value)}
                                className="px-4 py-2.5 bg-slate-100 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-xl text-sm font-bold text-foreground focus:outline-none focus:ring-2 focus:ring-amber-500/40"
                            >
                                <option value="All">All Statuses</option>
                                <option value="Available">Available</option>
                                <option value="Booked">Booked</option>
                                <option value="Maintenance">Under Maintenance</option>
                                <option value="Inactive">Inactive</option>
                            </select>
                        </div>
                    </div>

                    {/* Table View */}
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-foreground/[0.02] border-b border-slate-200 dark:border-border">
                                    {["Resource Name", "Location", "Category", "Operational Status", "Quick Status Update"].map(h => (
                                        <th key={h} className="px-6 py-4 font-black text-slate-505 dark:text-foreground/40 text-[10px] uppercase tracking-widest">{h}</th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-border/50">
                                {loading ? (
                                    Array.from({ length: 5 }).map((_, i) => (
                                        <tr key={i}>
                                            {Array.from({ length: 5 }).map((_, j) => (
                                                <td key={j} className="px-6 py-5"><div className="h-4 bg-slate-200 dark:bg-foreground/10 rounded animate-pulse w-24" /></td>
                                            ))}
                                        </tr>
                                    ))
                                ) : filteredResources.length === 0 ? (
                                    <tr>
                                        <td colSpan={5} className="px-6 py-16 text-center">
                                            <div className="inline-flex flex-col items-center gap-3">
                                                <div className="w-14 h-14 rounded-2xl bg-slate-100 dark:bg-foreground/5 flex items-center justify-center"><Database className="w-7 h-7 text-slate-400" /></div>
                                                <p className="font-black text-foreground">No resources found</p>
                                                <p className="text-sm text-slate-550 dark:text-foreground/40 font-bold">Try adjusting your filters or search query.</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    filteredResources.map(resource => {
                                        const isStatusUpdating = updatingId === resource.id;
                                        const currentStatus = resource.availability_status;

                                        // Styling for status badge
                                        let statusBadgeClass = "bg-slate-100 text-slate-700 border-slate-200";
                                        let statusDotClass = "bg-slate-400";
                                        if (currentStatus === "Available") {
                                            statusBadgeClass = "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 border-emerald-200 dark:border-emerald-500/20";
                                            statusDotClass = "bg-emerald-500";
                                        } else if (currentStatus === "Booked") {
                                            statusBadgeClass = "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border-blue-200 dark:border-blue-500/20";
                                            statusDotClass = "bg-blue-500";
                                        } else if (currentStatus === "Maintenance" || currentStatus === "Under Maintenance") {
                                            statusBadgeClass = "bg-amber-50 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 border-amber-200 dark:border-amber-500/20";
                                            statusDotClass = "bg-amber-500 animate-pulse";
                                        } else if (currentStatus === "Inactive" || currentStatus === "Decommissioned") {
                                            statusBadgeClass = "bg-red-50 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20";
                                            statusDotClass = "bg-red-500";
                                        }

                                        return (
                                            <tr key={resource.id} className="hover:bg-foreground/[0.01] transition-colors">
                                                <td className="px-6 py-5">
                                                    <div className="font-bold text-foreground text-sm">{resource.name}</div>
                                                    <div className="text-[10px] text-slate-400 dark:text-foreground/30 mt-0.5 uppercase tracking-wider font-mono">ID: {resource.id.slice(0, 8)}</div>
                                                </td>
                                                <td className="px-6 py-5 font-bold text-slate-600 dark:text-foreground/60 text-sm">
                                                    {resource.location}
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${getCategoryColor(resource.type)}`}>
                                                        {getCategoryIcon(resource.type)}
                                                        {resource.type}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold border ${statusBadgeClass}`}>
                                                        <span className={`w-1.5 h-1.5 rounded-full ${statusDotClass}`} />
                                                        {currentStatus === "Maintenance" ? "Under Maintenance" : currentStatus === "Inactive" ? "Decommissioned" : currentStatus}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex gap-2">
                                                        {[
                                                            { label: "Available", status: "Available", color: "hover:bg-emerald-500/10 border-transparent hover:border-emerald-500/25 text-emerald-600 dark:text-emerald-400" },
                                                            { label: "Maintenance", status: "Maintenance", color: "hover:bg-amber-500/10 border-transparent hover:border-amber-500/25 text-amber-600 dark:text-amber-400" },
                                                            { label: "Inactive", status: "Inactive", color: "hover:bg-red-500/10 border-transparent hover:border-red-500/25 text-red-600 dark:text-red-400" }
                                                        ].map(action => (
                                                            <button
                                                                key={action.status}
                                                                onClick={() => handleUpdateStatus(resource.id, action.status)}
                                                                disabled={isStatusUpdating || currentStatus === action.status}
                                                                className={`px-3 py-1.5 border text-xs font-black uppercase tracking-widest rounded-lg transition-all disabled:opacity-35 disabled:cursor-not-allowed ${action.color} ${
                                                                    currentStatus === action.status ? "bg-foreground/[0.03] opacity-35" : ""
                                                                }`}
                                                            >
                                                                {isStatusUpdating && updatingId === resource.id ? "..." : action.label}
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
                </div>
            </div>
        </div>
    );
}
