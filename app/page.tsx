"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useInView, useScroll, useTransform, AnimatePresence } from "framer-motion";
import {
  ArrowRight, Calendar, ShieldCheck, Users, Zap, TrendingUp,
  LayoutDashboard, CheckCircle2, Star, ChevronRight, BookOpen,
  Cpu, Building2, Activity, Clock
} from "lucide-react";

/* ── Animated Counter Hook ── */
function useCountUp(target: number, duration = 1800, trigger: boolean) {
  const [count, setCount] = useState(0);
  useEffect(() => {
    if (!trigger) return;
    let start = 0;
    const step = Math.ceil(target / (duration / 16));
    const timer = setInterval(() => {
      start += step;
      if (start >= target) { setCount(target); clearInterval(timer); }
      else setCount(start);
    }, 16);
    return () => clearInterval(timer);
  }, [trigger, target, duration]);
  return count;
}

/* ── Stat Item ── */
function StatItem({ num, suffix, label }: { num: number; suffix: string; label: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, amount: 0.5 });
  const count = useCountUp(num, 2000, isInView);
  
  return (
    <motion.div 
      ref={ref}
      initial={{ opacity: 0, scale: 0.8 }}
      animate={isInView ? { opacity: 1, scale: 1 } : { opacity: 0, scale: 0.8 }}
      transition={{ duration: 0.6, type: "spring", bounce: 0.4 }}
      className="flex flex-col items-center justify-center p-8 rounded-[2rem] bg-card/40 border border-slate-200/50 dark:border-white/10 backdrop-blur-xl shadow-2xl relative overflow-hidden group hover:-translate-y-2 transition-transform duration-300"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-blue-500/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
      <span className="text-5xl md:text-6xl font-black bg-gradient-to-br from-slate-800 to-slate-500 dark:from-white dark:to-white/50 bg-clip-text text-transparent drop-shadow-sm z-10">
        {count.toLocaleString()}<span className="text-cyan-500">{suffix}</span>
      </span>
      <span className="text-slate-500 dark:text-slate-400 font-bold text-sm mt-3 uppercase tracking-widest z-10">{label}</span>
    </motion.div>
  );
}

/* ── Floating UI Card ── */
function FloatingCard({ children, delay = 0, yOffset = [0, -20, 0], duration = 6, className = "" }: any) {
  return (
    <motion.div
      animate={{ y: yOffset }}
      transition={{ repeat: Infinity, duration, ease: "easeInOut", delay }}
      className={`absolute ${className}`}
    >
      {children}
    </motion.div>
  );
}

