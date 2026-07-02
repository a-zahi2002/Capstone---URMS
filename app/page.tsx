"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  ArrowRight,
  ShieldCheck,
  Users,
  CheckCircle2,
  ChevronRight,
  Laptop,
  Check,
  AlertTriangle,
  Plus,
  ShieldAlert,
  Search,
  HelpCircle,
  RefreshCw
} from "lucide-react";

/* ─── Mock Data for Interactive Simulator ─── */
const mockSpaces = [
  { id: "lab01", name: "Computing Lab 01", capacity: "36/40 seats", status: "Occupied", detail: "CS302 Database Lecture", fill: 90, color: "bg-foreground text-background border-foreground" },
  { id: "audiB", name: "Lecture Theatre B", capacity: "0/120 seats", status: "Vacant", detail: "Next class: 2:00 PM", fill: 0, color: "bg-transparent text-brand-success border-brand-success" },
  { id: "seminar02", name: "Seminar Room 02", capacity: "15/30 seats", status: "Occupied", detail: "Seminar: AI & Ethics", fill: 50, color: "bg-foreground text-background border-foreground" },
  { id: "iotlab", name: "IoT & Robotics Lab", capacity: "0/20 seats", status: "Maintenance", detail: "AC Unit Repair", fill: 0, color: "bg-brand-danger text-white border-brand-danger" }
];

