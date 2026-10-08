"use client";

import React, { useState, useEffect, FormEvent, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import {
  AtSign,
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  AlertCircle,
  User,
  BadgeCheck,
  ChevronDown,
  Sparkles,
  CheckCircle2,
  Building2,
  ChevronLeft,
  Shield,
  Zap,
  Users,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";
import {
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut,
} from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL as API_BASE } from "@/lib/apiClient";

/*
 * URMS LIGHT BLUE DESIGN SYSTEM
 * bg-base      : #F8FAFC  surface: #FFFFFF  border: #E2E8F0
 * primary      : #0EA5E9  primary-dark: #0284C7
 * teal         : #0D9488  teal-light: #CCFBF1
 * ink-main     : #0F172A  ink-muted: #64748B
 */

/* ── Password Strength ── */
function PasswordStrength({ password }: { password: string }) {
  const strength =
    password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 8 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
    : 3;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const bars   = ["", "bg-rose-400", "bg-amber-400", "bg-sky-400", "bg-teal-500"];
  const texts  = ["", "text-rose-500", "text-amber-500", "text-sky-500", "text-teal-600"];

  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-500 ${
              i <= strength ? bars[strength] : "bg-[#E2E8F0]"
            }`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-semibold ${texts[strength]}`}>
        {labels[strength]} password
      </p>
    </div>
  );
}

/* ── Floating stat card for the branding panel ── */
function StatCard({
  icon: Icon,
  value,
  label,
  delay,
}: {
  icon: React.ElementType;
  value: string;
  label: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.5, ease: "easeOut" }}
      className="flex items-center gap-3 bg-white/10 backdrop-blur-sm border border-white/20 rounded-2xl px-4 py-3"
    >
      <span className="flex h-8 w-8 items-center justify-center rounded-xl bg-white/15">
        <Icon className="h-4 w-4 text-white" />
      </span>
      <div>
        <p className="text-[15px] font-bold text-white leading-none">{value}</p>
        <p className="text-[10px] text-white/60 mt-0.5">{label}</p>
      </div>
    </motion.div>
  );
}

