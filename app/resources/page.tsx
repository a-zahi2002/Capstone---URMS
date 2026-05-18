"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import AddResourceModal from "@/components/AddResourceModal";
import EditResourceModal, { Resource } from "@/components/EditResourceModal";
import BulkImport from "@/components/BulkImport";
import { supabase } from "@/lib/supabase";
import {
    Search,
    Plus,
    Edit3,
    Trash2,
    Database,
    CheckCircle2,
    XCircle,
    ChevronUp,
    ChevronDown,
    ChevronsUpDown,
    FlaskConical,
    Building2,
    DoorOpen,
    Package,
    UploadCloud,
} from "lucide-react";

type SortField = "name" | "type" | "capacity" | "availability_status";
type SortDir = "asc" | "desc";

const parseEquipment = (value: unknown): string[] => {
    if (Array.isArray(value)) return value.map((item) => String(item));
    if (typeof value === "string" && value.trim()) {
        try {
            const parsed = JSON.parse(value);
            if (Array.isArray(parsed)) {
                return parsed.map((item) => String(item));
            }
        } catch {
            return [];
        }
    }
    return [];
};

const STATUS_SEQUENCE = ["Available", "Booked", "Maintenance"] as const;

const getNextStatus = (current: string) => {
    const index = STATUS_SEQUENCE.indexOf(current as typeof STATUS_SEQUENCE[number]);
    if (index === -1) return STATUS_SEQUENCE[0];
    return STATUS_SEQUENCE[(index + 1) % STATUS_SEQUENCE.length];
};

