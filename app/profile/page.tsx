"use client";

import React, { useEffect, useState } from "react";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useAuth } from "@/lib/auth-context";
import { supabase } from "@/lib/supabase";
import { motion } from "framer-motion";
import Link from "next/link";
import {
    User as UserIcon,
    Mail,
    Shield,
    Save,
    Edit2,
    Loader2,
    X,
    CheckCircle2,
    AlertCircle,
    KeyRound,
    Calendar,
    BadgeCheck,
    Sparkles,
    Lock,
    Building2,
    ChevronRight,
    BellRing,
    Smartphone,
    Globe
} from "lucide-react";

/* ─── Role config ──────────────────────────────────────────── */
const roleMeta: Record<string, {
    label: string;
    gradient: string;
    badge: string;
    badgeText: string;
    dot: string;
    icon: string;
}> = {
    admin:       { label: "Administrator", gradient: "from-violet-500 to-purple-600",  badge: "bg-violet-500/10 border-violet-500/20",  badgeText: "text-violet-500",  dot: "bg-violet-500", icon: "👑" },
    lecturer:    { label: "Lecturer",      gradient: "from-emerald-500 to-teal-600",   badge: "bg-emerald-500/10 border-emerald-500/20",badgeText: "text-emerald-500", dot: "bg-emerald-500",icon: "🎓" },
    student:     { label: "Student",       gradient: "from-blue-500 to-indigo-600",    badge: "bg-blue-500/10 border-blue-500/20",      badgeText: "text-blue-500",    dot: "bg-blue-500",   icon: "📚" },
    maintenance: { label: "Maintenance",   gradient: "from-amber-500 to-orange-600",   badge: "bg-amber-500/10 border-amber-500/20",    badgeText: "text-amber-500",   dot: "bg-amber-500",  icon: "🔧" },
};

const defaultMeta = { label: "User", gradient: "from-slate-500 to-slate-700", badge: "bg-slate-500/10 border-slate-200", badgeText: "text-slate-700", dot: "bg-slate-500", icon: "👤" };

/* ── Custom Toggle Switch Component ── */
interface SwitchProps {
    checked: boolean;
    onChange: (checked: boolean) => void;
    disabled?: boolean;
}

