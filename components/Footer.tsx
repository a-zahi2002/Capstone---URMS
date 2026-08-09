import Link from "next/link";
import {
    Building2,
    Mail,
    Phone,
    MapPin,
    ArrowRight,
    Github,
    Twitter,
    Linkedin,
} from "lucide-react";

/*
 * URMS LIGHT BLUE DESIGN SYSTEM
 * bg-base      : #F8FAFC
 * surface      : #FFFFFF
 * border       : #E2E8F0
 * primary      : #0EA5E9  (Sky 500)
 * primary-dark : #0284C7  (Sky 600)
 * teal         : #0D9488  (Teal 600)
 * teal-light   : #CCFBF1  (Teal 100)
 * ink-main     : #0F172A  (Slate 900)
 * ink-muted    : #64748B  (Slate 500)
 */

const FOOTER_LINKS = {
    Platform: [
        { name: "Browse Resources",   href: "/resources"     },
        { name: "Book a Space",       href: "/bookings"      },
        { name: "Explore Campus",     href: "/explore"       },
        { name: "Notifications",      href: "/notifications" },
    ],
    Portals: [
        { name: "Student Hub",        href: "/login" },
        { name: "Faculty Console",    href: "/login" },
        { name: "Operations Admin",   href: "/login" },
        { name: "Maintenance Centre", href: "/login" },
    ],
    Support: [
        { name: "Getting Started",    href: "#"        },
        { name: "Booking Guide",      href: "#"        },
        { name: "FAQ",                href: "#"        },
        { name: "Contact IT Support", href: "#contact" },
    ],
};

const SOCIAL_LINKS = [
    { icon: Github,   href: "#", label: "GitHub"   },
    { icon: Twitter,  href: "#", label: "Twitter"  },
    { icon: Linkedin, href: "#", label: "LinkedIn" },
];

export default function Footer() {
    return (
        <footer className="bg-[#0F172A] text-white">

            {/* ── Top CTA Strip ── */}
            <div className="border-b border-white/10">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-10">
                    <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-center">
                        <div>
                            <h2 className="text-xl font-bold text-white">
                                Ready to streamline campus bookings?
                            </h2>
                            <p className="mt-1 text-sm text-slate-400">
                                Join thousands of students and faculty already using UniLink URMS.
                            </p>
                        </div>
                        <Link
                            href="/login"
                            className="inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-white bg-gradient-to-r from-[#0EA5E9] to-[#0D9488] rounded-full shadow-lg shadow-[#0EA5E9]/20 hover:shadow-xl hover:shadow-[#0EA5E9]/30 hover:-translate-y-0.5 transition-all duration-200 shrink-0"
                        >
                            Get Started Free
                            <ArrowRight className="h-4 w-4" />
                        </Link>
                    </div>
                </div>
            </div>

            {/* ── Main Grid ── */}
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pt-14 pb-10">
                <div className="grid gap-10 lg:grid-cols-12">

                    {/* ── Brand Column ── */}
                    <div className="lg:col-span-4">
                        {/* Logo */}
                        <Link href="/" className="inline-flex items-center gap-2.5 group">
                            <img src="/logo1.png" alt="UniLink URMS Logo" className="h-25 w-auto object-contain" />
                            
                        </Link>

                        <p className="mt-4 text-sm leading-relaxed text-slate-400 max-w-xs">
                            University Resource Management System — the single live index
                            for every campus space, scheduled without a single collision.
                        </p>

                        {/* Contact details */}
                        <div className="mt-6 space-y-2.5">
                            <a
                                href="mailto:urms@university.edu"
                                className="flex items-center gap-2.5 text-[12.5px] text-slate-400 hover:text-[#0EA5E9] transition-colors group"
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] group-hover:bg-[#0EA5E9]/10 transition-colors">
                                    <Mail className="h-3.5 w-3.5" />
                                </span>
                                urms@university.edu
                            </a>
                            <a
                                href="tel:+94452280000"
                                className="flex items-center gap-2.5 text-[12.5px] text-slate-400 hover:text-[#0EA5E9] transition-colors group"
                            >
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] group-hover:bg-[#0EA5E9]/10 transition-colors">
                                    <Phone className="h-3.5 w-3.5" />
                                </span>
                                +94 (0) 45 228 0000
                            </a>
                            <div className="flex items-start gap-2.5 text-[12.5px] text-slate-400">
                                <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] mt-0.5">
                                    <MapPin className="h-3.5 w-3.5" />
                                </span>
                                Faculty of Computing, Sabaragamuwa University of Sri Lanka
                            </div>
                        </div>

                        {/* Social Icons */}
                        <div className="mt-6 flex items-center gap-2">
                            {SOCIAL_LINKS.map(({ icon: Icon, href, label }) => (
                                <a
                                    key={label}
                                    href={href}
                                    aria-label={label}
                                    className="flex h-8 w-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-slate-400 hover:bg-[#0EA5E9]/20 hover:text-[#0EA5E9] hover:border-[#0EA5E9]/30 transition-all"
                                >
                                    <Icon className="h-3.5 w-3.5" />
                                </a>
                            ))}
                        </div>
                    </div>

                    {/* ── Link Columns ── */}
                    <div className="lg:col-span-8 grid gap-8 sm:grid-cols-3">
                        {Object.entries(FOOTER_LINKS).map(([group, links]) => (
                            <div key={group}>
                                <p className="text-[11px] font-bold uppercase tracking-[0.12em] text-slate-500 mb-4">
                                    {group}
                                </p>
                                <ul className="space-y-2.5">
                                    {links.map((link) => (
                                        <li key={link.name}>
                                            <Link
                                                href={link.href}
                                                className="text-[13px] text-slate-400 hover:text-white transition-colors duration-150"
                                            >
                                                {link.name}
                                            </Link>
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Bottom Bar ── */}
            <div className="border-t border-white/[0.08]">
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-5 flex flex-col items-center justify-between gap-3 sm:flex-row">
                    <p className="text-[12px] text-slate-500">
                        © {new Date().getFullYear()} UniLink URMS · Sabaragamuwa University of Sri Lanka · All rights reserved.
                    </p>
                    <div className="flex items-center gap-4 text-[12px] text-slate-500">
                        <span className="flex items-center gap-1.5">
                            <span className="h-1.5 w-1.5 rounded-full bg-[#0D9488] animate-pulse" />
                            All systems operational
                        </span>
                        <span className="text-slate-700">·</span>
                        <Link href="#" className="hover:text-slate-300 transition-colors">Privacy</Link>
                        <Link href="#" className="hover:text-slate-300 transition-colors">Terms</Link>
                    </div>
                </div>
            </div>
        </footer>
    );
}