/* ── Main Auth Content ── */
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? false : true;

  const [isLogin, setIsLogin] = useState(initialMode);
  const { signIn, user, loading: authLoading } = useAuth();

  const [email, setEmail]                 = useState("");
  const [password, setPassword]           = useState("");
  const [showPassword, setShowPassword]   = useState(false);
  const [loading, setLoading]             = useState(false);
  const [error, setError]                 = useState<string | null>(null);
  const [success, setSuccess]             = useState<string | null>(null);
  const [fullName, setFullName]           = useState("");
  const [role, setRole]                   = useState("");
  const [department, setDepartment]       = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (!authLoading && user && isLogin) router.push("/dashboard");
  }, [user, authLoading, router, isLogin]);

  const toggleMode = (loginMode: boolean) => {
    setError(null);
    setSuccess(null);
    setIsLogin(loginMode);
    const url = new URL(window.location.href);
    if (loginMode) url.searchParams.delete("mode");
    else url.searchParams.set("mode", "register");
    window.history.pushState({}, "", url.toString());
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      try {
        const token = await auth?.currentUser?.getIdToken();
        if (token) {
          const verifyResponse = await fetch(`${API_BASE}/users/verify-password`, {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
            body: JSON.stringify({ email, password }),
          });
          if (verifyResponse.ok) {
            const data = await verifyResponse.json();
            if (data.valid === false) {
              if (auth) await firebaseSignOut(auth);
              setError("Password verification failed. Please reset your password.");
              setLoading(false);
              return;
            }
          }
        }
      } catch {
        // bcrypt endpoint optional
      }
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("wrong-password") || err.message.includes("invalid-credential"))
          setError("Incorrect email or password.");
        else if (err.message.includes("user-not-found"))
          setError("No account found with that email.");
        else if (err.message.includes("too-many-requests"))
          setError("Too many attempts. Please try again later.");
        else setError("Sign-in failed. Please try again.");
      } else setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!fullName || !email || !role || !department || !password || !confirmPassword) {
      setError("All fields are required.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Please enter a valid email address.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }
    setLoading(true);
    try {
      if (!auth) throw new Error("Auth service unavailable.");
      const cred = await createUserWithEmailAndPassword(auth, email, password);
      if (fullName.trim()) await updateProfile(cred.user, { displayName: fullName.trim() });
      const token = await cred.user.getIdToken();
      const res = await fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.toLowerCase(),
          role: role.toLowerCase(),
          department,
          password,
        }),
      });
      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save registration.");
      }
      if (auth) await signOut(auth);
      const isStudent = role.toLowerCase() === "student";
      setSuccess(
        isStudent
          ? "Account created successfully! You can now sign in."
          : "Account created! Pending admin approval."
      );
      setTimeout(() => toggleMode(true), 2500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        const code = (err as { code?: string }).code ?? "";
        if (code.includes("email-already-in-use"))
          setError("An account with this email already exists.");
        else if (code.includes("weak-password"))
          setError("Password is too weak. Use at least 8 characters.");
        else setError(err.message || "Registration failed. Please try again.");
      } else setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  };

  /* ── shared input class ── */
  const inputCls =
    "w-full bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl pl-10 pr-4 py-3 text-[13px] text-[#0F172A] placeholder-[#94A3B8] focus:outline-none focus:border-[#0EA5E9] focus:ring-2 focus:ring-[#0EA5E9]/15 transition-all duration-200 disabled:opacity-50";

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-hidden selection:bg-[#0EA5E9]/20">

      {/* ════════════════ LEFT BRANDING PANEL ════════════════ */}
      <motion.div
        initial={{ x: -60, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        transition={{ duration: 0.6, ease: "easeOut" }}
        className="hidden lg:flex lg:w-[52%] relative flex-col items-center justify-center overflow-hidden"
        style={{
          background: "linear-gradient(135deg, #0F172A 0%, #0c2340 45%, #0D9488 100%)",
        }}
      >
        {/* Decorative blobs */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          <div className="absolute -top-32 -right-32 h-96 w-96 rounded-full bg-[#0EA5E9]/20 blur-3xl" />
          <div className="absolute -bottom-32 -left-32 h-80 w-80 rounded-full bg-[#0D9488]/30 blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-64 w-64 rounded-full bg-white/[0.03] blur-2xl" />
        </div>

        {/* Subtle dot grid */}
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage: "radial-gradient(#fff 1px, transparent 1px)",
            backgroundSize: "28px 28px",
          }}
        />

        {/* Content */}
        <div className="relative z-10 flex flex-col items-center text-center px-14 max-w-lg">
          {/* Logo */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5, type: "spring" }}
            className="mb-8 flex items-center justify-center p-3 rounded-2xl bg-white/10 backdrop-blur-sm border border-white/20 shadow-xl"
          >
            <img src="/logo1.png" alt="UniLink Logo" className="h-12 w-auto object-contain" />
          </motion.div>

          <motion.h1
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="text-4xl font-bold text-white leading-tight tracking-tight"
          >
            Uni<span className="text-[#38BDF8]">Link</span>
            <span className="block text-[13px] font-semibold text-white/40 uppercase tracking-[0.2em] mt-1">
              URMS Platform
            </span>
          </motion.h1>

          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="mt-5 text-[14px] leading-relaxed text-white/60 max-w-xs"
          >
            The unified campus resource management system — every lecture hall,
            lab and seminar space, zero double-bookings.
          </motion.p>

          {/* Stat cards */}
          <div className="mt-10 grid grid-cols-1 gap-3 w-full max-w-xs">
            <StatCard icon={Building2} value="482" label="Campus rooms indexed" delay={0.5} />
            <StatCard icon={Users}     value="3,200+" label="Active faculty & students" delay={0.6} />
            <StatCard icon={Zap}       value="3.2s" label="Average booking time" delay={0.7} />
          </div>
        </div>

        {/* Mode switch hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.9, duration: 0.5 }}
          className="absolute bottom-8 left-0 right-0 text-center"
        >
          <p className="text-[11px] text-white/30 uppercase tracking-widest">
            Sabaragamuwa University of Sri Lanka
          </p>
        </motion.div>
      </motion.div>

      {/* ════════════════ RIGHT FORM PANEL ════════════════ */}
      <div className="flex-1 flex flex-col min-h-screen bg-white">

        {/* Top bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0]">
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 text-[12px] font-medium text-[#64748B] hover:text-[#0EA5E9] transition-colors group"
          >
            <ChevronLeft className="h-3.5 w-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Back to Home
          </Link>

          {/* Tab switcher */}
          <div className="flex items-center gap-1 bg-[#F8FAFC] rounded-full p-1 border border-[#E2E8F0]">
            <button
              onClick={() => toggleMode(true)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 ${
                isLogin
                  ? "bg-white text-[#0F172A] shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => toggleMode(false)}
              className={`px-4 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 ${
                !isLogin
                  ? "bg-white text-[#0F172A] shadow-sm"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
            >
              Register
            </button>
          </div>
        </div>

        {/* Form area */}
        <div className="flex-1 flex items-center justify-center px-6 py-10 overflow-y-auto">
          <div className="w-full max-w-[420px]">
            <AnimatePresence mode="wait">
              {isLogin ? (
                /* ── LOGIN FORM ── */
                <motion.div
                  key="login"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* Heading */}
                  <div className="mb-8">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F0F9FF] text-[#0EA5E9] rounded-full text-[11px] font-semibold mb-4 border border-[#BAE6FD]">
                      <Shield className="h-3 w-3" />
                      Secure Campus Access
                    </div>
                    <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                      Welcome back
                    </h2>
                    <p className="mt-1 text-[13px] text-[#64748B]">
                      Sign in to your university account
                    </p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    {/* Email */}
                    <div>
                      <label className="block text-[12px] font-medium text-[#0F172A] mb-1.5">
                        Institutional Email
                      </label>
                      <div className="relative">
                        <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@university.ac.lk"
                          disabled={loading}
                          className={inputCls}
                        />
                      </div>
                    </div>

                    {/* Password */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[12px] font-medium text-[#0F172A]">
                          Password
                        </label>
                        <Link
                          href="/forgot-password"
                          className="text-[11px] text-[#0EA5E9] hover:text-[#0284C7] font-medium transition-colors"
                        >
                          Forgot password?
                        </Link>
                      </div>
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          disabled={loading}
                          className={`${inputCls} pr-10`}
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(!showPassword)}
                          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                        >
                          {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </button>
                      </div>
                    </div>

                    {/* Error */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -6, height: 0 }}
                          className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3"
                        >
                          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          <p className="text-[12px] text-rose-600 font-medium">{error}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3 mt-2 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-[#0EA5E9] to-[#0D9488] shadow-md shadow-[#0EA5E9]/20 hover:shadow-lg hover:shadow-[#0EA5E9]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Signing in…
                        </>
                      ) : (
                        <>
                          Sign In
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>
                  </form>

                  {/* Bottom hint */}
                  <p className="mt-6 text-center text-[12px] text-[#64748B]">
                    Don't have an account?{" "}
                    <button
                      onClick={() => toggleMode(false)}
                      className="text-[#0EA5E9] font-semibold hover:text-[#0284C7] transition-colors"
                    >
                      Create one
                    </button>
                  </p>
                </motion.div>
              ) : (
                /* ── REGISTER FORM ── */
                <motion.div
                  key="register"
                  initial={{ opacity: 0, y: 18 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -18 }}
                  transition={{ duration: 0.3, ease: "easeOut" }}
                >
                  {/* Heading */}
                  <div className="mb-6">
                    <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#F0FDFA] text-[#0D9488] rounded-full text-[11px] font-semibold mb-4 border border-[#99F6E4]">
                      <Sparkles className="h-3 w-3" />
                      New Account Registration
                    </div>
                    <h2 className="text-2xl font-bold text-[#0F172A] tracking-tight">
                      Join UniLink
                    </h2>
                    <p className="mt-1 text-[13px] text-[#64748B]">
                      Register for campus resource access
                    </p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-4">
                    {/* Full Name + Email */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-medium text-[#0F172A] mb-1.5">
                          Full Name
                        </label>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                          <input
                            type="text"
                            required
                            value={fullName}
                            onChange={(e) => setFullName(e.target.value)}
                            placeholder="Jane Doe"
                            disabled={loading}
                            className={inputCls}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-[#0F172A] mb-1.5">
                          Email
                        </label>
                        <div className="relative">
                          <AtSign className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                          <input
                            type="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="@university"
                            disabled={loading}
                            className={inputCls}
                          />
                        </div>
                      </div>
                    </div>

                    {/* Role + Faculty */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-medium text-[#0F172A] mb-1.5">
                          Role
                        </label>
                        <div className="relative">
                          <BadgeCheck className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                          <select
                            required
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                            disabled={loading}
                            className={`${inputCls} pr-8 appearance-none`}
                          >
                            <option value="" disabled>Select role</option>
                            <option value="Admin">Admin</option>
                            <option value="Lecturer">Lecturer</option>
                            <option value="Student">Student</option>
                            <option value="Maintenance">Maintenance</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8] pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-[#0F172A] mb-1.5">
                          Faculty
                        </label>
                        <div className="relative">
                          <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                          <select
                            required
                            value={department}
                            onChange={(e) => setDepartment(e.target.value)}
                            disabled={loading}
                            className={`${inputCls} pr-8 appearance-none`}
                          >
                            <option value="" disabled>Select faculty</option>
                            <option value="Faculty of Computing">Computing</option>
                            <option value="Faculty of Applied Sciences">Applied Sci.</option>
                            <option value="Faculty of Management">Management</option>
                          </select>
                          <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8] pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    {/* Passwords */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[12px] font-medium text-[#0F172A] mb-1.5">
                          Password
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            className={`${inputCls} pr-10`}
                          />
                          <button
                            type="button"
                            onClick={() => setShowPassword(!showPassword)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-[#94A3B8] hover:text-[#64748B] transition-colors"
                          >
                            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                          </button>
                        </div>
                        <PasswordStrength password={password} />
                      </div>
                      <div>
                        <label className="block text-[12px] font-medium text-[#0F172A] mb-1.5">
                          Confirm
                        </label>
                        <div className="relative">
                          <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#94A3B8]" />
                          <input
                            type={showPassword ? "text" : "password"}
                            required
                            value={confirmPassword}
                            onChange={(e) => setConfirmPassword(e.target.value)}
                            placeholder="••••••••"
                            disabled={loading}
                            className={`${inputCls} ${
                              confirmPassword && password !== confirmPassword
                                ? "border-rose-300 focus:border-rose-400 focus:ring-rose-100"
                                : confirmPassword && password === confirmPassword
                                ? "border-teal-400 focus:border-teal-500 focus:ring-teal-100"
                                : ""
                            }`}
                          />
                          {confirmPassword && (
                            <span className="absolute right-3 top-1/2 -translate-y-1/2">
                              {password === confirmPassword
                                ? <CheckCircle2 className="h-4 w-4 text-teal-500" />
                                : <AlertCircle className="h-4 w-4 text-rose-400" />
                              }
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Error / Success */}
                    <AnimatePresence>
                      {error && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -6, height: 0 }}
                          className="flex items-start gap-2.5 bg-rose-50 border border-rose-200 rounded-xl p-3"
                        >
                          <AlertCircle className="h-4 w-4 text-rose-500 shrink-0 mt-0.5" />
                          <p className="text-[12px] text-rose-600 font-medium">{error}</p>
                        </motion.div>
                      )}
                      {success && (
                        <motion.div
                          initial={{ opacity: 0, y: -6, height: 0 }}
                          animate={{ opacity: 1, y: 0, height: "auto" }}
                          exit={{ opacity: 0, y: -6, height: 0 }}
                          className="flex items-start gap-2.5 bg-[#F0FDFA] border border-[#99F6E4] rounded-xl p-3"
                        >
                          <CheckCircle2 className="h-4 w-4 text-[#0D9488] shrink-0 mt-0.5" />
                          <p className="text-[12px] text-[#0D9488] font-medium">{success}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Submit */}
                    <button
                      type="submit"
                      disabled={loading}
                      className="w-full flex items-center justify-center gap-2 py-3 mt-1 rounded-xl text-[13px] font-semibold text-white bg-gradient-to-r from-[#0EA5E9] to-[#0D9488] shadow-md shadow-[#0EA5E9]/20 hover:shadow-lg hover:shadow-[#0EA5E9]/30 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 disabled:opacity-60 disabled:pointer-events-none"
                    >
                      {loading ? (
                        <>
                          <div className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white animate-spin" />
                          Creating account…
                        </>
                      ) : (
                        <>
                          Create Account
                          <ArrowRight className="h-4 w-4" />
                        </>
                      )}
                    </button>

                    <p className="text-center text-[11px] text-[#64748B]">
                      {role.toLowerCase() === "student"
                        ? "Student accounts are automatically approved."
                        : "Non-student accounts require admin approval before access is granted."}
                    </p>
                  </form>

                  <p className="mt-5 text-center text-[12px] text-[#64748B]">
                    Already have an account?{" "}
                    <button
                      onClick={() => toggleMode(true)}
                      className="text-[#0EA5E9] font-semibold hover:text-[#0284C7] transition-colors"
                    >
                      Sign in
                    </button>
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="px-6 py-4 border-t border-[#E2E8F0] text-center">
          <p className="text-[11px] text-[#94A3B8]">
            © {new Date().getFullYear()} UniLink URMS · Sabaragamuwa University of Sri Lanka
          </p>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#F8FAFC] flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-10 w-10 rounded-full border-2 border-[#E2E8F0] border-t-[#0EA5E9] animate-spin" />
            <p className="text-[12px] text-[#64748B] font-medium">Loading…</p>
          </div>
        </div>
      }
    >
      <AuthContent />
    </Suspense>
  );
}
