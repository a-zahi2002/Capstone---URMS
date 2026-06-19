"use client";

import React, { useState, useMemo, useEffect } from "react";
import {
    Search,
    Filter,
    Calendar,
    Clock,
    MapPin,
    MoreVertical,
    ChevronLeft,
    ChevronRight,
    CheckCircle2,
    Clock as ClockIcon,
    XCircle,
    AlertCircle,
    X,
    Info,
    ArrowUpDown,
    HelpCircle,
    CalendarDays
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export interface BookingResource {
    id: string;
    name: string;
    type: string;
    location: string;
}

export interface BookingUser {
    id: string;
    name: string;
    email: string;
}

export interface BookingRow {
    id: string;
    resource_id: string;
    user_id?: string;
    start_time: string;
    end_time: string;
    status: string;
    created_at?: string;
    resources?: BookingResource | BookingResource[] | null;
    users?: BookingUser | BookingUser[] | null;
}

interface PersonalBookingDashboardProps {
    bookings: BookingRow[];
    loadingBookings: boolean;
    onEditBooking: (booking: BookingRow) => void;
    onDeleteBooking: (booking: BookingRow) => void;
    onCancelBooking: (bookingId: string) => Promise<void>;
    view: string;
}

const getBookingResource = (booking: BookingRow): BookingResource | null => {
    if (!booking.resources) return null;
    return Array.isArray(booking.resources)
        ? booking.resources[0] || null
        : booking.resources;
};

const getDuration = (start: string, end: string) => {
    try {
        const diffMs = new Date(end).getTime() - new Date(start).getTime();
        const diffMins = Math.round(diffMs / 60000);
        const hrs = Math.floor(diffMins / 60);
        const mins = diffMins % 60;
        if (hrs > 0) {
            return `${hrs}h ${mins > 0 ? `${mins}m` : ""}`;
        }
        return `${diffMins}m`;
    } catch {
        return "";
    }
};

const formatDateLabel = (value: string) => {
    try {
        return new Date(value).toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
            year: "numeric",
        });
    } catch {
        return value;
    }
};

const formatTimeLabel = (value: string) => {
    try {
        return new Date(value).toLocaleTimeString("en-US", {
            hour: "2-digit",
            minute: "2-digit",
            hour12: true,
        });
    } catch {
        return value;
    }
};

const normalizeBookingStatus = (status: string) => {
    if (status === "Approved") return "Confirmed";
    if (status === "Pending") return "Pending";
    if (status === "Cancelled") return "Cancelled";
    if (status === "Completed") return "Completed";
    if (status === "Rejected") return "Rejected";
    return status;
};

const getBookingStatusClasses = (statusLabel: string) => {
    if (statusLabel === "Confirmed") {
        return "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-100 dark:border-emerald-500/20";
    }
    if (statusLabel === "Pending") {
        return "bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-100 dark:border-amber-500/20";
    }
    if (statusLabel === "Cancelled") {
        return "bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 border border-red-100 dark:border-red-500/20";
    }
    if (statusLabel === "Rejected") {
        return "bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-500/20";
    }
    return "bg-slate-100 dark:bg-white/5 text-slate-600 dark:text-foreground/60 border border-slate-200 dark:border-white/10";
};

