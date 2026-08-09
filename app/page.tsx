"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import Footer from "@/components/Footer";
import {
  ArrowRight,
  Calendar,
  Clock,
  Users,
  GraduationCap,
  ShieldCheck,
  Building2,
  Sparkles,
  AlertTriangle,
  RefreshCw,
  CheckCircle2,
  Search,
  Check,
  ChevronRight,
  Send,
  HelpCircle,
  Mail,
  MapPin,
  Phone,
  Layers,
  Activity,
  UserCheck,
} from "lucide-react";

/* ────────────────────────────────────────────────────────────────────────
   URMS LIGHT BLUE DESIGN SYSTEM
   bg-base     : #F8FAFC (Slate 50)
   surface     : #FFFFFF
   border      : #E2E8F0 (Slate 200)
   primary     : #0EA5E9 (Sky 500)
   primary-dark: #0284C7 (Sky 600)
   teal        : #0D9488 (Teal 600 - Main Accent)
   teal-light  : #CCFBF1 (Teal 100)
   ink-main    : #0F172A (Slate 900)
   ink-muted   : #64748B (Slate 500)
   ──────────────────────────────────────────────────────────────────────── */

const ROOM_FACULTIES = [
  {
    id: "computing",
    title: "Computing & IT Lab 01",
    type: "Computer Lab",
    capacity: "60 Seats",
    status: "Available",
    badge: "Interactive Workstations",
    image: "https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "engineering",
    title: "Main Auditorium Hall A",
    type: "Auditorium",
    capacity: "350 Seats",
    status: "Available",
    badge: "AV System Synced",
    image: "https://images.unsplash.com/photo-1541829070764-84a7d30dd3f3?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "science",
    title: "Advanced Physics Lab",
    type: "Specialised Science Lab",
    capacity: "40 Seats",
    status: "Reserved",
    badge: "Safety Verification",
    image: "https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=80",
  },
  {
    id: "management",
    title: "Executive Seminar Room 02",
    type: "Conference Room",
    capacity: "80 Seats",
    status: "Available",
    badge: "Hybrid Video Stream",
    image: "https://images.unsplash.com/photo-1431540015161-0bf868a2d407?auto=format&fit=crop&w=800&q=80",
  },
];

const SERVICES = [
  {
    icon: Calendar,
    title: "Smart Room Booking",
    desc: "Reserve lecture halls, computing labs, and seminar spaces in real time with zero overlapping schedules.",
  },
  {
    icon: AlertTriangle,
    title: "Conflict Resolver",
    desc: "Automated engine flags double-bookings instantly and proposes tier-equivalent alternative spaces.",
  },
  {
    icon: UserCheck,
    title: "QR Pass Check-in",
    desc: "Digital scannable passes generated on confirmation to verify attendance and monitor room utilization.",
  },
  {
    icon: Layers,
    title: "Equipment & AV Lock",
    desc: "Request projectors, audio systems, and specialised hardware alongside room reservations.",
  },
];

const ROLES_DATA = [
  {
    id: "student",
    title: "Students",
    icon: GraduationCap,
    desc: "Browse live campus catalog, hold study group spaces, track waitlists, and check in via scannable QR pass.",
    stats: [
      { n: "128", l: "Credits Tracked" },
      { n: "6", l: "Active Holds" },
      { n: "100%", l: "Verified Access" },
    ],
    features: ["Browse Live Catalog", "Self-Service Reservations", "Mobile QR Pass Access"],
  },
  {
    id: "lecturer",
    title: "Lecturers & Faculty",
    icon: Users,
    desc: "Skip queue approvals for term-long recurring lectures, reserve specialized labs, and view attendance trends.",
    stats: [
      { n: "14", l: "Course Sections" },
      { n: "240", l: "Enrolled Students" },
      { n: "Priority", l: "Queue Level" },
    ],
    features: ["Recurring Section Lock", "Priority Override", "Lab Hardware Tracking"],
  },
  {
    id: "admin",
    title: "Operations Admin",
    icon: ShieldCheck,
    desc: "Complete operational visibility over campus facilities, manual conflict overrides, and automated maintenance routing.",
    stats: [
      { n: "482", l: "Total Rooms" },
      { n: "0.2s", l: "Sync Speed" },
      { n: "Full", l: "Audit Controls" },
    ],
    features: ["Campus Real-Time Audit", "Manual Schedule Override", "Maintenance Ticketing"],
  },
];

