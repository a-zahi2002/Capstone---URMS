"use client";

import React, { useState } from "react";
import { X, AlertTriangle, Trash2, MapPin } from "lucide-react";
import { useAuth } from "@/lib/auth-context";

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

interface DeleteBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
    booking: BookingRow | null;
}

export default function DeleteBookingModal({ isOpen, onClose, onSuccess, booking }: DeleteBookingModalProps) {
    const { user } = useAuth();
    const [isDeleting, setIsDeleting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    if (!isOpen || !booking) return null;

    const resource = booking.resources
        ? Array.isArray(booking.resources)
            ? booking.resources[0]
            : booking.resources
        : null;

    const formatDate = (dateStr: string) => {
        try {
            return new Date(dateStr).toLocaleString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
                hour: "2-digit",
                minute: "2-digit",
                hour12: true,
            });
        } catch {
            return dateStr;
        }
    };

    const handleDelete = async () => {
        setIsDeleting(true);
        setError(null);

        try {
            const token = user ? await user.getIdToken() : "dev-token";
            const res = await fetch(`${API}/api/bookings/${booking.id}`, {
                method: "DELETE",
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            });

            const result = await res.json();

            if (!res.ok || result.status === "error") {
                throw new Error(result.message || "Failed to delete booking.");
            }

            onSuccess();
            onClose();
        } catch (err: any) {
            console.error("Delete booking failed:", err);
            setError(err.message || "Failed to delete booking.");
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100 dark:border-slate-800">
                    <div>
                        <h2 className="text-xl font-black text-foreground tracking-tight flex items-center gap-2">
                            <Trash2 className="w-5 h-5 text-rose-500" />
                            Delete Booking
                        </h2>
                        <p className="text-xs font-medium text-slate-500 dark:text-foreground/40 mt-0.5">
                            This action cannot be undone
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 dark:hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Content */}
                <div className="p-6 space-y-5">
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-rose-50 dark:bg-red-500/10 border border-rose-100 dark:border-red-500/20 rounded-2xl text-rose-600 dark:text-red-400 text-xs font-semibold">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Warning */}
                    <div className="p-4 bg-rose-50 dark:bg-red-500/5 border border-rose-200 dark:border-red-500/20 rounded-2xl">
                        <p className="text-sm font-semibold text-rose-800 dark:text-red-300">
                            Are you sure you want to permanently delete this booking record?
                        </p>
                    </div>

                    {/* Booking details */}
                    <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-white/[0.03] border border-slate-200 dark:border-slate-800 rounded-2xl">
                        <div className="w-10 h-10 rounded-xl bg-brand-primary/10 flex items-center justify-center shrink-0">
                            <MapPin className="w-5 h-5 text-brand-primary" />
                        </div>
                        <div className="min-w-0">
                            <p className="text-sm font-bold text-foreground truncate">
                                {resource?.name || "Resource"}
                            </p>
                            <p className="text-xs text-slate-500 dark:text-foreground/40 mt-0.5">
                                {formatDate(booking.start_time)} — {formatDate(booking.end_time)}
                            </p>
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
                            type="button"
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="inline-flex items-center gap-2 bg-rose-600 text-white font-bold px-6 py-3 rounded-2xl hover:bg-rose-500 transition-all shadow-lg shadow-rose-600/20 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            <Trash2 className="w-4 h-4" />
                            {isDeleting ? "Deleting..." : "Delete Booking"}
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