export default function LandingPage() {
  const [simTab, setSimTab] = useState<"availability" | "booking" | "analytics">("availability");
  const [selectedRoom, setSelectedRoom] = useState("Computing Lab 01");
  const [selectedTimeSlot, setSelectedTimeSlot] = useState("");
  const [bookingStatus, setBookingStatus] = useState<"idle" | "conflict" | "resolving" | "resolved" | "success">("idle");
  const [bookingMessage, setBookingMessage] = useState("");
  const [activeRole, setActiveRole] = useState<"student" | "lecturer" | "admin">("student");
  const [currentTime, setCurrentTime] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleSlotSelect = (time: string) => {
    setSelectedTimeSlot(time);
    if (time === "10:30 AM - 12:30 PM") {
      setBookingStatus("conflict");
      setBookingMessage("COLLISION DETECTED: Computing Lab 01 is booked for CS302.");
    } else {
      setBookingStatus("success");
      setBookingMessage(`SUCCESS: Reserved ${selectedRoom} for ${time}.`);
    }
  };

  const runConflictSolver = () => {
    setBookingStatus("resolving");
    setBookingMessage("RUNNING RESOLUTION ALGORITHM...");
    setTimeout(() => {
      setBookingStatus("resolved");
      setBookingMessage("SUGGESTION: Seminar Room 02 is vacant during this time.");
    }, 1200);
  };

  const confirmAlternative = () => {
    setSelectedRoom("Seminar Room 02");
    setBookingStatus("success");
    setBookingMessage("SUCCESS: Reserved Seminar Room 02 for 10:30 AM - 12:30 PM.");
  };

  const resetBookingSim = () => {
    setSelectedRoom("Computing Lab 01");
    setSelectedTimeSlot("");
    setBookingStatus("idle");
    setBookingMessage("");
  };

  const pipelineSteps = [
    { title: "1. Request Intake", desc: "User inputs booking parameters. Request passes client-side schema checks.", icon: <Plus className="w-5 h-5" /> },
    { title: "2. Database Index Lock", desc: "System queries DB with precise time block indexes for overlaps.", icon: <Search className="w-5 h-5" /> },
    { title: "3. Conflict Evaluation", desc: "Smart validation detects intersecting bookings based on hierarchy.", icon: <ShieldAlert className="w-5 h-5" /> },
    { title: "4. Confirmation", desc: "Provides alternative or automatically locks conflict-free slot.", icon: <CheckCircle2 className="w-5 h-5" /> }
  ];

  return (
    <div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-brand-primary selection:text-white">
      
      {/* ─── HERO SECTION ─── */}
      <section className="relative min-h-[92svh] flex items-center pt-24 pb-20 lg:pt-16 border-b-2 border-foreground">
        
        {/* Stark grid background overlay */}
        <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-10" 
             style={{ backgroundImage: "linear-gradient(var(--foreground) 1px, transparent 1px), linear-gradient(90deg, var(--foreground) 1px, transparent 1px)", backgroundSize: "40px 40px" }} />

        <div className="max-w-7xl mx-auto px-6 w-full relative z-10 grid lg:grid-cols-12 gap-12 xl:gap-16 items-center">
          
          {/* Hero Left Content */}
          <div className="lg:col-span-6 flex flex-col items-start text-left">
            <motion.div 
              initial={{ opacity: 0, y: 15 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.5 }}
              className="inline-flex items-center gap-2 border-2 border-foreground text-foreground text-xs sm:text-sm font-bold uppercase tracking-wider px-4 py-2 mb-8 bg-card shadow-[4px_4px_0_0_rgba(0,0,0,1)] dark:shadow-[4px_4px_0_0_rgba(255,255,255,0.2)]"
            >
              <span className="w-2 h-2 bg-brand-primary" />
              Production-Grade Portal
            </motion.div>

            <motion.h1 
              initial={{ opacity: 0, y: 25 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.1 }}
              className="text-5xl sm:text-6xl xl:text-7xl font-heading font-black uppercase leading-[0.9] tracking-tighter mb-6 text-foreground"
            >
              Unified Engine for<br />
              <span className="text-brand-primary">Campus Bookings</span>
            </motion.h1>

            <motion.p 
              initial={{ opacity: 0, y: 25 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-foreground/80 text-lg max-w-xl mb-10 leading-relaxed font-bold"
            >
              Optimize academic facility utilization, dispatch maintenance tickets, and eliminate collisions with our stark, reliable resource planner.
            </motion.p>

            <motion.div 
              initial={{ opacity: 0, y: 25 }} 
              animate={{ opacity: 1, y: 0 }} 
              transition={{ duration: 0.6, delay: 0.3 }}
              className="flex flex-col sm:flex-row gap-4 w-full sm:w-auto"
            >
              <Link
                href="/login"
                className="flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-white bg-brand-primary hover:bg-foreground transition-colors duration-0 border-2 border-transparent group"
              >
                Launch Console
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                href="/resources"
                className="flex items-center justify-center gap-2 px-8 py-4 text-sm font-bold uppercase tracking-wider text-foreground border-2 border-foreground hover:bg-foreground hover:text-background transition-colors duration-0 group bg-card"
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
              className="mt-12 pt-8 border-t-2 border-border w-full grid grid-cols-3 gap-4"
            >
              <div>
                <p className="text-3xl font-heading font-black text-foreground tracking-tighter">99.9%</p>
                <p className="text-[10px] uppercase font-bold text-foreground/60 tracking-wider">Uptime SLA</p>
              </div>
              <div>
                <p className="text-3xl font-heading font-black text-foreground tracking-tighter">0s</p>
                <p className="text-[10px] uppercase font-bold text-foreground/60 tracking-wider">Collision Risk</p>
              </div>
              <div>
                <p className="text-3xl font-heading font-black text-foreground tracking-tighter">4</p>
                <p className="text-[10px] uppercase font-bold text-foreground/60 tracking-wider">Depts Sync</p>
              </div>
            </motion.div>
          </div>

          {/* Hero Right: Interactive Dashboard Simulator */}
          <div className="lg:col-span-6 relative w-full flex items-center justify-center">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="w-full max-w-[540px] bg-card border-2 border-foreground flex flex-col relative shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.2)]"
            >
              {/* Simulator Header Bar */}
              <div className="bg-foreground text-background px-4 py-3 flex items-center justify-between border-b-2 border-foreground">
                <div className="flex items-center gap-3">
                  <div className="flex gap-1.5">
                    <span className="w-3 h-3 bg-white/20" />
                    <span className="w-3 h-3 bg-white/20" />
                    <span className="w-3 h-3 bg-white/20" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-widest">
                    URMS Core v1.2
                  </span>
                </div>
                <div className="flex items-center gap-2 bg-brand-primary text-white px-2 py-0.5 text-[9px] font-bold tracking-widest uppercase">
                  LIVE
                </div>
              </div>

              {/* Simulator Navigation Tabs */}
              <div className="flex border-b-2 border-border bg-background">
                {(["availability", "booking", "analytics"] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => { setSimTab(tab); resetBookingSim(); }}
                    className={`px-4 py-3 text-xs font-bold uppercase tracking-wider relative transition-colors border-r-2 border-border ${
                      simTab === tab 
                        ? "bg-foreground text-background" 
                        : "text-foreground hover:bg-card"
                    }`}
                  >
                    {tab}
                  </button>
                ))}
                
                <div className="ml-auto self-center px-4 text-[10px] font-mono text-foreground font-bold hidden sm:block" suppressHydrationWarning>
                  {mounted ? currentTime : "12:00:00"}
                </div>
              </div>

              {/* Simulator Content Panel */}
              <div className="p-5 min-h-[310px] flex flex-col justify-between bg-background">
                <AnimatePresence mode="wait">
                  {simTab === "availability" && (
                    <motion.div
                      key="availability"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-3 w-full"
                    >
                      <div className="flex items-center justify-between mb-2 pb-2 border-b-2 border-border">
                        <span className="text-[10px] font-bold uppercase text-foreground/60 tracking-wider">Resource Name</span>
                        <span className="text-[10px] font-bold uppercase text-foreground/60 tracking-wider">Status / Util</span>
                      </div>
                      
                      {mockSpaces.map((room) => (
                        <div key={room.id} className="p-3 bg-card border-2 border-transparent hover:border-foreground transition-all duration-0 flex items-center justify-between">
                          <div>
                            <p className="text-xs font-bold uppercase text-foreground tracking-wide">{room.name}</p>
                            <p className="text-[10px] text-foreground/60 font-bold uppercase tracking-wider mt-0.5">{room.detail}</p>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1.5">
                            <span className={`text-[9px] px-2 py-0.5 font-bold uppercase border-2 ${room.color}`}>
                              {room.status}
                            </span>
                            {room.status !== "Maintenance" && (
                              <div className="flex items-center gap-1.5">
                                <span className="text-[9px] text-foreground font-bold">{room.capacity}</span>
                                <div className="w-12 bg-border h-1.5 overflow-hidden">
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
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-4 w-full flex flex-col"
                    >
                      <div>
                        <span className="text-[10px] font-bold uppercase text-foreground/80 tracking-wider block mb-2">1. Choose Resource</span>
                        <div className="grid grid-cols-3 gap-2">
                          {["Computing Lab 01", "Lecture Theatre B", "Seminar Room 02"].map((name) => (
                            <button
                              key={name}
                              onClick={() => { setSelectedRoom(name); setBookingStatus("idle"); setSelectedTimeSlot(""); }}
                              className={`py-2 text-[9px] font-bold uppercase tracking-wider border-2 transition-all duration-0 ${
                                selectedRoom === name
                                  ? "border-foreground bg-foreground text-background"
                                  : "border-border hover:border-foreground text-foreground bg-card"
                              }`}
                            >
                              {name.replace("Computing ", "").replace("Lecture ", "")}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div>
                        <span className="text-[10px] font-bold uppercase text-foreground/80 tracking-wider block mb-2">2. Target Time Slot</span>
                        <div className="grid grid-cols-2 gap-2">
                          <button
                            onClick={() => handleSlotSelect("08:30 AM - 10:30 AM")}
                            className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider border-2 flex justify-between items-center transition-all duration-0 ${
                              selectedTimeSlot === "08:30 AM - 10:30 AM"
                                ? "border-foreground bg-foreground text-background"
                                : "border-border hover:border-foreground text-foreground bg-card"
                            }`}
                          >
                            <span>08:30 - 10:30</span>
                            <span className="text-[9px] text-brand-success font-black border-b border-brand-success">VACANT</span>
                          </button>
                          <button
                            onClick={() => handleSlotSelect("10:30 AM - 12:30 PM")}
                            className={`py-2 px-3 text-[10px] font-bold uppercase tracking-wider border-2 flex justify-between items-center transition-all duration-0 ${
                              selectedTimeSlot === "10:30 AM - 12:30 PM"
                                ? "border-brand-primary bg-brand-primary text-white"
                                : "border-border hover:border-foreground text-foreground bg-card"
                            }`}
                          >
                            <span>10:30 - 12:30</span>
                            <span className="text-[9px] text-brand-primary font-black border-b border-brand-primary">COLLISION</span>
                          </button>
                        </div>
                      </div>

                      <div className="flex-1 min-h-[90px] border-2 border-foreground p-3 flex flex-col justify-center bg-card">
                        {bookingStatus === "idle" && (
                          <p className="text-[10px] font-bold text-foreground/50 text-center uppercase tracking-wider">
                            Select a time slot to run simulation
                          </p>
                        )}

                        {bookingStatus === "conflict" && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-wider flex items-start gap-1.5 leading-snug">
                              <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {bookingMessage}
                            </p>
                            <button
                              onClick={runConflictSolver}
                              className="w-full py-2 text-[10px] font-bold uppercase tracking-wider bg-foreground text-background hover:bg-brand-primary hover:text-white transition-colors duration-0 flex items-center justify-center gap-2"
                            >
                              <RefreshCw className="w-3.5 h-3.5" /> Run Resolver
                            </button>
                          </div>
                        )}

                        {bookingStatus === "resolving" && (
                          <div className="flex flex-col items-center justify-center gap-2">
                            <RefreshCw className="w-5 h-5 animate-spin text-brand-primary" />
                            <p className="text-[10px] font-bold text-brand-primary uppercase tracking-widest">{bookingMessage}</p>
                          </div>
                        )}

                        {bookingStatus === "resolved" && (
                          <div className="space-y-3">
                            <p className="text-[10px] font-bold text-brand-warning uppercase tracking-wider flex items-start gap-1.5 leading-snug">
                              <HelpCircle className="w-3.5 h-3.5 shrink-0" /> {bookingMessage}
                            </p>
                            <div className="flex gap-2">
                              <button
                                onClick={confirmAlternative}
                                className="flex-1 py-2 text-[10px] font-bold uppercase bg-brand-success text-white hover:bg-foreground transition-colors duration-0"
                              >
                                Accept alternate
                              </button>
                              <button
                                onClick={resetBookingSim}
                                className="py-2 px-3 text-[10px] font-bold uppercase border-2 border-foreground text-foreground hover:bg-foreground hover:text-background transition-colors duration-0 bg-background"
                              >
                                Cancel
                              </button>
                            </div>
                          </div>
                        )}

                        {bookingStatus === "success" && (
                          <div className="text-center space-y-3">
                            <p className="text-[10px] font-bold uppercase tracking-wider text-brand-success leading-snug">
                              {bookingMessage}
                            </p>
                            <button
                              onClick={resetBookingSim}
                              className="inline-flex items-center gap-1 px-4 py-2 text-[9px] font-bold uppercase tracking-widest border-2 border-brand-success text-brand-success hover:bg-brand-success hover:text-white transition-colors duration-0 bg-background"
                            >
                              Reset
                            </button>
                          </div>
                        )}
                      </div>
                    </motion.div>
                  )}

                  {simTab === "analytics" && (
                    <motion.div
                      key="analytics"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="space-y-5 w-full"
                    >
                      <div className="grid grid-cols-3 gap-2">
                        <div className="bg-card p-3 border-2 border-foreground text-center">
                          <p className="text-[9px] text-foreground/60 font-bold uppercase tracking-wider">Util Rate</p>
                          <p className="text-lg font-heading font-black mt-1 text-foreground">84.6%</p>
                        </div>
                        <div className="bg-card p-3 border-2 border-foreground text-center">
                          <p className="text-[9px] text-foreground/60 font-bold uppercase tracking-wider">Bookings</p>
                          <p className="text-lg font-heading font-black mt-1 text-foreground">342</p>
                        </div>
                        <div className="bg-card p-3 border-2 border-brand-primary text-center">
                          <p className="text-[9px] text-brand-primary font-bold uppercase tracking-wider">Collisions</p>
                          <p className="text-lg font-heading font-black mt-1 text-brand-primary">47 Blocked</p>
                        </div>
                      </div>

                      <div className="space-y-3">
                        <p className="text-[10px] font-bold uppercase text-foreground/80 tracking-wider border-b-2 border-border pb-1">Faculty Usage</p>
                        
                        <div className="space-y-2.5">
                          <div>
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-foreground mb-1">
                              <span>Computing & IS</span>
                              <span>92%</span>
                            </div>
                            <div className="w-full bg-border h-2 overflow-hidden">
                              <div className="bg-foreground h-full" style={{ width: "92%" }} />
                            </div>
                          </div>
                          <div>
                            <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-foreground mb-1">
                              <span>Applied Sciences</span>
                              <span>76%</span>
                            </div>
                            <div className="w-full bg-border h-2 overflow-hidden">
                              <div className="bg-foreground h-full" style={{ width: "76%" }} />
                            </div>
                          </div>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Simulator Action Footer */}
              <div className="bg-card px-5 py-3 border-t-2 border-foreground flex items-center justify-between text-[9px] font-bold uppercase tracking-widest text-foreground">
                <span>Index: Locked</span>
                <span className="text-brand-primary flex items-center gap-1">
                  <span className="w-1.5 h-1.5 bg-brand-primary" />
                  RLS Active
                </span>
              </div>
            </motion.div>
          </div>

        </div>
      </section>

      {/* ─── INTERACTIVE ROLE HUB ─── */}
      <section className="py-24 relative z-20 bg-background border-b-2 border-foreground">
        <div className="max-w-7xl mx-auto px-6">
          
          <div className="text-center max-w-2xl mx-auto mb-16 border-2 border-foreground p-8 bg-card shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.2)]">
            <h2 className="text-3xl sm:text-4xl font-heading font-black text-foreground uppercase tracking-tighter">
              One DB.<br/>Three Workspaces.
            </h2>
            <p className="text-foreground/80 text-sm font-bold mt-4 uppercase tracking-wider leading-relaxed">
              Strict RBAC separation serving role-specific features.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8 items-stretch">
            <div className="lg:col-span-5 flex flex-col gap-4">
              {(["student", "lecturer", "admin"] as const).map((role) => (
                <button
                  key={role}
                  onClick={() => setActiveRole(role)}
                  className={`p-5 text-left border-2 transition-all duration-0 flex items-center gap-4 ${
                    activeRole === role
                      ? "border-foreground bg-foreground text-background"
                      : "border-border hover:border-foreground bg-card text-foreground"
                  }`}
                >
                  <div className={`w-10 h-10 flex items-center justify-center border-2 ${
                    activeRole === role ? "border-background" : "border-foreground"
                  }`}>
                    {role === "student" && <Users className="w-5 h-5" />}
                    {role === "lecturer" && <Laptop className="w-5 h-5" />}
                    {role === "admin" && <ShieldCheck className="w-5 h-5" />}
                  </div>
                  <div>
                    <p className="text-sm font-bold uppercase tracking-wider">{role === "admin" ? "Ops Admin" : role}</p>
                  </div>
                </button>
              ))}
            </div>

            <div className="lg:col-span-7 h-full">
              <div className="bg-card border-2 border-foreground p-6 shadow-[8px_8px_0_0_rgba(0,0,0,1)] dark:shadow-[8px_8px_0_0_rgba(255,255,255,0.2)] h-full flex flex-col">
                <div className="flex justify-between items-center pb-4 border-b-2 border-foreground">
                  <span className="text-xs font-bold uppercase tracking-wider flex items-center gap-2 text-brand-primary">
                    <span className="w-2 h-2 bg-brand-primary" /> Active Session: {activeRole}
                  </span>
                  <span className="text-[10px] font-mono text-foreground font-bold">OK</span>
                </div>
                <div className="flex-1 py-8 flex flex-col justify-center text-sm font-bold text-foreground leading-relaxed uppercase tracking-wide">
                  {activeRole === "student" && "Students view approved rooms and track check-in barcodes."}
                  {activeRole === "lecturer" && "Lecturers bypass standard reservations and lock classrooms recursively."}
                  {activeRole === "admin" && "Admins monitor security controls and access the ticket system."}
                </div>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* ─── DYNAMIC CONFLICT PIPELINE ─── */}
      <section className="py-24 relative z-20 bg-card">
        <div className="max-w-7xl mx-auto px-6">
          <h2 className="text-3xl font-heading font-black text-foreground uppercase tracking-tighter mb-12 text-center">
            Scheduling Engine
          </h2>
          <div className="grid md:grid-cols-4 gap-6">
            {pipelineSteps.map((step, idx) => (
              <div key={idx} className="p-6 border-2 border-foreground bg-background hover:bg-foreground hover:text-background transition-colors duration-0 group flex flex-col">
                <div className="w-10 h-10 border-2 border-current flex items-center justify-center mb-4">
                  {step.icon}
                </div>
                <h3 className="text-sm font-bold uppercase tracking-wider mb-2">{step.title}</h3>
                <p className="text-xs font-bold opacity-80 leading-relaxed mt-auto">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}