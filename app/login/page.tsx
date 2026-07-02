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
  ChevronLeft,
  User,
  BadgeCheck,
  ChevronDown,
  Sparkles,
  CheckCircle2
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { auth } from "@/lib/firebase";
import { 
  signOut as firebaseSignOut,
  createUserWithEmailAndPassword,
  updateProfile,
  signOut
} from "firebase/auth";
import { motion, AnimatePresence } from "framer-motion";
import { BASE_URL as API_BASE } from "@/lib/apiClient";

/* ─── Password Strength Helper ─── */
function PasswordStrength({ password }: { password: string }) {
  const strength = password.length === 0 ? 0
    : password.length < 6 ? 1
    : password.length < 8 ? 2
    : /[A-Z]/.test(password) && /[0-9]/.test(password) ? 4
    : 3;

  const labels = ["", "Weak", "Fair", "Good", "Strong"];
  const colors = ["", "bg-rose-500", "bg-amber-500", "bg-blue-500", "bg-emerald-500"];
  const textColors = ["", "text-rose-500", "text-amber-500", "text-blue-500", "text-emerald-500"];

  if (!password) return null;

  return (
    <div className="mt-1 space-y-1 ml-1">
      <div className="flex gap-1">
        {[1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className={`h-0.5 flex-1 rounded-none transition-all duration-300 ${i <= strength ? colors[strength] : "bg-border"}`}
          />
        ))}
      </div>
      <p className={`text-[9px] font-bold uppercase tracking-wider ${textColors[strength]}`}>{labels[strength]} Password</p>
    </div>
  );
}

