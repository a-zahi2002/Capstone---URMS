"use client";

import React, { useEffect, useMemo, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import NewBookingModal from "@/components/NewBookingModal";
import { supabase } from "@/lib/supabase";
import {
    Plus,
    Search,
    Filter,
    Calendar,
    Clock,
    MapPin,
    MoreVertical,
    ChevronLeft,
    ChevronRight
} from "lucide-react";

type CalendarView = "week" | "month";
type AvailabilityStatus = "Available" | "Limited" | "Booked";

interface ResourceItem {
    id: string;
    name: string;
    type: string;
    location: string;
    availability_status: string;
}

interface BookingResource {
    id: string;
    name: string;
    type: string;
    location: string;
}

interface BookingRow {
    id: string;
    resource_id: string;
    start_time: string;
    end_time: string;
    status: string;
    resources?: BookingResource | BookingResource[] | null;
}

interface DaySummary {
    status: AvailabilityStatus;
    bookingCount: number;
    bookedResources: number;
    totalResources: number;
}

const WORKDAY_START_HOUR = 8;
const WORKDAY_END_HOUR = 17;
const ALL_RESOURCES_LIMITED_THRESHOLD = 0.3;
const ALL_RESOURCES_BOOKED_THRESHOLD = 0.7;
const SINGLE_RESOURCE_LIMITED_THRESHOLD = 0.1;
const SINGLE_RESOURCE_BOOKED_THRESHOLD = 0.85;
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const startOfDay = (date: Date) =>
    new Date(date.getFullYear(), date.getMonth(), date.getDate());

const toDateKey = (date: Date) => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    return `${year}-${month}-${day}`;
};

const addDays = (date: Date, amount: number) => {
    const next = new Date(date);
    next.setDate(next.getDate() + amount);
    return next;
};

const getStartOfWeek = (date: Date) => {
    const start = startOfDay(date);
    const day = start.getDay();
    const diff = (day + 6) % 7;
    start.setDate(start.getDate() - diff);
    return start;
};

const buildWeek = (date: Date) => {
    const start = getStartOfWeek(date);
    return Array.from({ length: 7 }, (_, idx) => addDays(start, idx));
};

const buildMonthGrid = (date: Date) => {
    const firstOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
    const gridStart = getStartOfWeek(firstOfMonth);
    return Array.from({ length: 42 }, (_, idx) => addDays(gridStart, idx));
};

const formatDateLabel = (value: string) =>
    new Date(value).toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
        year: "numeric",
    });

const formatTimeLabel = (value: string) =>
    new Date(value).toLocaleTimeString("en-US", {
        hour: "2-digit",
        minute: "2-digit",
        hour12: false,
    });

const getBookingResource = (booking: BookingRow) => {
    if (!booking.resources) return null;
    return Array.isArray(booking.resources)
        ? booking.resources[0] || null
        : booking.resources;
};

const getOverlapMinutes = (
    start: Date,
    end: Date,
    windowStart: Date,
    windowEnd: Date
) => {
    const startMs = Math.max(start.getTime(), windowStart.getTime());
    const endMs = Math.min(end.getTime(), windowEnd.getTime());
    return Math.max(0, (endMs - startMs) / 60000);
};

const getAvailabilityClasses = (status: AvailabilityStatus) => {
    if (status === "Available") {
        return "bg-emerald-50 text-emerald-700 border border-emerald-100";
    }
    if (status === "Limited") {
        return "bg-amber-50 text-amber-700 border border-amber-100";
    }
    return "bg-rose-50 text-rose-700 border border-rose-100";
};

const normalizeBookingStatus = (status: string) => {
    if (status === "Approved") return "Confirmed";
    if (status === "Pending") return "Pending";
    if (status === "Cancelled") return "Cancelled";
    if (status === "Completed") return "Completed";
    return status;
};

const getBookingStatusClasses = (statusLabel: string) => {
    if (statusLabel === "Confirmed") {
        return "bg-emerald-50 text-emerald-600 border border-emerald-100";
    }
    if (statusLabel === "Pending") {
        return "bg-amber-50 text-amber-600 border border-amber-100";
    }
    if (statusLabel === "Cancelled") {
        return "bg-red-50 text-red-600 border border-red-100";
    }
    return "bg-slate-100 text-slate-600 border border-slate-200";
};

