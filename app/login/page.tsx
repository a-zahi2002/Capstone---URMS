"use client";

import { useState, useEffect, FormEvent } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { 
  AtSign, 
  Lock, 
  Eye, 
  EyeOff, 
  ArrowRight, 
  AlertCircle, 
  Sparkles, 
  Shield, 
  Zap, 
  Users, 
  ChevronLeft,
  LayoutDashboard,
  Calendar,
  Building2,
  Wrench,
  TrendingUp,
  Settings,
  Bell,
  Search,
  Activity,
  ArrowUpRight,
  ShieldCheck,
  CheckCircle2,
  Clock
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { motion } from "framer-motion";

export default function LoginPage() {
  const { signIn, setMockUser } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [focusedField, setFocusedField] = useState<string | null>(null);
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    };
    updateTime();
    const clockInterval = setInterval(updateTime, 1000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(clockInterval);
    };
  }, []);

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);
      router.push("/dashboard");
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message.includes("wrong-password") || err.message.includes("invalid-credential")) {
          setError("Incorrect email or password.");
        } else if (err.message.includes("user-not-found")) {
          setError("No account found with that email.");
        } else if (err.message.includes("too-many-requests")) {
          setError("Too many failed attempts. Try again later.");
        } else {
          setError("Sign-in failed. Please try again.");
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDemoClick = (role: "admin" | "maintenance" | "lecturer" | "student") => {
    setMockUser(role);
    router.push("/dashboard");
  };

  return (
    <div className="min-h-screen w-full bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 overflow-hidden relative flex items-center justify-center">
      
      {/* Premium Cursor Highlight */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-40 transition-opacity duration-300 hidden lg:block"
        animate={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(124, 58, 237, 0.05), transparent 45%)`
        }}
      />

      {/* BACKGROUND MOCKUP: Live simulated UniLink Dashboard (Visible only on Desktop for richness) */}
      <div className="absolute inset-0 z-0 pointer-events-none select-none opacity-35 dark:opacity-20 hidden lg:flex">
        
        {/* Mock Sidebar */}
        <div className="w-64 border-r border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 p-6 flex flex-col justify-between">
          <div className="space-y-8">
            <div className="flex items-center gap-3">
              <div className="h-9 w-9 rounded-xl bg-gradient-to-tr from-brand-primary to-indigo-600 flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <span className="font-black text-lg tracking-tight text-slate-900 dark:text-white">UniLink</span>
            </div>
            
            <div className="space-y-1">
              {[
                { name: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" />, active: true },
                { name: "Bookings", icon: <Calendar className="w-4 h-4" /> },
                { name: "Resources", icon: <Building2 className="w-4 h-4" /> },
                { name: "Maintenance", icon: <Wrench className="w-4 h-4" /> },
                { name: "Analytics", icon: <TrendingUp className="w-4 h-4" /> },
                { name: "Settings", icon: <Settings className="w-4 h-4" /> }
              ].map((item, idx) => (
                <div 
                  key={idx} 
                  className={`flex items-center gap-3 px-4 py-3 rounded-2xl text-xs font-bold transition-all ${
                    item.active 
                      ? "text-brand-primary bg-brand-primary/10" 
                      : "text-slate-500 dark:text-slate-400"
                  }`}
                >
                  {item.icon}
                  <span>{item.name}</span>
                </div>
              ))}
            </div>
          </div>
          
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 flex items-center gap-3">
            <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
            <div>
              <p className="text-[10px] font-black uppercase text-slate-400">Gateway Standby</p>
              <p className="text-xs font-bold text-slate-600 dark:text-slate-350">Authorization Req.</p>
            </div>
          </div>
        </div>

        {/* Mock Main Dashboard View */}
        <div className="flex-1 flex flex-col">
          {/* Topbar */}
          <div className="h-16 border-b border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900/60 px-8 flex items-center justify-between">
            <div className="flex items-center gap-3 w-80 py-2 px-4 rounded-xl bg-slate-100 dark:bg-slate-800/40 border border-slate-200/50 dark:border-slate-700/50">
              <Search className="w-4 h-4 text-slate-400" />
              <span className="text-xs text-slate-450 dark:text-slate-400">Search spaces, lecturers, faculties...</span>
            </div>
            
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-wider text-brand-primary bg-brand-primary/10 px-3 py-1.5 rounded-lg border border-brand-primary/15">
                <Clock className="w-3.5 h-3.5 animate-pulse" />
                {currentTime || "19:20:00"}
              </div>
              <div className="relative p-2 rounded-xl bg-slate-100 dark:bg-slate-800/60 text-slate-655 dark:text-slate-400">
                <Bell className="w-4 h-4" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand-primary" />
              </div>
              <div className="h-8 w-8 rounded-full bg-slate-200 dark:bg-slate-700" />
            </div>
          </div>

          {/* Dashboard Main Grid Area */}
          <div className="p-8 space-y-6 flex-1 overflow-hidden">
            
            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-6">
              {[
                { label: "Active Room Occupancy", value: "89.2%", change: "+4.2% from peak", color: "text-brand-primary bg-brand-primary/5" },
                { label: "Conflict Resolution Solver", value: "99.8%", change: "14 conflicts auto-resolved", color: "text-emerald-500 bg-emerald-500/5" },
                { label: "Sensors Online Node status", value: "98.4%", change: "264 active devices online", color: "text-blue-500 bg-blue-500/5" }
              ].map((stat, i) => (
                <div key={i} className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between h-28">
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">{stat.label}</span>
                    <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full ${stat.color}`}>{stat.change}</span>
                  </div>
                  <span className="text-3xl font-black text-slate-900 dark:text-white">{stat.value}</span>
                </div>
              ))}
            </div>

            {/* Room Availability Matrix Grid */}
            <div className="space-y-3">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Campus Facilities Status Monitor</span>
              <div className="grid grid-cols-4 gap-6">
                {[
                  { name: "Computing Lab 01", cap: "36/40 seats", status: "Occupied", desc: "CS302 Database Lecture", border: "border-brand-primary/20", fill: "bg-brand-primary" },
                  { name: "Lecture Theatre B", cap: "0/120 seats", status: "Vacant", desc: "Next: 2:00 PM Lecture", border: "border-emerald-500/20", fill: "bg-emerald-500" },
                  { name: "Seminar Room 02", cap: "15/30 seats", status: "Occupied", desc: "AI Ethics Symposium", border: "border-brand-primary/20", fill: "bg-brand-primary" },
                  { name: "IoT & Robotics Lab", cap: "0/20 seats", status: "Maintenance", desc: "AC Repair In Progress", border: "border-rose-500/20", fill: "bg-rose-500" }
                ].map((room, i) => (
                  <div key={i} className={`p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 flex flex-col justify-between h-36 ${room.border}`}>
                    <div className="flex justify-between items-start">
                      <span className="font-black text-sm text-slate-900 dark:text-white truncate max-w-[130px]">{room.name}</span>
                      <span className="text-[9px] font-bold text-slate-400">{room.cap}</span>
                    </div>
                    <div>
                      <p className="text-[10px] font-semibold text-slate-500 dark:text-slate-400">{room.desc}</p>
                      <div className="flex items-center gap-2 mt-3">
                        <span className={`h-2 w-2 rounded-full ${room.fill}`} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-600 dark:text-slate-350">{room.status}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Simulated Live Analytics Grid */}
            <div className="p-5 rounded-3xl bg-white dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800/80 h-32 flex flex-col justify-between">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Weekly Resource Allocations Telemetry</span>
                <span className="text-[10px] font-bold text-brand-primary">Automated scheduler: Online</span>
              </div>
              <div className="flex items-end gap-2 h-14 pt-2">
                {[60, 45, 80, 55, 90, 70, 85, 95, 60, 75, 85, 92, 78, 88].map((val, idx) => (
                  <div key={idx} className="flex-1 bg-slate-100 dark:bg-slate-800 rounded-t-lg h-full relative overflow-hidden">
                    <div className="absolute bottom-0 w-full rounded-t-lg bg-brand-primary/45" style={{ height: `${val}%` }} />
                  </div>
                ))}
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Semi-transparent Glassmorphic Security Overlay */}
      <div className="absolute inset-0 z-10 bg-slate-50/50 dark:bg-slate-950/50 backdrop-blur-[6px]" />

      {/* Floating Centered Authentication portal */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-[460px] mx-4 bg-white/75 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 backdrop-blur-2xl rounded-[2.5rem] shadow-2xl p-8 sm:p-10 relative z-20 space-y-6"
      >
        
        {/* Back to Home Control */}
        <div className="absolute top-6 left-6 z-30">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100/90 dark:bg-foreground/5 hover:bg-slate-200/90 dark:hover:bg-foreground/10 border border-slate-200 dark:border-border text-slate-700 dark:text-foreground/75 hover:text-foreground text-[9px] font-black uppercase tracking-wider transition-all group"
          >
            <ChevronLeft className="w-3.5 h-3.5 group-hover:-translate-x-0.5 transition-transform" />
            Home
          </Link>
        </div>

        {/* Card Header & Branding */}
        <div className="text-center pt-4">
          <div className="inline-flex items-center gap-2 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/15 rounded-full px-3 py-1 mb-5">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
            </span>
            <span className="text-brand-primary text-[9px] font-black uppercase tracking-widest">Secure Access Gateway</span>
          </div>
          
          <h1 className="text-3xl font-black text-slate-900 dark:text-white tracking-tight mb-2">
            Welcome Back
          </h1>
          <p className="text-slate-500 dark:text-foreground/50 text-sm font-semibold">
            Sign in to your institutional account
          </p>
        </div>

        {/* Credentials Form */}
        <form onSubmit={handleSubmit} className="space-y-4" noValidate>
          
          {/* Email Address */}
          <div>
            <label htmlFor="email" className="block text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-foreground/45 mb-1.5 ml-1">
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
                className="block w-full pl-11 pr-4 py-3 bg-white/50 dark:bg-slate-950/20 border border-slate-200 dark:border-border/85 rounded-2xl text-sm font-bold text-foreground placeholder-slate-400 dark:placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50 transition-all disabled:opacity-40"
              />
            </div>
          </div>

          {/* Password Input */}
          <div>
            <div className="flex items-center justify-between mb-1.5 ml-1">
              <label htmlFor="password" className="text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-foreground/45">
                Password
              </label>
              <Link 
                href="/forgot-password" 
                className="text-[10px] font-bold text-brand-primary hover:text-brand-secondary transition-colors"
              >
                Forgot Password?
              </Link>
            </div>
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
                className="block w-full pl-11 pr-12 py-3 bg-white/50 dark:bg-slate-950/20 border border-slate-200 dark:border-border/85 rounded-2xl text-sm font-bold text-foreground placeholder-slate-400 dark:placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50 transition-all disabled:opacity-40"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute inset-y-0 right-0 pr-4 flex items-center text-slate-400 dark:text-foreground/40 hover:text-brand-primary transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          {/* Form Error Alert */}
          {error && (
            <div className="flex items-center gap-3 bg-rose-500/10 border border-rose-500/20 p-4 rounded-2xl animate-in fade-in slide-in-from-top-2 duration-200">
              <AlertCircle className="w-4.5 h-4.5 text-rose-500 shrink-0" />
              <p className="text-xs font-bold text-rose-500 leading-tight">{error}</p>
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
                Sign In
                <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </form>

        {/* Redirect to Register */}
        <p className="text-center text-xs font-semibold text-slate-500 dark:text-foreground/50">
          Don&apos;t have an account?{" "}
          <Link href="/register" className="font-black text-brand-primary hover:text-brand-secondary transition-colors">
            Create Account
          </Link>
        </p>

        {/* Quick Demo Access Badges */}
        <div className="pt-5 border-t border-slate-200/60 dark:border-border/40 space-y-4">
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-foreground/45">
            Quick Operator Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["admin", "maintenance", "lecturer", "student"] as const).map((role) => (
              <button
                key={role}
                onClick={() => handleDemoClick(role)}
                className={`flex items-center justify-between px-3.5 py-2.5 border rounded-xl transition-all hover:scale-[1.02] shadow-sm text-left group cursor-pointer ${
                  role === "admin" ? "bg-gradient-to-r from-purple-500/10 to-indigo-500/5 border-purple-500/20 text-purple-650 dark:text-purple-300 hover:border-purple-500/40" :
                  role === "maintenance" ? "bg-gradient-to-r from-amber-500/10 to-orange-500/5 border-amber-500/20 text-amber-650 dark:text-amber-300 hover:border-amber-500/40" :
                  role === "lecturer" ? "bg-gradient-to-r from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-655 dark:text-emerald-300 hover:border-emerald-500/40" :
                  "bg-gradient-to-r from-blue-500/10 to-sky-500/5 border-blue-500/20 text-blue-650 dark:text-blue-300 hover:border-blue-500/40"
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <div className="shrink-0 text-slate-500 dark:text-foreground/45 group-hover:text-current transition-colors">
                    {role === "admin" ? <Shield className="w-3.5 h-3.5" /> :
                     role === "maintenance" ? <Wrench className="w-3.5 h-3.5" /> :
                     role === "lecturer" ? <Activity className="w-3.5 h-3.5" /> :
                     <Users className="w-3.5 h-3.5" />}
                  </div>
                  <span className="text-[10px] font-black uppercase tracking-wider capitalize truncate">{role}</span>
                </div>
                <ArrowUpRight className="w-3 h-3 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 ml-1 text-slate-400 group-hover:text-current" />
              </button>
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  );
}