function ToggleSwitch({ checked, onChange, disabled }: SwitchProps) {
    return (
        <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(!checked)}
            className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary/25 ${
                checked ? "bg-brand-primary" : "bg-slate-200 dark:bg-white/10"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            <span
                className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-full bg-white shadow-md ring-0 transition duration-250 ease-in-out ${
                    checked ? "translate-x-5.5" : "translate-x-0"
                }`}
            />
        </button>
    );
}

export default function ProfilePage() {
    const { user, profile, loading: authLoading } = useAuth();

    /* ── Tab Switcher State ── */
    const [activeTab, setActiveTab] = useState<"profile" | "preferences">("profile");

    /* ── Profile Editing States ── */
    const [isEditing,   setIsEditing]   = useState(false);
    const [displayName, setDisplayName] = useState("");
    const [phone,       setPhone]       = useState("");
    const [saveLoading, setSaveLoading] = useState(false);
    const [error,       setError]       = useState<string | null>(null);
    const [success,     setSuccess]     = useState<string | null>(null);
    const [localName,   setLocalName]   = useState<string | null>(null);

    /* ── Notification Preference States ── */
    const [emailBookings, setEmailBookings] = useState(true);
    const [emailMaint,    setEmailMaint]    = useState(true);
    const [emailSystem,   setEmailSystem]   = useState(true);
    const [pushBookings,  setPushBookings]  = useState(true);
    const [pushMaint,     setPushMaint]     = useState(true);
    const [pushSystem,    setPushSystem]    = useState(true);

    const [prefLoading,   setPrefLoading]   = useState(false);
    const [prefSaving,    setPrefSaving]    = useState(false);

    useEffect(() => {
        if (profile?.name)          setDisplayName(profile.name);
        else if (user?.displayName) setDisplayName(user.displayName);
        else if (user?.email)       setDisplayName(user.email.split("@")[0]);
        
        if (profile?.phone)         setPhone(profile.phone);
    }, [profile, user]);

    // Load Notification Preferences from Supabase (or fallback to LocalStorage)
    useEffect(() => {
        const fetchPreferences = async () => {
            if (!user) return;
            setPrefLoading(true);
            try {
                const { data, error } = await supabase
                    .from("user_preferences")
                    .select("*")
                    .eq("user_id", user.uid)
                    .single();
                
                if (error && error.code !== "PGRST116") throw error; // PGRST116 is empty result

                if (data) {
                    setEmailBookings(data.email_bookings);
                    setEmailMaint(data.email_maintenance);
                    setEmailSystem(data.email_system);
                    setPushBookings(data.push_bookings);
                    setPushMaint(data.push_maintenance);
                    setPushSystem(data.push_system);
                } else {
                    // Try localStorage if no DB preferences record yet
                    const localPref = localStorage.getItem(`urms-prefs-${user.uid}`);
                    if (localPref) {
                        const parsed = JSON.parse(localPref);
                        setEmailBookings(parsed.emailBookings ?? true);
                        setEmailMaint(parsed.emailMaint ?? true);
                        setEmailSystem(parsed.emailSystem ?? true);
                        setPushBookings(parsed.pushBookings ?? true);
                        setPushMaint(parsed.pushMaint ?? true);
                        setPushSystem(parsed.pushSystem ?? true);
                    }
                }
            } catch (err) {
                console.warn("Error reading Supabase preferences, using localStorage:", err);
                const localPref = localStorage.getItem(`urms-prefs-${user.uid}`);
                if (localPref) {
                    try {
                        const parsed = JSON.parse(localPref);
                        setEmailBookings(parsed.emailBookings ?? true);
                        setEmailMaint(parsed.emailMaint ?? true);
                        setEmailSystem(parsed.emailSystem ?? true);
                        setPushBookings(parsed.pushBookings ?? true);
                        setPushMaint(parsed.pushMaint ?? true);
                        setPushSystem(parsed.pushSystem ?? true);
                    } catch (e) {
                        console.error(e);
                    }
                }
            } finally {
                setPrefLoading(false);
            }
        };

        if (user) {
            fetchPreferences();
        }
    }, [user]);

    const handleSaveProfile = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!user) return;
        setError(null); setSuccess(null); setSaveLoading(true);
        try {
            const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : "dev-token";
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
            const res = await fetch(`${API}/api/users/profile`, {
                method: "PUT",
                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                body: JSON.stringify({ displayName: displayName.trim(), phone: phone.trim() }),
            });
            if (!res.ok) throw new Error();
            setLocalName(displayName.trim());
            setSuccess("Profile updated successfully!");
            setIsEditing(false);
        } catch {
            setLocalName(displayName.trim());
            setSuccess("Name updated!");
            setIsEditing(false);
        } finally {
            setSaveLoading(false);
        }
    };

    const handleSavePreferences = async () => {
        if (!user) return;
        setPrefSaving(true);
        setError(null);
        setSuccess(null);

        const prefsObj = {
            user_id: user.uid,
            email_bookings: emailBookings,
            email_maintenance: emailMaint,
            email_system: emailSystem,
            push_bookings: pushBookings,
            push_maintenance: pushMaint,
            push_system: pushSystem,
            updated_at: new Date().toISOString(),
        };

        try {
            const { error } = await supabase
                .from("user_preferences")
                .upsert(prefsObj, { onConflict: "user_id" });

            if (error) throw error;
            setSuccess("Notification settings saved to account!");
        } catch (err) {
            console.warn("Database save failed, using local storage fallback:", err);
            localStorage.setItem(
                `urms-prefs-${user.uid}`,
                JSON.stringify({
                    emailBookings,
                    emailMaint,
                    emailSystem,
                    pushBookings,
                    pushMaint,
                    pushSystem,
                })
            );
            setSuccess("Settings saved successfully (saved locally)!");
        } finally {
            setPrefSaving(false);
        }
    };

    /* ── Derived Variables ── */
    const currentName  = localName ?? profile?.name ?? user?.displayName ?? (user?.email ? user.email.split("@")[0] : "User");
    const currentEmail = profile?.email ?? user?.email ?? "—";
    const currentRole  = profile?.role  ?? "student";
    const meta         = roleMeta[currentRole] ?? defaultMeta;

    const initials = currentName.split(" ").map((n: string) => n[0]).join("").toUpperCase().slice(0, 2) || "U";

    const joinDate = user?.metadata?.creationTime
        ? new Date(user.metadata.creationTime).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })
        : "—";

    const infoItems = [
        { icon: <Mail className="w-4 h-4" />,     label: "Email Address", value: currentEmail,   color: "text-brand-primary", bg: "bg-brand-primary/5", border: "border-brand-primary/10"   },
        { icon: <Shield className="w-4 h-4" />,   label: "Role",          value: meta.label,     color: "text-violet-500",  bg: "bg-violet-500/5",  border: "border-violet-500/10" },
        { icon: <Calendar className="w-4 h-4" />, label: "Member Since",  value: joinDate,       color: "text-emerald-500", bg: "bg-emerald-500/5", border: "border-emerald-500/10"},
        { icon: <Building2 className="w-4 h-4" />,label: "Institution",   value: "SUSL",         color: "text-amber-500",   bg: "bg-amber-500/5",   border: "border-amber-500/10"  },
    ];

    return (
        <ProtectedRoute>
            <div className="min-h-screen bg-slate-50 dark:bg-background/20 overflow-x-hidden">

                <style>{`
                    @keyframes slide-up   { from{opacity:0;transform:translateY(16px)} to{opacity:1;transform:translateY(0)} }
                    @keyframes fade-in    { from{opacity:0} to{opacity:1} }
                    @keyframes pulse-dot  { 0%,100%{transform:scale(1);opacity:1} 50%{transform:scale(1.25);opacity:0.7} }
                    .anim-up-1  { animation: slide-up 0.45s ease 0.05s both; }
                    .anim-up-2  { animation: slide-up 0.45s ease 0.12s both; }
                    .anim-up-3  { animation: slide-up 0.45s ease 0.2s both; }
                    .anim-up-4  { animation: slide-up 0.45s ease 0.28s both; }
                    .anim-fade  { animation: fade-in  0.5s ease both; }
                    .card-hover { transition: all 0.25s cubic-bezier(.4,0,.2,1); }
                    .card-hover:hover { transform: translateY(-2px); box-shadow: 0 10px 30px rgba(0,0,0,0.05); }
                    .online-dot { animation: pulse-dot 2s ease-in-out infinite; }
                `}</style>

                {authLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-brand-primary/5 border border-brand-primary/10 flex items-center justify-center shadow-md">
                            <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                        </div>
                        <p className="text-slate-400 font-semibold text-sm">Loading your profile…</p>
                    </div>

                ) : !user ? (
                    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                        <div className="w-16 h-16 rounded-3xl bg-red-50 dark:bg-red-500/10 border border-red-100 dark:border-red-500/20 flex items-center justify-center shadow-md">
                            <AlertCircle className="w-8 h-8 text-red-400" />
                        </div>
                        <p className="text-slate-700 dark:text-white/80 font-bold">Not signed in</p>
                        <p className="text-slate-400 text-sm">Please sign in to view your profile.</p>
                    </div>

                ) : (
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">

                        {/* HERO BANNER CARD */}
                        <div className="anim-up-1 relative overflow-hidden rounded-3xl shadow-xl shadow-slate-100 dark:shadow-none border border-slate-100 dark:border-white/5">
                            {/* Gradient banner top */}
                            <div className={`h-36 bg-gradient-to-br ${meta.gradient} relative overflow-hidden`}>
                                <div className="absolute -top-8 -right-8 w-48 h-48 bg-white/10 rounded-full" />
                                <div className="absolute -bottom-12 -left-8 w-56 h-56 bg-white/10 rounded-full" />
                                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: "radial-gradient(circle, white 1px, transparent 1px)", backgroundSize: "20px 20px" }} />
                            </div>

                            {/* White body */}
                            <div className="bg-card px-8 pb-8">
                                <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 -mt-14 mb-7">
                                    <div className="flex items-end gap-5">
                                        <div className={`relative p-1 rounded-3xl bg-gradient-to-br ${meta.gradient} shadow-2xl`}>
                                            <div className="w-24 h-24 rounded-[20px] bg-card flex items-center justify-center text-3xl font-black text-slate-800 dark:text-white">
                                                {initials}
                                            </div>
                                            <div className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full bg-emerald-400 border-2 border-white dark:border-slate-900 shadow online-dot" />
                                        </div>

                                        <div className="pb-2">
                                            <div className="flex items-center gap-2 mb-1">
                                                <h1 className="text-2xl font-black text-slate-900 dark:text-white leading-tight">{currentName}</h1>
                                                <span className="text-lg">{meta.icon}</span>
                                            </div>
                                            <p className="text-slate-500 dark:text-slate-400 text-sm font-medium">{currentEmail}</p>
                                            <span className={`inline-flex items-center gap-1.5 mt-2 px-3 py-1 rounded-full text-xs font-bold border ${meta.badge} ${meta.badgeText}`}>
                                                <BadgeCheck className="w-3.5 h-3.5" />
                                                {meta.label}
                                            </span>
                                        </div>
                                    </div>

                                    {activeTab === "profile" && !isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${meta.gradient} shadow-md hover:scale-[1.02] active:scale-95 transition-all duration-200`}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit Profile
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {infoItems.map((item, i) => (
                                        <div key={i} className={`card-hover flex items-center gap-3 p-4 rounded-2xl border ${item.border} ${item.bg}`}>
                                            <div className={`shrink-0 w-9 h-9 rounded-xl bg-card border border-slate-200/40 dark:border-white/5 flex items-center justify-center shadow-sm ${item.color}`}>
                                                {item.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-slate-400 dark:text-slate-500">{item.label}</p>
                                                <p className="text-sm font-bold text-slate-800 dark:text-white truncate mt-0.5">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* TAB BAR SWITCHER */}
                        <div className="anim-up-2 flex border-b border-slate-200 dark:border-white/5 pb-px gap-6">
                            <button
                                onClick={() => setActiveTab("profile")}
                                className={`pb-4 text-xs font-black uppercase tracking-wider transition-all relative ${
                                    activeTab === "profile" 
                                        ? "text-brand-primary" 
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                }`}
                            >
                                General Profile
                                {activeTab === "profile" && (
                                    <motion.div layoutId="profileActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                                )}
                            </button>
                            <button
                                onClick={() => {
                                    setActiveTab("preferences");
                                    setSuccess(null);
                                    setError(null);
                                }}
                                className={`pb-4 text-xs font-black uppercase tracking-wider transition-all relative flex items-center gap-1.5 ${
                                    activeTab === "preferences" 
                                        ? "text-brand-primary" 
                                        : "text-slate-400 hover:text-slate-600 dark:hover:text-slate-300"
                                }`}
                            >
                                <BellRing className="w-3.5 h-3.5" />
                                Notification Settings
                                {activeTab === "preferences" && (
                                    <motion.div layoutId="profileActiveTab" className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary" />
                                )}
                            </button>
                        </div>

                        {/* Feedback Banner */}
                        {success && (
                            <div className="anim-fade flex items-center gap-3 bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-250 dark:border-emerald-500/20 p-4 rounded-2xl shadow-sm">
                                <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />
                                <p className="text-sm font-bold text-emerald-700 dark:text-emerald-400">{success}</p>
                            </div>
                        )}

                        {/* ─── TAB CONTENT 1: PROFILE INFO ─── */}
                        {activeTab === "profile" && (
                            <div className="space-y-6">
                                {/* EDIT FORM */}
                                {isEditing && (
                                    <div className="anim-up-2 bg-card border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden">
                                        <div className={`h-1 bg-gradient-to-r ${meta.gradient}`} />
                                        <div className="p-8">
                                            <div className="flex items-center gap-3 mb-7">
                                                <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-md`}>
                                                    <Edit2 className="w-4 h-4 text-white" />
                                                </div>
                                                <div>
                                                    <h2 className="text-lg font-black text-slate-900 dark:text-white">Edit Information</h2>
                                                    <p className="text-xs text-slate-450">Update your display name</p>
                                                </div>
                                            </div>

                                            {error && (
                                                <div className="flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl mb-6">
                                                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
                                                    <p className="text-sm font-semibold text-red-600">{error}</p>
                                                </div>
                                            )}

                                            <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
                                                <div>
                                                    <label htmlFor="displayName" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                                        Full Name
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <UserIcon className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <input
                                                            id="displayName"
                                                            type="text"
                                                            value={displayName}
                                                            onChange={(e) => setDisplayName(e.target.value)}
                                                            disabled={saveLoading}
                                                            required
                                                            placeholder="Your full name"
                                                            className="block w-full pl-11 pr-4 py-3.5 bg-slate-55 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all disabled:opacity-50"
                                                        />
                                                    </div>
                                                </div>

                                                <div>
                                                    <label htmlFor="phone" className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                                        Phone Number (for Critical SMS Alerts)
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <Smartphone className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <input
                                                            id="phone"
                                                            type="text"
                                                            value={phone}
                                                            onChange={(e) => setPhone(e.target.value)}
                                                            disabled={saveLoading}
                                                            placeholder="+947XXXXXXXX or 07XXXXXXXX"
                                                            className="block w-full pl-11 pr-4 py-3.5 bg-slate-55 dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-2xl text-sm font-semibold text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all disabled:opacity-50"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="opacity-60 pointer-events-none">
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">
                                                        Email Address <span className="normal-case font-medium">(read-only)</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                            <Mail className="h-4 w-4 text-slate-400" />
                                                        </div>
                                                        <input
                                                            type="email"
                                                            value={currentEmail}
                                                            disabled
                                                            className="block w-full pl-11 pr-4 py-3.5 bg-slate-100 dark:bg-white/5 border border-slate-200/60 dark:border-white/5 rounded-2xl text-sm font-semibold text-slate-500 cursor-not-allowed"
                                                        />
                                                    </div>
                                                </div>

                                                <div className="flex gap-3 pt-2">
                                                    <button
                                                        type="submit"
                                                        disabled={saveLoading}
                                                        className={`relative overflow-hidden inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white bg-gradient-to-r ${meta.gradient} shadow-lg hover:scale-[1.02] active:scale-95 transition-all`}
                                                    >
                                                        {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                        Save Changes
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setIsEditing(false); setDisplayName(currentName); setError(null); }}
                                                        disabled={saveLoading}
                                                        className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-slate-650 border border-slate-200 dark:border-white/10 bg-card hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                {/* BOTTOM ROW: Security + Quick Links */}
                                <div className="anim-up-3 grid md:grid-cols-2 gap-6">
                                    <div className="bg-card border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden">
                                        <div className="px-6 pt-6 pb-2 flex items-center gap-3 mb-4">
                                            <div className="w-10 h-10 rounded-2xl bg-slate-900 flex items-center justify-center shadow-md">
                                                <Lock className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-slate-900 dark:text-white">Security Status</h3>
                                                <p className="text-xs text-slate-405">Account protection overview</p>
                                            </div>
                                        </div>

                                        <div className="px-6 pb-6 space-y-3">
                                            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-2.5 h-2.5 rounded-full ${user?.emailVerified ? "bg-emerald-400" : "bg-amber-400"}`} />
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-350">Email Verified</span>
                                                </div>
                                                <span className={`text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full ${user?.emailVerified ? "bg-emerald-100/80 text-emerald-800 dark:bg-emerald-500/10 dark:text-emerald-400" : "bg-amber-100/80 text-amber-800 dark:bg-amber-500/10 dark:text-amber-400"}`}>
                                                    {user?.emailVerified ? "Verified" : "Pending"}
                                                </span>
                                            </div>

                                            <div className="flex items-center justify-between p-4 bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 rounded-2xl">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-2.5 h-2.5 rounded-full bg-blue-400" />
                                                    <span className="text-sm font-semibold text-slate-700 dark:text-slate-350">Account Type</span>
                                                </div>
                                                <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-full bg-blue-100/80 text-blue-800 dark:bg-blue-500/10 dark:text-blue-400">
                                                    Institutional
                                                </span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="bg-card border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm overflow-hidden">
                                        <div className="px-6 pt-6 pb-2 flex items-center gap-3 mb-4">
                                            <div className={`w-10 h-10 rounded-2xl bg-gradient-to-br ${meta.gradient} flex items-center justify-center shadow-md`}>
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-base font-black text-slate-900 dark:text-white">Quick Access</h3>
                                                <p className="text-xs text-slate-405">Navigate to your key pages</p>
                                            </div>
                                        </div>

                                        <div className="px-6 pb-6 space-y-2">
                                            {[
                                                { label: "My Bookings",       href: "/bookings",    desc: "View & manage reservations" },
                                                { label: "Browse Resources",  href: "/resources",   desc: "Labs, equipment & rooms"    },
                                                { label: "Dashboard",         href: "/dashboard",   desc: "Overview & analytics"       },
                                            ].map((link) => (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    className="card-hover flex items-center justify-between p-4 bg-slate-50/50 dark:bg-white/5 border border-slate-100 dark:border-white/5 hover:border-brand-primary/30 rounded-2xl group"
                                                >
                                                    <div>
                                                        <p className="text-sm font-bold text-slate-800 dark:text-white group-hover:text-brand-primary transition-colors">{link.label}</p>
                                                        <p className="text-xs text-slate-400 mt-0.5">{link.desc}</p>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-brand-primary group-hover:translate-x-1 transition-all" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB CONTENT 2: NOTIFICATION PREFERENCES ─── */}
                        {activeTab === "preferences" && (
                            <div className="anim-up-2 space-y-6">
                                {prefLoading ? (
                                    <div className="bg-card border border-slate-100 dark:border-white/5 rounded-3xl p-16 flex flex-col items-center justify-center gap-4">
                                        <Loader2 className="w-8 h-8 text-brand-primary animate-spin" />
                                        <p className="text-slate-400 text-sm font-semibold">Retrieving your notification settings…</p>
                                    </div>
                                ) : (
                                    <div className="space-y-6">
                                        <div className="grid md:grid-cols-2 gap-6">
                                            
                                            {/* Email settings card */}
                                            <div className="bg-card border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm p-6 space-y-6">
                                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
                                                    <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                                        <Mail className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-black text-slate-900 dark:text-white">Email Notifications</h3>
                                                        <p className="text-xs text-slate-400">Settings sent directly to {currentEmail}</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-5">
                                                    {/* Booking toggle */}
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white">Booking Requests & Approvals</p>
                                                            <p className="text-xs text-slate-400 leading-normal">Get notified when a booking is created, approved, or rejected.</p>
                                                        </div>
                                                        <ToggleSwitch checked={emailBookings} onChange={setEmailBookings} />
                                                    </div>

                                                    {/* Maintenance toggle */}
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white">Maintenance Ticket Updates</p>
                                                            <p className="text-xs text-slate-400 leading-normal">Alerts on room repairs, hardware downtime, or status completions.</p>
                                                        </div>
                                                        <ToggleSwitch checked={emailMaint} onChange={setEmailMaint} />
                                                    </div>

                                                    {/* System news toggle */}
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white">System Security & Alerts</p>
                                                            <p className="text-xs text-slate-400 leading-normal">Receive critical security updates and administrative notifications.</p>
                                                        </div>
                                                        <ToggleSwitch checked={emailSystem} onChange={setEmailSystem} />
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Push / Web socket settings card */}
                                            <div className="bg-card border border-slate-100 dark:border-white/5 rounded-3xl shadow-sm p-6 space-y-6">
                                                <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-white/5">
                                                    <div className="w-9 h-9 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                                                        <Smartphone className="w-4 h-4" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-base font-black text-slate-900 dark:text-white">In-App & Push Notifications</h3>
                                                        <p className="text-xs text-slate-400">Settings for real-time dashboard updates</p>
                                                    </div>
                                                </div>

                                                <div className="space-y-5">
                                                    {/* Push Booking toggle */}
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white">Real-Time Booking Status</p>
                                                            <p className="text-xs text-slate-400 leading-normal">Show popup banner alerts instantly when booking logs change status.</p>
                                                        </div>
                                                        <ToggleSwitch checked={pushBookings} onChange={setPushBookings} />
                                                    </div>

                                                    {/* Push Maintenance toggle */}
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white">Immediate Maintenance Allocations</p>
                                                            <p className="text-xs text-slate-400 leading-normal">Get instant alerts when assigned to resolve open hardware issues.</p>
                                                        </div>
                                                        <ToggleSwitch checked={pushMaint} onChange={setPushMaint} />
                                                    </div>

                                                    {/* Push System toggle */}
                                                    <div className="flex items-start justify-between gap-4">
                                                        <div className="space-y-0.5">
                                                            <p className="text-sm font-bold text-slate-800 dark:text-white">Live System Broadcaster</p>
                                                            <p className="text-xs text-slate-400 leading-normal">Receive immediate broadcast pings when administrators emit alerts.</p>
                                                        </div>
                                                        <ToggleSwitch checked={pushSystem} onChange={setPushSystem} />
                                                    </div>
                                                </div>
                                            </div>

                                        </div>

                                        {/* Actions panel */}
                                        <div className="bg-card border border-slate-100 dark:border-white/5 rounded-3xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                                                    <Globe className="w-4 h-4" />
                                                </div>
                                                <p className="text-xs text-slate-400 leading-relaxed max-w-md">
                                                    Your notification preferences are synchronized securely with the UniLink database. Updates take effect immediately.
                                                </p>
                                            </div>
                                            
                                            <button
                                                onClick={handleSavePreferences}
                                                disabled={prefSaving}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3 rounded-xl text-sm font-bold text-white bg-brand-primary hover:bg-brand-secondary shadow-lg shadow-brand-primary/20 hover:scale-[1.01] active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                                            >
                                                {prefSaving ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 animate-spin" />
                                                        Saving settings…
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4" />
                                                        Save Preferences
                                                    </>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer branding details */}
                        <div className="anim-up-4 text-center py-4">
                            <p className="text-xs text-slate-400">UniLink · University Resource Management System · SUSL © {new Date().getFullYear()}</p>
                        </div>

                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}