/* ─── Auth Content ─── */
function AuthContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialMode = searchParams.get("mode") === "register" ? false : true;
  
  // true = Login, false = Register
  const [isLogin, setIsLogin] = useState(initialMode);
  
  const { signIn, user, loading: authLoading } = useAuth();

  // Shared States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  
  // Register specific states
  const [fullName, setFullName] = useState("");
  const [role, setRole] = useState("");
  const [department, setDepartment] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  // UI States
  const [isMobile, setIsMobile] = useState(false);

  // Monitor screen size for animations
  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768);
    };
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Redirect if already logged in (only for login flow, not register)
  useEffect(() => {
    if (!authLoading && user && isLogin) {
      router.push("/dashboard");
    }
  }, [user, authLoading, router, isLogin]);

  // Toggle modes and clear errors
  const toggleMode = (loginMode: boolean) => {
    setError(null);
    setSuccess(null);
    setIsLogin(loginMode);
    
    // update URL without reloading
    const url = new URL(window.location.href);
    if (loginMode) url.searchParams.delete('mode');
    else url.searchParams.set('mode', 'register');
    window.history.pushState({}, '', url.toString());
  };

  const handleLoginSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await signIn(email, password);

      // Secondary bcrypt verification against stored hash
      try {
        const token = await auth?.currentUser?.getIdToken();
        if (token) {
          const verifyResponse = await fetch(
            `${API_BASE}/users/verify-password`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
              },
              body: JSON.stringify({ email, password }),
            }
          );
          if (verifyResponse.ok) {
            const verifyData = await verifyResponse.json();
            if (verifyData.valid === false) {
              if (auth) await firebaseSignOut(auth);
              setError("Password verification failed. Please reset your password.");
              setLoading(false);
              return;
            }
          }
        }
      } catch (verifyErr) {
        console.warn("Bcrypt verification endpoint unreachable. Proceeding with Firebase auth only.", verifyErr);
      }

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

  const validateRegisterForm = () => {
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

  const handleRegisterSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!validateRegisterForm()) return;

    setLoading(true);
    try {
      if (!auth) throw new Error("Authentication service is not available.");
      
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      if (fullName.trim()) {
        await updateProfile(userCredential.user, { displayName: fullName.trim() });
      }

      const idToken = await userCredential.user.getIdToken();

      const registerRes = await fetch(`${API_BASE}/users/register`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({
          name: fullName.trim(),
          email: email.toLowerCase(),
          role: role.toLowerCase(),
          department,
          password,
        }),
      });

      if (!registerRes.ok) {
        const errData = await registerRes.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to save registration.");
      }

      if (auth) {
        await signOut(auth);
      }

      setSuccess("Account created! Pending admin approval.");
      setTimeout(() => toggleMode(true), 2500);

    } catch (err: unknown) {
      if (err instanceof Error) {
        const code = (err as { code?: string }).code ?? "";
        if (code.includes("email-already-in-use")) {
          setError("An account with this email already exists. Please sign in instead.");
        } else if (code.includes("weak-password")) {
          setError("Password is too weak. Use at least 8 characters.");
        } else if (code.includes("invalid-email")) {
          setError("The email address is not valid.");
        } else {
          setError("Registration failed. Please try again.");
        }
      } else {
        setError("An unexpected error occurred.");
      }
    } finally {
      setLoading(false);
    }
  };

  const inputBase = "block w-full pl-9 pr-3 py-2 bg-card border-2 border-border focus:border-foreground rounded-none text-xs font-bold text-foreground placeholder-foreground/30 focus:outline-none transition-all disabled:opacity-40";

  return (
    <div className="min-h-screen w-full bg-background text-foreground overflow-hidden relative flex items-center justify-center p-4 selection:bg-brand-primary selection:text-white">
      
      {/* Responsive Neo-Brutalist Main Container */}
      <div className="w-full max-w-md md:max-w-5xl h-[600px] md:h-[650px] bg-background border-2 border-foreground shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.2)] relative flex overflow-hidden">
        
        {/* Back Home Button (Absolute) */}
        <div className="absolute top-4 left-4 z-50">
          <Link 
            href="/" 
            className="inline-flex items-center gap-1 px-2.5 py-1 border-2 border-transparent hover:border-foreground bg-card text-foreground text-[8px] font-black uppercase tracking-wider transition-all group"
          >
            <ChevronLeft className="w-3 h-3 group-hover:-translate-x-0.5 transition-transform" />
            Home
          </Link>
        </div>

        {/* ─── SLIDING FORM PANEL ─── */}
        <motion.div 
          initial={false}
          animate={{ x: isMobile ? "0%" : (isLogin ? "100%" : "0%") }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="absolute top-0 left-0 w-full md:w-1/2 h-full bg-background flex flex-col items-center justify-center p-6 md:p-12 z-20"
        >
          <div className="w-full max-w-[360px]">
            <AnimatePresence mode="wait">
              {isLogin ? (
                <motion.div 
                  key="login-form"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-6">
                    <h2 className="text-2xl md:text-3xl font-heading font-black text-foreground uppercase tracking-tighter mb-1">Welcome Back</h2>
                    <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Sign in to your account</p>
                  </div>

                  <form onSubmit={handleLoginSubmit} className="space-y-4">
                    <div>
                      <label className="block text-[9px] font-black uppercase tracking-widest text-foreground/60 mb-1 ml-1">Institutional Email</label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <AtSign className="h-3.5 w-3.5 text-foreground/40" />
                        </div>
                        <input
                          type="email"
                          required
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="name@university.ac.lk"
                          disabled={loading}
                          className={inputBase}
                        />
                      </div>
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1 ml-1">
                        <label className="text-[9px] font-black uppercase tracking-widest text-foreground/60">Password</label>
                        <Link href="/forgot-password" className="text-[9px] font-black text-brand-primary uppercase hover:underline underline-offset-2">Forgot?</Link>
                      </div>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <Lock className="h-3.5 w-3.5 text-foreground/40" />
                        </div>
                        <input
                          type={showPassword ? "text" : "password"}
                          required
                          value={password}
                          onChange={(e) => setPassword(e.target.value)}
                          placeholder="••••••••"
                          disabled={loading}
                          className={inputBase}
                        />
                        <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-3 flex items-center text-foreground/40 hover:text-brand-primary">
                          {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                        </button>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 bg-brand-primary border-2 border-brand-primary p-2.5 text-white">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-[9px] font-black uppercase tracking-wider leading-tight">{error}</p>
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full bg-foreground text-background font-black uppercase tracking-widest py-3 border-2 border-transparent hover:bg-brand-primary hover:text-white transition-colors duration-0 flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50 text-xs">
                      {loading ? <span className="animate-pulse">Authenticating...</span> : <>Sign In <ArrowRight className="w-3.5 h-3.5" /></>}
                    </button>
                  </form>
                </motion.div>
              ) : (
                <motion.div 
                  key="register-form"
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -15 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="mb-4">
                    <h2 className="text-2xl md:text-3xl font-heading font-black text-foreground uppercase tracking-tighter mb-1">Join UniLink</h2>
                    <p className="text-xs font-bold text-foreground/60 uppercase tracking-wider">Register for access</p>
                  </div>

                  <form onSubmit={handleRegisterSubmit} className="space-y-3">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-foreground/60 mb-1 ml-1">Full Name</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <User className="h-3.5 w-3.5 text-foreground/40" />
                          </div>
                          <input type="text" required value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Jane Doe" disabled={loading} className={`${inputBase} pl-8`} />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-foreground/60 mb-1 ml-1">Email</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <AtSign className="h-3.5 w-3.5 text-foreground/40" />
                          </div>
                          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="email@univ" disabled={loading} className={`${inputBase} pl-8`} />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-foreground/60 mb-1 ml-1">Role</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <BadgeCheck className="h-3.5 w-3.5 text-foreground/40" />
                          </div>
                          <select required value={role} onChange={(e) => setRole(e.target.value)} disabled={loading} className={`${inputBase} pl-8 pr-6 appearance-none`}>
                            <option value="" disabled>Role</option>
                            <option value="Admin">Admin</option>
                            <option value="Lecturer">Lecturer</option>
                            <option value="Student">Student</option>
                            <option value="Maintenance">Maintenance</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40 pointer-events-none" />
                        </div>
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-foreground/60 mb-1 ml-1">Faculty</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <Sparkles className="h-3.5 w-3.5 text-foreground/40" />
                          </div>
                          <select required value={department} onChange={(e) => setDepartment(e.target.value)} disabled={loading} className={`${inputBase} pl-8 pr-6 appearance-none`}>
                            <option value="" disabled>Faculty</option>
                            <option value="Faculty of Computing">Computing</option>
                            <option value="Faculty of Applied Sciences">Applied Sci</option>
                            <option value="Faculty of Management">Management</option>
                            <option value="Faculty of Engineering">Engineering</option>
                          </select>
                          <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-foreground/40 pointer-events-none" />
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-foreground/60 mb-1 ml-1">Password</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <Lock className="h-3.5 w-3.5 text-foreground/40" />
                          </div>
                          <input type={showPassword ? "text" : "password"} required value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••" disabled={loading} className={`${inputBase} pl-8 pr-8`} />
                          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute inset-y-0 right-0 pr-2.5 flex items-center text-foreground/40 hover:text-brand-primary">
                            {showPassword ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </button>
                        </div>
                        <PasswordStrength password={password} />
                      </div>
                      <div>
                        <label className="block text-[9px] font-black uppercase tracking-widest text-foreground/60 mb-1 ml-1">Confirm</label>
                        <div className="relative">
                          <div className="absolute inset-y-0 left-0 pl-2.5 flex items-center pointer-events-none">
                            <Lock className="h-3.5 w-3.5 text-foreground/40" />
                          </div>
                          <input type={showPassword ? "text" : "password"} required value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="••••••••" disabled={loading} className={`${inputBase} pl-8`} />
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-center gap-2 bg-brand-primary border-2 border-brand-primary p-2.5 text-white">
                        <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-[9px] font-black uppercase tracking-wider leading-tight">{error}</p>
                      </div>
                    )}
                    {success && (
                      <div className="flex items-center gap-2 bg-emerald-500 border-2 border-emerald-500 p-2.5 text-white">
                        <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
                        <p className="text-[9px] font-black uppercase tracking-wider leading-tight">{success}</p>
                      </div>
                    )}

                    <button type="submit" disabled={loading} className="w-full bg-foreground text-background font-black uppercase tracking-widest py-3 border-2 border-transparent hover:bg-brand-primary hover:text-white transition-colors duration-0 flex items-center justify-center gap-1.5 mt-2 disabled:opacity-50 text-xs">
                      {loading ? <span className="animate-pulse">Processing...</span> : <>Create Account <ArrowRight className="w-3.5 h-3.5" /></>}
                    </button>
                  </form>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Mobile-only toggle switcher */}
            <div className="mt-4 text-center md:hidden">
              <button 
                onClick={() => toggleMode(!isLogin)}
                className="text-[10px] font-black uppercase tracking-wider text-brand-primary hover:underline"
              >
                {isLogin ? "Need an Account? Create One" : "Have an Account? Sign In"}
              </button>
            </div>
          </div>
        </motion.div>

        {/* ─── SLIDING BRANDING PANEL (HIDDEN ON MOBILE) ─── */}
        <motion.div 
          initial={false}
          animate={{ x: isMobile ? "100%" : (isLogin ? "0%" : "100%") }}
          transition={{ type: "spring", stiffness: 400, damping: 40 }}
          className="absolute top-0 left-0 w-full md:w-1/2 h-full bg-foreground flex flex-col items-center justify-center text-background z-30 hidden md:flex"
        >
          {/* Subtle Grid Pattern Overlay */}
          <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-10" 
             style={{ backgroundImage: "linear-gradient(var(--background) 1px, transparent 1px), linear-gradient(90deg, var(--background) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

          <div className="relative z-10 flex flex-col items-center text-center px-12">
            <div className="w-20 h-20 mb-6 bg-background rounded-none flex items-center justify-center shadow-[6px_6px_0_0_rgba(255,87,34,1)]">
              <img src="/urms-logo.png" alt="URMS Logo" className="w-12 h-12 grayscale" />
            </div>
            
            <h1 className="text-5xl font-heading font-black uppercase tracking-tighter mb-3 text-background">
              Uni<span className="text-brand-primary">Link</span>
            </h1>
            <p className="text-background/80 text-xs font-bold uppercase tracking-wider max-w-xs mb-10 leading-relaxed">
              The Unified Resource Management Platform for University Faculties.
            </p>

            {/* Toggle Button */}
            <div className="flex flex-col items-center gap-3">
              <p className="text-[9px] font-black uppercase tracking-widest text-background/60">
                {isLogin ? "New to UniLink?" : "Already Registered?"}
              </p>
              <button 
                onClick={() => toggleMode(!isLogin)}
                className="px-6 py-2.5 border-2 border-background text-background font-black uppercase tracking-widest hover:bg-background hover:text-foreground transition-colors duration-0 text-xs"
              >
                {isLogin ? "Create an Account" : "Sign in to Portal"}
              </button>
            </div>
          </div>
        </motion.div>

      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-4 border-foreground border-t-brand-primary rounded-none animate-spin" /></div>}>
      <AuthContent />
    </Suspense>
  );
}