export default function PersonalBookingDashboard({
    bookings,
    loadingBookings,
    onEditBooking,
    onDeleteBooking,
    onCancelBooking,
    view
}: PersonalBookingDashboardProps) {
    const [searchQuery, setSearchQuery] = useState("");
    const [resourceTypeFilter, setResourceTypeFilter] = useState("All");
    const [statusFilter, setStatusFilter] = useState("All");
    const [sortOption, setSortOption] = useState("date-desc");
    const [currentPage, setCurrentPage] = useState(1);
    const [selectedBooking, setSelectedBooking] = useState<BookingRow | null>(null);
    const [activeDropdown, setActiveDropdown] = useState<string | null>(null);
    const pageSize = 5;

    // Reset page when filters change
    useEffect(() => {
        setCurrentPage(1);
    }, [searchQuery, resourceTypeFilter, statusFilter, sortOption]);

    // Close dropdowns on click outside
    useEffect(() => {
        const handleOutsideClick = () => setActiveDropdown(null);
        window.addEventListener("click", handleOutsideClick);
        return () => window.removeEventListener("click", handleOutsideClick);
    }, []);

    // Calculate booking stats
    const stats = useMemo(() => {
        const now = new Date();
        let total = bookings.length;
        let active = 0;
        let upcoming = 0;
        let completed = 0;
        let cancelledRejected = 0;

        bookings.forEach((b) => {
            const start = new Date(b.start_time);
            const end = new Date(b.end_time);
            const normalizedStatus = normalizeBookingStatus(b.status);

            if (normalizedStatus === "Cancelled" || normalizedStatus === "Rejected") {
                cancelledRejected++;
            } else if (normalizedStatus === "Completed" || end < now) {
                completed++;
            } else if (start <= now && end >= now && normalizedStatus === "Confirmed") {
                active++;
            } else if (start > now) {
                upcoming++;
            }
        });

        return { total, active, upcoming, completed, cancelledRejected };
    }, [bookings]);

    // Unique Resource Types from current bookings list
    const resourceTypes = useMemo(() => {
        const types = new Set<string>();
        bookings.forEach((b) => {
            const res = getBookingResource(b);
            if (res?.type) types.add(res.type);
        });
        return ["All", ...Array.from(types)];
    }, [bookings]);

    // Filtered Bookings
    const filteredBookings = useMemo(() => {
        const now = new Date();
        return bookings.filter((b) => {
            const res = getBookingResource(b);
            const statusLabel = normalizeBookingStatus(b.status);

            // Search Filter
            if (searchQuery) {
                const q = searchQuery.toLowerCase();
                const matchName = res?.name?.toLowerCase().includes(q) ?? false;
                const matchLocation = res?.location?.toLowerCase().includes(q) ?? false;
                const matchType = res?.type?.toLowerCase().includes(q) ?? false;
                if (!matchName && !matchLocation && !matchType) return false;
            }

            // Resource Type Filter
            if (resourceTypeFilter !== "All") {
                if (res?.type !== resourceTypeFilter) return false;
            }

            // Status Filter (includes logical states like upcoming, active, completed)
            if (statusFilter !== "All") {
                const start = new Date(b.start_time);
                const end = new Date(b.end_time);

                if (statusFilter === "Active") {
                    return statusLabel === "Confirmed" && start <= now && end >= now;
                }
                if (statusFilter === "Upcoming") {
                    return (statusLabel === "Confirmed" || statusLabel === "Pending") && start > now;
                }
                if (statusFilter === "Completed") {
                    return statusLabel === "Completed" || ((statusLabel === "Confirmed" || statusLabel === "Pending") && end < now);
                }
                if (statusFilter === "Cancelled") {
                    return statusLabel === "Cancelled";
                }
                if (statusFilter === "Rejected") {
                    return statusLabel === "Rejected";
                }
                if (statusFilter === "Pending") {
                    return statusLabel === "Pending";
                }
            }

            return true;
        });
    }, [bookings, searchQuery, resourceTypeFilter, statusFilter]);

    // Sorted Bookings
    const sortedBookings = useMemo(() => {
        const list = [...filteredBookings];
        list.sort((a, b) => {
            if (sortOption === "date-asc") {
                return new Date(a.start_time).getTime() - new Date(b.start_time).getTime();
            }
            if (sortOption === "date-desc") {
                return new Date(b.start_time).getTime() - new Date(a.start_time).getTime();
            }
            if (sortOption === "status-asc") {
                return a.status.localeCompare(b.status);
            }
            if (sortOption === "status-desc") {
                return b.status.localeCompare(a.status);
            }
            return 0;
        });
        return list;
    }, [filteredBookings, sortOption]);

    // Paginated Bookings
    const paginatedBookings = useMemo(() => {
        const startIdx = (currentPage - 1) * pageSize;
        return sortedBookings.slice(startIdx, startIdx + pageSize);
    }, [sortedBookings, currentPage]);

    const totalPages = Math.ceil(sortedBookings.length / pageSize) || 1;

    return (
        <div className="space-y-8 text-foreground">
            {/* ── Stats Cards Grid ── */}
            <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                    { label: "Total Bookings", value: stats.total, icon: CalendarDays, color: "text-blue-500", bg: "bg-blue-500/10" },
                    { label: "Active Now", value: stats.active, icon: CheckCircle2, color: "text-emerald-500", bg: "bg-emerald-500/10" },
                    { label: "Upcoming", value: stats.upcoming, icon: ClockIcon, color: "text-amber-500", bg: "bg-amber-500/10" },
                    { label: "Completed", value: stats.completed, icon: CheckCircle2, color: "text-purple-500", bg: "bg-purple-500/10" },
                    { label: "Cancelled / Declined", value: stats.cancelledRejected, icon: XCircle, color: "text-rose-500", bg: "bg-rose-500/10" },
                ].map((stat, i) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 15 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.35, delay: i * 0.05 }}
                        className="bg-card border border-slate-200 dark:border-white/[0.06] rounded-2xl p-5 shadow-sm hover:shadow-md hover:scale-[1.02] transition-all"
                    >
                        <div className={`w-10 h-10 rounded-xl ${stat.bg} flex items-center justify-center mb-3`}>
                            <stat.icon className={`w-5 h-5 ${stat.color}`} />
                        </div>
                        <p className="text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest leading-none mb-1">
                            {stat.label}
                        </p>
                        <p className="text-3xl font-black text-foreground">{loadingBookings ? "—" : stat.value}</p>
                    </motion.div>
                ))}
            </div>

            {/* ── Toolbar & Filters ── */}
            <div className="bg-white dark:bg-slate-900/60 p-5 rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-sm space-y-4">
                <div className="flex flex-col lg:flex-row gap-4">
                    {/* Search Input */}
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by resource name, location, or type..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 dark:bg-[#0c0a14] border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
                        />
                    </div>

                    {/* Filter by Resource Type */}
                    <div className="flex flex-wrap sm:flex-nowrap gap-4">
                        <div className="flex items-center gap-2">
                            <Filter className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-xs font-bold text-slate-500 dark:text-foreground/45 uppercase tracking-wider whitespace-nowrap">Type:</span>
                            <select
                                value={resourceTypeFilter}
                                onChange={(e) => setResourceTypeFilter(e.target.value)}
                                className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-foreground/80 bg-slate-50 dark:bg-[#0c0a14] focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors min-w-[120px]"
                            >
                                {resourceTypes.map((type) => (
                                    <option key={type} value={type}>
                                        {type}
                                    </option>
                                ))}
                            </select>
                        </div>

                        {/* Sort Option */}
                        <div className="flex items-center gap-2">
                            <ArrowUpDown className="w-4 h-4 text-slate-400 shrink-0" />
                            <span className="text-xs font-bold text-slate-500 dark:text-foreground/45 uppercase tracking-wider whitespace-nowrap">Sort:</span>
                            <select
                                value={sortOption}
                                onChange={(e) => setSortOption(e.target.value)}
                                className="px-3 py-2 border border-slate-200 dark:border-white/10 rounded-xl text-xs font-bold text-slate-700 dark:text-foreground/80 bg-slate-50 dark:bg-[#0c0a14] focus:outline-none focus:ring-2 focus:ring-brand-primary transition-colors min-w-[150px]"
                            >
                                <option value="date-desc">Date (Newest First)</option>
                                <option value="date-asc">Date (Oldest First)</option>
                                <option value="status-asc">Status (A-Z)</option>
                                <option value="status-desc">Status (Z-A)</option>
                            </select>
                        </div>
                    </div>
                </div>

                {/* Status Tabs */}
                <div className="flex flex-wrap gap-2 border-t border-slate-100 dark:border-white/[0.04] pt-4">
                    {[
                        { id: "All", label: "All Bookings" },
                        { id: "Active", label: "Active" },
                        { id: "Upcoming", label: "Upcoming" },
                        { id: "Pending", label: "Pending Approval" },
                        { id: "Completed", label: "Completed" },
                        { id: "Cancelled", label: "Cancelled" },
                        { id: "Rejected", label: "Rejected" },
                    ].map((status) => (
                        <button
                            key={status.id}
                            onClick={() => setStatusFilter(status.id)}
                            className={`px-4 py-2 rounded-xl text-xs font-black transition-all ${
                                statusFilter === status.id
                                    ? "bg-brand-primary text-white shadow-md shadow-brand-primary/20"
                                    : "bg-slate-50 dark:bg-white/5 text-slate-650 dark:text-foreground/60 hover:bg-slate-100 dark:hover:bg-white/10"
                            }`}
                        >
                            {status.label}
                        </button>
                    ))}
                </div>
            </div>

            {/* ── Bookings Grid / Table List ── */}
            <div className="bg-white dark:bg-slate-900/60 rounded-3xl border border-slate-100 dark:border-white/[0.06] shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead>
                            <tr className="bg-slate-50 dark:bg-white/[0.02] border-b border-slate-100 dark:border-white/[0.06]">
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40">Resource / Facility</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40">Date & Time</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40">Duration</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40">Status</th>
                                <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 dark:divide-white/[0.04]">
                            {loadingBookings ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-12 text-center text-sm font-semibold text-slate-400">
                                        <div className="flex items-center justify-center gap-2">
                                            <div className="w-4 h-4 border-2 border-brand-primary border-t-transparent rounded-full animate-spin"></div>
                                            Loading your bookings...
                                        </div>
                                    </td>
                                </tr>
                            ) : paginatedBookings.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="max-w-md mx-auto flex flex-col items-center">
                                            <Calendar className="w-12 h-12 text-slate-300 dark:text-foreground/20 mb-3" />
                                            <p className="text-base font-bold text-slate-700 dark:text-foreground/80">No bookings found</p>
                                            <p className="text-xs text-slate-400 dark:text-foreground/40 mt-1 mb-4">
                                                {bookings.length === 0
                                                    ? "You have not made any bookings yet. Create a reservation to get started!"
                                                    : "Try adjusting your search criteria or filter options to find the booking."}
                                            </p>
                                        </div>
                                    </td>
                                </tr>
                            ) : (
                                paginatedBookings.map((booking) => {
                                    const resource = getBookingResource(booking);
                                    const statusLabel = normalizeBookingStatus(booking.status);
                                    const resourceName = resource?.name || "Unknown resource";
                                    const resourceMeta = resource
                                        ? `${resource.type} • ${resource.location}`
                                        : "Resource details unavailable";

                                    return (
                                        <tr
                                            key={booking.id}
                                            className="hover:bg-slate-50/50 dark:hover:bg-white/[0.01] transition-colors group cursor-pointer"
                                            onClick={() => setSelectedBooking(booking)}
                                        >
                                            {/* Resource name */}
                                            <td className="px-6 py-5">
                                                <div className="flex items-center gap-4">
                                                    <div className="w-10 h-10 rounded-2xl bg-brand-primary/5 flex items-center justify-center shrink-0">
                                                        <MapPin className="w-5 h-5 text-brand-primary" />
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-bold text-slate-900 dark:text-foreground truncate group-hover:text-brand-primary transition-colors">
                                                            {resourceName}
                                                        </p>
                                                        <p className="text-xs font-semibold text-slate-400 dark:text-foreground/40 truncate">
                                                            {resourceMeta}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Date / Time */}
                                            <td className="px-6 py-5">
                                                <div className="flex flex-col gap-1">
                                                    <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-foreground/80">
                                                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                                                        {formatDateLabel(booking.start_time)}
                                                    </div>
                                                    <div className="flex items-center gap-2 text-xs font-semibold text-slate-500 dark:text-foreground/50">
                                                        <Clock className="w-3.5 h-3.5 text-slate-400" />
                                                        {formatTimeLabel(booking.start_time)} - {formatTimeLabel(booking.end_time)}
                                                    </div>
                                                </div>
                                            </td>

                                            {/* Duration */}
                                            <td className="px-6 py-5 text-sm font-semibold text-slate-650 dark:text-foreground/60">
                                                {getDuration(booking.start_time, booking.end_time)}
                                            </td>

                                            {/* Status Badge */}
                                            <td className="px-6 py-5">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getBookingStatusClasses(statusLabel)}`}>
                                                    {statusLabel}
                                                </span>
                                            </td>

                                            {/* Dropdown Actions */}
                                            <td className="px-6 py-5 text-right relative" onClick={(e) => e.stopPropagation()}>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        setActiveDropdown(activeDropdown === booking.id ? null : booking.id);
                                                    }}
                                                    className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-foreground"
                                                >
                                                    <MoreVertical className="w-5 h-5" />
                                                </button>

                                                <AnimatePresence>
                                                    {activeDropdown === booking.id && (
                                                        <motion.div
                                                            initial={{ opacity: 0, scale: 0.95 }}
                                                            animate={{ opacity: 1, scale: 1 }}
                                                            exit={{ opacity: 0, scale: 0.95 }}
                                                            transition={{ duration: 0.1 }}
                                                            className="absolute right-8 top-12 z-20 w-48 bg-white dark:bg-slate-950 rounded-xl shadow-xl border border-slate-100 dark:border-white/10 overflow-hidden text-left"
                                                        >
                                                            <div className="py-1">
                                                                <button
                                                                    onClick={() => {
                                                                        setSelectedBooking(booking);
                                                                        setActiveDropdown(null);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-sm font-semibold text-slate-700 dark:text-foreground/80 hover:bg-slate-50 dark:hover:bg-white/5 text-left flex items-center gap-2"
                                                                >
                                                                    <Info className="w-4 h-4" /> View Details
                                                                </button>
                                                                {booking.status === "Pending" && (
                                                                    <button
                                                                        onClick={() => {
                                                                            onEditBooking(booking);
                                                                            setActiveDropdown(null);
                                                                        }}
                                                                        className="w-full px-4 py-2 text-sm font-semibold text-brand-primary hover:bg-brand-primary/5 text-left flex items-center gap-2"
                                                                    >
                                                                        <Calendar className="w-4 h-4" /> Edit Booking
                                                                    </button>
                                                                )}
                                                                {(booking.status === "Pending" || booking.status === "Approved") && (
                                                                    <button
                                                                        onClick={async () => {
                                                                            if (confirm("Are you sure you want to cancel this booking?")) {
                                                                                await onCancelBooking(booking.id);
                                                                            }
                                                                            setActiveDropdown(null);
                                                                        }}
                                                                        className="w-full px-4 py-2 text-sm font-semibold text-amber-600 hover:bg-amber-500/10 text-left flex items-center gap-2"
                                                                    >
                                                                        <XCircle className="w-4 h-4" /> Cancel Booking
                                                                    </button>
                                                                )}
                                                                <button
                                                                    onClick={() => {
                                                                        onDeleteBooking(booking);
                                                                        setActiveDropdown(null);
                                                                    }}
                                                                    className="w-full px-4 py-2 text-sm font-semibold text-rose-600 hover:bg-rose-500/10 text-left flex items-center gap-2"
                                                                >
                                                                    <XCircle className="w-4 h-4 text-rose-600" /> Delete Record
                                                                </button>
                                                            </div>
                                                        </motion.div>
                                                    )}
                                                </AnimatePresence>
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>

                {/* Pagination footer */}
                {sortedBookings.length > 0 && (
                    <div className="px-6 py-4 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-white/[0.06] flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-500 dark:text-foreground/45">
                            {loadingBookings
                                ? "Loading bookings..."
                                : `Showing ${Math.min(sortedBookings.length, (currentPage - 1) * pageSize + 1)}-${Math.min(
                                      sortedBookings.length,
                                      currentPage * pageSize
                                  )} of ${sortedBookings.length} bookings`}
                        </p>
                        <div className="flex gap-2">
                            <button
                                onClick={() => setCurrentPage((c) => Math.max(1, c - 1))}
                                disabled={currentPage === 1 || loadingBookings}
                                className={`px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold transition-all ${
                                    currentPage === 1 || loadingBookings
                                        ? "bg-white/5 text-slate-400 dark:text-foreground/20 cursor-not-allowed"
                                        : "bg-white dark:bg-white/5 text-slate-650 dark:text-foreground/80 hover:bg-slate-50 dark:hover:bg-white/10"
                                }`}
                            >
                                <ChevronLeft className="w-3.5 h-3.5 inline mr-1" />
                                Prev
                            </button>
                            <span className="px-3 py-1.5 text-xs font-bold text-slate-500 dark:text-foreground/40 self-center">
                                Page {currentPage} of {totalPages}
                            </span>
                            <button
                                onClick={() => setCurrentPage((c) => Math.min(totalPages, c + 1))}
                                disabled={currentPage === totalPages || loadingBookings}
                                className={`px-3 py-1.5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-bold transition-all ${
                                    currentPage === totalPages || loadingBookings
                                        ? "bg-white/5 text-slate-400 dark:text-foreground/20 cursor-not-allowed"
                                        : "bg-white dark:bg-white/5 text-slate-650 dark:text-foreground/80 hover:bg-slate-50 dark:hover:bg-white/10"
                                }`}
                            >
                                Next
                                <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
                            </button>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Detail Modal ── */}
            <AnimatePresence>
                {selectedBooking && (() => {
                    const resource = getBookingResource(selectedBooking);
                    const statusLabel = normalizeBookingStatus(selectedBooking.status);
                    return (
                        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                            {/* Backdrop */}
                            <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                exit={{ opacity: 0 }}
                                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                                onClick={() => setSelectedBooking(null)}
                            />

                            {/* Modal panel */}
                            <motion.div
                                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                                animate={{ opacity: 1, scale: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                                className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden"
                            >
                                {/* Header */}
                                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                                    <div>
                                        <h2 className="text-xl font-black text-slate-900 dark:text-foreground tracking-tight">Booking Details</h2>
                                        <p className="text-xs font-medium text-slate-500 dark:text-foreground/50 mt-0.5">Reference: {selectedBooking.id}</p>
                                    </div>
                                    <button
                                        onClick={() => setSelectedBooking(null)}
                                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-slate-600 dark:hover:text-foreground"
                                    >
                                        <X className="w-5 h-5" />
                                    </button>
                                </div>

                                {/* Body */}
                                <div className="p-6 space-y-6">
                                    {/* Resource Info */}
                                    <div className="space-y-3">
                                        <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40 leading-none">
                                            Resource Information
                                        </h4>
                                        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] p-4 rounded-2xl flex items-start gap-4">
                                            <div className="w-10 h-10 rounded-2xl bg-brand-primary/5 flex items-center justify-center shrink-0">
                                                <MapPin className="w-5 h-5 text-brand-primary" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-bold text-slate-900 dark:text-foreground">
                                                    {resource?.name || "Unknown resource"}
                                                </h3>
                                                <p className="text-xs text-slate-500 dark:text-foreground/50 font-medium mt-1">
                                                    <span className="font-bold text-slate-700 dark:text-foreground/80">Location:</span> {resource?.location || "N/A"}
                                                </p>
                                                <p className="text-xs text-slate-500 dark:text-foreground/50 font-medium mt-0.5">
                                                    <span className="font-bold text-slate-700 dark:text-foreground/80">Type:</span> {resource?.type || "N/A"}
                                                </p>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Date & Time Info */}
                                    <div className="grid grid-cols-2 gap-4">
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40 leading-none">
                                                Scheduled Date
                                            </span>
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-foreground/85">
                                                <Calendar className="w-4 h-4 text-slate-400 shrink-0" />
                                                {formatDateLabel(selectedBooking.start_time)}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40 leading-none">
                                                Duration
                                            </span>
                                            <div className="flex items-center gap-2 text-sm font-bold text-slate-700 dark:text-foreground/85">
                                                <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                                                {getDuration(selectedBooking.start_time, selectedBooking.end_time)}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40 leading-none">
                                                Start Time
                                            </span>
                                            <div className="text-xs font-semibold text-slate-600 dark:text-foreground/70">
                                                {formatTimeLabel(selectedBooking.start_time)}
                                            </div>
                                        </div>
                                        <div className="space-y-1.5">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40 leading-none">
                                                End Time
                                            </span>
                                            <div className="text-xs font-semibold text-slate-600 dark:text-foreground/70">
                                                {formatTimeLabel(selectedBooking.end_time)}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Purpose (if any) */}
                                    <div className="space-y-2">
                                        <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40 leading-none">
                                            Booking Purpose
                                        </span>
                                        <div className="bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.04] p-4 rounded-2xl text-sm font-semibold text-slate-650 dark:text-foreground/70 min-h-[60px]">
                                            {(selectedBooking as any).purpose || "No purpose provided."}
                                        </div>
                                    </div>

                                    {/* Reservation Status */}
                                    <div className="flex items-center justify-between border-t border-slate-100 dark:border-white/[0.04] pt-5">
                                        <div className="space-y-1">
                                            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40 leading-none">
                                                Status
                                            </span>
                                            <div className="flex items-center gap-2 mt-1">
                                                <span className={`inline-flex px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getBookingStatusClasses(statusLabel)}`}>
                                                    {statusLabel}
                                                </span>
                                            </div>
                                        </div>

                                        {selectedBooking.created_at && (
                                            <div className="text-right space-y-1">
                                                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 dark:text-foreground/40 leading-none">
                                                    Requested On
                                                </span>
                                                <p className="text-xs font-semibold text-slate-500 dark:text-foreground/50 mt-1">
                                                    {formatDateLabel(selectedBooking.created_at)} @ {formatTimeLabel(selectedBooking.created_at)}
                                                </p>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                {/* Footer actions */}
                                <div className="px-6 py-5 bg-slate-50 dark:bg-white/[0.02] border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3">
                                    <button
                                        type="button"
                                        onClick={() => setSelectedBooking(null)}
                                        className="px-5 py-2.5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-bold text-slate-600 dark:text-foreground/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                                    >
                                        Close
                                    </button>
                                    {selectedBooking.status === "Pending" && (
                                        <button
                                            type="button"
                                            onClick={() => {
                                                onEditBooking(selectedBooking);
                                                setSelectedBooking(null);
                                            }}
                                            className="px-5 py-2.5 bg-brand-primary text-white font-bold rounded-2xl hover:bg-brand-secondary transition-all"
                                        >
                                            Edit
                                        </button>
                                    )}
                                    {(selectedBooking.status === "Pending" || selectedBooking.status === "Approved") && (
                                        <button
                                            type="button"
                                            onClick={async () => {
                                                if (confirm("Are you sure you want to cancel this booking?")) {
                                                    await onCancelBooking(selectedBooking.id);
                                                    setSelectedBooking(null);
                                                }
                                            }}
                                            className="px-5 py-2.5 bg-amber-600 text-white font-bold rounded-2xl hover:bg-amber-700 transition-all"
                                        >
                                            Cancel Booking
                                        </button>
                                    )}
                                </div>
                            </motion.div>
                        </div>
                    );
                })()}
            </AnimatePresence>
        </div>
    );
}
