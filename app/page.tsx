"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
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
  Laptop,
  Check,
  AlertTriangle,
  Plus,
  Wrench,
  ShieldAlert,
  PieChart,
  HelpCircle,
  RefreshCw
} from "lucide-react";

/* ─── Mock Data for Interactive Simulator ─── */
const mockSpaces = [
  { id: "lab01", name: "Computing Lab 01", capacity: "36/40 seats", status: "Occupied", detail: "CS302 Database Lecture", fill: 90, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { id: "audiB", name: "Lecture Theatre B", capacity: "0/120 seats", status: "Vacant", detail: "Next class: 2:00 PM", fill: 0, color: "text-emerald-500 bg-emerald-500/10 border-emerald-500/20" },
  { id: "seminar02", name: "Seminar Room 02", capacity: "15/30 seats", status: "Occupied", detail: "Seminar: AI & Ethics", fill: 50, color: "text-amber-500 bg-amber-500/10 border-amber-500/20" },
  { id: "iotlab", name: "IoT & Robotics Lab", capacity: "0/20 seats", status: "Maintenance", detail: "AC Unit Repair", fill: 0, color: "text-rose-500 bg-rose-500/10 border-rose-500/20" }
];

export default function LandingPage() {
  const [mousePosition, setMousePosition] = useState({ x: 0, y: 0 });
  
  // Interactive Simulator States
  const [simTab, setSimTab] = useState<"availability" | "booking" | "analytics">("availability");
  const [selectedRoom, setSelectedRoom] = useState("Computing Lab 01");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [bookingStatus, setBookingStatus] = useState<"idle" | "conflict" | "resolving" | "resolved" | "success">("idle");
  const [bookingMessage, setBookingMessage] = useState("");

  // Role Switcher States
  const [activeRole, setActiveRole] = useState<"student" | "lecturer" | "admin">("student");

  // Conflict visualizer step
  const [conflictStep, setConflictStep] = useState(0);

  // Time tracker for simulator status bar
  const [currentTime, setCurrentTime] = useState("");

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePosition({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    
    // Simple digital clock
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      clearInterval(interval);
    };
  }, []);

  // Handle simulated booking slot click
  const handleSlotSelect = (time: string) => {
    setSelectedTimeSlot(time);
    if (time === "10:30 AM - 12:30 PM") {
      setBookingStatus("conflict");
      setBookingMessage("⚠️ Collision detected! Computing Lab 01 is booked for CS302 class.");
    } else {
      setBookingStatus("success");
      setBookingMessage(`🎉 Success! Reserved ${selectedRoom} for ${time}.`);
    }
  };

  // Run simulated conflict solver
  const runConflictSolver = () => {
    setBookingStatus("resolving");
    setBookingMessage("Running conflict resolution algorithm...");
    
    setTimeout(() => {
      setBookingStatus("resolved");
      setBookingMessage("✅ Smart suggestion found: Seminar Room 02 is vacant during this time!");
    }, 1200);
  };

  const confirmAlternative = () => {
    setSelectedRoom("Seminar Room 02");
    setBookingStatus("success");
    setBookingMessage("🎉 Success! Reserved Seminar Room 02 for 10:30 AM - 12:30 PM.");
  };

  const resetBookingSim = () => {
    setSelectedRoom("Computing Lab 01");
    setSelectedTimeSlot("");
    setBookingStatus("idle");
    setBookingMessage("");
  };

  // Conflict Resolution Step Explanations
  const pipelineSteps = [
    {
      title: "1. Request Intake",
      desc: "Student/lecturer inputs booking parameters (space type, duration, capacity). Request passes client-side schema checks.",
      icon: <Plus className="w-5 h-5" />,
      color: "border-blue-500/30 text-blue-500 bg-blue-500/5"
    },
    {
      title: "2. Database Index Lock",
      desc: "UniLink queries PostgreSQL with precise time block indexes to search for overlapping booking intervals.",
      icon: <Search className="w-5 h-5" />,
      color: "border-amber-500/30 text-amber-500 bg-amber-500/5"
    },
    {
      title: "3. Conflict Evaluation",
      desc: "Smart validation detects intersecting bookings. Evaluates role hierarchy (e.g., lecturers can override students).",
      icon: <ShieldAlert className="w-5 h-5" />,
      color: "border-rose-500/30 text-rose-500 bg-rose-500/5"
    },
    {
      title: "4. Auto-Routing & Confirmation",
      desc: "Provides instant alternate suggestions or automatically locks the conflict-free slot, writing to Supabase DB and sending WS notifications.",
      icon: <CheckCircle2 className="w-5 h-5" />,
      color: "border-emerald-500/30 text-emerald-500 bg-emerald-500/5"
    }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-brand-primary/30 relative">
      
      {/* Premium Cursor Ambient Highlight */}
      <motion.div
        className="pointer-events-none fixed inset-0 z-50 transition-opacity duration-300"
        animate={{
          background: `radial-gradient(800px circle at ${mousePosition.x}px ${mousePosition.y}px, rgba(124, 58, 237, 0.05), transparent 45%)`
        }}
      />

      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[92svh] flex items-center pt-24 pb-20 lg:pt-16 overflow-hidden border-b border-slate-200/40 dark:border-border/30">
        
        {/* Subtle Backdrop Pattern & Blobs */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <div className="absolute top-[10%] left-[5%] w-[55vw] h-[35vw] rounded-full bg-brand-primary/5 blur-[120px]" />
          <div className="absolute top-[20%] right-[10%] w-[40vw] h-[40vw] rounded-full bg-blue-500/5 blur-[140px]" />
          <div className="absolute inset-0 opacity-[0.02] dark:opacity-[0.015]" style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg width='80' height='80' viewBox='0 0 80 80' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M40 0v80M0 40h80' stroke='%237C3AED' stroke-width='1' fill='none'/%3E%3C/svg%3E\")" }} />
        </div>

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid lg:grid-cols-12 gap-12 xl:gap-16 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 bg-brand-primary/5 dark:bg-brand-primary/10 border border-brand-primary/20 text-brand-primary text-xs sm:text-sm font-black px-4.5 py-2 rounded-full mb-8 shadow-sm"
            >
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-primary opacity-75 animate-duration-1000"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-brand-primary"></span>
              </span>
              Production-Grade Resource Portal
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 25 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-4xl sm:text-5xl xl:text-6xl font-black leading-[1.08] tracking-tight mb-6 text-slate-900 dark:text-white"
            >
              A Unified Engine for <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-primary via-brand-accent to-blue-500">
                Campus Bookings
              </span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 25 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-slate-500 dark:text-foreground/60 text-lg max-w-xl mb-10 leading-relaxed font-semibold"
            >
              Optimize academic facility utilization, dispatch maintenance tickets instantly, and eliminate scheduling collisions with our real-time resource planner. Built for SUSL.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 25 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link
                href="/login"
                className="relative overflow-hidden flex items-center justify-center gap-2 px-8 py-4 text-sm font-black text-white rounded-2xl bg-brand-primary hover:bg-brand-secondary shadow-xl shadow-brand-primary/25 hover:-translate-y-0.5 transition-all duration-300 group"
              >
                Launch Console
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/resources"
                className="flex items-center justify-center gap-2 px-8 py-4 text-sm font-black text-slate-800 dark:text-white rounded-2xl border border-slate-200 dark:border-border hover:border-brand-primary/30 hover:bg-brand-primary/5 transition-all duration-300 group backdrop-blur-md"
              >
                Browse Resources
                <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
            </motion.div>
            
            {/* Quick Metrics */}
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5, duration: 0.8 }}
              className="mt-12 pt-8 border-t border-slate-200/55 dark:border-border/20 w-full grid grid-cols-3 gap-4"
            >
              <div>
                <p className="text-2xl font-black text-slate-800 dark:text-white">99.9%</p>
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Uptime SLA</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 dark:text-white">0s</p>
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Collision Risk</p>
              </div>
              <div>
                <p className="text-2xl font-black text-slate-800 dark:text-white">4 Departments</p>
                <p className="text-[10px] uppercase font-black text-slate-500 tracking-wider">Active Sync</p>
              </div>
            </motion.div>
          </div>

          {/* Hero Right: Interactive URMS Live Dashboard Simulator */}
          <div className="lg:col-span-6 relative w-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-[540px] bg-card border border-slate-200 dark:border-border/50 rounded-3xl shadow-2xl overflow-hidden flex flex-col relative"
            >
              {/* Simulator Header Bar */}
              <div className="bg-slate-100/80 dark:bg-[#120E22]/60 px-5 py-3.5 border-b border-slate-200/80 dark:border-border/40 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 rounded-full bg-red-400 opacity-80" />
                    <span className="w-3 h-3 rounded-full bg-amber-400 opacity-80" />
                    <span className="w-3 h-3 rounded-full bg-emerald-400 opacity-80" />
                  </div>
                  <span className="text-[10px] font-black uppercase text-slate-500 dark:text-white/40 tracking-widest ml-3">
                    URMS Core Console v1.2
                  </span>
                </div>
                
                {/* Live clock/status badge */}
                <div className="flex items-center gap-2 bg-emerald-500/10 text-emerald-500 dark:text-emerald-400 px-2.5 py-0.5 rounded-full border border-emerald-500/20 text-[9px] font-bold">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  LIVE
                </div>
              </div>

              {/* Simulator Navigation Tabs */}
              <div className="flex bg-slate-50/50 dark:bg-slate-900/10 border-b border-slate-200/50 dark:border-border/25 px-4 pt-2">
                {(["availability", "booking", "analytics"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setSimTab(tab); resetBookingSim(); }}
                    className={`px-4 py-2.5 text-xs font-bold uppercase tracking-wider relative transition-colors ${
                      simTab === tab 
                        ? "text-brand-primary" 
                        : "text-slate-500 dark:text-foreground/40 hover:text-slate-800 dark:hover:text-foreground/80"
                    }`}
                  >
                    {tab}
                    {simTab === tab && (
                      <motion.span
                        layoutId="activeSimTab"
                        className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand-primary"
                      />
                    )}
                  </button>
                ))}
                
                {/* Simulated timestamp */}
                <div className="ml-auto self-center pb-2 pr-1 text-[10px] font-mono text-slate-500 hidden sm:block">
                  {currentTime || "12:00:00 PM"}
                </div>
              </div>

              {/* Simulator Content Panel */}
              <div className="p-5 min-h-[310px] flex flex-col justify-between bg-card text-foreground">
                <AnimatePresence mode="wait">
                  {simTab === "availability" && (
                    <motion.div
                      key="availability"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-3 w-full"
                    >
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Resource Name</span>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Status / Utilization</span>
                      </div>
                      
                      {mockSpaces.map((room) => (
                        <div key={room.id} className="p-3 bg-slate-50/65 dark:bg-slate-950/20 border border-slate-200/60 dark:border-border/30 rounded-2xl flex items-center justify-between hover:border-brand-primary/30 transition-all duration-200">
                          <div>
                            <p className="text-xs font-bold text-slate-800 dark:text-white">{room.name}</p>
                            <p className="text-[10px] text-slate-500 dark:text-foreground/40 mt-0.5">{room.detail}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1.5">
                            <span className={`text-[9px] px-2 py-0.5 font-bold uppercase rounded-full border ${room.color}`}>
                              {room.status}
                            </span>
                            {room.status !== "Maintenance" && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-slate-500 font-bold">{room.capacity}</span>
                                <div className="w-12 bg-slate-200 dark:bg-white/10 h-1 rounded-full overflow-hidden">
                                  <div className="bg-brand-primary h-full" style={{ width: `${room.fill}%` }} />
                                </div>
                              </div>
                            )}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}

                  {simTab === "booking" && (
                    <motion.div
                      key="booking"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4 w-full flex flex-col"
                    >
                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">1. Choose Resource</span>
                        <div className="grid grid-cols-3 gap-2">
                          {["Computing Lab 01", "Lecture Theatre B", "Seminar Room 02"].map((name) => (
                            <button
                              key={name}
                              onClick={() => { setSelectedRoom(name); setBookingStatus("idle"); setSelectedTimeSlot(""); }}
                              className={`py-2 text-[10px] font-bold rounded-xl border text-center transition-all ${
                                selectedRoom === name
                                  ? "border-brand-primary bg-brand-primary/5 text-brand-primary shadow-sm"
                                  : "border-slate-200 dark:border-border/60 hover:bg-slate-50 dark:hover:bg-white/5 text-slate-600 dark:text-foreground/75"
                              }`}
                            >
                              {name.replace("Computing ", "").replace("Lecture ", "")}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-black uppercase text-slate-400 tracking-wider block mb-2">2. Select Target Time Slot</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSlotSelect("08:30 AM - 10:30 AM")}
                            className={`py-2 px-3 text-[10px] font-bold rounded-xl border text-left flex justify-between items-center transition-all ${
                              selectedTimeSlot === "08:30 AM - 10:30 AM"
                                ? "border-brand-primary bg-brand-primary/5 text-brand-primary"
                                : "border-slate-200 dark:border-border/60 text-slate-600 dark:text-foreground/70"
                            }`}
                          >
                            <span>08:30 - 10:30 AM</span>
                            <span className="text-[9px] text-emerald-500 bg-emerald-500/10 px-1.5 py-0.5 rounded font-black">VACANT</span>
                          </button>
                          <button
                            onClick={() => handleSlotSelect("10:30 AM - 12:30 PM")}
                            className={`py-2 px-3 text-[10px] font-bold rounded-xl border text-left flex justify-between items-center transition-all ${
                              selectedTimeSlot === "10:30 AM - 12:30 PM"
                                ? "border-brand-primary bg-brand-primary/5"
                                : "border-slate-200 dark:border-border/60 text-slate-600 dark:text-foreground/70"
                            }`}
                          >
                            <span>10:30 - 12:30 PM</span>
                            <span className="text-[9px] text-amber-500 bg-amber-500/10 px-1.5 py-0.5 rounded font-black">COLLISION</span>
                          </button>
                        </div>
                      </div>

                      {/* Animated Result Board */}
                      <div className="flex-1 min-h-[90px] border border-dashed border-slate-200 dark:border-border/60 rounded-2xl p-3 flex flex-col justify-center bg-slate-50/50 dark:bg-slate-900/5 relative overflow-hidden">
                        {bookingStatus === "idle" && (
                          <p className="text-[11px] font-semibold text-slate-400 text-center flex items-center justify-center gap-1.5">
                            <HelpCircle className="w-4 h-4 text-slate-400" /> Select a time slot above to test validation
                          </p>
                        )}

                        {bookingStatus === "conflict" && (
                          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                            <p className="text-[11px] font-bold text-red-500 dark:text-red-400 flex items-center gap-1.5 leading-tight">
                              <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" /> {bookingMessage}
                            </p>
                            <button
                              onClick={runConflictSolver}
                              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-black uppercase tracking-wider bg-brand-primary text-white hover:bg-brand-secondary rounded-xl transition-all shadow-md shadow-brand-primary/20"
                            >
                              <RefreshCw className="w-3.5 h-3.5 animate-spin-slow" /> Resolve Scheduling Conflict
                            </button>
                          </div>
                        )}

                        {bookingStatus === "resolving" && (
                          <div className="flex flex-col items-center justify-center gap-2 animate-in fade-in duration-200">
                            <div className="w-5 h-5 border-2 border-brand-primary/30 border-t-brand-primary rounded-full animate-spin" />
                            <p className="text-[10px] font-black text-brand-primary uppercase tracking-widest">{bookingMessage}</p>
                          </div>
                        )}

                        {bookingStatus === "resolved" && (
                          <div className="space-y-2 animate-in fade-in zoom-in-95 duration-200">
                            <p className="text-[11px] font-bold text-amber-500 dark:text-amber-400 flex items-center gap-1.5 leading-tight">
                              <Check className="w-4 h-4 text-emerald-500 shrink-0" /> {bookingMessage}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={confirmAlternative}
                                className="flex-1 py-1.5 text-[10px] font-black uppercase bg-emerald-500 hover:bg-emerald-600 text-white rounded-xl transition-all shadow-sm"
                              >
                                Accept alternate space
                              </button>
                              <button
                                onClick={resetBookingSim}
                                className="py-1.5 px-3 text-[10px] font-bold border border-slate-200 dark:border-border rounded-xl text-slate-500 hover:bg-slate-50 dark:hover:bg-white/5 transition-all"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {bookingStatus === "success" && (
                          <div className="text-center space-y-2.5 animate-in fade-in zoom-in-95 duration-200">
                            <p className="text-[11px] font-black text-emerald-600 dark:text-emerald-400 leading-tight">
                              {bookingMessage}
                            </p>
                            <button
                              onClick={resetBookingSim}
                              className="inline-flex items-center gap-1 px-4 py-1 text-[9px] font-black border border-emerald-500/20 text-emerald-500 bg-emerald-500/5 rounded-full hover:bg-emerald-500/10 transition-colors"
                            >
                              Reset Simulator
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {simTab === "analytics" && (
                    <motion.div
                      key="analytics"
                      initial={{ opacity: 0, y: 5 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -5 }}
                      className="space-y-4 w-full"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/50 dark:border-border/30 text-center">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Util Rate</p>
                          <p className="text-lg font-black mt-1 text-slate-800 dark:text-white">84.6%</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/50 dark:border-border/30 text-center">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Bookings</p>
                          <p className="text-lg font-black mt-1 text-slate-800 dark:text-white">342</p>
                        </div>
                        <div className="bg-slate-50 dark:bg-white/5 p-3 rounded-2xl border border-slate-200/50 dark:border-border/30 text-center">
                          <p className="text-[9px] text-slate-400 font-bold uppercase">Collisions Blocked</p>
                          <p className="text-lg font-black mt-1 text-emerald-500">47</p>
                        </div>
                      </div>

                      <div className="space-y-3 pt-1">
                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-wider">Utilization by Faculty</p>
                        
                        <div className="space-y-2">
                          <div>
                            <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                              <span>Computing & IS</span>
                              <span>92%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-brand-primary to-blue-500 h-full rounded-full" style={{ width: "92%" }} />
                            </div>
                          </div>
                          
                          <div>
                            <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                              <span>Applied Sciences</span>
                              <span>76%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-brand-primary to-blue-500 h-full rounded-full" style={{ width: "76%" }} />
                            </div>
                          </div>

                          <div>
                            <div className="flex justify-between text-[9px] font-bold text-slate-500 mb-1">
                              <span>Geomatics</span>
                              <span>68%</span>
                            </div>
                            <div className="w-full bg-slate-100 dark:bg-white/10 h-1.5 rounded-full overflow-hidden">
                              <div className="bg-gradient-to-r from-brand-primary to-blue-500 h-full rounded-full" style={{ width: "68%" }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Simulator Action Footer */}
              <div className="bg-slate-100/80 dark:bg-[#120E22]/60 px-5 py-3 border-t border-slate-200/80 dark:border-border/40 flex items-center justify-between text-[10px] font-semibold text-slate-500 dark:text-foreground/40">
                <span>Database Index: Locked</span>
                <span className="flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500" />
                  RLS Rules: Enforcement Active
                </span>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ─── INTERACTIVE ROLE HUB ─── */}
      <section className="py-24 relative z-20 bg-slate-50/50 dark:bg-[#0b0814]/40 border-b border-slate-200/40 dark:border-border/30">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-brand-primary font-black tracking-widest uppercase text-xs mb-3 block">Role-Tailored Workspaces</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              One Unified Database. <br />Three Customized Dashboards.
            </h2>
            <p className="text-slate-500 dark:text-foreground/60 text-sm font-semibold mt-3">
              UniLink detects user credentials automatically, serving role-specific features while respecting security boundaries.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-center">
            
            {/* Role Hub Left: Controls & Copy */}
            <div className="lg:col-span-5 space-y-6">
              <div className="flex flex-col gap-2.5">
                {(["student", "lecturer", "admin"] as const).map((role) => (
                  <button
                    key={role}
                    onClick={() => setActiveRole(role)}
                    className={`p-4 text-left rounded-2xl border transition-all flex items-center gap-4 ${
                      activeRole === role
                        ? "border-brand-primary bg-card text-foreground shadow-md shadow-brand-primary/5"
                        : "border-slate-200/80 dark:border-border/40 hover:bg-slate-100/50 dark:hover:bg-white/5 text-slate-500 dark:text-foreground/50"
                    }`}
                  >
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold ${
                      activeRole === role 
                        ? "bg-brand-primary/10 text-brand-primary" 
                        : "bg-slate-200/50 dark:bg-white/5 text-slate-400 dark:text-white/20"
                    }`}>
                      {role === "student" && <Users className="w-5 h-5" />}
                      {role === "lecturer" && <Laptop className="w-5 h-5" />}
                      {role === "admin" && <ShieldCheck className="w-5 h-5" />}
                    </div>
                    <div>
                      <p className="text-sm font-black capitalize">{role === "admin" ? "Admin & Operations" : role}</p>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {role === "student" && "For reservation requests & updates"}
                        {role === "lecturer" && "For class schedules & priority locks"}
                        {role === "admin" && "For system audits & analytics controls"}
                      </p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Role Hub Right: Interactive Terminal Display */}
            <div className="lg:col-span-7">
              <div className="bg-card border border-slate-200 dark:border-border rounded-3xl p-6 shadow-xl relative overflow-hidden min-h-[360px] flex flex-col justify-between">
                
                {/* Terminal Header */}
                <div className="flex justify-between items-center pb-4 border-b border-slate-200/60 dark:border-border/40">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full bg-brand-primary opacity-60" />
                    <span className="text-xs font-black uppercase text-slate-500 dark:text-foreground/50 tracking-wider">
                      {activeRole === "student" && "Active Session: Student Hub"}
                      {activeRole === "lecturer" && "Active Session: Faculty Console"}
                      {activeRole === "admin" && "Active Session: Operator Dashboard"}
                    </span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 uppercase">SYS_OK</span>
                </div>

                {/* Switchable Mock Viewport */}
                <div className="flex-1 py-6 flex flex-col justify-center">
                  <AnimatePresence mode="wait">
                    {activeRole === "student" && (
                      <motion.div
                        key="student"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">
                          Students gain access to an instant dashboard where they can track approved rooms, reserve laboratory equipment, and view check-in barcodes.
                        </p>
                        
                        {/* Interactive UI Snippet */}
                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-border/30 space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                            <span>Your Reserved Slots</span>
                            <span className="text-brand-primary">2 Active</span>
                          </div>
                          
                          <div className="space-y-2">
                            <div className="flex items-center justify-between p-2.5 bg-card border border-slate-200/60 dark:border-border/30 rounded-xl">
                              <span className="text-xs font-bold text-slate-800 dark:text-white">Chemistry Lab Space B</span>
                              <span className="text-[9px] font-bold text-emerald-500 bg-emerald-500/10 px-2 py-0.5 rounded-full border border-emerald-500/20">Approved</span>
                            </div>
                            <div className="flex items-center justify-between p-2.5 bg-card border border-slate-200/60 dark:border-border/30 rounded-xl">
                              <span className="text-xs font-bold text-slate-800 dark:text-white">Smart Projector Kit #4</span>
                              <span className="text-[9px] font-bold text-amber-500 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">Pending Admin</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeRole === "lecturer" && (
                      <motion.div
                        key="lecturer"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">
                          Lecturers bypass standard reservations. They can lock classrooms recursively for a whole term, override student bookings, and approve space requests.
                        </p>
                        
                        {/* Interactive UI Snippet */}
                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-border/30 space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                            <span>Pending Student Requests</span>
                            <span className="text-amber-500">Action Required</span>
                          </div>
                          
                          <div className="flex items-center justify-between p-3 bg-card border border-slate-200/60 dark:border-border/30 rounded-xl">
                            <div>
                              <p className="text-xs font-bold text-slate-800 dark:text-white">Computing Lab 01</p>
                              <p className="text-[9px] text-slate-400 mt-0.5">Requested by: Student Society (1:30 PM)</p>
                            </div>
                            <div className="flex gap-1.5">
                              <button className="px-2.5 py-1 text-[9px] font-bold text-white bg-brand-primary rounded-lg">Approve</button>
                              <button className="px-2.5 py-1 text-[9px] font-bold border border-slate-200 dark:border-border text-slate-500 dark:text-white/60 rounded-lg">Decline</button>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}

                    {activeRole === "admin" && (
                      <motion.div
                        key="admin"
                        initial={{ opacity: 0, x: 10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -10 }}
                        className="space-y-4"
                      >
                        <p className="text-sm font-bold text-slate-800 dark:text-white leading-relaxed">
                          Administrators monitor security controls, access the complete maintenance ticket system, review usage audits, and compile PDF/Excel reports.
                        </p>
                        
                        {/* Interactive UI Snippet */}
                        <div className="p-4 bg-slate-50 dark:bg-white/5 rounded-2xl border border-slate-200/50 dark:border-border/30 space-y-3">
                          <div className="flex justify-between items-center text-[10px] font-black uppercase text-slate-400">
                            <span>System Status Panel</span>
                            <span className="text-blue-500 font-mono">100% SECURE</span>
                          </div>
                          
                          <div className="grid grid-cols-2 gap-2.5">
                            <div className="p-2 bg-card border border-slate-200/60 dark:border-border/30 rounded-xl flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 dark:text-white/40 font-bold">Active Tickets</span>
                              <span className="text-xs font-black text-rose-500">12 Pending</span>
                            </div>
                            <div className="p-2 bg-card border border-slate-200/60 dark:border-border/30 rounded-xl flex items-center justify-between">
                              <span className="text-[10px] text-slate-500 dark:text-white/40 font-bold">DB Operations</span>
                              <span className="text-xs font-black text-emerald-500">Sync OK</span>
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Footer specs checklist */}
                <div className="pt-4 border-t border-slate-200/60 dark:border-border/40 grid grid-cols-3 gap-2 text-[10px] font-bold text-slate-500 dark:text-foreground/40">
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-brand-primary" /> RBAC Middleware</span>
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-brand-primary" /> Supabase RLS</span>
                  <span className="flex items-center gap-1"><Check className="w-3.5 h-3.5 text-brand-primary" /> JWT Verification</span>
                </div>

              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── DYNAMIC CONFLICT PIPELINE ─── */}
      <section className="py-24 relative z-20">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16">
            <span className="text-brand-primary font-black tracking-widest uppercase text-xs mb-3 block">Collision Prevention Pipeline</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Behind the Scheduling Engine
            </h2>
            <p className="text-slate-500 dark:text-foreground/60 text-sm font-semibold mt-3">
              How UniLink validates, processes, and matches bookings dynamically inside the database index.
            </p>
          </div>

          {/* Interactive Steps Visualizer */}
          <div className="grid md:grid-cols-4 gap-6">
            {pipelineSteps.map((step, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.5, delay: idx * 0.1 }}
                onClick={() => setConflictStep(idx)}
                className={`p-6 rounded-3xl border text-left cursor-pointer transition-all ${
                  conflictStep === idx
                    ? "bg-card border-brand-primary shadow-lg shadow-brand-primary/5 -translate-y-1"
                    : "bg-card/40 border-slate-200/80 dark:border-border/30 hover:border-brand-primary/20"
                }`}
              >
                <div className={`w-10 h-10 rounded-xl border flex items-center justify-center mb-4 ${step.color}`}>
                  {step.icon}
                </div>
                <h3 className="text-sm font-black text-slate-800 dark:text-white mb-2">{step.title}</h3>
                <p className="text-xs text-slate-500 dark:text-foreground/60 leading-relaxed font-semibold">{step.desc}</p>
              </motion.div>
            ))}
          </div>

          {/* Pipeline Interactive Status Graph */}
          <div className="mt-12 bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-border rounded-3xl p-6 relative overflow-hidden">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-black uppercase text-slate-400">Simulation Status Graph</span>
              <span className="text-[10px] font-mono text-brand-primary">Pipeline Step {conflictStep + 1} of 4</span>
            </div>
            
            {/* Visual node connector line */}
            <div className="relative h-16 w-full flex items-center justify-between px-8 sm:px-16 mt-8 mb-4">
              <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-slate-200 dark:bg-white/10 -translate-y-1/2 z-0" />
              <div 
                className="absolute top-1/2 left-0 h-0.5 bg-brand-primary -translate-y-1/2 z-0 transition-all duration-500" 
                style={{ width: `${(conflictStep / 3) * 100}%` }}
              />
              
              {[0, 1, 2, 3].map((n) => (
                <button
                  key={n}
                  onClick={() => setConflictStep(n)}
                  className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs z-10 transition-all ${
                    n <= conflictStep
                      ? "bg-brand-primary text-white shadow-lg shadow-brand-primary/20 scale-110"
                      : "bg-slate-100 dark:bg-[#120E22] border border-slate-200 dark:border-border text-slate-400"
                  }`}
                >
                  {n + 1}
                </button>
              ))}
            </div>
          </div>

        </div>
      </section>

      {/* ─── BENTO GRID FEATURES ─── */}
      <section className="py-24 relative z-20 bg-slate-50/50 dark:bg-[#0b0814]/20 border-y border-slate-200/40 dark:border-border/30">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="mb-16 text-left">
            <span className="text-brand-primary font-black tracking-widest uppercase text-xs mb-3 block">Platform Capability Ecosystem</span>
            <h2 className="text-3xl sm:text-4xl font-black text-slate-900 dark:text-white tracking-tight">
              Fine-Tuned For Academic Operations
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            
            {/* Bento Card 1: Console */}
            <div className="md:col-span-2 bg-card border border-slate-200/70 dark:border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-brand-primary/30 transition-all duration-300">
              <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-brand-primary/10 text-brand-primary flex items-center justify-center">
                    <LayoutDashboard className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Unified Live Console</h3>
                  <p className="text-slate-500 dark:text-foreground/60 text-sm leading-relaxed max-w-md font-semibold">
                    Monitor classroom occupancy, labs, and equipment sets. Instant color status tags help operators see vacant resources dynamically.
                  </p>
                </div>
                <div className="flex items-center gap-1.5 text-xs font-bold text-brand-primary pt-4">
                  Explore Console Views <ChevronRight className="w-4 h-4" />
                </div>
              </div>
              <div className="absolute right-0 bottom-0 top-0 w-1/3 bg-gradient-to-l from-brand-primary/5 to-transparent pointer-events-none hidden sm:block" />
            </div>

            {/* Bento Card 2: Conflict Validation */}
            <div className="bg-card border border-slate-200/70 dark:border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-brand-primary/30 transition-all duration-300">
              <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center">
                    <Calendar className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Conflict Validation</h3>
                  <p className="text-slate-500 dark:text-foreground/60 text-sm leading-relaxed font-semibold">
                    Prevents schedule overlap with absolute precision using dynamic time boundaries.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-amber-500/10 text-amber-500 py-1 px-3 rounded-full border border-amber-500/20 max-w-max">
                  PostgreSQL Index Lock
                </span>
              </div>
            </div>

            {/* Bento Card 3: Security */}
            <div className="bg-card border border-slate-200/70 dark:border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-brand-primary/30 transition-all duration-300">
              <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-rose-500/10 text-rose-500 flex items-center justify-center">
                    <Lock className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Granular DB Access</h3>
                  <p className="text-slate-500 dark:text-foreground/60 text-sm leading-relaxed font-semibold">
                    Row Level Security filters users based on their active student, lecturer, or staff role.
                  </p>
                </div>
                <span className="text-[10px] font-mono bg-rose-500/10 text-rose-500 py-1 px-3 rounded-full border border-rose-500/20 max-w-max">
                  Supabase RLS Active
                </span>
              </div>
            </div>

            {/* Bento Card 4: Reports */}
            <div className="md:col-span-2 bg-card border border-slate-200/70 dark:border-border rounded-[2rem] p-8 relative overflow-hidden group hover:border-brand-primary/30 transition-all duration-300">
              <div className="relative z-10 flex flex-col justify-between h-full min-h-[220px]">
                <div className="space-y-4">
                  <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <h3 className="text-xl font-black text-slate-800 dark:text-white">Audits & Reports Export</h3>
                  <p className="text-slate-500 dark:text-foreground/60 text-sm leading-relaxed max-w-md font-semibold">
                    Generate instant PDF utilization sheets, export tabular schedules to Excel, or coordinate sync to Google Sheets for university management review.
                  </p>
                </div>
                <div className="flex gap-2.5 pt-4">
                  <span className="text-[9px] font-bold bg-slate-100 dark:bg-[#120E22] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-border">PDF Export</span>
                  <span className="text-[9px] font-bold bg-slate-100 dark:bg-[#120E22] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-border">Excel Export</span>
                  <span className="text-[9px] font-bold bg-slate-100 dark:bg-[#120E22] px-2.5 py-1 rounded-lg border border-slate-200 dark:border-border">Google Sheets API</span>
                </div>
              </div>
            </div>

          </div>

        </div>
      </section>

      {/* ─── IMMERSIVE CTA FOOTER ─── */}
      <section className="relative pt-32 pb-20 overflow-hidden bg-slate-950 dark:bg-black border-t border-white/5">
        
        {/* Glow ambient lines */}
        <div className="absolute bottom-[-20%] left-1/2 -translate-x-1/2 w-[80vw] h-[40vw] bg-brand-primary/20 rounded-full blur-[140px] pointer-events-none" />
        
        <div className="relative max-w-5xl mx-auto px-6 text-center z-10">
          <div className="bg-white/5 backdrop-blur-2xl border border-white/10 p-12 md:p-20 rounded-[3rem] shadow-2xl relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-brand-primary/10 to-transparent pointer-events-none" />
            
            <h2 className="text-3xl md:text-5xl font-black text-white mb-6 leading-tight relative z-10">
              Upgrade Your Campus <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-accent to-brand-primary">Resource Control System</span>
            </h2>
            <p className="text-slate-300 text-base md:text-lg mb-10 max-w-xl mx-auto font-semibold relative z-10">
              Coordinate and optimize your campus rooms, schedule classes conflict-free, and resolve resource bottlenecks today.
            </p>

            <div className="flex flex-col sm:flex-row justify-center gap-4 relative z-10">
              <Link
                href="/register"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-black text-slate-900 rounded-2xl bg-white hover:scale-[1.02] hover:shadow-[0_0_30px_rgba(255,255,255,0.25)] transition-all duration-300 cursor-pointer"
              >
                Create Account
              </Link>
              <Link
                href="/login"
                className="inline-flex items-center justify-center gap-2 px-10 py-5 text-base font-black text-white rounded-2xl border border-white/20 hover:bg-white/10 transition-all duration-300"
              >
                Sign In
              </Link>
            </div>
          </div>
          
          <div className="mt-16 text-slate-500 text-sm font-bold flex items-center justify-center gap-2">
            © {new Date().getFullYear()} UniLink. Built for Capstone Project G15.
          </div>
        </div>
      </section>
      
    </div>
  );
}