export default function ResourcesPage() {
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    const [isBulkImportOpen, setIsBulkImportOpen] = useState(false);
    const [editingResource, setEditingResource] = useState<Resource | null>(null);
    const [deletingId, setDeletingId] = useState<string | number | null>(null);
    const [updatingStatusId, setUpdatingStatusId] = useState<string | number | null>(null);

    const isAdmin = true;

    const fetchResources = async () => {
        setLoading(true);
        try {
            const { data, error } = await supabase
                .from("resources")
                .select("id, name, type, capacity, location, availability_status, equipment")
                .order("name");
            if (error) throw error;
            const mappedResources = (data || []).map((row) => ({
                id: row.id,
                name: row.name ?? "",
                type: row.type ?? "Lecture Halls",
                capacity: row.capacity?.toString() ?? "",
                location: row.location ?? "",
                availability_status: row.availability_status ?? "Available",
                equipment: parseEquipment(row.equipment),
            }));
            setResources(mappedResources);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchResources();
    }, []);

    const handleDelete = async (id: string | number) => {
        if (!window.confirm("Are you sure you want to delete this resource?")) return;
        setDeletingId(id);
        try {
            const { error: deleteError } = await supabase
                .from("resources")
                .delete()
                .eq("id", id);
            if (deleteError) throw deleteError;
            fetchResources();
        } catch (err: any) {
            alert(err.message);
        } finally {
            setDeletingId(null);
        }
    };

    const handleToggleStatus = async (resource: Resource) => {
        if (updatingStatusId) return;
        const nextStatus = getNextStatus(resource.availability_status);
        setUpdatingStatusId(resource.id);
        try {
            const { error: updateError } = await supabase
                .from("resources")
                .update({ availability_status: nextStatus })
                .eq("id", resource.id);
            if (updateError) throw updateError;
            setResources((prev) =>
                prev.map((item) =>
                    item.id === resource.id
                        ? { ...item, availability_status: nextStatus }
                        : item
                )
            );
        } catch (err: any) {
            alert(err.message || "Failed to update status");
        } finally {
            setUpdatingStatusId(null);
        }
    };

    const handleSort = (field: SortField) => {
        if (sortField === field) {
            setSortDir(sortDir === "asc" ? "desc" : "asc");
        } else {
            setSortField(field);
            setSortDir("asc");
        }
    };

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
            case "Labs": return "bg-purple-50 text-purple-700 border-purple-100";
            case "Lecture Halls": return "bg-blue-50 text-blue-700 border-blue-100";
            case "Rooms": return "bg-teal-50 text-teal-700 border-teal-100";
            default: return "bg-slate-50 text-slate-600 border-slate-200";
        }
    };

    const filteredResources = resources
        .filter((r) => {
            const q = searchQuery.toLowerCase();
            const matchSearch =
                r.name.toLowerCase().includes(q) ||
                r.type.toLowerCase().includes(q) ||
                r.location?.toLowerCase().includes(q);
            const matchCat = selectedCategory === "All" || r.type === selectedCategory;
            const matchStatus = selectedStatus === "All" || r.availability_status === selectedStatus;
            return matchSearch && matchCat && matchStatus;
        })
        .sort((a, b) => {
            const av = (a[sortField] ?? "").toString().toLowerCase();
            const bv = (b[sortField] ?? "").toString().toLowerCase();
            return sortDir === "asc" ? av.localeCompare(bv) : bv.localeCompare(av);
        });

    const totalResources = resources.length;
    const available = resources.filter((r) => r.availability_status === "Available").length;
    const booked = resources.filter((r) => r.availability_status === "Booked").length;

    const SortIcon = ({ field }: { field: SortField }) => {
        if (sortField !== field) return <ChevronsUpDown className="w-3.5 h-3.5 opacity-40" />;
        return sortDir === "asc"
            ? <ChevronUp className="w-3.5 h-3.5 text-[#1E3A8A]" />
            : <ChevronDown className="w-3.5 h-3.5 text-[#1E3A8A]" />;
    };

    return (
        <ProtectedRoute>
            {/* Dashboard wrapper */}
            <div className="min-h-screen bg-[#F0F4FF]">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

                    {/* ── Page Header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-[#1E3A8A] tracking-tight">Resources</h1>
                            <p className="text-slate-500 mt-1 text-sm">Manage university resources, labs, and halls</p>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsBulkImportOpen(true)}
                                    className="inline-flex items-center gap-2 bg-white border border-slate-200 hover:bg-slate-50 active:scale-95 text-slate-700 font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200"
                                >
                                    <UploadCloud className="w-4 h-4" />
                                    Bulk Import
                                </button>
                                <button
                                    id="add-resource-btn"
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="inline-flex items-center gap-2 bg-[#1E3A8A] hover:bg-[#1e40af] active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-900/20 transition-all duration-200"
                                >
                                    <Plus className="w-4 h-4" />
                                    Add Resource
                                </button>
                            </div>
                        )}
                    </div>

                    {/* ── Stats Cards ── */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-8">
                        {/* Total */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
                                <Database className="w-6 h-6 text-[#1E3A8A]" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Resources</p>
                                <p className="text-3xl font-bold text-slate-900 mt-0.5">
                                    {loading ? <span className="text-xl text-slate-300">—</span> : totalResources}
                                </p>
                            </div>
                        </div>

                        {/* Available */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Available</p>
                                <p className="text-3xl font-bold text-emerald-600 mt-0.5">
                                    {loading ? <span className="text-xl text-slate-300">—</span> : available}
                                </p>
                            </div>
                        </div>

                        {/* Booked */}
                        <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-6 flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-red-50 flex items-center justify-center shrink-0">
                                <XCircle className="w-6 h-6 text-red-500" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Booked</p>
                                <p className="text-3xl font-bold text-red-500 mt-0.5">
                                    {loading ? <span className="text-xl text-slate-300">—</span> : booked}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Search & Filters ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 p-4 mb-6 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                placeholder="Search resources…"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-800 placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => setSelectedCategory(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                        >
                            <option value="All">All Categories</option>
                            <option value="Lecture Halls">Lecture Halls</option>
                            <option value="Labs">Labs</option>
                            <option value="Rooms">Rooms</option>
                            <option value="Equipment">Equipment</option>
                            <option value="Vehicles">Vehicles</option>
                        </select>
                        <select
                            value={selectedStatus}
                            onChange={(e) => setSelectedStatus(e.target.value)}
                            className="px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-700 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Available">Available</option>
                            <option value="Booked">Booked</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    </div>

                    {/* ── Error Banner ── */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-xl text-sm font-medium flex items-center gap-2">
                            <XCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* ── Table ── */}
                    <div className="bg-white rounded-2xl shadow-sm border border-slate-100 overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-[#1E3A8A]" />
                            </div>
                        ) : filteredResources.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 flex items-center justify-center mb-4">
                                    <Search className="w-7 h-7 text-blue-300" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 mb-1">No resources found</h3>
                                <p className="text-sm text-slate-500">Try adjusting your search or filters.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 bg-slate-50/60">
                                            {(
                                                [
                                                    { label: "Name", field: "name" },
                                                    { label: "Type", field: "type" },
                                                    { label: "Capacity", field: "capacity" },
                                                    { label: "Status", field: "availability_status" },
                                                ] as { label: string; field: SortField }[]
                                            ).map(({ label, field }) => (
                                                <th
                                                    key={field}
                                                    className="px-6 py-4 text-left text-xs font-semibold text-slate-500 uppercase tracking-wider cursor-pointer select-none hover:text-[#1E3A8A] transition-colors"
                                                    onClick={() => handleSort(field)}
                                                >
                                                    <span className="inline-flex items-center gap-1.5">
                                                        {label}
                                                        <SortIcon field={field} />
                                                    </span>
                                                </th>
                                            ))}
                                            {isAdmin && (
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50">
                                        {filteredResources.map((resource) => (
                                            <tr
                                                key={resource.id}
                                                className="hover:bg-blue-50/40 transition-colors duration-150 group"
                                            >
                                                {/* Name */}
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-slate-800">{resource.name}</span>
                                                    {resource.location && (
                                                        <p className="text-xs text-slate-400 mt-0.5">{resource.location}</p>
                                                    )}
                                                </td>

                                                {/* Category */}
                                                <td className="px-6 py-4">
                                                    <span className={`inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full border ${getCategoryColor(resource.type)}`}>
                                                        {getCategoryIcon(resource.type)}
                                                        {resource.type}
                                                    </span>
                                                </td>

                                                {/* Capacity */}
                                                <td className="px-6 py-4 text-slate-700 font-medium">
                                                    {resource.capacity}
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(resource)}
                                                        disabled={updatingStatusId === resource.id}
                                                        title="Click to toggle status"
                                                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-colors ${resource.availability_status === "Available"
                                                            ? "bg-emerald-100 text-emerald-700"
                                                            : resource.availability_status === "Booked"
                                                                ? "bg-red-100 text-red-600"
                                                                : "bg-amber-100 text-amber-700"
                                                            } ${updatingStatusId === resource.id
                                                                ? "opacity-60 cursor-wait"
                                                                : "hover:opacity-90"
                                                            }`}
                                                    >
                                                        <span
                                                            className={`w-1.5 h-1.5 rounded-full ${resource.availability_status === "Available"
                                                                ? "bg-emerald-500"
                                                                : resource.availability_status === "Booked"
                                                                    ? "bg-red-500"
                                                                    : "bg-amber-500"
                                                                }`}
                                                        />
                                                        {resource.availability_status}
                                                    </button>
                                                </td>

                                                {/* Actions */}
                                                {isAdmin && (
                                                    <td className="px-6 py-4">
                                                        <div className="flex items-center justify-end gap-2">
                                                            <button
                                                                onClick={() => setEditingResource(resource)}
                                                                title="Edit"
                                                                className="p-2 rounded-lg text-slate-400 hover:text-[#1E3A8A] hover:bg-blue-50 transition-all duration-150"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(resource.id)}
                                                                title="Delete"
                                                                disabled={deletingId === resource.id}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 transition-all duration-150 disabled:opacity-40"
                                                            >
                                                                <Trash2 className="w-4 h-4" />
                                                            </button>
                                                        </div>
                                                    </td>
                                                )}
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>

                                {/* Table footer */}
                                <div className="border-t border-slate-100 px-6 py-3 flex items-center justify-between bg-slate-50/40">
                                    <p className="text-xs text-slate-400">
                                        Showing <span className="font-semibold text-slate-600">{filteredResources.length}</span> of{" "}
                                        <span className="font-semibold text-slate-600">{totalResources}</span> resources
                                    </p>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Modals ── */}
            <AddResourceModal
                isOpen={isAddModalOpen}
                onClose={() => setIsAddModalOpen(false)}
                onSuccess={fetchResources}
            />
            <EditResourceModal
                isOpen={!!editingResource}
                resource={editingResource}
                onClose={() => setEditingResource(null)}
                onSuccess={fetchResources}
            />
            <BulkImport
                isOpen={isBulkImportOpen}
                onClose={() => setIsBulkImportOpen(false)}
                onSuccess={fetchResources}
            />
        </ProtectedRoute>
    );
}