export default function BookingsPage() {
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [resources, setResources] = useState<ResourceItem[]>([]);
    const [bookings, setBookings] = useState<BookingRow[]>([]);
    const [loadingResources, setLoadingResources] = useState(true);
    const [loadingBookings, setLoadingBookings] = useState(true);
    const [resourceError, setResourceError] = useState<string | null>(null);
    const [bookingError, setBookingError] = useState<string | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const [calendarView, setCalendarView] = useState<CalendarView>("month");
    const [activeDate, setActiveDate] = useState(() => new Date());
    const [selectedResourceId, setSelectedResourceId] = useState("all");
    const [refreshSignal, setRefreshSignal] = useState(0);

    const calendarDays = useMemo(
        () =>
            calendarView === "week"
                ? buildWeek(activeDate)
                : buildMonthGrid(activeDate),
        [calendarView, activeDate]
    );

    const calendarRange = useMemo(() => {
        if (calendarDays.length === 0) return null;
        const rangeStart = startOfDay(calendarDays[0]);
        const rangeEnd = startOfDay(addDays(calendarDays[calendarDays.length - 1], 1));
        return { rangeStart, rangeEnd };
    }, [calendarDays]);

    const rangeStartIso = calendarRange?.rangeStart.toISOString() ?? null;
    const rangeEndIso = calendarRange?.rangeEnd.toISOString() ?? null;

    const calendarLabel = useMemo(() => {
        if (!calendarRange) return "";
        if (calendarView === "month") {
            return activeDate.toLocaleDateString("en-US", {
                month: "long",
                year: "numeric",
            });
        }
        const start = calendarRange.rangeStart;
        const end = addDays(calendarRange.rangeStart, 6);
        const startLabel = start.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
        const endLabel = end.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
        const yearLabel = end.toLocaleDateString("en-US", { year: "numeric" });
        return `${startLabel} - ${endLabel}, ${yearLabel}`;
    }, [calendarView, calendarRange, activeDate]);

    const calendarSubLabel = useMemo(() => {
        if (!calendarRange) return "";
        if (calendarView === "month") return "Availability by day";
        const start = calendarRange.rangeStart;
        const end = addDays(calendarRange.rangeStart, 6);
        const startLabel = start.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
        const endLabel = end.toLocaleDateString("en-US", {
            month: "short",
            day: "numeric",
        });
        return `Week of ${startLabel} - ${endLabel}`;
    }, [calendarView, calendarRange]);

    useEffect(() => {
        let isActive = true;
        const loadResources = async () => {
            setLoadingResources(true);
            setResourceError(null);
            try {
                const { data, error } = await supabase
                    .from("resources")
                    .select("id, name, type, location, availability_status")
                    .order("name");
                if (error) throw error;
                if (isActive) setResources((data as ResourceItem[]) || []);
            } catch (err: any) {
                if (isActive) {
                    setResourceError(err.message || "Failed to load resources.");
                }
            } finally {
                if (isActive) setLoadingResources(false);
            }
        };
        loadResources();
        return () => {
            isActive = false;
        };
    }, []);

    useEffect(() => {
        if (!rangeStartIso || !rangeEndIso) return;
        let isActive = true;
        const loadBookings = async () => {
            setLoadingBookings(true);
            setBookingError(null);
            try {
                let query = supabase
                    .from("bookings")
                    .select(
                        "id, resource_id, start_time, end_time, status, resources ( id, name, type, location )"
                    )
                    .lt("start_time", rangeEndIso)
                    .gt("end_time", rangeStartIso)
                    .order("start_time", { ascending: true });

                if (selectedResourceId !== "all") {
                    query = query.eq("resource_id", selectedResourceId);
                }

                const { data, error } = await query;
                if (error) throw error;
                if (isActive) setBookings((data as BookingRow[]) || []);
            } catch (err: any) {
                if (isActive) {
                    setBookingError(err.message || "Failed to load bookings.");
                }
            } finally {
                if (isActive) setLoadingBookings(false);
            }
        };
        loadBookings();
        return () => {
            isActive = false;
        };
    }, [rangeStartIso, rangeEndIso, selectedResourceId, refreshSignal]);

    const daySummaries = useMemo(() => {
        const summaries = new Map<string, DaySummary>();
        if (calendarDays.length === 0) return summaries;

        const relevantResources =
            selectedResourceId === "all"
                ? resources
                : resources.filter((resource) => resource.id === selectedResourceId);
        const totalResources = relevantResources.length;

        for (const day of calendarDays) {
            const dayStart = startOfDay(day);
            const dayEnd = addDays(dayStart, 1);
            const workStart = new Date(dayStart);
            workStart.setHours(WORKDAY_START_HOUR, 0, 0, 0);
            const workEnd = new Date(dayStart);
            workEnd.setHours(WORKDAY_END_HOUR, 0, 0, 0);

            let bookingCount = 0;
            let bookedMinutes = 0;
            const bookedResources = new Set<string>();

            for (const booking of bookings) {
                if (booking.status === "Cancelled") continue;
                if (
                    selectedResourceId !== "all" &&
                    booking.resource_id !== selectedResourceId
                ) {
                    continue;
                }

                const bookingStart = new Date(booking.start_time);
                const bookingEnd = new Date(booking.end_time);

                if (bookingStart >= dayEnd || bookingEnd <= dayStart) continue;

                bookingCount += 1;
                bookedResources.add(booking.resource_id);

                if (selectedResourceId !== "all") {
                    bookedMinutes += getOverlapMinutes(
                        bookingStart,
                        bookingEnd,
                        workStart,
                        workEnd
                    );
                }
            }

            let status: AvailabilityStatus = "Available";
            if (selectedResourceId === "all") {
                const ratio =
                    totalResources > 0
                        ? bookedResources.size / totalResources
                        : 0;
                status =
                    ratio >= ALL_RESOURCES_BOOKED_THRESHOLD
                        ? "Booked"
                        : ratio >= ALL_RESOURCES_LIMITED_THRESHOLD
                            ? "Limited"
                            : "Available";
            } else {
                const workMinutes = Math.max(
                    0,
                    (WORKDAY_END_HOUR - WORKDAY_START_HOUR) * 60
                );
                status =
                    bookedMinutes >= workMinutes * SINGLE_RESOURCE_BOOKED_THRESHOLD
                        ? "Booked"
                        : bookedMinutes >= workMinutes * SINGLE_RESOURCE_LIMITED_THRESHOLD
                            ? "Limited"
                            : "Available";
            }

            summaries.set(toDateKey(dayStart), {
                status,
                bookingCount,
                bookedResources: bookedResources.size,
                totalResources,
            });
        }

        return summaries;
    }, [calendarDays, bookings, resources, selectedResourceId]);

    const filteredBookings = useMemo(() => {
        if (!searchQuery) return bookings;
        const q = searchQuery.toLowerCase();
        return bookings.filter((booking) => {
            const resource = getBookingResource(booking);
            const name = resource?.name || "";
            const location = resource?.location || "";
            const type = resource?.type || "";
            return (
                name.toLowerCase().includes(q) ||
                location.toLowerCase().includes(q) ||
                type.toLowerCase().includes(q)
            );
        });
    }, [bookings, searchQuery]);

    const totalBookings = bookings.length;
    const shownBookings = filteredBookings.length;
    const todayKey = toDateKey(new Date());
    const combinedError = [resourceError, bookingError]
        .filter(Boolean)
        .join(" ");

    const handlePrev = () => {
        setActiveDate((current) => {
            const next = new Date(current);
            if (calendarView === "month") {
                next.setMonth(next.getMonth() - 1);
            } else {
                next.setDate(next.getDate() - 7);
            }
            return next;
        });
    };

    const handleNext = () => {
        setActiveDate((current) => {
            const next = new Date(current);
            if (calendarView === "month") {
                next.setMonth(next.getMonth() + 1);
            } else {
                next.setDate(next.getDate() + 7);
            }
            return next;
        });
    };

    const handleToday = () => {
        setActiveDate(new Date());
    };

    const handleBookingRefresh = () => {
        setRefreshSignal((value) => value + 1);
    };

    return (
        <ProtectedRoute>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
                <header className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-10">
                    <div>
                        <h1 className="text-3xl font-black text-slate-900 tracking-tight mb-2">Resource Bookings</h1>
                        <p className="text-slate-500 font-medium">Manage and monitor facility schedules across all university faculties.</p>
                    </div>
                    <button
                        onClick={() => setIsModalOpen(true)}
                        className="inline-flex items-center justify-center gap-2 bg-brand-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-brand-secondary transition-all shadow-lg active:scale-95 whitespace-nowrap"
                    >
                        <Plus className="w-5 h-5" />
                        New Booking
                    </button>
                </header>

                {combinedError && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-100 text-red-600 rounded-2xl text-sm font-semibold">
                        {combinedError}
                    </div>
                )}

                {/* Availability Calendar */}
                <section className="mb-8">
                    <div className="bg-white rounded-3xl border border-slate-100 shadow-sm p-6">
                        <div className="flex flex-col xl:flex-row xl:items-center xl:justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-xl font-black text-slate-900">Booking Availability</h2>
                                <p className="text-sm font-medium text-slate-500">{calendarSubLabel}</p>
                            </div>
                            <div className="flex flex-wrap items-center gap-2">
                                <div className="flex items-center gap-2 px-2 py-1.5 border border-slate-200 rounded-xl bg-slate-50">
                                    <button
                                        onClick={handlePrev}
                                        className="p-1.5 rounded-lg hover:bg-white transition-colors text-slate-500"
                                        aria-label="Previous"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="text-sm font-bold text-slate-700 whitespace-nowrap">{calendarLabel}</span>
                                    <button
                                        onClick={handleNext}
                                        className="p-1.5 rounded-lg hover:bg-white transition-colors text-slate-500"
                                        aria-label="Next"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                    <button
                                        onClick={handleToday}
                                        className="px-2.5 py-1 text-xs font-bold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-50 transition-colors"
                                    >
                                        Today
                                    </button>
                                </div>
                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setCalendarView("week")}
                                        className={`px-3 py-2 border rounded-xl text-xs font-bold transition-colors ${calendarView === "week"
                                            ? "bg-brand-primary text-white border-brand-primary"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        Week
                                    </button>
                                    <button
                                        onClick={() => setCalendarView("month")}
                                        className={`px-3 py-2 border rounded-xl text-xs font-bold transition-colors ${calendarView === "month"
                                            ? "bg-brand-primary text-white border-brand-primary"
                                            : "border-slate-200 text-slate-600 hover:bg-slate-50"
                                            }`}
                                    >
                                        Month
                                    </button>
                                </div>
                                <select
                                    value={selectedResourceId}
                                    onChange={(e) => setSelectedResourceId(e.target.value)}
                                    disabled={loadingResources}
                                    className="px-3 py-2 border border-slate-200 rounded-xl text-xs font-bold text-slate-600 bg-slate-50 hover:bg-white transition-colors min-w-[180px]"
                                >
                                    <option value="all">
                                        {loadingResources ? "Loading resources..." : "All resources"}
                                    </option>
                                    {resources.map((resource) => (
                                        <option key={resource.id} value={resource.id}>
                                            {resource.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {loadingBookings ? (
                            <div className="py-12 text-center text-sm font-semibold text-slate-400">
                                Loading availability...
                            </div>
                        ) : (
                            <>
                                <div className="grid grid-cols-7 gap-2 text-[11px] font-black uppercase tracking-widest text-slate-400">
                                    {WEEKDAYS.map((label) => (
                                        <span key={label} className="text-center">
                                            {label}
                                        </span>
                                    ))}
                                </div>
                                <div className="grid grid-cols-7 gap-2 mt-2">
                                    {calendarDays.map((day) => {
                                        const dayKey = toDateKey(day);
                                        const summary = daySummaries.get(dayKey);
                                        const status = summary?.status || "Available";
                                        const isOutsideMonth =
                                            calendarView === "month" &&
                                            day.getMonth() !== activeDate.getMonth();
                                        const isToday = dayKey === todayKey;
                                        const bookingCount = summary?.bookingCount || 0;
                                        const metaText =
                                            selectedResourceId === "all"
                                                ? summary && summary.totalResources > 0
                                                    ? `${summary.bookedResources}/${summary.totalResources} resources booked`
                                                    : "No resources"
                                                : bookingCount > 0
                                                    ? `${bookingCount} booking${bookingCount > 1 ? "s" : ""}`
                                                    : "Open slots";
                                        return (
                                            <div
                                                key={dayKey}
                                                className={`rounded-2xl border p-3 min-h-[110px] flex flex-col justify-between ${isOutsideMonth
                                                    ? "bg-slate-50 text-slate-400 border-slate-100"
                                                    : "bg-slate-50/60 border-slate-100"
                                                    } ${isToday
                                                        ? "ring-2 ring-brand-primary/20"
                                                        : ""
                                                    }`}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span
                                                        className={`text-sm font-bold ${isOutsideMonth
                                                            ? "text-slate-400"
                                                            : "text-slate-800"
                                                            }`}
                                                    >
                                                        {day.getDate()}
                                                    </span>
                                                    {bookingCount > 0 && (
                                                        <span className="text-[10px] font-bold text-slate-400">
                                                            {bookingCount} booking{bookingCount > 1 ? "s" : ""}
                                                        </span>
                                                    )}
                                                </div>
                                                <div className="mt-2">
                                                    <span
                                                        className={`inline-flex px-2 py-1 rounded-full text-[10px] font-black uppercase tracking-widest ${getAvailabilityClasses(status)
                                                            }`}
                                                    >
                                                        {status}
                                                    </span>
                                                </div>
                                                <div className="mt-2 text-[11px] font-semibold text-slate-400">
                                                    {metaText}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            </>
                        )}

                        <div className="mt-6 flex flex-wrap gap-3 text-xs font-bold text-slate-500">
                            <span className="inline-flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500"></span>
                                Available
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-amber-500"></span>
                                Limited
                            </span>
                            <span className="inline-flex items-center gap-2">
                                <span className="w-2.5 h-2.5 rounded-full bg-rose-500"></span>
                                Booked
                            </span>
                        </div>
                    </div>
                </section>

                {/* Filters & Search */}
                <div className="bg-white p-4 rounded-3xl border border-slate-100 shadow-sm mb-8 flex flex-col lg:flex-row gap-4">
                    <div className="relative flex-1 group">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400 transition-colors group-focus-within:text-brand-primary" />
                        <input
                            type="text"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Search by resource name, type, or location..."
                            className="w-full pl-12 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
                        />
                    </div>
                    <div className="flex gap-4">
                        <button className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                            <Filter className="w-4 h-4" />
                            Filters
                        </button>
                        <button className="flex items-center gap-2 px-5 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors">
                            <Calendar className="w-4 h-4" />
                            {calendarLabel || "Select range"}
                        </button>
                    </div>
                </div>

                {/* Bookings Table */}
                <div className="bg-white rounded-3xl border border-slate-100 shadow-sm overflow-hidden">
                    <div className="overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="bg-slate-50 border-b border-slate-100">
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Resource / Facility</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Date & Time</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400">Status</th>
                                    <th className="px-6 py-4 text-xs font-black uppercase tracking-widest text-slate-400"></th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-50">
                                {loadingBookings ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-10 text-center text-sm font-semibold text-slate-400"
                                        >
                                            Loading bookings...
                                        </td>
                                    </tr>
                                ) : filteredBookings.length === 0 ? (
                                    <tr>
                                        <td
                                            colSpan={4}
                                            className="px-6 py-10 text-center text-sm font-semibold text-slate-400"
                                        >
                                            No bookings found for this range.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredBookings.map((booking) => {
                                        const statusLabel = normalizeBookingStatus(booking.status);
                                        const resource = getBookingResource(booking);
                                        const resourceName =
                                            resource?.name || "Unknown resource";
                                        const resourceMeta = resource
                                            ? `${resource.type} - ${resource.location}`
                                            : "Resource details unavailable";
                                        const dateLabel = formatDateLabel(booking.start_time);
                                        const timeLabel = `${formatTimeLabel(
                                            booking.start_time
                                        )} - ${formatTimeLabel(booking.end_time)}`;

                                        return (
                                            <tr
                                                key={booking.id}
                                                className="hover:bg-slate-50/50 transition-colors group"
                                            >
                                                <td className="px-6 py-5">
                                                    <div className="flex items-center gap-4">
                                                        <div className="w-10 h-10 rounded-2xl bg-brand-primary/5 flex items-center justify-center">
                                                            <MapPin className="w-5 h-5 text-brand-primary" />
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-slate-900">
                                                                {resourceName}
                                                            </p>
                                                            <p className="text-xs font-medium text-slate-500 italic">
                                                                {resourceMeta}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <div className="flex flex-col gap-1">
                                                        <div className="flex items-center gap-2 text-sm font-bold text-slate-700">
                                                            <Calendar className="w-3.5 h-3.5" />
                                                            {dateLabel}
                                                        </div>
                                                        <div className="flex items-center gap-2 text-xs font-medium text-slate-500">
                                                            <Clock className="w-3.5 h-3.5" />
                                                            {timeLabel}
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-6 py-5">
                                                    <span
                                                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest shadow-sm ${getBookingStatusClasses(
                                                            statusLabel
                                                        )}`}
                                                    >
                                                        {statusLabel}
                                                    </span>
                                                </td>
                                                <td className="px-6 py-5 text-right">
                                                    <button className="p-2 hover:bg-slate-100 rounded-lg transition-colors text-slate-400 hover:text-slate-600">
                                                        <MoreVertical className="w-5 h-5" />
                                                    </button>
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                    <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
                        <p className="text-xs font-bold text-slate-500 items-center">
                            {loadingBookings
                                ? "Loading bookings..."
                                : `Showing ${shownBookings} of ${totalBookings} bookings`}
                        </p>
                        <div className="flex gap-2">
                            <button
                                disabled
                                className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-400 cursor-not-allowed"
                            >
                                Prev
                            </button>
                            <button
                                disabled
                                className="px-3 py-1 border border-slate-200 rounded-lg text-xs font-bold bg-white text-slate-400 cursor-not-allowed"
                            >
                                Next
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* New Booking Modal */}
            <NewBookingModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                onSuccess={handleBookingRefresh}
            />
        </ProtectedRoute>
    );
}

