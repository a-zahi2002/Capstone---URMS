"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  User, 
  AtSign, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  CheckCircle2, 
  Sparkles, 
  BadgeCheck, 
  ChevronDown, 
  ChevronLeft 
} from "lucide-react";
import {
  createUserWithEmailAndPassword,
  updateProfile,
} from "firebase/auth";
import { auth } from "@/lib/firebase";
import { createUserProfile } from "@/lib/supabase";
import { motion } from "framer-motion";

/* Password strength helper */
function PasswordStrength({ password }: { password: string }) {
  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 8 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
    : 3;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];
  const textColors = ["", "text-rose-500 dark:text-rose-400", "text-amber-500 dark:text-amber-400", "text-blue-500 dark:text-blue-400", "text-emerald-500 dark:text-emerald-400"];

  if (!password) return null;

  return (
    <div className="mt-2 space-y-1.5 ml-1">
      <div className="flex gap-1.5">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-1 flex-1 rounded-full transition-all duration-300 ${i <= strength ? colors[strength] : "bg-slate-200 dark:bg-white/10"}`}
          />
        ))}
      </div>
      <p className={`text-[10px] font-bold uppercase tracking-wider ${textColors[strength]}`}>{labels[strength]} Password</p>
    </div>
  );
}

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const validateForm = () => {
    if (!fullName || !email || !role || !department || !password || !confirmPassword) {
      setError("All fields are required.");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError("Please enter a valid email address.");
      return false;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return false;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validateForm()) return;

    setLoading(true);
    try {
      if (!auth) {
        throw new Error("Authentication service is not available. Please try again later.");
      }
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const uid = userCredential.user.uid;

      if (fullName.trim()) {
        await updateProfile(userCredential.user, { displayName: fullName.trim() });
      }

      await createUserProfile({
        id: uid,
        name: fullName.trim(),
        email: email.toLowerCase(),
        role: role.toLowerCase() as any,
        department: department
      });

      setSuccess("Account created! Redirecting to sign in…");
      setTimeout(() => router.push("/login"), 1500);
    } catch (err: unknown) {
      if (err instanceof Error) {
        const code = (err as { code?: string }).code ?? "";
        if (code.includes("email-already-in-use")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else if (code.includes("weak-password")) {
          setError("Password is too weak. Use at least 8 characters.");
        } else if (code.includes("invalid-email")) {
          setError("The email address is not valid.");
        } else if (code.includes("network-request-failed")) {
          setError("Network error. Check your connection and try again.");
        } else {
          setError("Registration failed. Please try again.");
        }
        console.error(err);
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBase = "block w-full pl-11 pr-4 py-2.5 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-border/80 rounded-2xl text-sm font-bold text-foreground placeholder-slate-400 dark:placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50 transition-all disabled:opacity-40";

  return (
    <div className="min-h-screen w-full flex flex-col justify-center items-center py-12 px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-background text-foreground">
      
      {/* Premium Cursor Highlight */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        animate={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(124, 58, 237, 0.04), transparent 45%)`
        }}
      />

      {/* Background Glowing Blobs and Grid Pattern */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute top-[10%] right-[10%] w-[50vw] h-[40vw] rounded-full bg-brand-primary/5 blur-[120px] animate-pulse [animation-duration:8s]" />
        <div className="absolute bottom-[10%] left-[10%] w-[45vw] h-[45vw] rounded-full bg-blue-500/5 blur-[130px] animate-pulse [animation-duration:10s]" />
        <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0v80M0 40h80' stroke='%237C3AED' stroke-width='1' fill='none'/%3E%3C/svg%3E\")" }} />
      </div>

      {/* Top Controls: Back to Home */}
      <div className="absolute top-6 left-6 z-20">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-slate-100 dark:bg-foreground/5 hover:bg-slate-200 dark:hover:bg-foreground/10 border border-slate-200 dark:border-border text-slate-700 dark:text-foreground/75 hover:text-foreground text-[10px] font-black uppercase tracking-widest transition-all group"
        >
          <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
          Back to Home
        </Link>
      </div>

      {/* Centered Glassmorphic Authentication Card */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="w-full max-w-[460px] bg-card/65 dark:bg-card/25 backdrop-blur-2xl border border-slate-200/60 dark:border-border/30 rounded-[2.5rem] shadow-2xl p-8 sm:p-10 relative z-10 space-y-6"
      >
        
        {/* Card Header & Branding */}
        <div className="text-center">
          <div className="inline-flex items-center gap-2 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/15 rounded-full px-3 py-1 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
            <span className="text-brand-primary text-[9px] font-black uppercase tracking-widest">New Registration</span>
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Create Account
          </h1>
          <p className="text-slate-500 dark:text-foreground/50 text-sm font-semibold">
            Enter your details to register on UniLink
          </p>
        </div>

        {/* Signup Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5" noValidate>
          
          {/* Full Name */}
          <div>
            <label htmlFor="fullName" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-foreground/45 mb-1 ml-1">
              Full Name
            </label>
            <div className={`relative transition-all duration-255 ${focusedField === "fullName" ? "scale-[1.01]" : ""}`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className={`h-4 w-4 transition-colors ${focusedField === "fullName" ? "text-brand-primary" : "text-slate-400 dark:text-foreground/30"}`} />
              </div>
              <input
                id="fullName"
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                onFocus={() => setFocusedField("fullName")}
                onBlur={() => setFocusedField(null)}
                placeholder="John Doe"
                disabled={loading}
                className={inputBase}
              />
            </div>
          </div>

          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-foreground/45 mb-1 ml-1">
              Institutional Email
            </label>
            <div className={`relative transition-all duration-255 ${focusedField === "email" ? "scale-[1.01]" : ""}`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <AtSign className={`h-4 w-4 transition-colors ${focusedField === "email" ? "text-brand-primary" : "text-slate-400 dark:text-foreground/30"}`} />
              </div>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onFocus={() => setFocusedField("email")}
                onBlur={() => setFocusedField(null)}
                placeholder="name@university.ac.lk"
                disabled={loading}
                className={inputBase}
              />
            </div>
          </div>

          {/* Role Dropdown */}
          <div>
            <label htmlFor="role" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-foreground/45 mb-1 ml-1">
              Select Role
            </label>
            <div className={`relative transition-all duration-255 ${focusedField === "role" ? "scale-[1.01]" : ""}`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <BadgeCheck className={`h-4 w-4 transition-colors ${focusedField === "role" ? "text-brand-primary" : "text-slate-400 dark:text-foreground/30"}`} />
              </div>
              <select
                id="role"
                required
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onFocus={() => setFocusedField("role")}
                onBlur={() => setFocusedField(null)}
                disabled={loading}
                className={`${inputBase} pr-10 appearance-none ${!role ? "text-slate-400 dark:text-foreground/30" : ""}`}
              >
                <option value="" disabled className="bg-card text-slate-500 dark:text-foreground/40">Select your role</option>
                <option value="Admin" className="bg-card text-foreground">Admin</option>
                <option value="Lecturer" className="bg-card text-foreground">Lecturer</option>
                <option value="Student" className="bg-card text-foreground">Student</option>
                <option value="Maintenance" className="bg-card text-foreground">Maintenance</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-slate-400 dark:text-foreground/40" />
              </div>
            </div>
          </div>

          {/* Faculty / Department Dropdown */}
          <div>
            <label htmlFor="department" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-foreground/45 mb-1 ml-1">
              Faculty / Department
            </label>
            <div className={`relative transition-all duration-255 ${focusedField === "department" ? "scale-[1.01]" : ""}`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Sparkles className={`h-4 w-4 transition-colors ${focusedField === "department" ? "text-brand-primary" : "text-slate-400 dark:text-foreground/30"}`} />
              </div>
              <select
                id="department"
                required
                value={department}
                onChange={(e) => setDepartment(e.target.value)}
                onFocus={() => setFocusedField("department")}
                onBlur={() => setFocusedField(null)}
                disabled={loading}
                className={`${inputBase} pr-10 appearance-none ${!department ? "text-slate-400 dark:text-foreground/30" : ""}`}
              >
                <option value="" disabled className="bg-card text-slate-500 dark:text-foreground/40">Select your faculty</option>
                <option value="Faculty of Computing" className="bg-card text-foreground">Faculty of Computing</option>
                <option value="Faculty of Applied Sciences" className="bg-card text-foreground">Faculty of Applied Sciences</option>
                <option value="Faculty of Management" className="bg-card text-foreground">Faculty of Management</option>
                <option value="Faculty of Engineering" className="bg-card text-foreground">Faculty of Engineering</option>
                <option value="Faculty of Business" className="bg-card text-foreground">Faculty of Business</option>
                <option value="Faculty of Medicine" className="bg-card text-foreground">Faculty of Medicine</option>
              </select>
              <div className="absolute inset-y-0 right-0 pr-4 flex items-center pointer-events-none">
                <ChevronDown className="h-4 w-4 text-slate-400 dark:text-foreground/40" />
              </div>
            </div>
          </div>

          {/* Password Input */}
          <div>
            <label htmlFor="password" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-foreground/45 mb-1 ml-1">
              Password
            </label>
            <div className={`relative transition-all duration-255 ${focusedField === "password" ? "scale-[1.01]" : ""}`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className={`h-4 w-4 transition-colors ${focusedField === "password" ? "text-brand-primary" : "text-slate-400 dark:text-foreground/30"}`} />
              </div>
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onFocus={() => setFocusedField("password")}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                disabled={loading}
                className={`${inputBase} pr-12`}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-foreground/40 hover:text-brand-primary transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div>
            <label htmlFor="confirmPassword" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-foreground/45 mb-1 ml-1">
              Confirm Password
            </label>
            <div className={`relative transition-all duration-255 ${focusedField === "confirm" ? "scale-[1.01]" : ""}`}>
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className={`h-4 w-4 transition-colors ${focusedField === "confirm" ? "text-brand-primary" : "text-slate-400 dark:text-foreground/30"}`} />
              </div>
              <input
                id="confirmPassword"
                type={showPassword ? "text" : "password"}
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onFocus={() => setFocusedField("confirm")}
                onBlur={() => setFocusedField(null)}
                placeholder="••••••••"
                disabled={loading}
                className={`${inputBase} pr-12 ${confirmPassword && confirmPassword === password ? "border-emerald-500/40" : ""}`}
              />
              {confirmPassword && confirmPassword === password && (
                <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
                  <CheckCircle2 className="h-4 w-4 text-emerald-400" />
                </div>
              )}
            </div>
          </div>

          {/* Form Alerts: Error / Success */}
          {error && (
            <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              <p className="text-xs font-bold text-rose-500 leading-tight">{error}</p>
            </div>
          )}
          {success && (
            <div className="flex items-center gap-3 bg-emerald-500/10 border border-emerald-500/20 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <CheckCircle2 className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
              <p className="text-xs font-bold text-emerald-400 leading-tight">{success}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full relative overflow-hidden bg-gradient-to-r from-brand-primary to-indigo-600 hover:from-brand-secondary hover:to-indigo-500 text-white font-black py-3.5 rounded-2xl transition-all duration-300 shadow-xl shadow-brand-primary/20 hover:shadow-brand-primary/30 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 group mt-2"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-white/0 via-white/10 to-white/0 translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-700 skew-x-12" />
            {loading ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Create Account
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Redirect to Login */}
        <p className="text-center text-xs font-semibold text-slate-500 dark:text-foreground/50 mt-4">
          Already have an account?{" "}
          <Link href="/login" className="font-black text-brand-primary hover:text-brand-secondary transition-colors">
            Sign In
          </Link>
        </p>

      </motion.div>
    </div>
  );
}
