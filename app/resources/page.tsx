"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams, usePathname } from "next/navigation";
import ProtectedRoute from "@/components/ProtectedRoute";
import AddResourceModal from "@/components/AddResourceModal";
import EditResourceModal, { Resource } from "@/components/EditResourceModal";
import BulkImport from "@/components/BulkImport";
import { supabase } from "@/lib/supabase";
import Pagination from "@/components/Pagination";
import SavedSearches from "@/components/SavedSearches";
import { exportToCSV } from "@/lib/exportCsv";
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
    DownloadCloud,
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

function ResourcesPageContent() {
    const router = useRouter();
    const searchParams = useSearchParams();
    const pathname = usePathname();

    const urlPage = parseInt(searchParams.get("page") || "1", 10);
    const urlPageSize = parseInt(searchParams.get("pageSize") || "10", 10);

    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [selectedCategory, setSelectedCategory] = useState("All");
    const [selectedStatus, setSelectedStatus] = useState("All");
    const [sortField, setSortField] = useState<SortField>("name");
    const [sortDir, setSortDir] = useState<SortDir>("asc");

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
            case "Labs": return "bg-purple-50 dark:bg-purple-500/10 text-purple-700 dark:text-purple-400 border border-purple-100 dark:border-purple-500/20";
            case "Lecture Halls": return "bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 border border-blue-100 dark:border-blue-500/20";
            case "Rooms": return "bg-teal-50 dark:bg-teal-500/10 text-teal-700 dark:text-teal-400 border border-teal-100 dark:border-teal-500/20";
            default: return "bg-slate-55 dark:bg-white/5 text-slate-600 dark:text-foreground/60 border border-slate-200 dark:border-white/10";
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

    const paginatedResources = filteredResources.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

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
            <div className="min-h-screen bg-slate-50 dark:bg-slate-950/40 text-foreground">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 pb-24">

                    {/* ── Page Header ── */}
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 mb-8">
                        <div>
                            <h1 className="text-3xl font-bold text-[#1E3A8A] dark:text-blue-400 tracking-tight">Resources</h1>
                            <p className="text-slate-500 dark:text-foreground/50 mt-1 text-sm">Manage university resources, labs, and halls</p>
                        </div>
                        {isAdmin && (
                            <div className="flex items-center gap-3">
                                <button
                                    onClick={() => setIsBulkImportOpen(true)}
                                    className="inline-flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 active:scale-95 text-slate-700 dark:text-foreground/80 font-semibold px-5 py-2.5 rounded-xl shadow-sm transition-all duration-200"
                                >
                                    <UploadCloud className="w-4 h-4" />
                                    Bulk Import
                                </button>
                                <button
                                    id="add-resource-btn"
                                    onClick={() => setIsAddModalOpen(true)}
                                    className="inline-flex items-center gap-2 bg-[#1E3A8A] dark:bg-blue-600 hover:bg-[#1e40af] dark:hover:bg-blue-500 active:scale-95 text-white font-semibold px-5 py-2.5 rounded-xl shadow-md shadow-blue-900/20 dark:shadow-blue-500/10 transition-all duration-200"
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
                        <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm border border-slate-100 dark:border-white/[0.06] p-6 flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center shrink-0">
                                <Database className="w-6 h-6 text-[#1E3A8A] dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-foreground/45 uppercase tracking-wider">Total Resources</p>
                                <p className="text-3xl font-bold text-slate-900 dark:text-foreground mt-0.5">
                                    {loading ? <span className="text-xl text-slate-300">—</span> : totalResources}
                                </p>
                            </div>
                        </div>

                        {/* Available */}
                        <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm border border-slate-100 dark:border-white/[0.06] p-6 flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 flex items-center justify-center shrink-0">
                                <CheckCircle2 className="w-6 h-6 text-emerald-600 dark:text-emerald-450" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-foreground/45 uppercase tracking-wider">Available</p>
                                <p className="text-3xl font-bold text-emerald-600 dark:text-emerald-400 mt-0.5">
                                    {loading ? <span className="text-xl text-slate-300">—</span> : available}
                                </p>
                            </div>
                        </div>

                        {/* Booked */}
                        <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm border border-slate-100 dark:border-white/[0.06] p-6 flex items-center gap-5">
                            <div className="w-12 h-12 rounded-xl bg-red-50 dark:bg-red-500/10 flex items-center justify-center shrink-0">
                                <XCircle className="w-6 h-6 text-red-500 dark:text-red-400" />
                            </div>
                            <div>
                                <p className="text-xs font-semibold text-slate-500 dark:text-foreground/45 uppercase tracking-wider">Booked</p>
                                <p className="text-3xl font-bold text-red-500 dark:text-red-400 mt-0.5">
                                    {loading ? <span className="text-xl text-slate-300">—</span> : booked}
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* ── Search & Filters ── */}
                    <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm border border-slate-100 dark:border-white/[0.06] p-4 mb-4 flex flex-col sm:flex-row gap-3">
                        <div className="relative flex-1">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={(e) => {
                                    setSearchQuery(e.target.value);
                                    updateUrlParams(1, pageSize);
                                }}
                                placeholder="Search resources…"
                                className="w-full pl-10 pr-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-800 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                            />
                        </div>
                        <select
                            value={selectedCategory}
                            onChange={(e) => {
                                setSelectedCategory(e.target.value);
                                updateUrlParams(1, pageSize);
                            }}
                            className="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-foreground/75 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
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
                            onChange={(e) => {
                                setSelectedStatus(e.target.value);
                                updateUrlParams(1, pageSize);
                            }}
                            className="px-4 py-2.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl text-sm font-medium text-slate-700 dark:text-foreground/75 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all appearance-none cursor-pointer"
                        >
                            <option value="All">All Statuses</option>
                            <option value="Available">Available</option>
                            <option value="Booked">Booked</option>
                            <option value="Maintenance">Maintenance</option>
                        </select>
                    </div>

                    {/* ── Saved Searches & Export ── */}
                    <div className="flex items-center justify-between gap-4 mb-6">
                        <SavedSearches
                            pageKey="resources"
                            currentFilters={{
                                searchQuery,
                                selectedCategory,
                                selectedStatus,
                            }}
                            onLoadFilters={(filters) => {
                                if (filters.searchQuery !== undefined) setSearchQuery(filters.searchQuery);
                                if (filters.selectedCategory !== undefined) setSelectedCategory(filters.selectedCategory);
                                if (filters.selectedStatus !== undefined) setSelectedStatus(filters.selectedStatus);
                                updateUrlParams(1, pageSize);
                            }}
                        />
                        <button
                            onClick={() => {
                                exportToCSV(
                                    filteredResources,
                                    ["Name", "Type", "Capacity", "Location", "Status"],
                                    ["name", "type", "capacity", "location", "availability_status"],
                                    "resources"
                                );
                            }}
                            className="inline-flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 active:scale-95 text-slate-700 dark:text-foreground/80 font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200 text-sm"
                        >
                            <DownloadCloud className="w-4 h-4 text-emerald-500" />
                            <span>Export CSV</span>
                        </button>
                    </div>

                    {/* ── Error Banner ── */}
                    {error && (
                        <div className="mb-6 p-4 bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 text-red-600 dark:text-red-400 rounded-xl text-sm font-medium flex items-center gap-2">
                            <XCircle className="w-4 h-4 shrink-0" />
                            {error}
                        </div>
                    )}

                    {/* ── Table ── */}
                    <div className="bg-white dark:bg-slate-900/60 rounded-2xl shadow-sm border border-slate-100 dark:border-white/[0.06] overflow-hidden">
                        {loading ? (
                            <div className="flex items-center justify-center py-24">
                                <div className="animate-spin rounded-full h-10 w-10 border-[3px] border-slate-200 border-t-[#1E3A8A] dark:border-t-blue-500" />
                            </div>
                        ) : filteredResources.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-24 text-center px-6">
                                <div className="w-16 h-16 rounded-2xl bg-blue-50 dark:bg-blue-500/10 flex items-center justify-center mb-4">
                                    <Search className="w-7 h-7 text-blue-300 dark:text-blue-400" />
                                </div>
                                <h3 className="text-lg font-bold text-slate-800 dark:text-foreground mb-1">No resources found</h3>
                                <p className="text-sm text-slate-500 dark:text-foreground/45">Try adjusting your search or filters.</p>
                            </div>
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full text-sm">
                                    <thead>
                                        <tr className="border-b border-slate-100 dark:border-white/[0.06] bg-slate-50/60 dark:bg-white/[0.02]">
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
                                                    className="px-6 py-4 text-left text-xs font-semibold text-slate-505 dark:text-foreground/40 uppercase tracking-wider cursor-pointer select-none hover:text-[#1E3A8A] dark:hover:text-blue-450 transition-colors"
                                                    onClick={() => handleSort(field)}
                                                >
                                                    <span className="inline-flex items-center gap-1.5">
                                                        {label}
                                                        <SortIcon field={field} />
                                                    </span>
                                                </th>
                                            ))}
                                            {isAdmin && (
                                                <th className="px-6 py-4 text-right text-xs font-semibold text-slate-505 dark:text-foreground/40 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            )}
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                                        {paginatedResources.map((resource) => (
                                            <tr
                                                key={resource.id}
                                                className="hover:bg-blue-50/40 dark:hover:bg-white/[0.01] transition-colors duration-150 group"
                                            >
                                                {/* Name */}
                                                <td className="px-6 py-4">
                                                    <span className="font-semibold text-slate-800 dark:text-foreground">{resource.name}</span>
                                                    {resource.location && (
                                                        <p className="text-xs text-slate-400 dark:text-foreground/30 mt-0.5">{resource.location}</p>
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
                                                <td className="px-6 py-4 text-slate-700 dark:text-foreground/80 font-medium">
                                                    {resource.capacity}
                                                </td>

                                                {/* Status */}
                                                <td className="px-6 py-4">
                                                    <button
                                                        type="button"
                                                        onClick={() => handleToggleStatus(resource)}
                                                        disabled={updatingStatusId === resource.id}
                                                        title="Click to toggle status"
                                                        className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full transition-colors border ${resource.availability_status === "Available"
                                                            ? "bg-emerald-100 dark:bg-emerald-500/10 text-emerald-700 dark:text-emerald-450 border-emerald-250 dark:border-emerald-500/20"
                                                            : resource.availability_status === "Booked"
                                                                ? "bg-red-100 dark:bg-red-500/10 text-red-600 dark:text-red-400 border-red-250 dark:border-red-500/20"
                                                                : "bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-450 border-amber-250 dark:border-amber-500/20"
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
                                                                className="p-2 rounded-lg text-slate-400 hover:text-[#1E3A8A] dark:hover:text-blue-400 hover:bg-blue-50 dark:hover:bg-white/5 transition-all duration-150"
                                                            >
                                                                <Edit3 className="w-4 h-4" />
                                                            </button>
                                                            <button
                                                                onClick={() => handleDelete(resource.id)}
                                                                title="Delete"
                                                                disabled={deletingId === resource.id}
                                                                className="p-2 rounded-lg text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-white/5 transition-all duration-150 disabled:opacity-40"
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

                                <Pagination
                                    currentPage={currentPage}
                                    pageSize={pageSize}
                                    totalItems={filteredResources.length}
                                    onPageChange={(p) => updateUrlParams(p, pageSize)}
                                    onPageSizeChange={(sz) => updateUrlParams(1, sz)}
                                />
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

export default function ResourcesPage() {
    return (
        <Suspense fallback={<div className="max-w-7xl mx-auto px-4 py-10 text-center font-bold text-slate-500">Loading Resources...</div>}>
            <ResourcesPageContent />
        </Suspense>
    );
}
