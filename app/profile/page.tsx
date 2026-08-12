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
    admin:       { label: "Administrator", gradient: "bg-gradient-to-br from-violet-600 to-indigo-600",  badge: "bg-violet-500/10 border-violet-500/20",  badgeText: "text-violet-500",  dot: "bg-violet-500", icon: "👑" },
    lecturer:    { label: "Lecturer",      gradient: "bg-gradient-to-br from-emerald-500 to-teal-600",   badge: "bg-emerald-500/10 border-emerald-500/20",badgeText: "text-emerald-500", dot: "bg-emerald-500",icon: "🎓" },
    student:     { label: "Student",       gradient: "bg-gradient-to-br from-blue-500 to-indigo-600",    badge: "bg-blue-500/10 border-blue-500/20",      badgeText: "text-blue-500",    dot: "bg-blue-500",   icon: "📚" },
    maintenance: { label: "Maintenance",   gradient: "bg-gradient-to-br from-amber-500 to-orange-600",   badge: "bg-amber-500/10 border-amber-500/20",    badgeText: "text-amber-500",   dot: "bg-amber-500",  icon: "🔧" },
};

const defaultMeta = { label: "User", gradient: "bg-gradient-to-br from-slate-500 to-slate-700", badge: "bg-slate-500/10 border-slate-200", badgeText: "text-slate-700", dot: "bg-slate-500", icon: "👤" };

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
            className={`relative inline-flex h-6.5 w-12 shrink-0 cursor-pointer rounded-none border-2 border-transparent transition-colors duration-250 ease-in-out focus:outline-none focus:ring-2 focus:ring-brand-primary/25 ${
                checked ? "bg-brand-primary" : "bg-slate-200 dark:bg-white/10"
            } ${disabled ? "opacity-50 cursor-not-allowed" : ""}`}
        >
            <span
                className={`pointer-events-none inline-block h-5.5 w-5.5 transform rounded-none bg-white shadow-md ring-0 transition duration-250 ease-in-out ${
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
            <div className="min-h-screen bg-[#F8FAFC] overflow-x-hidden">

                <style>{`
                    @keyframes slide-up   { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
                    @keyframes fade-in    { from{opacity:0} to{opacity:1} }
                    @keyframes pulse-ring { 0%,100%{transform:scale(1);opacity:0.6} 50%{transform:scale(1.12);opacity:0} }
                    @keyframes online-pulse { 0%,100%{box-shadow:0 0 0 0 rgba(16,185,129,0.5)} 70%{box-shadow:0 0 0 6px rgba(16,185,129,0)} }
                    .anim-1 { animation: slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.05s both; }
                    .anim-2 { animation: slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.12s both; }
                    .anim-3 { animation: slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.2s both; }
                    .anim-4 { animation: slide-up 0.5s cubic-bezier(0.16,1,0.3,1) 0.28s both; }
                    .anim-fade { animation: fade-in 0.4s ease both; }
                    .ring-pulse::before { content:''; position:absolute; inset:-4px; border-radius:50%; border:2px solid; animation: pulse-ring 2.5s ease-in-out infinite; }
                    .online-dot { animation: online-pulse 2s ease-in-out infinite; }
                    .card-lift { transition: all 0.25s cubic-bezier(0.4,0,0.2,1); }
                    .card-lift:hover { transform: translateY(-3px); box-shadow: 0 12px 32px rgba(14,165,233,0.10); }
                    .tab-underline { position:absolute; bottom:-1px; left:0; right:0; height:2px; border-radius:2px; background:linear-gradient(90deg,#0EA5E9,#0D9488); }
                    .input-field {
                        width:100%; padding: 0.875rem 1rem 0.875rem 2.75rem;
                        background:#fff; border:1.5px solid #E2E8F0; border-radius:12px;
                        font-size:0.875rem; font-weight:600; color:#0F172A;
                        transition: border-color 0.2s, box-shadow 0.2s;
                        outline:none;
                    }
                    .input-field:focus { border-color:#0EA5E9; box-shadow:0 0 0 3px rgba(14,165,233,0.12); }
                    .input-field:disabled { background:#F8FAFC; color:#94A3B8; cursor:not-allowed; }
                    .toggle-track {
                        position:relative; display:inline-flex; align-items:center;
                        width:46px; height:26px; border-radius:99px; cursor:pointer;
                        transition: background 0.25s ease; border:none; outline:none;
                        flex-shrink:0;
                    }
                    .toggle-thumb {
                        position:absolute; left:3px; width:20px; height:20px;
                        background:#fff; border-radius:50%;
                        box-shadow: 0 1px 4px rgba(0,0,0,0.18);
                        transition: transform 0.25s cubic-bezier(0.4,0,0.2,1);
                    }
                `}</style>

                {authLoading ? (
                    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-[#F0F9FF] border border-[#BAE6FD] flex items-center justify-center shadow-md">
                            <Loader2 className="w-7 h-7 text-[#0EA5E9] animate-spin" />
                        </div>
                        <p className="text-[#64748B] font-semibold text-sm">Loading your profile…</p>
                    </div>

                ) : !user ? (
                    <div className="flex flex-col items-center justify-center min-h-screen gap-4">
                        <div className="w-16 h-16 rounded-2xl bg-red-50 border border-red-100 flex items-center justify-center shadow-md">
                            <AlertCircle className="w-7 h-7 text-red-400" />
                        </div>
                        <p className="text-[#0F172A] font-bold">Not signed in</p>
                        <p className="text-[#64748B] text-sm">Please sign in to view your profile.</p>
                    </div>

                ) : (
                    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

                        {/* ── HERO CARD ── */}
                        <div className="anim-1 relative overflow-hidden rounded-2xl bg-white border border-[#E2E8F0] shadow-sm">
                            {/* Banner gradient */}
                            <div className="h-40 relative overflow-hidden"
                                style={{ background: "linear-gradient(135deg, #0EA5E9 0%, #0D9488 50%, #0284C7 100%)" }}>
                                {/* Decorative blobs */}
                                <div className="absolute -top-10 -right-10 w-52 h-52 rounded-full bg-white/10" />
                                <div className="absolute -bottom-16 -left-6 w-48 h-48 rounded-full bg-white/10" />
                                <div className="absolute top-4 right-4 w-24 h-24 rounded-full bg-white/5" />
                                {/* Dot grid */}
                                <div className="absolute inset-0 opacity-10"
                                    style={{ backgroundImage:"radial-gradient(circle, white 1.5px, transparent 1.5px)", backgroundSize:"24px 24px" }} />
                                {/* Role badge top-right */}
                                <div className="absolute top-4 left-6 flex items-center gap-2">
                                    <span className="text-xl">{meta.icon}</span>
                                    <span className="text-xs font-bold text-white/80 uppercase tracking-widest">{meta.label} Account</span>
                                </div>
                            </div>

                            {/* Avatar + name row */}
                            <div className="px-6 sm:px-8 pb-6">
                                <div className="relative -mt-12 mb-4 w-fit">
                                    <div className="w-24 h-24 rounded-2xl bg-white border-4 border-white shadow-xl flex items-center justify-center"
                                        style={{ background: "linear-gradient(135deg, #0EA5E9, #0D9488)" }}>
                                        <span className="text-3xl font-black text-white">{initials}</span>
                                    </div>
                                    {/* Online dot */}
                                    <div className="absolute -bottom-1.5 -right-1.5 w-5 h-5 rounded-full bg-emerald-400 border-2 border-white shadow-sm online-dot" />
                                </div>

                                <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
                                    <div className="pb-1 max-w-full">
                                        <div className="flex items-center gap-2 mb-1">
                                            <h1 className="text-xl font-black text-[#0F172A] leading-tight">{currentName}</h1>
                                            <BadgeCheck className="w-4.5 h-4.5 text-[#0EA5E9] shrink-0" />
                                        </div>
                                        <p className="text-[#64748B] text-sm break-all">{currentEmail}</p>
                                        <div className="mt-2.5">
                                            <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[11px] font-bold border ${meta.badge} ${meta.badgeText}`}>
                                                <BadgeCheck className="w-3 h-3" />
                                                {meta.label}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Edit button */}
                                    {activeTab === "profile" && !isEditing && (
                                        <button
                                            onClick={() => setIsEditing(true)}
                                            className="shrink-0 flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl text-sm font-bold text-white transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg active:scale-95 cursor-pointer h-fit"
                                            style={{ background: "linear-gradient(135deg, #0EA5E9, #0D9488)", boxShadow: "0 4px 14px rgba(14,165,233,0.25)" }}
                                        >
                                            <Edit2 className="w-4 h-4" />
                                            Edit Profile
                                        </button>
                                    )}
                                </div>

                                {/* Info chips row */}
                                <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                                    {[
                                        { icon: <Mail className="w-4 h-4" />,     label: "Email",        value: currentEmail, accent: "#0EA5E9", bg: "#F0F9FF" },
                                        { icon: <Shield className="w-4 h-4" />,   label: "Role",         value: meta.label,   accent: "#8B5CF6", bg: "#F5F3FF" },
                                        { icon: <Calendar className="w-4 h-4" />, label: "Member Since", value: joinDate,      accent: "#0D9488", bg: "#F0FDFA" },
                                        { icon: <Building2 className="w-4 h-4" />,label: "Institution",  value: "SUSL",        accent: "#F59E0B", bg: "#FFFBEB" },
                                    ].map((item, i) => (
                                        <div key={i} className="card-lift flex items-center gap-3 p-3.5 rounded-xl border border-[#E2E8F0] bg-[#F8FAFC]">
                                            <div className="shrink-0 w-9 h-9 rounded-xl flex items-center justify-center"
                                                style={{ background: item.bg, color: item.accent }}>
                                                {item.icon}
                                            </div>
                                            <div className="min-w-0">
                                                <p className="text-[9px] font-bold uppercase tracking-widest text-[#94A3B8]">{item.label}</p>
                                                <p className="text-[12px] font-bold text-[#0F172A] truncate mt-0.5">{item.value}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>

                        {/* ── TAB BAR ── */}
                        <div className="anim-2 flex items-center gap-1 bg-white border border-[#E2E8F0] rounded-2xl p-1.5 shadow-sm">
                            {[
                                { key: "profile", label: "General Profile", icon: <UserIcon className="w-3.5 h-3.5" /> },
                                { key: "preferences", label: "Notifications", icon: <BellRing className="w-3.5 h-3.5" /> },
                            ].map((tab) => (
                                <button
                                    key={tab.key}
                                    onClick={() => { setActiveTab(tab.key as any); setSuccess(null); setError(null); }}
                                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all duration-200 cursor-pointer ${
                                        activeTab === tab.key
                                            ? "text-white shadow-md"
                                            : "text-[#64748B] hover:text-[#0F172A] hover:bg-[#F8FAFC]"
                                    }`}
                                    style={activeTab === tab.key ? { background: "linear-gradient(135deg, #0EA5E9, #0D9488)" } : {}}
                                >
                                    {tab.icon}
                                    {tab.label}
                                </button>
                            ))}
                        </div>

                        {/* ── Feedback Banner ── */}
                        {success && (
                            <div className="anim-fade flex items-center gap-3 bg-[#F0FDFA] border border-[#99F6E4] p-4 rounded-2xl shadow-sm">
                                <CheckCircle2 className="w-5 h-5 text-[#0D9488] shrink-0" />
                                <p className="text-sm font-semibold text-[#0F766E]">{success}</p>
                            </div>
                        )}
                        {error && (
                            <div className="anim-fade flex items-center gap-3 bg-red-50 border border-red-200 p-4 rounded-2xl shadow-sm">
                                <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />
                                <p className="text-sm font-semibold text-red-600">{error}</p>
                            </div>
                        )}

                        {/* ─── TAB 1: PROFILE ─── */}
                        {activeTab === "profile" && (
                            <div className="anim-3 space-y-5">

                                {/* Edit Form */}
                                {isEditing && (
                                    <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
                                        {/* Top accent bar */}
                                        <div className="h-1 w-full" style={{ background: "linear-gradient(90deg, #0EA5E9, #0D9488)" }} />
                                        <div className="p-6 sm:p-8">
                                            <div className="flex items-center gap-3 mb-6">
                                                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                                                    style={{ background: "linear-gradient(135deg, #0EA5E9, #0D9488)" }}>
                                                    <Edit2 className="w-4 h-4" />
                                                </div>
                                                <div>
                                                    <h2 className="text-base font-bold text-[#0F172A]">Edit Information</h2>
                                                    <p className="text-xs text-[#64748B]">Update your display name and contact details</p>
                                                </div>
                                            </div>

                                            <form onSubmit={handleSaveProfile} className="space-y-5 max-w-lg">
                                                {/* Full Name */}
                                                <div>
                                                    <label htmlFor="displayName" className="block text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mb-2">
                                                        Full Name
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                            <UserIcon className="h-4 w-4 text-[#94A3B8]" />
                                                        </div>
                                                        <input
                                                            id="displayName" type="text"
                                                            value={displayName}
                                                            onChange={(e) => setDisplayName(e.target.value)}
                                                            disabled={saveLoading} required
                                                            placeholder="Your full name"
                                                            className="input-field"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Phone */}
                                                <div>
                                                    <label htmlFor="phone" className="block text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mb-2">
                                                        Phone Number <span className="normal-case font-medium">(for SMS alerts)</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                            <Smartphone className="h-4 w-4 text-[#94A3B8]" />
                                                        </div>
                                                        <input
                                                            id="phone" type="text"
                                                            value={phone}
                                                            onChange={(e) => setPhone(e.target.value)}
                                                            disabled={saveLoading}
                                                            placeholder="+947XXXXXXXX"
                                                            className="input-field"
                                                        />
                                                    </div>
                                                </div>

                                                {/* Email (read-only) */}
                                                <div className="opacity-60 pointer-events-none">
                                                    <label className="block text-[10px] font-black uppercase tracking-widest text-[#94A3B8] mb-2">
                                                        Email Address <span className="normal-case font-medium">(read-only)</span>
                                                    </label>
                                                    <div className="relative">
                                                        <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                                                            <Mail className="h-4 w-4 text-[#94A3B8]" />
                                                        </div>
                                                        <input type="email" value={currentEmail} disabled className="input-field" />
                                                    </div>
                                                </div>

                                                {/* Actions */}
                                                <div className="flex gap-3 pt-1">
                                                    <button
                                                        type="submit" disabled={saveLoading}
                                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                                        style={{ background: "linear-gradient(135deg, #0EA5E9, #0D9488)", boxShadow: "0 4px 14px rgba(14,165,233,0.25)" }}
                                                    >
                                                        {saveLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                                                        Save Changes
                                                    </button>
                                                    <button
                                                        type="button"
                                                        onClick={() => { setIsEditing(false); setDisplayName(currentName); setError(null); }}
                                                        disabled={saveLoading}
                                                        className="inline-flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-semibold text-[#64748B] bg-[#F8FAFC] border border-[#E2E8F0] hover:bg-[#F0F9FF] hover:border-[#0EA5E9]/40 transition-all cursor-pointer"
                                                    >
                                                        <X className="w-4 h-4" />
                                                        Cancel
                                                    </button>
                                                </div>
                                            </form>
                                        </div>
                                    </div>
                                )}

                                {/* Security + Quick Links */}
                                <div className="grid md:grid-cols-2 gap-5">
                                    {/* Security Status */}
                                    <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
                                        <div className="px-6 pt-6 pb-4 flex items-center gap-3 border-b border-[#F1F5F9]">
                                            <div className="w-10 h-10 rounded-xl bg-[#0F172A] flex items-center justify-center shadow-md">
                                                <Lock className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-[#0F172A]">Security Status</h3>
                                                <p className="text-xs text-[#64748B]">Account protection overview</p>
                                            </div>
                                        </div>
                                        <div className="px-6 py-4 space-y-3">
                                            {[
                                                {
                                                    label: "Email Verified",
                                                    ok: user?.emailVerified,
                                                    trueText: "Verified",
                                                    falseText: "Pending",
                                                },
                                                {
                                                    label: "Account Type",
                                                    ok: true,
                                                    trueText: "Institutional",
                                                    falseText: "—",
                                                },
                                            ].map((row, i) => (
                                                <div key={i} className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                                                    <div className="flex items-center gap-2.5">
                                                        <div className={`w-2 h-2 rounded-full ${row.ok ? "bg-emerald-400" : "bg-amber-400"}`} />
                                                        <span className="text-sm font-semibold text-[#0F172A]">{row.label}</span>
                                                    </div>
                                                    <span className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full ${row.ok ? "bg-[#F0FDFA] text-[#0D9488]" : "bg-amber-50 text-amber-600"}`}>
                                                        {row.ok ? row.trueText : row.falseText}
                                                    </span>
                                                </div>
                                            ))}
                                            <div className="flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                                                <div className="flex items-center gap-2.5">
                                                    <KeyRound className="w-4 h-4 text-[#64748B]" />
                                                    <span className="text-sm font-semibold text-[#0F172A]">Password</span>
                                                </div>
                                                <button className="text-[11px] font-bold text-[#0EA5E9] hover:text-[#0284C7] transition-colors cursor-pointer flex items-center gap-1">
                                                    Change <ChevronRight className="w-3 h-3" />
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Quick Access */}
                                    <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm overflow-hidden">
                                        <div className="px-6 pt-6 pb-4 flex items-center gap-3 border-b border-[#F1F5F9]">
                                            <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-md"
                                                style={{ background: "linear-gradient(135deg, #0EA5E9, #0D9488)" }}>
                                                <Sparkles className="w-4 h-4 text-white" />
                                            </div>
                                            <div>
                                                <h3 className="text-sm font-bold text-[#0F172A]">Quick Access</h3>
                                                <p className="text-xs text-[#64748B]">Jump to your key pages</p>
                                            </div>
                                        </div>
                                        <div className="px-6 py-4 space-y-2">
                                            {[
                                                { label: "My Bookings",      href: "/bookings",   desc: "View & manage reservations",   icon: <Calendar className="w-4 h-4" /> },
                                                { label: "Browse Resources", href: "/resources",  desc: "Labs, equipment & rooms",      icon: <Building2 className="w-4 h-4" /> },
                                                { label: "Dashboard",        href: "/dashboard",  desc: "Overview & analytics",         icon: <Sparkles className="w-4 h-4" /> },
                                            ].map((link) => (
                                                <Link
                                                    key={link.href}
                                                    href={link.href}
                                                    className="card-lift flex items-center justify-between p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] hover:border-[#BAE6FD] hover:bg-[#F0F9FF] group"
                                                >
                                                    <div className="flex items-center gap-3">
                                                        <div className="w-8 h-8 rounded-lg flex items-center justify-center text-[#0EA5E9] bg-[#E0F2FE]">
                                                            {link.icon}
                                                        </div>
                                                        <div>
                                                            <p className="text-sm font-bold text-[#0F172A] group-hover:text-[#0EA5E9] transition-colors">{link.label}</p>
                                                            <p className="text-xs text-[#64748B] mt-0.5">{link.desc}</p>
                                                        </div>
                                                    </div>
                                                    <ChevronRight className="w-4 h-4 text-[#CBD5E1] group-hover:text-[#0EA5E9] group-hover:translate-x-1 transition-all" />
                                                </Link>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}

                        {/* ─── TAB 2: NOTIFICATION PREFERENCES ─── */}
                        {activeTab === "preferences" && (
                            <div className="anim-3 space-y-5">
                                {prefLoading ? (
                                    <div className="bg-white border border-[#E2E8F0] rounded-2xl p-16 flex flex-col items-center gap-4">
                                        <Loader2 className="w-8 h-8 text-[#0EA5E9] animate-spin" />
                                        <p className="text-[#64748B] text-sm font-semibold">Retrieving your notification settings…</p>
                                    </div>
                                ) : (
                                    <div className="space-y-5">
                                        <div className="grid md:grid-cols-2 gap-5">
                                            {/* Email Notifications */}
                                            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
                                                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#F1F5F9]">
                                                    <div className="w-9 h-9 rounded-xl bg-[#F0F9FF] flex items-center justify-center">
                                                        <Mail className="w-4 h-4 text-[#0EA5E9]" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-[#0F172A]">Email Notifications</h3>
                                                        <p className="text-xs text-[#64748B] truncate">Sent to {currentEmail}</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    {[
                                                        { label: "Booking Requests & Approvals", desc: "Notified when a booking is created, approved, or rejected.", checked: emailBookings, onChange: setEmailBookings },
                                                        { label: "Maintenance Ticket Updates",   desc: "Alerts on room repairs, hardware downtime or completions.",  checked: emailMaint,    onChange: setEmailMaint    },
                                                        { label: "System Security & Alerts",     desc: "Critical security updates and administrative notifications.", checked: emailSystem,   onChange: setEmailSystem   },
                                                    ].map((row, i) => (
                                                        <div key={i} className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                                                            <div className="space-y-0.5">
                                                                <p className="text-sm font-semibold text-[#0F172A]">{row.label}</p>
                                                                <p className="text-xs text-[#64748B] leading-normal">{row.desc}</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => row.onChange(!row.checked)}
                                                                className="toggle-track shrink-0 mt-0.5"
                                                                style={{ background: row.checked ? "linear-gradient(135deg,#0EA5E9,#0D9488)" : "#E2E8F0" }}
                                                                aria-pressed={row.checked}
                                                            >
                                                                <span className="toggle-thumb" style={{ transform: row.checked ? "translateX(20px)" : "translateX(0)" }} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>

                                            {/* Push / In-App Notifications */}
                                            <div className="bg-white border border-[#E2E8F0] rounded-2xl shadow-sm p-6">
                                                <div className="flex items-center gap-3 pb-4 mb-4 border-b border-[#F1F5F9]">
                                                    <div className="w-9 h-9 rounded-xl bg-[#F0FDFA] flex items-center justify-center">
                                                        <Smartphone className="w-4 h-4 text-[#0D9488]" />
                                                    </div>
                                                    <div>
                                                        <h3 className="text-sm font-bold text-[#0F172A]">In-App & Push</h3>
                                                        <p className="text-xs text-[#64748B]">Real-time dashboard updates</p>
                                                    </div>
                                                </div>
                                                <div className="space-y-4">
                                                    {[
                                                        { label: "Real-Time Booking Status",         desc: "Popup banner alerts when booking status changes.",            checked: pushBookings, onChange: setPushBookings },
                                                        { label: "Immediate Maintenance Allocations", desc: "Instant alerts when assigned to resolve hardware issues.",    checked: pushMaint,    onChange: setPushMaint    },
                                                        { label: "Live System Broadcaster",           desc: "Broadcast pings when administrators emit system alerts.",    checked: pushSystem,   onChange: setPushSystem   },
                                                    ].map((row, i) => (
                                                        <div key={i} className="flex items-start justify-between gap-4 p-3.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0]">
                                                            <div className="space-y-0.5">
                                                                <p className="text-sm font-semibold text-[#0F172A]">{row.label}</p>
                                                                <p className="text-xs text-[#64748B] leading-normal">{row.desc}</p>
                                                            </div>
                                                            <button
                                                                type="button"
                                                                onClick={() => row.onChange(!row.checked)}
                                                                className="toggle-track shrink-0 mt-0.5"
                                                                style={{ background: row.checked ? "linear-gradient(135deg,#0EA5E9,#0D9488)" : "#E2E8F0" }}
                                                                aria-pressed={row.checked}
                                                            >
                                                                <span className="toggle-thumb" style={{ transform: row.checked ? "translateX(20px)" : "translateX(0)" }} />
                                                            </button>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Save footer */}
                                        <div className="bg-white border border-[#E2E8F0] rounded-2xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-9 h-9 rounded-xl bg-[#F0FDFA] flex items-center justify-center">
                                                    <Globe className="w-4 h-4 text-[#0D9488]" />
                                                </div>
                                                <p className="text-xs text-[#64748B] leading-relaxed max-w-md">
                                                    Preferences are synced securely with the UniLink database and take effect immediately.
                                                </p>
                                            </div>
                                            <button
                                                onClick={handleSavePreferences}
                                                disabled={prefSaving}
                                                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-7 py-2.5 rounded-xl text-sm font-bold text-white shadow-md hover:-translate-y-0.5 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                                                style={{ background: "linear-gradient(135deg, #0EA5E9, #0D9488)", boxShadow: "0 4px 14px rgba(14,165,233,0.25)" }}
                                            >
                                                {prefSaving ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" />Saving…</>
                                                ) : (
                                                    <><Save className="w-4 h-4" />Save Preferences</>
                                                )}
                                            </button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        )}

                        {/* Footer */}
                        <div className="anim-4 text-center py-4">
                            <p className="text-xs text-[#94A3B8]">UniLink · University Resource Management System · SUSL © {new Date().getFullYear()}</p>
                        </div>

                    </div>
                )}
            </div>
        </ProtectedRoute>
    );
}

