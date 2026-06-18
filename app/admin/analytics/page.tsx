"use client";

import React, { useState, useEffect } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import {
    BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip as RechartsTooltip, ResponsiveContainer,
    PieChart as RechartsPieChart, Pie, Cell, AreaChart, Area
} from "recharts";
import {
    LayoutDashboard, Users, Package, CalendarCheck, AlertCircle,
    CheckCircle2, Clock, BarChart3, TrendingUp, PieChart as PieIcon,
    AlertTriangle, ArrowLeft, RefreshCcw, FileText, ChevronDown, BellRing, Sparkles
} from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

import { useTheme } from "next-themes";
import { BookingLineChart } from "@/components/charts/BookingLineChart";
import { BookingPieChart } from "@/components/charts/BookingPieChart";
import { BookingBarChart } from "@/components/charts/BookingBarChart";

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];

// Reusable animated orb for ambient background
function Orb({ className }: { className: string }) {
    return <div className={`absolute rounded-full blur-3xl opacity-20 animate-pulse pointer-events-none ${className}`} />;
}

export default function AnalyticsDashboard() {
    const { user } = useAuth();
    const { resolvedTheme } = useTheme();
    const isDark = resolvedTheme === "dark";
    
    const [activeTab, setActiveTab] = useState<'overview' | 'bookings' | 'utilization'>('overview');
    // ... rest of the component state ...
    const [timeRange, setTimeRange] = useState<'7d' | '30d' | '12m' | 'custom'>('7d');
    const [startDate, setStartDate] = useState<string>("");
    const [endDate, setEndDate] = useState<string>("");
    const [department, setDepartment] = useState<string>("");
    
    const departments = [
        "Faculty of Computing",
        "Faculty of Applied Sciences",
        "Faculty of Management",
        "Faculty of Engineering",
        "Faculty of Business",
        "Faculty of Medicine"
    ];
    
    // Overview Data
    const [overview, setOverview] = useState<any>(null);
    const [rechartsBookings, setRechartsBookings] = useState<any>(null);
    const [rechartsResources, setRechartsResources] = useState<any>(null);
    const [rechartsMaintenance, setRechartsMaintenance] = useState<any>(null);
    
    // Booking Reports Data
    const [trends, setTrends] = useState<any>(null);
    const [statusDistribution, setStatusDistribution] = useState<any>(null);
    const [resourceFrequency, setResourceFrequency] = useState<any>(null);
    const [categoryFrequency, setCategoryFrequency] = useState<any>(null);

    // Utilization Reports Data
    const [utilizationData, setUtilizationData] = useState<any>(null);
    const [peakUsage, setPeakUsage] = useState<any>(null);
    
    const [loading, setLoading] = useState(true);
    const [reportsLoading, setReportsLoading] = useState(false);
    const [exporting, setExporting] = useState<string | null>(null);
    const [googleSheetUrl, setGoogleSheetUrl] = useState<string | null>(null);
    const [error, setError] = useState<string | null>(null);

    const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

    const buildParams = (extra: Record<string, string | undefined> = {}) => {
        const p = new URLSearchParams();
        if (department) p.set('department', department);
        if (timeRange === 'custom' && startDate && endDate) {
            p.set('startDate', startDate);
            p.set('endDate', endDate);
        }
        Object.entries(extra).forEach(([k, v]) => { if (v) p.set(k, v); });
        return p.toString() ? `?${p.toString()}` : '';
    };

    const fetchData = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : "dev-token";
            const headers = { Authorization: `Bearer ${token}` };
            const qs = buildParams();

            const [ovRes, bkRes, rsRes, mtRes] = await Promise.all([
                fetch(`${API}/api/admin/analytics/overview${qs}`, { headers }),
                fetch(`${API}/api/admin/analytics/bookings${qs}`, { headers }),
                fetch(`${API}/api/admin/analytics/resources${qs}`, { headers }),
                fetch(`${API}/api/admin/analytics/maintenance${qs}`, { headers })
            ]);

            if (!ovRes.ok || !bkRes.ok || !rsRes.ok || !mtRes.ok) throw new Error("Failed to fetch analytics data");

            const [ov, bk, rs, mt] = await Promise.all([ovRes.json(), bkRes.json(), rsRes.json(), mtRes.json()]);

            setOverview(ov.data);
            setRechartsBookings(bk.data);
            setRechartsResources(rs.data);
            setRechartsMaintenance(mt.data);
        } catch (err: any) {
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const fetchBookingReports = async (range: string) => {
        setReportsLoading(true);
        setError(null);
        try {
            const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : "dev-token";
            const headers = { Authorization: `Bearer ${token}` };
            const rangeQs = range !== 'custom' ? `range=${range}` : '';
            const qs = buildParams({ ...(rangeQs ? { range } : {}) });

            const [trRes, stRes, rfRes, cfRes] = await Promise.all([
                fetch(`${API}/api/admin/analytics/booking-trends${qs}`, { headers }),
                fetch(`${API}/api/admin/analytics/booking-status${qs}`, { headers }),
                fetch(`${API}/api/admin/analytics/resource-bookings${qs}`, { headers }),
                fetch(`${API}/api/admin/analytics/category-bookings${qs}`, { headers })
            ]);

            if (!trRes.ok || !stRes.ok || !rfRes.ok || !cfRes.ok) throw new Error("Failed to fetch booking report data");

            const [tr, st, rf, cf] = await Promise.all([trRes.json(), stRes.json(), rfRes.json(), cfRes.json()]);

            setTrends(tr.data);
            setStatusDistribution(st.data);
            setResourceFrequency(rf.data);
            setCategoryFrequency(cf.data);
        } catch (err: any) {
            console.error("Booking Report Error:", err);
            setError("Failed to load booking reports: " + err.message);
        } finally {
            setReportsLoading(false);
        }
    };

    const fetchUtilizationReports = async (range: string) => {
        setReportsLoading(true);
        setError(null);
        try {
            const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : "dev-token";
            const headers = { Authorization: `Bearer ${token}` };
            const qs = buildParams({ ...(range !== 'custom' ? { range } : {}) });

            const [utRes, pkRes] = await Promise.all([
                fetch(`${API}/api/admin/analytics/resource-utilization${qs}`, { headers }),
                fetch(`${API}/api/admin/analytics/peak-usage${qs}`, { headers })
            ]);

            if (!utRes.ok || !pkRes.ok) throw new Error("Failed to fetch utilization data");

            const [ut, pk] = await Promise.all([utRes.json(), pkRes.json()]);

            setUtilizationData(ut.data);
            setPeakUsage(pk.data);
        } catch (err: any) {
            console.error("Utilization Report Error:", err);
            setError("Failed to load utilization reports: " + err.message);
        } finally {
            setReportsLoading(false);
        }
    };

    const handleExport = async (format: 'pdf' | 'excel' | 'sheets', type: string) => {
        setExporting(`${type}-${format}`);
        setError(null);
        try {
            const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : "dev-token";
            const qs = buildParams({ type, ...(timeRange !== 'custom' ? { range: timeRange } : {}) });
            // Fix: map 'sheets' to the correct backend route 'google-sheets'
            const exportRoute = format === 'sheets' ? 'google-sheets' : format;
            const response = await fetch(`${API}/api/admin/analytics/export/${exportRoute}${qs}`, {
                headers: { Authorization: `Bearer ${token}` }
            });

            if (!response.ok) throw new Error(`Export failed (${response.status}): ${response.statusText}`);

            if (format === 'sheets') {
                const result = await response.json();
                setGoogleSheetUrl(result.data.spreadsheetUrl);
                window.open(result.data.spreadsheetUrl, '_blank');
            } else {
                const blob = await response.blob();
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `urms-${type}-report-${new Date().toISOString().split('T')[0]}.${format === 'pdf' ? 'pdf' : 'xlsx'}`;
                document.body.appendChild(a);
                a.click();
                window.URL.revokeObjectURL(url);
                a.remove();
            }
        } catch (err: any) {
            console.error("Export error:", err);
            setError("Export failed: " + err.message);
        } finally {
            setExporting(null);
        }
    };

    useEffect(() => {
        if (user) fetchData();
    }, [user, department, timeRange, startDate, endDate]);

    useEffect(() => {
        if (user) {
            if (activeTab === 'bookings') fetchBookingReports(timeRange);
            if (activeTab === 'utilization') fetchUtilizationReports(timeRange);
        }
    }, [user, activeTab, timeRange, department, startDate, endDate]);

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="flex flex-col items-center gap-6">
                    <div className="relative flex justify-center items-center">
                        <div className="absolute animate-ping w-16 h-16 rounded-full bg-blue-500/20" />
                        <div className="animate-spin rounded-full h-12 w-12 border-[3px] border-slate-200 dark:border-border border-t-blue-500 relative z-10" />
                    </div>
                    <p className="text-blue-500 dark:text-blue-400 font-black tracking-widest text-[10px] uppercase animate-pulse">Initializing Analytics</p>
                </div>
            </div>
        );
    }

    const bookingStatusData = rechartsBookings ? Object.entries(rechartsBookings.statusDistribution).map(([name, value]) => ({ name, value })) : [];
    const resourceCategoryData = rechartsResources ? Object.entries(rechartsResources.categoryDistribution).map(([name, value]) => ({ name, value })) : [];

    // Theme-aware Chart Styles
    const chartGridColor = isDark ? "rgba(255, 255, 255, 0.05)" : "rgba(0, 0, 0, 0.05)";
    const chartTextColor = isDark ? "#94A3B8" : "#64748B";
    const tooltipBg = isDark ? "#0f172a" : "#ffffff";
    const tooltipBorder = isDark ? "#1e293b" : "#e2e8f0";
    const tooltipText = isDark ? "#ffffff" : "#0f172a";

    // Chart.js Data Mappings
    const chartJsTrends = {
        labels: (trends as any)?.map((t: any) => t.label) || [],
        datasets: [{
            label: 'Bookings',
            data: (trends as any)?.map((t: any) => t.value) || [],
            borderColor: '#3B82F6',
            backgroundColor: 'rgba(59, 130, 246, 0.1)',
            fill: true,
            tension: 0.4,
            borderWidth: 3,
            pointBackgroundColor: '#3B82F6',
            pointRadius: 4,
            pointHoverRadius: 6
        }]
    };

    const chartJsStatus = {
        labels: statusDistribution ? Object.keys(statusDistribution as any) : [],
        datasets: [{
            data: (statusDistribution ? Object.values(statusDistribution as any) : []) as number[],
            backgroundColor: COLORS,
            borderWidth: 0,
            hoverOffset: 15
        }]
    };

    const chartJsPeakHours = {
        labels: (peakUsage as any)?.peakHours?.map((h: any) => h.label) || [],
        datasets: [{
            label: 'Bookings',
            data: (peakUsage as any)?.peakHours?.map((h: any) => h.count) || [],
            backgroundColor: '#F59E0B',
            borderRadius: 6,
        }]
    };

    const chartJsPeakDays = {
        labels: (peakUsage as any)?.peakDays?.map((d: any) => d.label) || [],
        datasets: [{
            label: 'Bookings',
            data: (peakUsage as any)?.peakDays?.map((d: any) => d.count) || [],
            backgroundColor: '#10B981',
            borderRadius: 6,
        }]
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
    };

    const itemVariants: any = {
        hidden: { opacity: 0, y: 20 },
        visible: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 100 } }
    };

    return (
        <ProtectedRoute allowedRoles={['admin']}>
            <div className="min-h-screen bg-background text-foreground overflow-hidden relative pb-24">
                {/* Ambient Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-900/5 via-background to-background -z-20" />
                <div className="absolute inset-0 opacity-[0.03] -z-10" style={{ backgroundImage: "linear-gradient(rgba(128,128,128,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(128,128,128,0.3) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />
                <Orb className="w-[500px] h-[500px] bg-blue-600/10 -top-40 -left-40" />
                <Orb className="w-[400px] h-[400px] bg-indigo-600/5 top-1/2 right-[-100px]" />
                <Orb className="w-[600px] h-[600px] bg-sky-500/5 bottom-[-200px] left-1/3" />

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 relative z-10">
                    
                    {/* Header */}
                    <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="flex flex-col xl:flex-row items-start xl:items-center justify-between gap-6 mb-10">
                        <div className="flex items-center gap-5">
                            <Link href="/dashboard" className="p-2.5 bg-card border border-slate-200 dark:border-border rounded-2xl hover:bg-slate-100 dark:bg-foreground/5 transition-colors shadow-sm">
                                <ArrowLeft className="w-5 h-5 text-slate-700 dark:text-foreground/70" />
                            </Link>
                            <div>
                                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-2">
                                    <Sparkles className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                                    <span className="text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">Command Center</span>
                                </div>
                                <h1 className="text-4xl font-black text-foreground tracking-tight">
                                    Analytics 
                                </h1>
                                <p className="text-slate-600 dark:text-foreground/60 text-sm font-bold mt-1">Real-time system insights & utilization trends</p>
                            </div>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row items-center gap-3 w-full xl:w-auto">
                            {/* Tabs */}
                            <div className="flex items-center gap-1 bg-card p-1 rounded-2xl border border-slate-200 dark:border-border shadow-sm">
                                {[
                                    { id: 'overview', label: 'Overview' },
                                    { id: 'bookings', label: 'Bookings' },
                                    { id: 'utilization', label: 'Utilization' }
                                ].map((tab) => (
                                    <button 
                                        key={tab.id}
                                        onClick={() => setActiveTab(tab.id as any)}
                                        className={`px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === tab.id ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/25' : 'text-slate-500 dark:text-foreground/40 hover:bg-slate-100 dark:bg-foreground/5 hover:text-foreground'}`}
                                    >
                                        {tab.label}
                                    </button>
                                ))}
                            </div>

                            {/* Filters + Export Bar */}
                            <div className="flex flex-col gap-2 w-full xl:w-auto">
                                <div className="flex items-center gap-3 bg-card p-1.5 pr-3 rounded-2xl border border-slate-200 dark:border-border shadow-sm flex-wrap">
                                    {/* Department Selector */}
                                    <div className="relative group">
                                        <select
                                            value={department}
                                            onChange={(e) => setDepartment(e.target.value)}
                                            className="appearance-none pl-4 pr-10 py-2 bg-transparent text-slate-800 dark:text-foreground/90 font-black text-[10px] uppercase tracking-widest rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500/40 transition-all cursor-pointer"
                                        >
                                            <option value="" className="bg-card">All Departments</option>
                                            {departments.map((dept) => (
                                                <option key={dept} value={dept} className="bg-card">{dept}</option>
                                            ))}
                                        </select>
                                        <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 dark:text-foreground/40 pointer-events-none" />
                                    </div>

                                    <div className="w-px h-5 bg-border mx-1" />

                                    {/* Export buttons */}
                                    <div className="flex gap-1">
                                        <button
                                            onClick={() => handleExport('pdf', activeTab)}
                                            disabled={!!exporting}
                                            title="Export PDF"
                                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-foreground/10 transition-colors disabled:opacity-40"
                                        >
                                            {exporting === `${activeTab}-pdf`
                                                ? <RefreshCcw className="w-4 h-4 text-red-500 animate-spin" />
                                                : <FileText className="w-4 h-4 text-red-500" />}
                                        </button>
                                        <button
                                            onClick={() => handleExport('excel', activeTab)}
                                            disabled={!!exporting}
                                            title="Export Excel"
                                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-foreground/10 transition-colors disabled:opacity-40"
                                        >
                                            {exporting === `${activeTab}-excel`
                                                ? <RefreshCcw className="w-4 h-4 text-emerald-500 animate-spin" />
                                                : <PieIcon className="w-4 h-4 text-emerald-500" />}
                                        </button>
                                        <button
                                            onClick={() => handleExport('sheets', activeTab)}
                                            disabled={!!exporting}
                                            title="Export to Google Sheets"
                                            className="p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-foreground/10 transition-colors disabled:opacity-40"
                                        >
                                            {exporting === `${activeTab}-sheets`
                                                ? <RefreshCcw className="w-4 h-4 text-blue-500 animate-spin" />
                                                : <img src="https://upload.wikimedia.org/wikipedia/commons/3/30/Google_Sheets_logo_%282014-2020%29.svg" className="w-4 h-4 opacity-80" alt="Google Sheets" />}
                                        </button>
                                    </div>

                                    <div className="w-px h-5 bg-border mx-1" />

                                    <Link
                                        href="/admin/analytics/reports"
                                        className="flex items-center gap-2 px-3 py-2 bg-slate-100 dark:bg-foreground/5 hover:bg-slate-200 dark:hover:bg-foreground/10 text-foreground font-black text-[10px] uppercase tracking-widest rounded-xl transition-all"
                                    >
                                        <BellRing className="w-3.5 h-3.5" />
                                        Schedule
                                    </Link>
                                </div>

                                {/* Custom date range inputs — only shown when 'custom' is selected */}
                                {timeRange === 'custom' && (
                                    <div className="flex items-center gap-2 bg-card px-4 py-2.5 rounded-2xl border border-blue-500/30 shadow-sm">
                                        <span className="text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest">From</span>
                                        <input
                                            type="date"
                                            value={startDate}
                                            onChange={(e) => setStartDate(e.target.value)}
                                            className="text-[11px] font-bold bg-transparent text-foreground border border-slate-200 dark:border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        />
                                        <span className="text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest">To</span>
                                        <input
                                            type="date"
                                            value={endDate}
                                            onChange={(e) => setEndDate(e.target.value)}
                                            className="text-[11px] font-bold bg-transparent text-foreground border border-slate-200 dark:border-border rounded-lg px-2 py-1 focus:outline-none focus:ring-2 focus:ring-blue-500/40"
                                        />
                                    </div>
                                )}
                            </div>
                        </div>
                    </motion.div>

                    {googleSheetUrl && (
                        <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} className="mb-8">
                            <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-300 rounded-2xl flex items-center justify-between gap-3 backdrop-blur-md">
                                <div className="flex items-center gap-3">
                                    <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                                    <div>
                                        <p className="font-black text-xs uppercase tracking-widest">Report Exported Successfully!</p>
                                        <p className="text-[10px] font-bold opacity-70">Your data has been synced to Google Sheets.</p>
                                    </div>
                                </div>
                                <a 
                                    href={googleSheetUrl} 
                                    target="_blank" 
                                    rel="noreferrer"
                                    className="bg-emerald-500 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20"
                                >
                                    Open Sheet
                                </a>
                            </div>
                        </motion.div>
                    )}

                    {error && (
                        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 p-4 bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-300 rounded-2xl flex items-center justify-between gap-3 backdrop-blur-md">
                            <div className="flex items-center gap-3">
                                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                                <p className="font-bold text-xs">{error}</p>
                            </div>
                            <button
                                onClick={() => { setError(null); fetchData(); }}
                                className="flex-shrink-0 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-600 dark:text-red-300 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all flex items-center gap-1.5"
                            >
                                <RefreshCcw className="w-3 h-3" /> Retry
                            </button>
                        </motion.div>
                    )}

                    {/* Main Content Area */}
                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeTab}
                            variants={containerVariants}
                            initial="hidden"
                            animate="visible"
                            exit={{ opacity: 0 }}
                            className="space-y-8"
                        >
                            {activeTab === 'overview' && (
                                <>
                                    {/* Overview Cards */}
                                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                        <motion.div variants={itemVariants}><StatCard title="Total Resources" value={overview?.totalResources} icon={<Package className="w-6 h-6" />} color="bg-blue-500" /></motion.div>
                                        <motion.div variants={itemVariants}><StatCard title="Active Bookings" value={overview?.activeBookings} icon={<CalendarCheck className="w-6 h-6" />} color="bg-emerald-500" /></motion.div>
                                        <motion.div variants={itemVariants}><StatCard title="Pending Maintenance" value={overview?.pendingMaintenanceTasks} icon={<AlertCircle className="w-6 h-6" />} color="bg-amber-500" /></motion.div>
                                        <motion.div variants={itemVariants}><StatCard title="Utilization Rate" value={`${overview?.resourceUtilization}%`} icon={<TrendingUp className="w-6 h-6" />} color="bg-indigo-500" /></motion.div>
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                                        {/* Booking Trends */}
                                        <motion.div variants={itemVariants} className="lg:col-span-2 bg-card p-8 rounded-3xl border border-slate-200 dark:border-border shadow-xl">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                                                    <TrendingUp className="w-5 h-5 text-blue-500" /> Recent Activity
                                                </h3>
                                                <TimeRangePicker value={timeRange} onChange={setTimeRange} mini />
                                            </div>
                                            <div className="h-[300px] w-full">
                                                <ResponsiveContainer width="100%" aspect={2}>
                                                    <AreaChart data={rechartsBookings?.trends}>
                                                        <defs>
                                                            <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                                                                <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.4}/>
                                                                <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                                                            </linearGradient>
                                                        </defs>
                                                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={chartGridColor} />
                                                        <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: chartTextColor, fontSize: 10, fontWeight: 700}} dy={10} />
                                                        <YAxis axisLine={false} tickLine={false} tick={{fill: chartTextColor, fontSize: 10, fontWeight: 700}} dx={-10} />
                                                        <RechartsTooltip 
                                                            contentStyle={{borderRadius: '16px', backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, color: tooltipText}} 
                                                            itemStyle={{fontWeight: 'bold', color: '#3B82F6'}}
                                                        />
                                                        <Area type="monotone" dataKey="count" stroke="#3B82F6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                                                    </AreaChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </motion.div>

                                        {/* Booking Status */}
                                        <motion.div variants={itemVariants} className="bg-card p-8 rounded-3xl border border-slate-200 dark:border-border shadow-xl relative overflow-hidden">
                                            <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/10 blur-3xl rounded-full pointer-events-none" />
                                            <h3 className="text-lg font-black text-foreground mb-8 flex items-center gap-2 relative z-10">
                                                <PieIcon className="w-5 h-5 text-emerald-500" /> Status Mix
                                            </h3>
                                            <div className="h-[220px] w-full relative z-10">
                                                <ResponsiveContainer width="100%" aspect={1.5}>
                                                    <RechartsPieChart>
                                                        <Pie
                                                            data={bookingStatusData}
                                                            cx="50%" cy="50%"
                                                            innerRadius={60} outerRadius={85}
                                                            paddingAngle={5} dataKey="value"
                                                            stroke="none"
                                                        >
                                                            {bookingStatusData.map((entry: any, index: number) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Pie>
                                                        <RechartsTooltip contentStyle={{borderRadius: '12px', backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, color: tooltipText}} />
                                                    </RechartsPieChart>
                                                </ResponsiveContainer>
                                                <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none mt-2">
                                                    <span className="text-3xl font-black text-foreground">{(overview?.completedBookings || 0) + (overview?.activeBookings || 0)}</span>
                                                    <span className="text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest mt-1">Total</span>
                                                </div>
                                            </div>
                                            <div className="grid grid-cols-2 gap-3 mt-6 relative z-10">
                                                {bookingStatusData.slice(0, 4).map((item, i) => (
                                                    <div key={item.name} className="flex items-center gap-2 bg-slate-100 dark:bg-foreground/5 rounded-lg px-2 py-1.5">
                                                        <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{backgroundColor: COLORS[i % COLORS.length]}} />
                                                        <span className="text-[10px] font-black text-slate-600 dark:text-foreground/60 truncate uppercase tracking-tight">{item.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>

                                        {/* Maintenance Summary */}
                                        <motion.div variants={itemVariants} className="bg-card p-8 rounded-3xl border border-slate-200 dark:border-border shadow-xl">
                                            <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
                                                <AlertTriangle className="w-5 h-5 text-red-500" /> Maintenance
                                            </h3>
                                            <div className="p-5 bg-red-500/10 border border-red-500/20 rounded-2xl mb-6 text-center">
                                                <p className="text-[10px] font-black text-red-600 dark:text-red-400 uppercase tracking-widest mb-2">Avg. Resolution</p>
                                                <p className="text-4xl font-black text-foreground tracking-tighter">{rechartsMaintenance?.avgCompletionTimeHours}<span className="text-red-500 text-2xl">h</span></p>
                                            </div>
                                            <div className="space-y-3">
                                                {rechartsMaintenance?.topMaintainedResources.slice(0, 3).map((res: any, i: number) => (
                                                    <div key={i} className="flex items-center justify-between p-3.5 bg-slate-100 dark:bg-foreground/5 rounded-xl border border-slate-200 dark:border-border hover:bg-slate-200 dark:bg-foreground/10 transition-colors">
                                                        <p className="text-[10px] font-black text-slate-700 dark:text-foreground/70 truncate mr-2 uppercase tracking-tight">{res.name}</p>
                                                        <span className="text-[9px] font-black bg-red-500/20 text-red-600 dark:text-red-400 px-2.5 py-1 rounded-md whitespace-nowrap uppercase tracking-widest">{res.count} Issues</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </motion.div>

                                        {/* Categories */}
                                        <motion.div variants={itemVariants} className="lg:col-span-2 bg-card p-8 rounded-3xl border border-slate-200 dark:border-border shadow-xl">
                                            <div className="flex items-center justify-between mb-8">
                                                <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                                                    <LayoutDashboard className="w-5 h-5 text-purple-500" /> Asset Distribution
                                                </h3>
                                                <TimeRangePicker value={timeRange} onChange={setTimeRange} mini />
                                            </div>
                                            <div className="h-[250px]">
                                                <ResponsiveContainer width="100%" aspect={2.5}>
                                                    <BarChart data={resourceCategoryData} layout="vertical" margin={{ left: 20 }}>
                                                        <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke={chartGridColor} />
                                                        <XAxis type="number" hide />
                                                        <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} width={100} tick={{fill: chartTextColor, fontWeight: '900', fontSize: 10}} />
                                                        <RechartsTooltip cursor={{fill: 'rgba(0,0,0,0.05)'}} contentStyle={{borderRadius: '12px', backgroundColor: tooltipBg, border: `1px solid ${tooltipBorder}`, color: tooltipText}} />
                                                        <Bar dataKey="value" fill="#8B5CF6" radius={[0, 6, 6, 0]} barSize={24}>
                                                            {resourceCategoryData.map((entry, index) => (
                                                                <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                                                            ))}
                                                        </Bar>
                                                    </BarChart>
                                                </ResponsiveContainer>
                                            </div>
                                        </motion.div>
                                    </div>
                                </>
                            )}

                            {activeTab === 'bookings' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between bg-card p-6 rounded-3xl border border-slate-200 dark:border-border shadow-md">
                                        <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                                            <CalendarCheck className="w-5 h-5 text-indigo-500" /> Booking Statistics
                                        </h3>
                                        <TimeRangePicker value={timeRange} onChange={setTimeRange} />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <motion.div variants={itemVariants}><ChartCard title="Activity Trends" icon={<TrendingUp className="text-blue-500" />} loading={reportsLoading}><BookingLineChart data={chartJsTrends} /></ChartCard></motion.div>
                                        <motion.div variants={itemVariants}><ChartCard title="Workflow Distribution" icon={<PieIcon className="text-emerald-500" />} loading={reportsLoading}><BookingPieChart data={chartJsStatus} /></ChartCard></motion.div>
                                        <motion.div variants={itemVariants}><ChartCard title="Top Resources" icon={<Package className="text-purple-500" />} loading={reportsLoading}>
                                            <BookingBarChart data={{
                                                labels: (resourceFrequency as any)?.map((r: any) => r.name) || [],
                                                datasets: [{ label: 'Bookings', data: (resourceFrequency as any)?.map((r: any) => r.count) || [], backgroundColor: '#8B5CF6', borderRadius: 8 }]
                                            }} horizontal />
                                        </ChartCard></motion.div>
                                        <motion.div variants={itemVariants}><ChartCard title="Category Usage" icon={<LayoutDashboard className="text-indigo-500" />} loading={reportsLoading}>
                                            <BookingBarChart data={{
                                                labels: categoryFrequency ? Object.keys(categoryFrequency as any) : [],
                                                datasets: [{ label: 'Bookings', data: categoryFrequency ? Object.values(categoryFrequency as any) : [], backgroundColor: '#10B981', borderRadius: 8 }]
                                            }} />
                                        </ChartCard></motion.div>
                                    </div>
                                </div>
                            )}

                            {activeTab === 'utilization' && (
                                <div className="space-y-6">
                                    <div className="flex items-center justify-between bg-card p-6 rounded-3xl border border-slate-200 dark:border-border shadow-md">
                                        <h3 className="text-lg font-black text-foreground flex items-center gap-2">
                                            <Clock className="w-5 h-5 text-amber-500" /> Peak Usage & Efficiency
                                        </h3>
                                        <TimeRangePicker value={timeRange} onChange={setTimeRange} />
                                    </div>

                                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                                        <motion.div variants={itemVariants}><ChartCard title="Peak Booking Hours" icon={<Clock className="text-amber-500" />} loading={reportsLoading}><BookingBarChart data={chartJsPeakHours} /></ChartCard></motion.div>
                                        <motion.div variants={itemVariants}><ChartCard title="Busiest Days" icon={<CalendarCheck className="text-emerald-500" />} loading={reportsLoading}><BookingBarChart data={chartJsPeakDays} /></ChartCard></motion.div>
                                    </div>

                                    <motion.div variants={itemVariants} className="bg-card p-8 rounded-3xl border border-slate-200 dark:border-border shadow-lg overflow-hidden">
                                        <h3 className="text-lg font-black text-foreground mb-8 flex items-center gap-2">
                                            <BarChart3 className="w-5 h-5 text-indigo-500" /> Detailed Resource Utilization
                                        </h3>
                                        
                                        {reportsLoading ? (
                                            <div className="h-64 flex items-center justify-center"><div className="w-10 h-10 border-4 border-slate-200 dark:border-border border-t-blue-500 rounded-full animate-spin" /></div>
                                        ) : (
                                            <div className="overflow-x-auto">
                                                <table className="w-full text-left border-collapse">
                                                    <thead>
                                                        <tr className="border-b border-slate-200 dark:border-border">
                                                            <th className="pb-4 text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest">Resource</th>
                                                            <th className="pb-4 text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest">Category</th>
                                                            <th className="pb-4 text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest text-center">Total Bookings</th>
                                                            <th className="pb-4 text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest text-center">Total Hours</th>
                                                            <th className="pb-4 text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest text-right">Utilization %</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody className="divide-y divide-border/50">
                                                        {utilizationData?.length === 0 && (
                                                            <tr><td colSpan={5} className="py-12 text-center text-slate-500 dark:text-foreground/40 font-bold uppercase tracking-widest text-[10px]">No utilization data available.</td></tr>
                                                        )}
                                                        {utilizationData?.map((res: any) => (
                                                            <tr key={res.id ?? res.name} className="group hover:bg-foreground/[0.02] transition-colors">
                                                                <td className="py-4 font-black text-slate-800 dark:text-foreground/90 uppercase tracking-tight text-xs">{res.name}</td>
                                                                <td className="py-4">
                                                                    <span className="px-2.5 py-1 bg-slate-100 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-full text-[9px] font-black uppercase text-slate-600 dark:text-foreground/60 tracking-widest">{res.type}</span>
                                                                </td>
                                                                <td className="py-4 font-black text-blue-600 dark:text-blue-400 text-center text-sm">{res.totalBookings}</td>
                                                                <td className="py-4 text-[10px] font-black text-slate-600 dark:text-foreground/60 text-center uppercase tracking-widest">{res.totalHours}h</td>
                                                                <td className="py-4 text-right">
                                                                    <div className="flex items-center justify-end gap-3">
                                                                        <div className="w-24 bg-slate-200 dark:bg-foreground/10 h-2 rounded-full overflow-hidden hidden sm:block">
                                                                            <motion.div 
                                                                                initial={{ width: 0 }}
                                                                                animate={{ width: `${res.utilizationRate}%` }}
                                                                                transition={{ duration: 1, ease: "easeOut" }}
                                                                                className={`h-full rounded-full ${res.utilizationRate > 70 ? 'bg-red-500' : res.utilizationRate > 30 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                                                                            />
                                                                        </div>
                                                                        <span className="text-xs font-black text-foreground w-10">{res.utilizationRate}%</span>
                                                                    </div>
                                                                </td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </div>
                                        )}
                                    </motion.div>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>
        </ProtectedRoute>
    );
}

function TimeRangePicker({ value, onChange, mini }: { value: string, onChange: (v: any) => void, mini?: boolean }) {
    const options = [
        { label: '7D', full: '7 Days', value: '7d' },
        { label: '30D', full: '30 Days', value: '30d' },
        { label: '12M', full: '12 Months', value: '12m' },
        { label: 'Custom', full: 'Custom', value: 'custom' }
    ];

    return (
        <div className="flex items-center gap-1 bg-card p-1 rounded-xl border border-slate-200 dark:border-border shadow-sm">
            {options.map((opt) => (
                <button 
                    key={opt.value}
                    onClick={() => onChange(opt.value)}
                    className={`px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest transition-all ${value === opt.value ? 'bg-blue-600 text-white shadow-md' : 'text-slate-500 dark:text-foreground/40 hover:text-slate-800 dark:text-foreground/90 hover:bg-slate-100 dark:bg-foreground/5'}`}
                >
                    {mini ? opt.label : opt.full}
                </button>
            ))}
        </div>
    );
}

function ChartCard({ title, icon, loading, children }: { title: string, icon: React.ReactNode, loading: boolean, children: React.ReactNode }) {
    return (
        <div className="bg-card p-8 rounded-3xl border border-slate-200 dark:border-border shadow-xl min-h-[400px] flex flex-col relative overflow-hidden group">
            <h3 className="text-lg font-black text-foreground mb-6 flex items-center gap-2">
                {icon} {title}
            </h3>
            {loading ? (
                <div className="flex-1 flex items-center justify-center"><div className="w-8 h-8 border-[3px] border-slate-200 dark:border-border border-t-blue-500 rounded-full animate-spin" /></div>
            ) : (
                <div className="flex-1 relative z-10">{children}</div>
            )}
        </div>
    );
}

function StatCard({ title, value, icon, color }: { title: string, value: any, icon: React.ReactNode, color: string }) {
    return (
        <div className="bg-card p-6 rounded-3xl border border-slate-200 dark:border-border shadow-xl relative overflow-hidden group hover:bg-foreground/[0.02] transition-colors duration-300">
            <div className={`absolute -right-8 -top-8 w-32 h-32 ${color} opacity-[0.1] rounded-full blur-2xl group-hover:opacity-20 transition-opacity duration-500`} />
            <div className="flex items-center gap-5 relative z-10">
                <div className={`${color} p-4 rounded-2xl text-white shadow-lg ring-1 ring-white/10`}>
                    {icon}
                </div>
                <div>
                    <p className="text-[10px] font-black text-slate-500 dark:text-foreground/40 uppercase tracking-widest mb-1">{title}</p>
                    <p className="text-3xl font-black text-foreground tracking-tight">{value ?? "—"}</p>
                </div>
            </div>
        </div>
    );
}


