"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, MapPin, BookOpen, AlertTriangle, Pencil } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

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

interface EditBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    booking: BookingRow | null;
}

export default function EditBookingModal({ isOpen, onClose, onSuccess, booking }: EditBookingModalProps) {
    const { user } = useAuth();
    const [formData, setFormData] = useState({
        date: "",
        startTime: "",
        endTime: "",
    });
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Populate form when booking changes
    useEffect(() => {
        if (booking && isOpen) {
            try {
                const start = new Date(booking.start_time);
                const end = new Date(booking.end_time);
                const dateStr = start.toISOString().split("T")[0];
                const startTimeStr = start.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });
                const endTimeStr = end.toLocaleTimeString("en-US", {
                    hour: "2-digit",
                    minute: "2-digit",
                    hour12: false,
                });
                setFormData({ date: dateStr, startTime: startTimeStr, endTime: endTimeStr });
            } catch {
                setFormData({ date: "", startTime: "", endTime: "" });
            }
            setError(null);
        }
    }, [booking, isOpen]);

    if (!isOpen || !booking) return null;

    const resource = booking.resources
        ? Array.isArray(booking.resources)
            ? booking.resources[0]
            : booking.resources
        : null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setIsSubmitting(true);
        setError(null);

        const start = new Date(`${formData.date}T${formData.startTime}`);
        const end = new Date(`${formData.date}T${formData.endTime}`);

        if (end <= start) {
            setError("End time must be after start time.");
            setIsSubmitting(false);
            return;
        }

        try {
            const token = user ? await user.getIdToken() : "dev-token";
            const res = await fetch(`${API}/api/bookings/${booking.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    start_time: start.toISOString(),
                    end_time: end.toISOString(),
                }),
            });

            const result = await res.json();

            if (!res.ok || result.status === "error") {
                throw new Error(result.message || "Failed to update booking.");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Edit booking failed:", err);
            setError(err.message || "Failed to update booking.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                            <Pencil className="w-5 h-5 text-brand-primary" />
                            Edit Booking
                        </h2>
                        <p className="text-xs font-medium text-slate-500 dark:text-foreground/40 mt-0.5">
                            Update the date and time for this reservation
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Resource info */}
                <div className="px-6 py-4 bg-slate-50 dark:bg-white/[0.03] border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center">
                            <MapPin className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-bold text-foreground">{resource?.name || "Resource"}</p>
                            <p className="text-xs text-slate-500 dark:text-foreground/40">
                                {resource ? `${resource.type} • ${resource.location}` : "Details unavailable"}
                            </p>
                        </div>
                    </div>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-red-500/10 border border-rose-100 dark:border-red-500/20 rounded-2xl text-rose-600 dark:text-red-400 text-xs font-semibold">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Date */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                            Date
                        </label>
                        <div className="relative">
                            <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <input
                                type="date"
                                name="date"
                                value={formData.date}
                                onChange={handleChange}
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
                            />
                        </div>
                    </div>

                    {/* Time Range */}
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                Start Time
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="time"
                                    name="startTime"
                                    value={formData.startTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
                                />
                            </div>
                        </div>
                        <div>
                            <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                                End Time
                            </label>
                            <div className="relative">
                                <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                                <input
                                    type="time"
                                    name="endTime"
                                    value={formData.endTime}
                                    onChange={handleChange}
                                    required
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-semibold text-foreground focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 border border-slate-200 dark:border-slate-700 rounded-2xl text-sm font-bold text-slate-600 dark:text-foreground/60 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 bg-brand-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-brand-secondary transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Updating..." : "Update Booking"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
