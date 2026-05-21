"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import {
  ArrowRight,
  Calendar,
  ShieldCheck,
  Users,
  Zap,
  TrendingUp,
  LayoutDashboard,
  CheckCircle2,
  ChevronRight,
  Building2,
  Clock,
  Sparkles,
  Lock,
  Search,
  Activity,
  Laptop
} from "lucide-react";

/* ── Floating UI Wrapper ── */
function FloatingCard({ children, delay = 0, yOffset = [0, -12, 0], duration = 5, className = "" }: any) {
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
  const yBackground = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const features = [
    { 
      icon: <LayoutDashboard className="w-6 h-6" />, 
      title: "Unified Live Console", 
      desc: "Monitor all campus spaces, labs, and lecture halls at a single glance with live status indicators.", 
      color: "from-violet-500 to-indigo-600", 
      size: "col-span-1 md:col-span-2 row-span-1" 
    },
    { 
      icon: <Calendar className="w-6 h-6" />, 
      title: "Conflict-Free Booking", 
      desc: "Smart validation algorithms prevent double bookings and automatically handle holiday overrides.", 
      color: "from-purple-500 to-violet-600", 
      size: "col-span-1 md:col-span-1 row-span-2" 
    },
    { 
      icon: <ShieldCheck className="w-6 h-6" />, 
      title: "Granular Security", 
      desc: "Strict RLS database boundaries filter access based on active student, lecturer, or staff credentials.", 
      color: "from-fuchsia-500 to-purple-600", 
      size: "col-span-1 md:col-span-1 row-span-1" 
    },
    { 
      icon: <Zap className="w-6 h-6" />, 
      title: "Instant Notifications", 
      desc: "Real-time socket.io alerts ping users on booking confirmations and urgent schedule edits.", 
      color: "from-pink-500 to-rose-600", 
      size: "col-span-1 md:col-span-1 row-span-1" 
    },
    { 
      icon: <TrendingUp className="w-6 h-6" />, 
      title: "Audit & Analytics", 
      desc: "Explore usage statistics, peak scheduling hours, and generate PDF report summaries instantly.", 
      color: "from-indigo-500 to-violet-600", 
      size: "col-span-1 md:col-span-2 row-span-1" 
    },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-brand-primary/30 relative">
      
      {/* Dynamic Cursor Highlight */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        animate={{
          background: `radial-gradient(700px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(124,58,237,0.04), transparent 45%)`
        }}
      />

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[92svh] flex items-center pt-20 pb-20 lg:pt-0 overflow-hidden">
        
        {/* Glowing Ambient Blobs */}
        <motion.div style={{ y: yBackground }} className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[5%] left-[20%] w-[65vw] h-[35vw] rounded-full bg-brand-primary/10 blur-[130px] animate-pulse [animation-duration:6s]" />
          <div className="absolute top-[15%] right-[5%] w-[45vw] h-[45vw] rounded-full bg-violet-400/80 dark:bg-violet-900/15 opacity-15 dark:opacity-100 blur-[150px] animate-pulse [animation-duration:8s]" />
          <div className="absolute inset-0 opacity-[0.03] dark:opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%237C3AED' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E\")" }} />
        </motion.div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid lg:grid-cols-12 gap-16 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/15 text-brand-primary text-xs sm:text-sm font-black px-4.5 py-2 rounded-full mb-8 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
              </span>
              Intelligent Campus Resource Control
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 25 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.15 }}
              className="text-5xl sm:text-6xl xl:text-7xl font-black leading-[1.05] tracking-tight mb-8 text-slate-900 dark:text-white"
            >
              Enhance your campus<br />
              resource control 
              <span className="inline-block relative ml-3">
                <span className="absolute -inset-1 rounded-2xl bg-brand-primary/15 blur-lg" />
                <span className="relative inline-block bg-brand-primary text-white px-6 py-2.5 rounded-2xl font-black shadow-xl shadow-brand-primary/30 rotate-[-1.5deg] hover:rotate-0 transition-transform duration-300 select-none text-4xl sm:text-5xl xl:text-6xl">
                  with UniLink
                </span>
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 25 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.25 }}
              className="text-slate-500 dark:text-slate-400 text-lg sm:text-xl max-w-2xl mb-10 leading-relaxed font-medium"
            >
              Streamline resource bookings, audit facility utilization, and manage campus requests with our intuitive, scalable system. Designed for modern universities.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 25 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.35 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link
                href="/login"
                className="relative overflow-hidden flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-white rounded-2xl bg-brand-primary hover:bg-brand-secondary shadow-xl shadow-brand-primary/25 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                Launch Console
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/resources"
                className="flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold text-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-white/10 hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all duration-300 group backdrop-blur-md"
              >
                Browse Resources
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
          </div>

          {/* Hero Right Visuals (Device Mockup + Floating Widgets) */}
          <div className="lg:col-span-5 relative h-[500px] hidden lg:flex items-center justify-center">
            
            {/* Ambient Background Glow behind device */}
            <div className="absolute w-72 h-72 rounded-full bg-brand-primary/20 blur-[80px]" />

            {/* Smart Phone Frame Mockup */}
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.8, type: "spring" }}
              className="relative w-64 h-[460px] bg-slate-900 dark:bg-black rounded-[40px] border-[6px] border-slate-800 dark:border-slate-950 shadow-2xl overflow-hidden flex flex-col"
            >
              {/* Dynamic Island */}
              <div className="absolute top-3 left-1/2 -translate-x-1/2 w-28 h-5 bg-black rounded-full z-35 flex items-center justify-center">
                <div className="w-2.5 h-2.5 rounded-full bg-slate-900 ml-auto mr-3 border border-slate-800" />
              </div>

              {/* Inside Phone Screen UI */}
              <div className="flex-1 bg-slate-50 dark:bg-slate-950 p-4 pt-10 flex flex-col justify-between overflow-hidden">
                <div className="space-y-4">
                  {/* Top phone header */}
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-brand-primary">UniLink</span>
                    <div className="w-6 h-6 rounded-full bg-brand-primary/10 flex items-center justify-center"><Activity className="w-3.5 h-3.5 text-brand-primary" /></div>
                  </div>

                  {/* Booking display */}
                  <div className="bg-white dark:bg-white/5 border border-slate-200/50 dark:border-white/5 rounded-xl p-3 shadow-sm space-y-2">
                    <p className="text-[9px] font-bold text-slate-400 dark:text-white/40 uppercase tracking-widest">Active Reserve</p>
                    <p className="text-xs font-black text-slate-800 dark:text-white truncate">Computing Lab 03</p>
                    <div className="flex justify-between items-center pt-1.5 border-t border-slate-100 dark:border-white/5 text-[9px] font-bold text-slate-500">
                      <span>10:30 AM - 12:30 PM</span>
                      <span className="text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded">Approved</span>
                    </div>
                  </div>

                  {/* Navigation bar layout mock */}
                  <div className="space-y-1">
                    <div className="h-2 w-16 bg-slate-300 dark:bg-white/10 rounded-full" />
                    <div className="h-1.5 w-24 bg-slate-200 dark:bg-white/5 rounded-full" />
                  </div>

                  {/* Mini Cards */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="bg-white dark:bg-white/5 p-2 rounded-xl border border-slate-200/50 dark:border-white/5">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Auditorium</p>
                      <p className="text-sm font-black mt-1 text-slate-800 dark:text-white">94%</p>
                    </div>
                    <div className="bg-white dark:bg-white/5 p-2 rounded-xl border border-slate-200/50 dark:border-white/5">
                      <p className="text-[9px] text-slate-400 font-bold uppercase">Staff Hub</p>
                      <p className="text-sm font-black mt-1 text-slate-800 dark:text-white">Free</p>
                    </div>
                  </div>
                </div>

                {/* Footer mock inside phone */}
                <div className="pt-2 border-t border-slate-200/50 dark:border-white/5 flex justify-between items-center text-[10px] font-bold text-slate-400">
                  <span className="text-brand-primary">Explore</span>
                  <span>Schedule</span>
                  <span>Account</span>
                </div>
              </div>
            </motion.div>

            {/* Left Float Card: History / Bookings logs */}
            <FloatingCard delay={0.5} yOffset={[0, -12, 0]} duration={6} className="left-[-40px] top-[140px] w-64 z-20">
              <div className="bg-white/80 dark:bg-[#120E22]/90 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 p-4.5 rounded-2xl shadow-xl space-y-3">
                <div className="flex justify-between items-center border-b border-slate-100 dark:border-white/5 pb-2">
                  <span className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5" /> Recent Requests
                  </span>
                  <span className="text-[9px] font-bold text-brand-primary uppercase">Log</span>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">Main Audi Hall</p>
                      <p className="text-[9px] text-slate-400">Lecturer • Today</p>
                    </div>
                    <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full">+$2k</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800 dark:text-white">Foyer Lab 02</p>
                      <p className="text-[9px] text-slate-400">Student • Yesterday</p>
                    </div>
                    <span className="text-[9px] font-bold text-red-500 bg-red-500/10 px-2 py-0.5 rounded-full">Conflict</span>
                  </div>
                </div>
              </div>
            </FloatingCard>

            {/* Right Float Card: Utilization progress */}
            <FloatingCard delay={1.5} yOffset={[0, 12, 0]} duration={5.5} className="right-[-40px] top-[60px] w-56 z-20">
              <div className="bg-white/80 dark:bg-[#120E22]/90 backdrop-blur-xl border border-slate-200/60 dark:border-white/10 p-4.5 rounded-2xl shadow-xl space-y-3.5">
                <div>
                  <p className="text-[10px] font-black text-slate-400 dark:text-white/40 uppercase tracking-widest mb-1.5">Capacity Usage</p>
                  <p className="text-2xl font-black text-slate-800 dark:text-white">82.4%</p>
                </div>
                {/* Custom purple slider progress bar */}
                <div className="w-full bg-slate-100 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-primary h-full rounded-full" style={{ width: "82%" }} />
                </div>
                <div className="flex justify-between items-center text-[10px] font-bold text-slate-500">
                  <span>Usage Rate</span>
                  <span className="text-brand-primary">+12%</span>
                </div>
              </div>
            </FloatingCard>

          </div>
        </div>
      </section>

      {/* ─── TRUSTED LOGOS MARQUEE ─── */}
      <div className="w-full border-y border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-white/5 py-8 overflow-hidden flex relative z-20 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-6 w-full flex flex-col md:flex-row items-center justify-between gap-8 text-slate-400 dark:text-white/30 text-xs font-black uppercase tracking-widest">
          <span>Trusted by academic faculties</span>
          <div className="flex flex-wrap gap-8 items-center opacity-70">
            <span className="flex items-center gap-1.5"><Laptop className="w-4 h-4 text-brand-primary" /> Faculty of Computing</span>
            <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4 text-brand-primary" /> Applied Sciences</span>
            <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-brand-primary" /> Student Senate</span>
            <span className="flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-brand-primary" /> Administration</span>
          </div>
        </div>
      </div>

      {/* ─── BENTO GRID FEATURES ─── */}
      <section className="py-24 relative z-20 bg-slate-50/30 dark:bg-transparent">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-16">
            <span className="text-brand-primary font-black tracking-widest uppercase text-xs mb-3 block">Platform Capabilities</span>
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 dark:text-white tracking-tight">Built for scale.<br />Designed for speed.</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[250px]">
            {features.map((f, i) => (
              <motion.div 
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: i * 0.1 }}
                key={i}
                className={`${f.size} bg-card backdrop-blur-xl border border-slate-200/50 dark:border-white/10 rounded-[2.2rem] p-8 group relative overflow-hidden`}
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${f.color} opacity-0 group-hover:opacity-[0.03] transition-opacity duration-500`} />
                <div className="absolute top-0 right-0 w-32 h-32 bg-brand-primary/5 rounded-bl-[100px] -z-10 group-hover:scale-110 transition-transform duration-500" />
                
                <div className={`w-13 h-13 rounded-2xl bg-gradient-to-br ${f.color} text-white flex items-center justify-center mb-6 shadow-md shadow-brand-primary/10 group-hover:scale-110 transition-transform duration-300`}>
                  {f.icon}
                </div>
                <h3 className="text-xl font-black text-slate-900 dark:text-white mb-2">{f.title}</h3>
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── DYNAMIC WORKFLOW SECTION (Inspired by Reference Image bottom half) ─── */}
      <section className="py-24 relative z-20 border-t border-slate-200/50 dark:border-white/5 bg-slate-50/50 dark:bg-slate-950/20">
        <div className="max-w-6xl mx-auto px-6">
          <div className="text-center mb-20">
            <span className="inline-block bg-brand-primary/10 text-brand-primary text-[10px] font-black uppercase px-3 py-1 rounded-full tracking-widest mb-3">Our Workflow</span>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 dark:text-white">
              How our platform makes your <span className="text-brand-primary">workflow easier</span>
            </h2>
          </div>

          <div className="grid md:grid-cols-2 gap-8">
            
            {/* Card 1: Sign up and customize */}
            <div className="bg-card border border-slate-200/60 dark:border-white/10 p-8 rounded-3xl flex flex-col justify-between h-[420px] shadow-sm relative overflow-hidden group">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black">1</div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Sign up and customize</h3>
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  Create your account in minutes and tailor the platform to meet your university's unique resource roles.
                </p>
              </div>

              {/* Graphic Widget: Users card overlapping list */}
              <div className="w-full max-w-[280px] bg-slate-50 dark:bg-white/5 rounded-2xl p-4 border border-slate-200/50 dark:border-white/5 space-y-3 self-center mt-6">
                <div className="flex justify-between items-center text-[10px] text-slate-400 font-bold uppercase">
                  <span>Total Active Users</span>
                  <Users className="w-3.5 h-3.5 text-brand-primary" />
                </div>
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-black text-slate-900 dark:text-white">20K+</span>
                  <div className="flex -space-x-2 overflow-hidden">
                    {[1, 2, 3, 4].map((n) => (
                      <div key={n} className="inline-block h-6 w-6 rounded-full ring-2 ring-card bg-gradient-to-br from-brand-primary to-violet-400" />
                    ))}
                  </div>
                </div>
                <div className="w-full bg-slate-200/50 dark:bg-white/5 h-2 rounded-full overflow-hidden">
                  <div className="bg-brand-primary h-full rounded-full" style={{ width: "65%" }} />
                </div>
              </div>
            </div>

            {/* Card 2: Link Your Accounts / Resources */}
            <div className="bg-card border border-slate-200/60 dark:border-white/10 p-8 rounded-3xl flex flex-col justify-between h-[420px] shadow-sm relative overflow-hidden group">
              <div className="space-y-4">
                <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center font-black">2</div>
                <h3 className="text-2xl font-black text-slate-900 dark:text-white">Link Your resources</h3>
                <p className="text-slate-500 dark:text-slate-400 font-semibold text-sm">
                  Easily register university rooms, labs, booking limits, and conflict-free schedules in one location.
                </p>
              </div>

              {/* Graphic Widget: Connections node representation */}
              <div className="w-full max-w-[280px] bg-slate-50 dark:bg-white/5 rounded-2xl p-5 border border-slate-200/50 dark:border-white/5 flex items-center justify-between self-center mt-6">
                <div className="flex flex-col gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center"><Lock className="w-3 h-3 text-brand-primary" /></div>
                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center"><Search className="w-3 h-3 text-brand-primary" /></div>
                </div>
                
                {/* Central connecting core */}
                <div className="relative">
                  <div className="w-12 h-12 rounded-full bg-brand-primary flex items-center justify-center text-white shadow-lg shadow-brand-primary/30 z-10 relative">
                    <Sparkles className="w-5 h-5 animate-pulse" />
                  </div>
                  {/* Connecting lines using absolute styling */}
                  <div className="absolute top-1/2 -left-6 w-6 h-[2px] bg-brand-primary/30 -translate-y-1/2" />
                  <div className="absolute top-1/2 -right-6 w-6 h-[2px] bg-brand-primary/30 -translate-y-1/2" />
                </div>

                <div className="flex flex-col gap-3">
                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center"><Calendar className="w-3 h-3 text-brand-primary" /></div>
                  <div className="w-6 h-6 rounded-full bg-brand-primary/10 border border-brand-primary/20 flex items-center justify-center"><Activity className="w-3 h-3 text-brand-primary" /></div>
                </div>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* ─── IMMERSIVE CTA FOOTER ─── */}
      <section className="relative pt-32 pb-16 overflow-hidden">
        <div className="absolute inset-0 bg-[#0B0813] dark:bg-black" />
        {/* Glow ambient lines */}
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[40vw] bg-brand-primary/25 rounded-full blur-[130px] pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-12 md:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent" />
            
            <h2 className="text-4xl md:text-6xl font-black text-white mb-6 leading-tight relative z-10">
              Ready to upgrade<br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-primary">your campus?</span>
            </h2>
            <p className="text-slate-300 text-lg md:text-xl mb-10 max-w-2xl mx-auto font-semibold relative z-10">
              Join thousands of students and faculty members already experiencing the future of resource management.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold text-slate-900 rounded-2xl bg-white hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all duration-300 cursor-pointer"
              >
                Create Free Account
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-bold text-white rounded-2xl border border-white/20 hover:bg-white/10 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
          </div>
          
          <div className="mt-16 text-slate-500 text-sm font-bold flex items-center justify-center gap-2">
            © {new Date().getFullYear()} UniLink SUSL. All rights reserved.
          </div>
        </div>
      </section>
      
    </div>
  );
}