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
  Activity,
  Calendar,
  Wrench
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

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
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
        <div className="absolute top-[20%] left-[10%] w-[50vw] h-[40vw] rounded-full bg-brand-primary/5 blur-[120px] animate-pulse [animation-duration:8s]" />
        <div className="absolute bottom-[20%] right-[10%] w-[45vw] h-[45vw] rounded-full bg-blue-500/5 blur-[130px] animate-pulse [animation-duration:10s]" />
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
                className="block w-full pl-11 pr-4 py-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-border/80 rounded-2xl text-sm font-bold text-foreground placeholder-slate-400 dark:placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50 transition-all disabled:opacity-40"
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
                className="block w-full pl-11 pr-12 py-3 bg-slate-50/50 dark:bg-slate-950/20 border border-slate-200 dark:border-border/80 rounded-2xl text-sm font-bold text-foreground placeholder-slate-400 dark:placeholder-foreground/30 focus:outline-none focus:ring-2 focus:ring-brand-primary/30 focus:border-brand-primary/50 transition-all disabled:opacity-40"
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
          <p className="text-center text-[10px] font-black uppercase tracking-widest text-slate-500 dark:text-foreground/40">
            Quick Operator Access
          </p>
          <div className="grid grid-cols-2 gap-2">
            {(["admin", "maintenance", "lecturer", "student"] as const).map((role) => (
              <DemoButton key={role} role={role} onClick={() => setMockUser(role)} />
            ))}
          </div>
        </div>

      </motion.div>
    </div>
  );
}

function DemoButton({ role, onClick }: { role: string; onClick: () => void }) {
  const router = useRouter();
  const handleClick = () => {
    onClick();
    router.push("/dashboard");
  };

  const icons: Record<string, React.ReactNode> = {
    admin: <Shield className="w-3.5 h-3.5" />,
    maintenance: <Wrench className="w-3.5 h-3.5" />,
    lecturer: <Activity className="w-3.5 h-3.5" />,
    student: <Users className="w-3.5 h-3.5" />
  };

  const colors: Record<string, string> = {
    admin: "from-purple-500/10 to-indigo-500/5 border-purple-500/20 text-purple-600 dark:text-purple-300 hover:border-purple-500/40",
    maintenance: "from-amber-500/10 to-orange-500/5 border-amber-500/20 text-amber-600 dark:text-amber-300 hover:border-amber-500/40",
    lecturer: "from-emerald-500/10 to-teal-500/5 border-emerald-500/20 text-emerald-600 dark:text-emerald-300 hover:border-emerald-500/40",
    student: "from-blue-500/10 to-sky-500/5 border-blue-500/20 text-blue-600 dark:text-blue-300 hover:border-blue-500/40",
  };

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 px-3.5 py-2 bg-gradient-to-r border rounded-xl transition-all hover:scale-[1.02] shadow-sm text-left group cursor-pointer ${colors[role] ?? colors.student}`}
    >
      <div className="shrink-0">{icons[role]}</div>
      <span className="text-[10px] font-black uppercase tracking-wider capitalize truncate">{role === "admin" ? "Admin" : role}</span>
    </button>
  );
}
