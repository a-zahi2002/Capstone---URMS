"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { 
    BellRing, Calendar, Clock, Mail, FileText, Plus, Trash2, 
    XCircle, ChevronLeft, Save, AlertCircle,
    FileSpreadsheet, Settings2
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

interface ReportSchedule {
    id: string;
    report_types: string[];
    recipients: string[];
    delivery_day: number;
    delivery_time: string;
    format: 'pdf' | 'excel';
    is_enabled: boolean;
    last_run_at: string | null;
}

export default function ReportSchedulingPage() {
    const { user } = useAuth();
    const [schedules, setSchedules] = useState<ReportSchedule[]>([]);
    const [loading, setLoading] = useState(true);
    const [showModal, setShowModal] = useState(false);
    const [editingSchedule, setEditingSchedule] = useState<ReportSchedule | null>(null);
    const [error, setError] = useState<string | null>(null);

    const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
    const REPORT_TYPES = [
        { id: 'overview', label: 'System Overview', icon: <Settings2 className="w-4 h-4" /> },
        { id: 'booking', label: 'Booking Statistics', icon: <FileText className="w-4 h-4" /> },
        { id: 'utilization', label: 'Resource Utilization', icon: <FileSpreadsheet className="w-4 h-4" /> },
        { id: 'maintenance', label: 'Maintenance Reports', icon: <AlertCircle className="w-4 h-4" /> }
    ];

    useEffect(() => {
        if (user) {
            fetchSchedules();
        }
    }, [user]);

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const fetchSchedules = async () => {
        setLoading(true);
        try {
            const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : "dev-token";
            const res = await fetch(`${API}/api/admin/reports/schedules`, {
                headers: { Authorization: `Bearer ${token}` }
            });
            const data = await res.json();
            if (data.status === "success") {
                setSchedules(data.data);
            }
        } catch (err) {
            console.error("Failed to fetch schedules", err);
            setError("Failed to load schedules");
        } finally {
            setLoading(false);
        }
    };

    const handleToggleEnabled = async (schedule: ReportSchedule) => {
        try {
            const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : "dev-token";
            const res = await fetch(`${API}/api/admin/reports/schedules/${schedule.id}`, {
                method: 'PATCH',
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify({ is_enabled: !schedule.is_enabled })
            });
            if (res.ok) {
                fetchSchedules();
            }
        } catch (err) {
            console.error("Toggle failed", err);
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this schedule?")) return;
        try {
            const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : "dev-token";
            const res = await fetch(`${API}/api/admin/reports/schedules/${id}`, {
                method: 'DELETE',
                headers: { Authorization: `Bearer ${token}` }
            });
            if (res.ok) {
                fetchSchedules();
            }
        } catch (err) {
            console.error("Delete failed", err);
        }
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="min-h-screen bg-[#0B0F19] text-white pb-20 relative overflow-hidden">
                {/* Background effects */}
                <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-cyan-500/10 rounded-full blur-[120px] pointer-events-none" />
                <div className="absolute bottom-0 right-1/4 w-[600px] h-[600px] bg-violet-500/10 rounded-full blur-[150px] pointer-events-none" />

                {/* Header */}
                <motion.div 
                    initial={{ opacity: 0, y: -20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="sticky top-0 z-30 bg-[#0B0F19]/80 backdrop-blur-xl border-b border-white/5"
                >
                    <div className="max-w-7xl mx-auto px-6 py-5 flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <Link href="/admin/analytics" className="p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 rounded-xl transition-all text-slate-300 hover:text-white border border-slate-200 dark:border-white/10">
                                <ChevronLeft className="w-5 h-5" />
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-slate-400 bg-clip-text text-transparent">Report Scheduling</h1>
                                <p className="text-slate-400 text-sm">Automated weekly performance reports</p>
                            </div>
                        </div>
                        <button 
                            onClick={() => {
                                setEditingSchedule(null);
                                setShowModal(true);
                            }}
                            className="flex items-center gap-2 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white px-5 py-2.5 rounded-xl font-semibold text-sm transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] border border-slate-200 dark:border-white/10"
                        >
                            <Plus className="w-4 h-4" /> Create Schedule
                        </button>
                    </div>
                </motion.div>

                <div className="max-w-7xl mx-auto px-6 mt-10 relative z-10">
                    {loading ? (
                        <div className="flex flex-col items-center justify-center py-20">
                            <div className="w-12 h-12 border-4 border-slate-200 dark:border-white/10 border-t-cyan-500 rounded-full animate-spin mb-4"></div>
                            <p className="text-slate-400 font-medium">Syncing schedules...</p>
                        </div>
                    ) : schedules.length === 0 ? (
                        <motion.div 
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            className="bg-slate-50 dark:bg-white/5 backdrop-blur-xl rounded-[2rem] p-16 text-center border border-slate-200 dark:border-white/10"
                        >
                            <div className="w-20 h-20 bg-gradient-to-br from-cyan-500/20 to-blue-500/20 border border-cyan-500/30 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-[0_0_30px_rgba(6,182,212,0.2)]">
                                <BellRing className="w-10 h-10 text-cyan-400" />
                            </div>
                            <h2 className="text-2xl font-bold text-white mb-2">No Active Schedules</h2>
                            <p className="text-slate-400 max-w-sm mx-auto mb-10">Configure automated reports to be delivered to your inbox every week.</p>
                            <button 
                                onClick={() => setShowModal(true)}
                                className="bg-slate-100 dark:bg-white/10 hover:bg-slate-200 dark:bg-white/20 text-white px-8 py-3 rounded-2xl font-semibold transition-all border border-slate-200 dark:border-white/10"
                            >
                                Setup Your First Schedule
                            </button>
                        </motion.div>
                    ) : (
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            <AnimatePresence>
                                {schedules.map((s, index) => (
                                    <motion.div 
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: index * 0.1 }}
                                        key={s.id} 
                                        className="bg-slate-50 dark:bg-white/5 backdrop-blur-xl rounded-3xl p-6 border border-slate-200 dark:border-white/10 hover:border-cyan-500/50 transition-all group relative overflow-hidden shadow-lg"
                                    >
                                        {/* Decorative gradient */}
                                        <div className={`absolute -top-16 -right-16 w-32 h-32 rounded-full opacity-20 blur-2xl transition-all ${s.is_enabled ? 'bg-cyan-500' : 'bg-slate-500'}`}></div>
                                        
                                        <div className="flex items-start justify-between mb-6 relative z-10">
                                            <div className={`p-3 rounded-2xl border ${s.is_enabled ? 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400'}`}>
                                                <BellRing className="w-6 h-6" />
                                            </div>
                                            <div className="flex items-center gap-2">
                                                <button 
                                                    onClick={() => handleToggleEnabled(s)}
                                                    className={`px-3 py-1.5 rounded-full text-[10px] font-bold uppercase tracking-wider transition-all border ${s.is_enabled ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 hover:bg-slate-100 dark:bg-white/10'}`}
                                                >
                                                    {s.is_enabled ? 'Active' : 'Disabled'}
                                                </button>
                                            </div>
                                        </div>

                                        <div className="space-y-4 mb-8 relative z-10">
                                            <div>
                                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1.5">Reports Included</p>
                                                <div className="flex flex-wrap gap-2">
                                                    {s.report_types.map(t => (
                                                        <span key={t} className="px-2.5 py-1 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-lg text-xs font-medium text-slate-300 capitalize">
                                                            {t}
                                                        </span>
                                                    ))}
                                                </div>
                                            </div>

                                            <div className="grid grid-cols-2 gap-4">
                                                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-white/5">
                                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Delivery Day</p>
                                                    <div className="flex items-center gap-1.5 text-slate-200 font-medium text-sm">
                                                        <Calendar className="w-3.5 h-3.5 text-blue-400" /> {DAYS[s.delivery_day]}
                                                    </div>
                                                </div>
                                                <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-white/5">
                                                    <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Timing</p>
                                                    <div className="flex items-center gap-1.5 text-slate-200 font-medium text-sm">
                                                        <Clock className="w-3.5 h-3.5 text-amber-400" /> {s.delivery_time.substring(0, 5)}
                                                    </div>
                                                </div>
                                            </div>

                                            <div className="bg-slate-50 dark:bg-white/5 rounded-xl p-3 border border-white/5">
                                                <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-widest mb-1">Format & Recipients</p>
                                                <div className="flex items-center justify-between">
                                                    <div className="flex items-center gap-1.5 text-slate-200 font-medium text-sm">
                                                        {s.format === 'pdf' ? <FileText className="w-3.5 h-3.5 text-rose-400" /> : <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />}
                                                        <span className="uppercase">{s.format}</span>
                                                    </div>
                                                    <div className="flex items-center gap-1.5 text-slate-400 text-xs font-medium bg-slate-50 dark:bg-white/5 px-2 py-0.5 rounded-full border border-white/5">
                                                        <Mail className="w-3 h-3" /> {s.recipients.length} Recipients
                                                    </div>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-3 pt-4 border-t border-slate-200 dark:border-white/10 relative z-10">
                                            <button 
                                                onClick={() => {
                                                    setEditingSchedule(s);
                                                    setShowModal(true);
                                                }}
                                                className="flex-1 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 text-white font-medium text-xs py-2.5 rounded-xl transition-all border border-slate-200 dark:border-white/10"
                                            >
                                                Edit Configuration
                                            </button>
                                            <button 
                                                onClick={() => handleDelete(s.id)}
                                                className="p-2.5 text-rose-400 hover:text-white hover:bg-rose-500/20 rounded-xl transition-all border border-rose-500/20 hover:border-rose-500/50"
                                            >
                                                <Trash2 className="w-4 h-4" />
                                            </button>
                                        </div>
                                        
                                        {s.last_run_at && (
                                            <div className="mt-4 text-center relative z-10">
                                                <p className="text-[10px] font-medium text-slate-500">Last generated: {new Date(s.last_run_at).toLocaleString()}</p>
                                            </div>
                                        )}
                                    </motion.div>
                                ))}
                            </AnimatePresence>
                        </div>
                    )}
                </div>

                <AnimatePresence>
                    {showModal && (
                        <ScheduleModal 
                            schedule={editingSchedule} 
                            onClose={() => setShowModal(false)} 
                            onSuccess={() => {
                                setShowModal(false);
                                fetchSchedules();
                            }}
                            reportTypes={REPORT_TYPES}
                            days={DAYS}
                            userToken={user && typeof user.getIdToken === 'function' ? user.getIdToken() : Promise.resolve("dev-token")}
                        />
                    )}
                </AnimatePresence>
            </div>
        </ProtectedRoute>
    );
}

function ScheduleModal({ schedule, onClose, onSuccess, reportTypes, days, userToken }: any) {
    const [formData, setFormData] = useState({
        report_types: schedule?.report_types || [],
        recipients: schedule?.recipients?.join(', ') || '',
        delivery_day: schedule?.delivery_day ?? 1,
        delivery_time: schedule?.delivery_time ? schedule.delivery_time.substring(0, 5) : '09:00',
        format: schedule?.format || 'pdf',
        is_enabled: schedule?.is_enabled ?? true
    });
    const [saving, setSaving] = useState(false);

    const toggleReportType = (id: string) => {
        setFormData(prev => ({
            ...prev,
            report_types: prev.report_types.includes(id)
                ? prev.report_types.filter((t: string) => t !== id)
                : [...prev.report_types, id]
        }));
    };

    const handleSave = async () => {
        if (formData.report_types.length === 0) return alert("Select at least one report type");
        if (!formData.recipients) return alert("Add at least one recipient");

        setSaving(true);
        try {
            const token = await userToken;
            const payload = {
                ...formData,
                recipients: formData.recipients.split(',').map((r: string) => r.trim()).filter((r: string) => r),
                delivery_time: `${formData.delivery_time}:00`
            };

            const url = schedule 
                ? `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/reports/schedules/${schedule.id}`
                : `${process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000'}/api/admin/reports/schedules`;
            
            const method = schedule ? 'PATCH' : 'POST';

            const res = await fetch(url, {
                method,
                headers: { 
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${token}` 
                },
                body: JSON.stringify(payload)
            });

            if (res.ok) {
                onSuccess();
            } else {
                alert("Failed to save schedule");
            }
        } catch (err) {
            console.error("Save error", err);
        } finally {
            setSaving(false);
        }
    };

    return (
        <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-[#0B0F19]/80 backdrop-blur-md"
        >
            <motion.div 
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-[#111827] w-full max-w-xl rounded-[2.5rem] overflow-hidden shadow-[0_0_50px_rgba(0,0,0,0.5)] border border-slate-200 dark:border-white/10"
            >
                <div className="p-8 sm:p-10">
                    <div className="flex items-center justify-between mb-10">
                        <div>
                            <h2 className="text-2xl font-bold text-white">{schedule ? 'Edit Schedule' : 'New Report Schedule'}</h2>
                            <p className="text-slate-400 text-sm">Configure your automated reporting cycle</p>
                        </div>
                        <button onClick={onClose} className="p-2.5 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 border border-slate-200 dark:border-white/10 rounded-2xl transition-all text-slate-400 hover:text-white">
                            <XCircle className="w-6 h-6" />
                        </button>
                    </div>

                    <div className="space-y-8">
                        {/* Report Types */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Select Report Modules</label>
                            <div className="grid grid-cols-2 gap-3">
                                {reportTypes.map((type: any) => (
                                    <button 
                                        key={type.id}
                                        onClick={() => toggleReportType(type.id)}
                                        className={`flex items-center gap-3 p-4 rounded-2xl border transition-all text-left ${
                                            formData.report_types.includes(type.id)
                                            ? 'border-cyan-500/50 bg-cyan-500/10 text-white shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                                            : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-400 hover:border-slate-300 dark:border-white/20 hover:bg-slate-100 dark:bg-white/10'
                                        }`}
                                    >
                                        <div className={`p-2 rounded-xl border ${formData.report_types.includes(type.id) ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-400' : 'bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10'}`}>
                                            {type.icon}
                                        </div>
                                        <span className="font-medium text-sm">{type.label}</span>
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Delivery Settings */}
                        <div className="grid grid-cols-2 gap-6">
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Delivery Day</label>
                                <div className="relative">
                                    <select 
                                        value={formData.delivery_day}
                                        onChange={(e) => setFormData({...formData, delivery_day: parseInt(e.target.value)})}
                                        className="w-full bg-[#0B0F19] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 font-medium text-white appearance-none focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                    >
                                        {days.map((day: string, idx: number) => (
                                            <option key={idx} value={idx}>{day}</option>
                                        ))}
                                    </select>
                                    <Calendar className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                </div>
                            </div>
                            <div>
                                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Time (24h)</label>
                                <div className="relative">
                                    <input 
                                        type="time"
                                        value={formData.delivery_time}
                                        onChange={(e) => setFormData({...formData, delivery_time: e.target.value})}
                                        className="w-full bg-[#0B0F19] border border-slate-200 dark:border-white/10 rounded-2xl px-4 py-3.5 font-medium text-white focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all"
                                        style={{ colorScheme: 'dark' }}
                                    />
                                    <Clock className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 pointer-events-none" />
                                </div>
                            </div>
                        </div>

                        {/* Recipients */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Recipients (Emails or User IDs)</label>
                            <div className="relative">
                                <textarea 
                                    placeholder="admin@demo.lk, manager@demo.lk"
                                    value={formData.recipients}
                                    onChange={(e) => setFormData({...formData, recipients: e.target.value})}
                                    className="w-full bg-[#0B0F19] border border-slate-200 dark:border-white/10 rounded-2xl px-12 py-3.5 font-medium text-white min-h-[80px] focus:outline-none focus:border-cyan-500/50 focus:ring-1 focus:ring-cyan-500/50 transition-all placeholder:text-slate-600"
                                />
                                <Mail className="absolute left-4 top-4 w-5 h-5 text-slate-500" />
                            </div>
                            <p className="text-[10px] text-slate-500 mt-2 font-medium">Separate multiple recipients with commas.</p>
                        </div>

                        {/* Format */}
                        <div>
                            <label className="block text-xs font-semibold text-slate-400 uppercase tracking-widest mb-3">Report Format</label>
                            <div className="flex gap-4">
                                <button 
                                    onClick={() => setFormData({...formData, format: 'pdf'})}
                                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all font-medium ${
                                        formData.format === 'pdf' ? 'border-rose-500/50 bg-rose-500/10 text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.15)]' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-400 hover:bg-slate-100 dark:bg-white/10'
                                    }`}
                                >
                                    <FileText className="w-5 h-5" /> PDF
                                </button>
                                <button 
                                    onClick={() => setFormData({...formData, format: 'excel'})}
                                    className={`flex-1 flex items-center justify-center gap-2 p-4 rounded-2xl border transition-all font-medium ${
                                        formData.format === 'excel' ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.15)]' : 'border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-slate-400 hover:bg-slate-100 dark:bg-white/10'
                                    }`}
                                >
                                    <FileSpreadsheet className="w-5 h-5" /> EXCEL
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 flex gap-4">
                        <button 
                            onClick={onClose}
                            className="flex-1 px-8 py-4 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-white font-medium rounded-2xl hover:bg-slate-100 dark:bg-white/10 transition-all"
                        >
                            Cancel
                        </button>
                        <button 
                            onClick={handleSave}
                            disabled={saving}
                            className="flex-[2] px-8 py-4 bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 text-white font-bold rounded-2xl transition-all shadow-[0_0_20px_rgba(6,182,212,0.3)] hover:shadow-[0_0_30px_rgba(6,182,212,0.5)] flex items-center justify-center gap-2 disabled:opacity-50"
                        >
                            {saving ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-5 h-5" />}
                            {schedule ? 'Update Schedule' : 'Activate Schedule'}
                        </button>
                    </div>
                </div>
            </motion.div>
        </motion.div>
    );
}