const PROCESS_STEPS = [
  {
    step: "01",
    title: "Search & Select",
    desc: "Filter campus spaces by capacity, faculty block, or specific AV equipment needed.",
  },
  {
    step: "02",
    title: "Real-Time Index Lock",
    desc: "The core engine locks your chosen time index down to the exact minute to stop race conditions.",
  },
  {
    step: "03",
    title: "Automated Verification",
    desc: "System cross-checks role permissions and flags any schedule overlap across all departments.",
  },
  {
    step: "04",
    title: "Instant QR Pass Issued",
    desc: "Your booking is confirmed with a digital access pass ready for door check-in.",
  },
];

const PRICING_TIERS = [
  {
    name: "Standard Student",
    price: "Free",
    period: "Campus Identity Login",
    desc: "For general student study groups and society meetings.",
    features: ["Up to 3 active bookings", "2-hour max block duration", "Standard room catalog", "Basic QR check-in"],
    popular: false,
    cta: "Access Student Portal",
  },
  {
    name: "Faculty & Staff",
    price: "Academic",
    period: "Department Authorized",
    desc: "For course lecturers, tutors, and faculty research labs.",
    features: [
      "Recurring term reservations",
      "Full semester block lock",
      "Specialised lab equipment",
      "Priority collision override",
      "Auditorium access",
    ],
    popular: true,
    cta: "Launch Staff Console",
  },
  {
    name: "Campus Operations",
    price: "Enterprise",
    period: "Full System Audit",
    desc: "For university administration and estate management.",
    features: [
      "Real-time building heatmap",
      "Maintenance workflow routing",
      "Global conflict engine",
      "Unlimited system overrides",
      "Complete API integrations",
    ],
    popular: false,
    cta: "Manage System",
  },
];