export default function LandingPage() {
  const { scrollYProgress } = useScroll();
  const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacityHero = useTransform(scrollYProgress, [0, 0.2], [1, 0]);

  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    { icon: <LayoutDashboard className="w-6 h-6" />, title: "Live Dashboard", desc: "Real-time analytics and resource tracking.", color: "from-blue-500 to-blue-600", size: "col-span-1 md:col-span-2 row-span-1" },
    { icon: <Calendar className="w-6 h-6" />, title: "Smart Booking", desc: "Conflict-free AI scheduling.", color: "from-violet-500 to-violet-600", size: "col-span-1 md:col-span-1 row-span-2" },
    { icon: <ShieldCheck className="w-6 h-6" />, title: "RBAC Security", desc: "Role-based access controls.", color: "from-emerald-500 to-emerald-600", size: "col-span-1 md:col-span-1 row-span-1" },
    { icon: <Zap className="w-6 h-6" />, title: "Instant Actions", desc: "Lightning-fast approvals.", color: "from-amber-500 to-amber-600", size: "col-span-1 md:col-span-1 row-span-1" },
    { icon: <TrendingUp className="w-6 h-6" />, title: "Deep Analytics", desc: "Usage trends & insightful reports.", color: "from-cyan-500 to-cyan-600", size: "col-span-1 md:col-span-2 row-span-1" },
  ];

  const steps = [
    { icon: <Users />, title: "Create Identity", desc: "Sign in with your university credentials. Instant role assignment." },
    { icon: <Building2 />, title: "Discover Assets", desc: "Search through labs, halls, and specialized equipment." },
    { icon: <Clock />, title: "Reserve & Go", desc: "Book your slot. Get instant digital passes and reminders." },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-cyan-500/30 relative">
      
      {/* Global Mouse Follower Glow */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        animate={{
          background: `radial-gradient(600px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(6,182,212,0.05), transparent 40%)`
        }}
      />

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[100svh] flex items-center pt-28 pb-20 lg:pt-0 overflow-hidden">
        {/* Animated Background Mesh */}
        <motion.div style={{ y: yBackground }} className="absolute inset-0 z-0">
          <div className="absolute top-[-10%] left-[-10%] w-[50vw] h-[50vw] rounded-full bg-cyan-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse [animation-duration:3s]" />
          <div className="absolute top-[20%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-violet-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse [animation-duration:4s]" />
          <div className="absolute bottom-[-20%] left-[20%] w-[60vw] h-[60vw] rounded-full bg-blue-500/20 blur-[120px] mix-blend-multiply dark:mix-blend-screen animate-pulse [animation-duration:5s]" />
          <div className="absolute inset-0 opacity-[0.04] dark:opacity-[0.02]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid lg:grid-cols-2 gap-16 items-center">
          
          {/* Left: Text Content */}
          <motion.div style={{ opacity: opacityHero }} className="flex flex-col items-start text-left">
            <motion.div 
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }}
              className="inline-flex items-center gap-2 bg-white/50 dark:bg-white/5 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 text-cyan-600 dark:text-cyan-400 text-xs sm:text-sm font-bold px-4 py-2 rounded-full mb-8 shadow-lg shadow-cyan-500/10"
            >
              <span className="relative flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-cyan-500"></span>
              </span>
              Next-Gen Resource Management
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }}
              className="text-6xl sm:text-7xl lg:text-8xl font-black leading-[0.95] tracking-tighter mb-6 text-slate-900 dark:text-white"
            >
              Orchestrate<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-500 via-blue-500 to-violet-500">
                Your Campus
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.3 }}
              className="text-slate-600 dark:text-slate-400 text-lg sm:text-xl max-w-xl mb-10 leading-relaxed font-medium"
            >
              The intelligent hub for booking labs, halls, and equipment. Eliminate conflicts and automate approvals instantly.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.4 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link
                href="/login"
                className="relative overflow-hidden flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-white rounded-2xl bg-gradient-to-r from-cyan-500 to-blue-600 shadow-xl shadow-cyan-500/25 hover:shadow-cyan-500/40 hover:-translate-y-1 transition-all duration-300 group"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-[100%] group-hover:translate-y-0 transition-transform duration-300 ease-in-out" />
                <span className="relative z-10 flex items-center gap-2">
                  Launch Platform
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </span>
              </Link>
              <Link
                href="/resources"
                className="flex items-center justify-center gap-2 px-8 py-4 text-base font-bold text-slate-800 dark:text-white rounded-2xl border-2 border-slate-200 dark:border-white/10 hover:border-cyan-500/50 hover:bg-cyan-500/5 transition-all duration-300 group backdrop-blur-md"
              >
                Explore Resources
                <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </motion.div>

          {/* Right: Floating Interactive UI */}
          <div className="relative h-[600px] hidden lg:block perspective-[2000px]">
            <motion.div 
              initial={{ opacity: 0, rotateY: -30, scale: 0.8 }} 
              animate={{ opacity: 1, rotateY: -15, scale: 1 }} 
              transition={{ duration: 1, delay: 0.2, type: "spring" }}
              className="w-full h-full relative transform-gpu preserve-3d"
            >
              {/* Main Dashboard Card */}
              <FloatingCard delay={0} yOffset={[0, -20, 0]} duration={7} className="top-10 right-0 w-[450px] z-20">
                <div className="bg-white/80 dark:bg-[#0B1121]/80 backdrop-blur-2xl rounded-3xl border border-slate-200/50 dark:border-white/10 shadow-2xl shadow-cyan-500/10 overflow-hidden">
                  <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5">
                    <div className="flex gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-500" /><span className="w-3 h-3 rounded-full bg-amber-500" /><span className="w-3 h-3 rounded-full bg-emerald-500" /></div>
                    <span className="ml-4 text-[10px] text-slate-500 font-mono font-medium">Dashboard Overview</span>
                  </div>
                  <div className="p-6">
                    <div className="flex justify-between items-end mb-6">
                      <div>
                        <p className="text-xs text-slate-500 font-semibold mb-1 uppercase tracking-wider">Active Bookings</p>
                        <p className="text-4xl font-black text-slate-800 dark:text-white">142</p>
                      </div>
                      <div className="flex gap-1 items-center text-emerald-500 bg-emerald-500/10 px-2 py-1 rounded-md text-xs font-bold">
                        <TrendingUp className="w-3 h-3" /> +12%
                      </div>
                    </div>
                    <div className="h-32 flex items-end gap-2">
                      {[40, 70, 45, 90, 65, 55, 80].map((h, i) => (
                        <motion.div 
                          key={i} initial={{ height: 0 }} animate={{ height: `${h}%` }} transition={{ duration: 1, delay: 0.5 + (i * 0.1) }}
                          className="w-full bg-gradient-to-t from-cyan-500 to-blue-500 rounded-t-sm"
                        />
                      ))}
                    </div>
                  </div>
                </div>
              </FloatingCard>

              {/* Small Widget 1 */}
              <FloatingCard delay={1} yOffset={[0, 15, 0]} duration={5} className="bottom-20 left-[-40px] w-[220px] z-30">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-500">
                    <CheckCircle2 className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Request</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Approved</p>
                  </div>
                </div>
              </FloatingCard>

              {/* Small Widget 2 */}
              <FloatingCard delay={2} yOffset={[0, -10, 0]} duration={6} className="top-[-20px] left-10 w-[240px] z-10">
                <div className="bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl rounded-2xl border border-slate-200/50 dark:border-white/10 shadow-xl p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-full bg-violet-500/20 flex items-center justify-center text-violet-500">
                    <Calendar className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-xs text-slate-500 font-medium">Upcoming</p>
                    <p className="text-sm font-bold text-slate-800 dark:text-white">Main Hall</p>
                  </div>
                </div>
              </FloatingCard>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── MARQUEE ─── */}
      <div className="w-full border-y border-slate-200/50 dark:border-white/10 bg-slate-50/50 dark:bg-white/5 py-4 overflow-hidden flex relative z-20 backdrop-blur-sm">
        <div className="absolute inset-y-0 left-0 w-32 bg-gradient-to-r from-background to-transparent z-10" />
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-background to-transparent z-10" />
        <motion.div 
          animate={{ x: [0, -1035] }}
          transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
          className="flex whitespace-nowrap gap-16 items-center text-slate-400 font-bold tracking-widest uppercase text-sm"
        >
          {/* Repeat content twice for seamless loop */}
          {[...Array(2)].map((_, i) => (
            <React.Fragment key={i}>
              <span className="flex items-center gap-2"><Star className="w-4 h-4 text-cyan-500" /> Computing Lab</span>
              <span className="flex items-center gap-2"><Star className="w-4 h-4 text-cyan-500" /> Main Auditorium</span>
              <span className="flex items-center gap-2"><Star className="w-4 h-4 text-cyan-500" /> Mini Theater</span>
              <span className="flex items-center gap-2"><Star className="w-4 h-4 text-cyan-500" /> Library Conf</span>
              <span className="flex items-center gap-2"><Star className="w-4 h-4 text-cyan-500" /> Gym Complex</span>
            </React.Fragment>
          ))}
        </motion.div>
      </div>

      {/* ─── STATS SECTION ─── */}
      <section className="py-24 relative z-20">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 lg:grid-cols-4 gap-6">
          <StatItem num={50} suffix="+" label="Locations" />
          <StatItem num={1200} suffix="+" label="Assets" />
          <StatItem num={15} suffix="k+" label="Users" />
          <StatItem num={99} suffix="%" label="Uptime" />
        </div>
      </section>

      {/* ─── BENTO GRID FEATURES ─── */}
      <section className="py-24 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-cyan-500 font-bold tracking-widest uppercase text-sm mb-2 block">Platform Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white">Built for scale.<br />Designed for speed.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {features.map((f, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                key={i}
                className={`${f.size} bg-card/60 backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-[2rem] p-8 group relative overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500" />
                
                <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center mb-6 shadow-lg shadow-black/10 group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-medium">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── TIMELINE / HOW IT WORKS ─── */}
      <section className="py-32 relative z-20">
        <div className="absolute inset-0 bg-slate-50 dark:bg-[#060B14]" />
        <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.02]" style={{ backgroundImage: "radial-gradient(circle, currentColor 1px, transparent 1px)", backgroundSize: "32px 32px" }} />
        
        <div className="max-w-7xl mx-auto px-6 relative">
          <div className="text-center mb-24">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white mb-6">Frictionless Workflow</h2>
            <p className="text-slate-500 dark:text-slate-400 text-lg max-w-2xl mx-auto font-medium">Get from login to confirmed booking in under 60 seconds.</p>
          </div>

          <div className="relative">
            {/* Connection Line */}
            <div className="hidden lg:block absolute top-1/2 left-[10%] right-[10%] h-1 bg-slate-200 dark:bg-white/5 -translate-y-1/2 rounded-full" />
            
            <div className="grid lg:grid-cols-3 gap-12 lg:gap-8 relative z-10">
              {steps.map((s, i) => (
                <motion.div 
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 0.6, delay: i * 0.2 }}
                  key={i} 
                  className="flex flex-col items-center text-center group"
                >
                  <div className="w-24 h-24 rounded-[2rem] bg-white dark:bg-slate-900 border border-slate-200/50 dark:border-white/10 shadow-xl flex items-center justify-center mb-8 relative group-hover:-translate-y-2 transition-transform duration-300">
                    <div className="absolute inset-0 rounded-[2rem] bg-gradient-to-br from-cyan-500 to-blue-500 opacity-0 group-hover:opacity-10 transition-opacity duration-300" />
                    <div className="text-cyan-500 w-10 h-10 group-hover:scale-110 transition-transform duration-300">
                      {s.icon}
                    </div>
                    {/* Number Badge */}
                    <div className="absolute -top-3 -right-3 w-8 h-8 rounded-full bg-gradient-to-br from-cyan-500 to-blue-600 text-white font-black text-sm flex items-center justify-center shadow-lg border-2 border-white dark:border-slate-900">
                      {i + 1}
                    </div>
                  </div>
                  <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-3">{s.title}</h3>
                  <p className="text-slate-500 dark:text-slate-400 leading-relaxed font-medium">{s.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── IMMERSIVE CTA FOOTER ─── */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-slate-900 dark:bg-black" />
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[50vw] bg-cyan-500/20 rounded-full blur-[150px] pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8, type: "spring" }}
            className="bg-white/5 backdrop-blur-2xl border border-white/10 p-12 md:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/10 to-transparent" />
            
            <h2 className="text-4xl md:text-6xl lg:text-7xl font-black text-white mb-6 leading-tight relative z-10">
              Ready to upgrade<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-500">your campus?</span>
            </h2>
            <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-medium relative z-10">
              Join thousands of students and faculty members already experiencing the future of resource management.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 text-lg font-bold text-slate-900 rounded-2xl bg-white hover:scale-105 hover:shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-all duration-300"
              >
                Create Free Account
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 text-lg font-bold text-white rounded-2xl border border-white/20 hover:bg-white/10 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
          </motion.div>
          
          <div className="mt-16 text-slate-500 text-sm font-medium flex items-center justify-center gap-2">
            © {new Date().getFullYear()} UniLink SUSL. All rights reserved.
          </div>
        </div>
      </section>
      
    </div>
  );
}