"use client";

import { useState, FormEvent } from "react";
import Link from "next/link";
import {
    AtSign,
    ArrowRight,
    ArrowLeft,
    AlertCircle,
    Mail,
    CheckCircle2,
    RotateCcw,
    ShieldCheck,
    KeyRound,
    Inbox,
} from "lucide-react";
import { sendPasswordResetEmail } from "firebase/auth";
import { auth } from "@/lib/firebase";

function Orb({ className }: { className: string }) {
    return <div className={`absolute rounded-full blur-3xl opacity-20 animate-pulse ${className}`} />;
}

/* step indicator shown on left panel */
function Step({ num, title, desc, active }: { num: string; title: string; desc: string; active?: boolean }) {
    return (
        <div className="flex items-start gap-4">
            <div className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 border transition-all ${active ? "bg-blue-500/30 border-blue-400/60" : "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10"}`}>
                <span className={`text-xs font-black ${active ? "text-blue-300" : "text-slate-500"}`}>{num}</span>
            </div>
            <div className="pt-1">
                <p className={`font-bold text-sm ${active ? "text-white" : "text-slate-500"}`}>{title}</p>
                <p className="text-slate-600 text-xs mt-0.5">{desc}</p>
            </div>
        </div>
    );
}

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState("");
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [focusedField, setFocusedField] = useState(false);

    const handleSubmit = async (e: FormEvent) => {
        e.preventDefault();
        setError(null);
        setSuccess(null);

        if (!email) {
            setError("Please enter your email address.");
            return;
        }

        if (!auth) {
            setError("Authentication service is not available. Please try again later.");
            return;
        }

        setLoading(true);
        try {
            await sendPasswordResetEmail(auth, email);
            setSuccess("Password reset link sent! Please check your inbox.");
            setEmail("");
        } catch (err: unknown) {
            if (err instanceof Error) {
                if (err.message.includes("user-not-found")) {
                    setError("No account found with that email.");
                } else if (err.message.includes("invalid-email")) {
                    setError("Please enter a valid email address.");
                } else {
                    setError("Failed to send reset email. Please try again.");
                }
            } else {
                setError("An unexpected error occurred.");
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex min-h-[calc(100vh-64px)] overflow-hidden bg-[#080E1E]">

            {/* ══════════════ LEFT PANEL ══════════════ */}
            <div className="hidden lg:flex lg:w-[48%] relative flex-col justify-between p-14 overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-br from-[#0D1B3E] via-[#0a1530] to-[#080E1E]" />
                <Orb className="w-80 h-80 bg-blue-600 -top-20 -right-10" />
                <Orb className="w-64 h-64 bg-indigo-500 bottom-20 -left-10" />
                <Orb className="w-40 h-40 bg-sky-400 top-1/2 left-1/2" />

                {/* grid */}
                <div
                    className="absolute inset-0 opacity-[0.04]"
                    style={{
                        backgroundImage: "linear-gradient(rgba(255,255,255,0.3) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.3) 1px, transparent 1px)",
                        backgroundSize: "40px 40px",
                    }}
                />
                {/* photo */}
                <div className="absolute inset-0">
                    <img
                        src="https://images.unsplash.com/photo-1562774053-701939374585?q=80&w=2000&auto=format&fit=crop"
                        alt="University Campus"
                        className="w-full h-full object-cover opacity-10 mix-blend-luminosity"
                    />
                </div>

                {/* top badge */}
                <div className="relative z-10">
                    <div className="inline-flex items-center gap-2 bg-slate-100 dark:bg-white/10 backdrop-blur border border-slate-300 dark:border-white/20 rounded-full px-4 py-2">
                        <ShieldCheck className="w-4 h-4 text-blue-300" />
                        <span className="text-white/80 text-xs font-semibold tracking-wide">Secure Account Recovery</span>
                    </div>
                </div>

                {/* main content */}
                <div className="relative z-10 flex flex-col gap-10">
                    <div>
                        <h2 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-5">
                            Regain<br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-sky-200">
                                Your Access.
                            </span>
                        </h2>
                        <p className="text-white/60 text-lg font-medium leading-relaxed max-w-sm">
                            Securely reset your password and get back to managing your university resources.
                        </p>
                    </div>

                    {/* steps */}
                    <div className="space-y-5">
                        <Step num="01" title="Enter Your Email" desc="Provide your institutional email address" active={!success} />
                        <Step num="02" title="Check Your Inbox" desc="We'll send a secure reset link" active={!!success} />
                        <Step num="03" title="Set New Password" desc="Click the link and choose a new password" />
                    </div>
                </div>
            </div>

            {/* ══════════════ RIGHT PANEL ══════════════ */}
            <div className="flex w-full lg:w-[52%] flex-col items-center justify-center p-8 sm:p-12 relative">
                <div className="absolute inset-0 bg-gradient-to-b from-[#0D1428] to-[#080E1E]" />
                <Orb className="w-64 h-64 bg-blue-700 bottom-0 right-0 opacity-10" />

                <div className="relative z-10 w-full max-w-sm">

                    {/* back link */}
                    <Link
                        href="/login"
                        className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 hover:text-slate-300 mb-10 transition-colors group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
                        Back to sign in
                    </Link>

                    {/* ── SUCCESS STATE ── */}
                    {success ? (
                        <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                            {/* icon */}
                            <div className="flex justify-center mb-8">
                                <div className="relative">
                                    <div className="w-20 h-20 rounded-full bg-emerald-500/20 border border-emerald-500/30 flex items-center justify-center">
                                        <Inbox className="w-9 h-9 text-emerald-400" />
                                    </div>
                                    <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-emerald-500 flex items-center justify-center shadow-lg shadow-emerald-500/40">
                                        <CheckCircle2 className="w-4 h-4 text-white" />
                                    </div>
                                    {/* pulse rings */}
                                    <div className="absolute inset-0 rounded-full border border-emerald-500/30 animate-ping" />
                                </div>
                            </div>

                            <div className="text-center mb-8">
                                <h1 className="text-3xl font-black text-white tracking-tight mb-3">Check Your Inbox</h1>
                                <p className="text-slate-500 font-medium leading-relaxed">
                                    We&apos;ve sent a password reset link to your email. It may take a moment to arrive.
                                </p>
                            </div>

                            {/* info card */}
                            <div className="bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl p-5 space-y-3 mb-8">
                                {[
                                    { icon: <Mail className="w-4 h-4 text-blue-400" />, text: "Check your spam/junk folder if you don't see it" },
                                    { icon: <KeyRound className="w-4 h-4 text-blue-400" />, text: "The link expires in 1 hour for security" },
                                    { icon: <ShieldCheck className="w-4 h-4 text-blue-400" />, text: "Never share your reset link with anyone" },
                                ].map((item, i) => (
                                    <div key={i} className="flex items-start gap-3">
                                        <div className="mt-0.5 shrink-0">{item.icon}</div>
                                        <p className="text-slate-400 text-sm font-medium leading-snug">{item.text}</p>
                                    </div>
                                ))}
                            </div>

                            <button
                                onClick={() => setSuccess(null)}
                                className="w-full flex items-center justify-center gap-2 border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 hover:bg-slate-100 dark:bg-white/10 text-slate-300 font-bold py-3.5 rounded-2xl transition-all group"
                            >
                                <RotateCcw className="w-4 h-4 group-hover:rotate-180 transition-transform duration-500" />
                                Resend Email
                            </button>
                        </div>
                    ) : (

                        /* ── FORM STATE ── */
                        <div className="animate-in fade-in duration-300">
                            <div className="mb-10">
                                <div className="inline-flex items-center gap-2 bg-blue-500/10 border border-blue-500/20 rounded-full px-3 py-1 mb-5">
                                    <div className="w-2 h-2 bg-blue-400 rounded-full animate-pulse" />
                                    <span className="text-blue-300 text-xs font-semibold">Account Recovery</span>
                                </div>
                                <h1 className="text-3xl font-black text-white tracking-tight mb-2">Reset Password</h1>
                                <p className="text-slate-500 font-medium">Enter your email to receive a secure reset link</p>
                            </div>

                            <form onSubmit={handleSubmit} className="space-y-5" noValidate>
                                <div>
                                    <label htmlFor="email" className="block text-xs font-bold uppercase tracking-widest text-slate-500 mb-2">
                                        Institutional Email
                                    </label>
                                    <div className={`relative transition-all duration-200 ${focusedField ? "scale-[1.01]" : ""}`}>
                                        <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                            <AtSign className={`h-4 w-4 transition-colors ${focusedField ? "text-blue-400" : "text-slate-600"}`} />
                                        </div>
                                        <input
                                            id="email"
                                            type="email"
                                            required
                                            value={email}
                                            onChange={(e) => setEmail(e.target.value)}
                                            onFocus={() => setFocusedField(true)}
                                            onBlur={() => setFocusedField(false)}
                                            placeholder="name@university.ac.lk"
                                            disabled={loading}
                                            className="block w-full pl-11 pr-4 py-3.5 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-2xl text-sm font-semibold text-white placeholder-slate-600 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60 focus:bg-white/8 transition-all disabled:opacity-40"
                                        />
                                    </div>
                                </div>

                                {/* Error */}
                                {error && (
                                    <div className="flex items-center gap-3 bg-red-500/10 border border-red-500/20 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
                                        <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
                                        <p className="text-sm font-semibold text-red-400 leading-tight">{error}</p>
                                    </div>
                                )}

                                {/* hint */}
                                <p className="text-xs font-medium text-slate-600 leading-relaxed">
                                    We&apos;ll send a secure link to this address. The link expires in <span className="text-slate-400 font-bold">1 hour</span>.
                                </p>

                                {/* Submit */}
                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full relative overflow-hidden bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-4 rounded-2xl transition-all duration-300 shadow-lg shadow-blue-500/20 hover:shadow-blue-500/40 hover:shadow-xl active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group"
                                >
                                    <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
                                    {loading ? (
                                        <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                                    ) : (
                                        <>
                                            Send Reset Link
                                            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                                        </>
                                    )}
                                </button>
                            </form>

                            <p className="mt-8 text-center text-sm font-medium text-slate-600">
                                Remember your password?{" "}
                                <Link href="/login" className="font-bold text-blue-400 hover:text-blue-300 transition-colors">
                                    Sign In
                                </Link>
                            </p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
