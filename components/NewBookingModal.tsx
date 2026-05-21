"use client";

import React, { useState, useEffect } from "react";
import { X, Calendar, Clock, MapPin, BookOpen, AlertTriangle } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";

interface NewBookingModalProps {
    isOpen: boolean;
    onClose: () => void;
    onSuccess: () => void;
}

export default function NewBookingModal({ isOpen, onClose, onSuccess }: NewBookingModalProps) {
    const { profile, user } = useAuth();
    const [formData, setFormData] = useState({
        resourceId: "",
        faculty: "",
        date: "",
        startTime: "",
        endTime: "",
        purpose: "",
    });
    const [resources, setResources] = useState<any[]>([]);
    const [loadingResources, setLoadingResources] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        const fetchResources = async () => {
            setLoadingResources(true);
            setError(null);
            try {
                const { data, error } = await supabase
                    .from("resources")
                    .select("id, name, department, availability_status")
                    .eq("availability_status", "Available")
                    .order("name");
                if (error) throw error;
                setResources(data || []);
            } catch (err: any) {
                console.error("Failed to fetch resources:", err);
                setError("Failed to load available resources.");
            } finally {
                setLoadingResources(false);
            }
        };

        if (isOpen) {
            fetchResources();
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
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
            const { error: insertError } = await supabase
                .from("bookings")
                .insert([
                    {
                        resource_id: formData.resourceId,
                        user_id: profile?.id || user?.uid,
                        start_time: start.toISOString(),
                        end_time: end.toISOString(),
                        status: "Pending",
                    },
                ]);

            if (insertError) throw insertError;

            onSuccess();
            onClose();
            setFormData({ resourceId: "", faculty: "", date: "", startTime: "", endTime: "", purpose: "" });
        } catch (err: any) {
            console.error("Booking failed:", err);
            setError(err.message || "Failed to submit booking request.");
        } finally {
            setIsSubmitting(false);
        }
    };

    const filteredResources = resources.filter((res) => {
        if (!formData.faculty) return true;
        return res.department?.toLowerCase() === formData.faculty.toLowerCase();
    });

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />

            {/* Modal */}
            <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95">
                {/* Header */}
                <div className="flex items-center justify-between px-6 py-5 border-b border-slate-100">
                    <div>
                        <h2 className="text-xl font-black text-slate-900 tracking-tight">New Booking</h2>
                        <p className="text-xs font-medium text-slate-500 mt-0.5">Reserve a facility or resource</p>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-2 hover:bg-slate-100 rounded-xl transition-colors text-slate-400 hover:text-slate-600"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="p-6 space-y-5">
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-rose-50 border border-rose-100 rounded-2xl text-rose-600 text-xs font-semibold">
                            <AlertTriangle className="w-4 h-4 shrink-0" />
                            <p>{error}</p>
                        </div>
                    )}

                    {/* Resource */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                            Resource / Facility
                        </label>
                        <div className="relative">
                            <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                name="resourceId"
                                value={formData.resourceId}
                                onChange={handleChange}
                                required
                                disabled={loadingResources}
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all appearance-none"
                            >
                                <option value="">
                                    {loadingResources ? "Loading resources..." : "Select Resource"}
                                </option>
                                {filteredResources.map((res) => (
                                    <option key={res.id} value={res.id}>
                                        {res.name} ({res.department || "General"})
                                    </option>
                                ))}
                            </select>
                        </div>
                    </div>

                    {/* Faculty */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                            Faculty
                        </label>
                        <div className="relative">
                            <BookOpen className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                            <select
                                name="faculty"
                                value={formData.faculty}
                                onChange={handleChange}
                                required
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all appearance-none"
                            >
                                <option value="">Select Faculty</option>
                                <option value="Engineering">Engineering</option>
                                <option value="Science">Science</option>
                                <option value="Business">Business</option>
                                <option value="Medicine">Medicine</option>
                                <option value="Arts">Arts</option>
                                <option value="Computing">Computing</option>
                            </select>
                        </div>
                    </div>

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
                                className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
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
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
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
                                    className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all"
                                />
                            </div>
                        </div>
                    </div>

                    {/* Purpose */}
                    <div>
                        <label className="block text-xs font-black uppercase tracking-widest text-slate-400 mb-2">
                            Purpose (Optional)
                        </label>
                        <textarea
                            name="purpose"
                            value={formData.purpose}
                            onChange={handleChange}
                            rows={3}
                            placeholder="Brief description of the booking purpose..."
                            className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/10 transition-all resize-none"
                        />
                    </div>

                    {/* Actions */}
                    <div className="flex items-center justify-end gap-3 pt-2">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-5 py-3 border border-slate-200 rounded-2xl text-sm font-bold text-slate-600 hover:bg-slate-50 transition-colors"
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            disabled={isSubmitting}
                            className="inline-flex items-center gap-2 bg-brand-primary text-white font-bold px-6 py-3 rounded-2xl hover:bg-brand-secondary transition-all shadow-lg active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {isSubmitting ? "Booking..." : "Confirm Booking"}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}