export default function LandingPage() {
  const [activeRole, setActiveRole] = useState("student");
  const [inquirySubmitted, setInquirySubmitted] = useState(false);

  const selectedRoleInfo = ROLES_DATA.find((r) => r.id === activeRole) || ROLES_DATA[0];

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#0F172A] font-sans antialiased selection:bg-[#0EA5E9] selection:text-white">
      
      {/* ── HERO SECTION ── */}
      <section className="relative overflow-hidden pt-12 pb-20 lg:pt-20 lg:pb-28">
        {/* Soft Background Accent Graphics */}
        <div className="pointer-events-none absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -top-24 right-0 h-[500px] w-[500px] rounded-full bg-gradient-to-bl from-[#0EA5E9]/10 via-[#0D9488]/10 to-transparent blur-3xl" />
          <div className="absolute top-1/2 -left-24 h-[400px] w-[400px] rounded-full bg-sky-100/60 blur-3xl" />
        </div>

        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12 lg:gap-8">
            {/* Hero Left Content */}
            <div className="lg:col-span-6">
              <div>
                
              </div>

              <h1 className="text-4xl font-extrabold tracking-tight text-[#0F172A] sm:text-5xl lg:text-6xl lg:leading-[1.12]">
                Campus Spaces <br />
                Scheduled Without <br />
                <span className="bg-gradient-to-r from-[#0EA5E9] to-[#0D9488] bg-clip-text text-transparent">
                  A Single Collision.
                </span>
              </h1>

              <p className="mt-5 max-w-xl text-base text-slate-600 leading-relaxed sm:text-lg">
                One centralized index for every lecture hall, computing laboratory, and seminar space on campus.
                Booked, verified, and audited in real-time.
              </p>

              {/* Action Group */}
              <div className="mt-8 flex flex-wrap items-center gap-4">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0D9488] px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-[#0D9488]/20 transition-all hover:bg-[#0F766E] hover:-translate-y-0.5"
                >
                  <span>Explore Live Catalog</span>
                  <ArrowRight className="h-4 w-4" />
                </Link>

                <a
                  href="#process"
                  className="inline-flex items-center gap-2 rounded-full border border-slate-300 bg-white px-6 py-3.5 text-sm font-semibold text-slate-700 shadow-sm transition-colors hover:border-slate-400 hover:bg-slate-50"
                >
                  <span>How It Works</span>
                </a>
              </div>

              {/* Social Proof / Stats Bar */}
              <div className="mt-10 flex items-center gap-6 border-t border-slate-200/80 pt-6">
                <div className="flex -space-x-2 overflow-hidden">
                  <div className="inline-block h-9 w-9 rounded-full bg-sky-500 ring-2 ring-white text-white font-bold text-xs flex items-center justify-center">
                    CS
                  </div>
                  <div className="inline-block h-9 w-9 rounded-full bg-teal-500 ring-2 ring-white text-white font-bold text-xs flex items-center justify-center">
                    ENG
                  </div>
                  <div className="inline-block h-9 w-9 rounded-full bg-slate-700 ring-2 ring-white text-white font-bold text-xs flex items-center justify-center">
                    SCI
                  </div>
                </div>
                <div>
                  <p className="text-sm font-bold text-[#0F172A]">480+ Campus Spaces</p>
                  <p className="text-xs font-medium text-slate-500">Synced across all faculties daily</p>
                </div>
              </div>
            </div>

            {/* Hero Right Visual Showcase */}
            <div className="relative lg:col-span-6">
              <div className="relative mx-auto max-w-md rounded-3xl border border-slate-200 bg-white p-4 shadow-2xl shadow-slate-200/60 sm:max-w-none">
                {/* Visual Image Header */}
                <div className="relative h-64 overflow-hidden rounded-2xl sm:h-80">
                  <img
                    src="https://images.unsplash.com/photo-1523240795612-9a054b0db644?auto=format&fit=crop&w=1200&q=80"
                    alt="University Campus Facilities"
                    className="h-full w-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/60 via-transparent to-transparent" />
                  <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between text-white">
                    <div>
                      <p className="text-xs font-semibold text-sky-300">Central Computing Building</p>
                      <p className="text-lg font-bold">Main Resource Control</p>
                    </div>
                    <span className="rounded-full bg-[#0D9488] px-3 py-1 text-xs font-bold uppercase tracking-wider text-white">
                      Live
                    </span>
                  </div>
                </div>

                {/* Floating Metric Badges */}
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <div className="rounded-xl bg-sky-50/80 p-3.5 border border-sky-100">
                    <div className="flex items-center gap-2 text-sky-700">
                      <Clock className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Sync Speed</span>
                    </div>
                    <p className="mt-1 text-xl font-extrabold text-[#0F172A]">0.2s</p>
                    <p className="text-[11px] text-slate-500">Instant collision detection</p>
                  </div>

                  <div className="rounded-xl bg-teal-50/80 p-3.5 border border-teal-100">
                    <div className="flex items-center gap-2 text-teal-700">
                      <CheckCircle2 className="h-4 w-4" />
                      <span className="text-xs font-bold uppercase tracking-wide">Weekly Load</span>
                    </div>
                    <p className="mt-1 text-xl font-extrabold text-[#0F172A]">98.4%</p>
                    <p className="text-[11px] text-slate-500">Zero double-bookings</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── FEATURED ROOM CATALOG ── */}
      <section id="catalog" className="bg-white py-16 border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end mb-10">
            <div>
              <p className="text-xs font-bold uppercase tracking-wider text-[#0EA5E9]">Active Facilities</p>
              <h2 className="mt-1 text-2xl font-bold text-[#0F172A] sm:text-3xl">Featured Campus Spaces</h2>
            </div>
            <Link
              href="/login"
              className="inline-flex items-center gap-1.5 text-xs font-bold text-[#0D9488] hover:text-[#0F766E]"
            >
              <span>View Full Catalog</span>
              <ChevronRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {ROOM_FACULTIES.map((room) => (
              <div
                key={room.id}
                className="group flex flex-col justify-between overflow-hidden rounded-2xl border border-slate-200 bg-white transition-all hover:border-sky-300 hover:shadow-lg hover:shadow-sky-100"
              >
                <div>
                  <div className="relative h-44 overflow-hidden">
                    <img
                      src={room.image}
                      alt={room.title}
                      className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                    />
                    <span className="absolute top-3 right-3 rounded-full bg-white/90 backdrop-blur-sm px-2.5 py-1 text-[10px] font-bold text-slate-700 shadow-sm">
                      {room.badge}
                    </span>
                  </div>
                  <div className="p-4">
                    <p className="text-xs font-semibold text-[#0EA5E9]">{room.type}</p>
                    <h3 className="mt-1 text-base font-bold text-[#0F172A]">{room.title}</h3>
                    <p className="mt-1 text-xs text-slate-500">{room.capacity}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 bg-slate-50/50">
                  <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-700">
                    <span className="h-2 w-2 rounded-full bg-teal-500" />
                    {room.status}
                  </span>
                  <Link
                    href="/login"
                    className="rounded-lg bg-white border border-slate-200 px-3 py-1.5 text-xs font-semibold text-slate-700 transition-colors hover:border-sky-400 hover:text-[#0EA5E9]"
                  >
                    Hold Room
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SERVICES SECTION ── */}
      <section id="services" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-12 lg:grid-cols-12">
            {/* Left Header */}
            <div className="lg:col-span-5">
              <p className="text-xs font-bold uppercase tracking-wider text-[#0EA5E9]">System Capabilities</p>
              <h2 className="mt-2 text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
                Services Offered By URMS Index
              </h2>
              <p className="mt-4 text-sm leading-relaxed text-slate-600">
                Designed to handle high-density university scheduling requests while strictly eliminating administrative delays and double-booking errors.
              </p>
              <div className="mt-6">
                <Link
                  href="/login"
                  className="inline-flex items-center gap-2 rounded-full bg-[#0EA5E9] px-5 py-2.5 text-xs font-bold text-white shadow-md shadow-sky-200 transition-all hover:bg-sky-600"
                >
                  <span>Request Custom Access</span>
                  <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
            </div>

            {/* Right Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:col-span-7">
              {SERVICES.map((srv, idx) => {
                const Icon = srv.icon;
                return (
                  <div
                    key={idx}
                    className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition-all hover:border-teal-200 hover:shadow-md"
                  >
                    <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-teal-50 text-[#0D9488]">
                      <Icon className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 text-base font-bold text-[#0F172A]">{srv.title}</h3>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-600">{srv.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* ── ROLE WORKSPACES (TABBED HUB) ── */}
      <section id="workspaces" className="bg-slate-100/70 py-20 border-y border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0EA5E9]">Role Architecture</p>
            <h2 className="mt-1 text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
              One Engine, Tailored Workspaces
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Granular access control ensuring each campus member interacts with the exact features required for their responsibility level.
            </p>
          </div>

          {/* Role Navigation Tabs */}
          <div className="flex justify-center gap-2 mb-8">
            {ROLES_DATA.map((role) => {
              const Icon = role.icon;
              const isActive = activeRole === role.id;
              return (
                <button
                  key={role.id}
                  onClick={() => setActiveRole(role.id)}
                  className={`flex items-center gap-2 rounded-full px-5 py-2.5 text-xs font-bold transition-all ${
                    isActive
                      ? "bg-[#0D9488] text-white shadow-md shadow-teal-200"
                      : "bg-white text-slate-600 hover:bg-slate-200/60"
                  }`}
                >
                  <Icon className="h-4 w-4" />
                  <span>{role.title}</span>
                </button>
              );
            })}
          </div>

          {/* Selected Role Display Card */}
          <div className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-xl sm:p-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between border-b border-slate-100 pb-6">
              <div>
                <span className="text-xs font-bold uppercase tracking-wider text-[#0EA5E9]">Role Profile</span>
                <h3 className="text-2xl font-bold text-[#0F172A]">{selectedRoleInfo.title} Workspace</h3>
                <p className="mt-2 text-sm text-slate-600 max-w-xl">{selectedRoleInfo.desc}</p>
              </div>

              <div className="flex items-center gap-2">
                {selectedRoleInfo.stats.map((s, idx) => (
                  <div key={idx} className="rounded-xl bg-slate-50 p-3 text-center border border-slate-100 min-w-[100px]">
                    <p className="text-base font-bold text-[#0F172A]">{s.n}</p>
                    <p className="text-[10px] font-semibold text-slate-400 uppercase">{s.l}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="mt-6">
              <p className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-3">Key Role Capabilities</p>
              <div className="grid gap-3 sm:grid-cols-3">
                {selectedRoleInfo.features.map((feat, idx) => (
                  <div key={idx} className="flex items-center gap-2 rounded-xl bg-sky-50/60 p-3 text-xs font-semibold text-sky-900 border border-sky-100">
                    <Check className="h-4 w-4 text-[#0EA5E9] shrink-0" />
                    <span>{feat}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── PROCESS SECTION ── */}
      <section id="process" className="py-20">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0EA5E9]">System Mechanics</p>
            <h2 className="mt-1 text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
              Our Design Process & Workflow
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Four structured checkpoints behind every single reservation on campus.
            </p>
          </div>

          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {PROCESS_STEPS.map((step, idx) => (
              <div key={idx} className="relative rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <span className="text-3xl font-extrabold text-sky-200">{step.step}</span>
                <h3 className="mt-3 text-base font-bold text-[#0F172A]">{step.title}</h3>
                <p className="mt-2 text-xs leading-relaxed text-slate-600">{step.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── ACCESS TIERS / PRICING ── */}
      <section id="tiers" className="bg-slate-50 py-20 border-t border-slate-200/80">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <p className="text-xs font-bold uppercase tracking-wider text-[#0EA5E9]">Clear Allocations</p>
            <h2 className="mt-1 text-3xl font-extrabold text-[#0F172A] sm:text-4xl">
              Campus Access Levels
            </h2>
            <p className="mt-3 text-sm text-slate-600">
              Structured reservation quotas designed for balanced resource distribution.
            </p>
          </div>

          <div className="grid gap-8 lg:grid-cols-3 lg:items-center">
            {PRICING_TIERS.map((tier, idx) => (
              <div
                key={idx}
                className={`relative flex flex-col justify-between rounded-3xl border p-8 bg-white transition-all ${
                  tier.popular
                    ? "border-[#0D9488] shadow-xl ring-2 ring-[#0D9488]/20 lg:-translate-y-2"
                    : "border-slate-200 shadow-sm"
                }`}
              >
                {tier.popular && (
                  <span className="absolute -top-3.5 left-1/2 -translate-x-1/2 rounded-full bg-[#0D9488] px-4 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
                    Most Popular
                  </span>
                )}

                <div>
                  <h3 className="text-lg font-bold text-[#0F172A]">{tier.name}</h3>
                  <p className="mt-1 text-xs text-slate-500">{tier.desc}</p>

                  <div className="mt-6 flex items-baseline gap-1">
                    <span className="text-3xl font-extrabold text-[#0F172A]">{tier.price}</span>
                    <span className="text-xs text-slate-400">/ {tier.period}</span>
                  </div>

                  <ul className="mt-8 space-y-3 border-t border-slate-100 pt-6">
                    {tier.features.map((feat, fIdx) => (
                      <li key={fIdx} className="flex items-center gap-2.5 text-xs text-slate-600">
                        <Check className="h-4 w-4 text-[#0D9488] shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link
                    href="/login"
                    className={`block w-full rounded-full py-3 text-center text-xs font-bold transition-all ${
                      tier.popular
                        ? "bg-[#0D9488] text-white shadow-md shadow-teal-200 hover:bg-[#0F766E]"
                        : "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50"
                    }`}
                  >
                    {tier.cta}
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── INQUIRY & CONTACT SECTION ── */}
      <section className="py-20 bg-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 to-slate-800 p-8 text-white shadow-2xl sm:p-12">
            <div className="grid gap-10 lg:grid-cols-12 lg:items-center">
              {/* Contact Info */}
              <div className="lg:col-span-5">
                <p className="text-xs font-bold uppercase tracking-wider text-sky-400">Direct Support</p>
                <h2 color="white" className="mt-2 text-3xl font-extrabold tracking-tight sm:text-4xl">
                  Let's Build Something Great Together
                </h2>
                <p className="mt-4 text-sm text-slate-300 leading-relaxed">
                  Have questions regarding faculty resource integration, custom lab setups, or system access? Reach out to the IT administration team.
                </p>

                <div className="mt-8 space-y-4 text-xs font-medium text-slate-300">
                  <div className="flex items-center gap-3">
                    <Mail className="h-4 w-4 text-[#0EA5E9]" />
                    <span>support@urms.edu.lk</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-4 w-4 text-[#0EA5E9]" />
                    <span>+94 (0) 45 228 0000</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-4 w-4 text-[#0EA5E9]" />
                    <span>Faculty of Computing, Campus Administration</span>
                  </div>
                </div>
              </div>

              {/* Inquiry Form */}
              <div className="rounded-2xl bg-white/10 p-6 backdrop-blur-md border border-white/10 lg:col-span-7">
                {inquirySubmitted ? (
                  <div className="py-8 text-center">
                    <CheckCircle2 className="mx-auto h-12 w-12 text-teal-400" />
                    <h3 className="mt-3 text-lg font-bold">Inquiry Sent Successfully</h3>
                    <p className="mt-1 text-xs text-slate-300">
                      Our IT resource coordinator will respond within 24 hours.
                    </p>
                  </div>
                ) : (
                  <form
                    onSubmit={(e) => {
                      e.preventDefault();
                      setInquirySubmitted(true);
                    }}
                    className="space-y-4"
                  >
                    <div className="grid gap-4 sm:grid-cols-2">
                      <input
                        type="text"
                        required
                        placeholder="Your Name"
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                      />
                      <input
                        type="email"
                        required
                        placeholder="University Email"
                        className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                      />
                    </div>
                    <select className="w-full rounded-xl border border-white/20 bg-slate-800 px-4 py-3 text-xs text-white focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]">
                      <option>General Resource Query</option>
                      <option>Faculty Schedule Integration</option>
                      <option>Lab Equipment Request</option>
                    </select>
                    <textarea
                      rows={3}
                      required
                      placeholder="Your Message..."
                      className="w-full rounded-xl border border-white/20 bg-white/10 px-4 py-3 text-xs text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0EA5E9]"
                    />
                    <button
                      type="submit"
                      className="w-full rounded-xl bg-[#0D9488] py-3 text-xs font-bold text-white transition-all hover:bg-[#0F766E]"
                    >
                      Send Message
                    </button>
                  </form>
                )}
              </div>
            </div>
          </div>
        </div>
      </section>

      

    </div>
  );
}