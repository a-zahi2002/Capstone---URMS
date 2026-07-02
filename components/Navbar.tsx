"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogOut, Menu, X, ChevronDown, User, Sparkles, Bell } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import GlobalSearch from "./GlobalSearch";
import { ThemeToggle } from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

/* ── role colours (flat high contrast) ── */
const roleMeta: Record<string, { label: string; dot: string; badge: string; text: string }> = {
    admin:       { label: "Administrator", dot: "bg-black dark:bg-white", badge: "bg-transparent border-foreground",  text: "text-foreground"  },
    lecturer:    { label: "Lecturer",      dot: "bg-black dark:bg-white", badge: "bg-transparent border-foreground",  text: "text-foreground" },
    student:     { label: "Student",       dot: "bg-black dark:bg-white", badge: "bg-transparent border-foreground",  text: "text-foreground"    },
    maintenance: { label: "Maintenance",   dot: "bg-black dark:bg-white", badge: "bg-transparent border-foreground",  text: "text-foreground"   },
};

export default function Navbar() {
    const pathname    = usePathname();
    const { user, profile, signOut } = useAuth();
    const [isOpen,   setIsOpen]   = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userMenu, setUserMenu] = useState(false);
    const [hovered,  setHovered]  = useState<string | null>(null);
    const userMenuRef = useRef<HTMLDivElement>(null);
    const indicatorRef = useRef<HTMLSpanElement>(null);
    const navRef       = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 4);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    useEffect(() => {
        const fn = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
                setUserMenu(false);
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    useEffect(() => { setIsOpen(false); }, [pathname]);

    let navLinks: { name: string; href: string }[] = [];
    switch (profile?.role) {
        case "admin":
            navLinks = [
                { name: "Admin Console",      href: "/dashboard"   },
                { name: "Manage Resources",   href: "/resources"   },
                { name: "All Bookings",       href: "/bookings"    },
                { name: "System Maintenance", href: "/maintenance" },
            ]; break;
        case "lecturer":
            navLinks = [
                { name: "Teacher Portal",    href: "/dashboard" },
                { name: "Faculty Resources", href: "/resources"  },
                { name: "My Bookings",       href: "/bookings"  },
            ]; break;
        case "student":
            navLinks = [
                { name: "Student Hub",      href: "/dashboard" },
                { name: "Browse Resources", href: "/resources"  },
                { name: "My Bookings",      href: "/bookings"  },
            ]; break;
        case "maintenance":
            navLinks = [
                { name: "Operations Hub", href: "/dashboard"   },
                { name: "Active Tickets", href: "/maintenance" },
            ]; break;
        default:
            navLinks = [
                { name: "Home",      href: "/"          },
                { name: "Resources", href: "/resources" },
            ];
    }

    const meta     = profile?.role ? roleMeta[profile.role] : null;
    const initials = profile?.name
        ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : user?.email?.[0].toUpperCase() ?? "U";

    useEffect(() => {
        const key   = hovered ?? pathname;
        const el    = navRef.current?.querySelector<HTMLElement>(`[data-href="${key}"]`);
        const bar   = indicatorRef.current;
        if (!el || !bar || !navRef.current) return;
        const navRect = navRef.current.getBoundingClientRect();
        const rect    = el.getBoundingClientRect();
        bar.style.left  = `${rect.left - navRect.left}px`;
        bar.style.width = `${rect.width}px`;
        bar.style.opacity = "1";
    }, [hovered, pathname, navLinks]);

    return (
        <>
            {/* ════════════════════ NAVBAR ════════════════════ */}
            <nav className={`sticky top-0 z-50 w-full bg-background transition-all duration-0 border-b border-border`}>

                <style>{`
                    @keyframes fadeUp  { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
                    .nav-item-enter { animation: fadeUp 0.15s ease forwards; }
                `}</style>

                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16 gap-4">

                        {/* ── LOGO ── */}
                        <Link href="/" className="flex items-center gap-2.5 group shrink-0 mr-2">
                            <div className="relative">
                                <img
                                    src="/urms-logo.png"
                                    alt="URMS Logo"
                                    className="relative w-8 h-8 object-contain drop-shadow-none grayscale group-hover:grayscale-0 transition-all duration-0"
                                />
                            </div>
                            <span className="text-xl font-heading font-black tracking-tight text-foreground uppercase">
                                Uni<span className="text-brand-primary">Link</span>
                            </span>
                        </Link>

                        {/* ── SEARCH ── */}
                        <div className="flex-1 flex justify-center px-2 lg:px-6">
                            <GlobalSearch />
                        </div>

                        {/* ── DESKTOP LINKS ── */}
                        <div
                            ref={navRef}
                            className="hidden md:flex items-center gap-1 relative"
                            onMouseLeave={() => setHovered(null)}
                        >
                            <span
                                ref={indicatorRef}
                                className="absolute bottom-0 h-0.5 bg-brand-primary transition-all duration-150 ease-out opacity-0 pointer-events-none"
                                style={{ left: 0, width: 0 }}
                            />

                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        data-href={link.href}
                                        onMouseEnter={() => setHovered(link.href)}
                                        className={`relative px-4 py-2 text-xs font-bold uppercase tracking-wider transition-colors duration-0 ${
                                            isActive
                                                ? "text-brand-primary"
                                                : "text-foreground hover:text-brand-primary"
                                        }`}
                                    >
                                        {link.name}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* ── USER / AUTH AREA ── */}
                        <div className="hidden md:flex items-center gap-3 shrink-0">
                            {user && <NotificationBell />}
                            {user ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenu(!userMenu)}
                                        className={`flex items-center gap-2.5 pl-1 pr-3 py-1 border transition-all duration-0 rounded-none ${
                                            userMenu
                                                ? "border-brand-primary bg-brand-primary text-white"
                                                : "border-border bg-background hover:border-foreground text-foreground"
                                        }`}
                                    >
                                        {/* avatar */}
                                        <div className={`w-7 h-7 flex items-center justify-center text-xs font-black shrink-0 ${userMenu ? "bg-white text-brand-primary" : "bg-foreground text-background"}`}>
                                            {initials}
                                        </div>
                                        <div className="text-left leading-none">
                                            <p className="text-[10px] font-bold uppercase tracking-wider">
                                                {profile?.name?.split(" ")[0] ?? "User"}
                                            </p>
                                        </div>
                                        <ChevronDown className={`w-3 h-3 transition-transform duration-0 ${userMenu ? "rotate-180" : ""}`} />
                                    </button>

                                    {/* ── DROPDOWN ── */}
                                    {userMenu && (
                                        <div className="absolute right-0 mt-2 w-56 bg-background border border-border shadow-none overflow-hidden animate-in fade-in slide-in- duration-150 z-50">
                                            <div className="px-4 py-3.5 bg-card border-b border-border">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 bg-foreground text-background flex items-center justify-center text-sm font-black shrink-0">
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-xs font-bold text-foreground uppercase truncate">{profile?.name ?? "User"}</p>
                                                        <p className="text-[10px] text-foreground/60 truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                                {meta && (
                                                    <span className={`inline-flex items-center gap-1.5 mt-3 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${meta.badge} ${meta.text}`}>
                                                        {meta.label}
                                                    </span>
                                                )}
                                            </div>

                                            <div className="p-2 space-y-1">
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setUserMenu(false)}
                                                    className="flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background transition-all group"
                                                >
                                                    <User className="w-3.5 h-3.5" />
                                                    My Profile
                                                </Link>
                                                <Link
                                                    href="/notifications"
                                                    onClick={() => setUserMenu(false)}
                                                    className="flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background transition-all group"
                                                >
                                                    <Bell className="w-3.5 h-3.5" />
                                                    Notifications
                                                </Link>
                                                <button
                                                    onClick={() => { signOut(); setUserMenu(false); }}
                                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs font-bold uppercase tracking-wider text-brand-primary border border-transparent hover:bg-brand-primary hover:text-white transition-all group"
                                                >
                                                    <LogOut className="w-3.5 h-3.5" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2">
                                    <Link
                                        href="/register"
                                        className="text-xs font-bold uppercase tracking-wider text-foreground hover:bg-foreground hover:text-background border border-transparent hover:border-foreground px-4 py-2 transition-all"
                                    >
                                        Register
                                    </Link>
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-bold uppercase tracking-wider text-white bg-brand-primary border border-brand-primary hover:bg-background hover:text-brand-primary transition-all duration-0"
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            )}
                            <div className="w-px h-6 bg-border mx-1" />
                            <ThemeToggle />
                        </div>

                        {/* ── HAMBURGER ── */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden relative w-9 h-9 flex flex-col items-center justify-center gap-[5px] border border-border bg-card hover:bg-foreground hover:text-background transition-all"
                            aria-label="Toggle menu"
                        >
                            <span className={`block h-0.5 bg-current transition-all duration-0 origin-center ${isOpen ? "w-5 rotate-45 translate-y-[7px]" : "w-5"}`} />
                            <span className={`block h-0.5 bg-current transition-all duration-0 ${isOpen ? "w-0 opacity-0" : "w-4"}`} />
                            <span className={`block h-0.5 bg-current transition-all duration-0 origin-center ${isOpen ? "w-5 -rotate-45 -translate-y-[7px]" : "w-5"}`} />
                        </button>
                    </div>
                </div>
            </nav>

            {/* ════════════════════ MOBILE DRAWER ════════════════════ */}
            <div className={`md:hidden fixed inset-0 z-40 transition-all duration-0 ${isOpen ? "visible" : "invisible"}`}>
                <div
                    className={`absolute inset-0 bg-background transition-opacity duration-0 ${isOpen ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setIsOpen(false)}
                />

                <div className={`absolute top-16 left-0 right-0 bottom-0 bg-background border-t border-border overflow-y-auto transition-all duration-150 ${
                    isOpen ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
                }`}>

                    {user && (
                        <div className="flex items-center gap-3 px-5 py-6 border-b border-border bg-card">
                            <div className="w-10 h-10 bg-foreground text-background flex items-center justify-center font-black shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="text-sm font-bold text-foreground uppercase truncate">{profile?.name ?? "User"}</p>
                                <p className="text-[10px] text-foreground/60 truncate">{user.email}</p>
                            </div>
                            {meta && (
                                <span className={`ml-auto shrink-0 flex items-center gap-1 px-2.5 py-1 text-[9px] font-bold uppercase border ${meta.badge} ${meta.text}`}>
                                    {meta.label}
                                </span>
                            )}
                        </div>
                    )}

                    <div className="p-3 space-y-1">
                        {navLinks.map((link, i) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`nav-item-enter flex items-center gap-3 px-4 py-4 text-xs font-bold uppercase tracking-wider transition-all border ${
                                        isActive
                                            ? "border-brand-primary bg-brand-primary text-white"
                                            : "border-transparent text-foreground hover:border-border hover:bg-card"
                                    }`}
                                    style={{ animationDelay: `${i * 20}ms` }}
                                >
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    <div className="px-3 pb-6 border-t border-border pt-4 space-y-2">
                        {user ? (
                            <>
                                <Link
                                    href="/profile"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-foreground border border-transparent hover:border-border hover:bg-card transition-all"
                                >
                                    <User className="w-4 h-4" />
                                    My Profile
                                </Link>
                                <Link
                                    href="/notifications"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-foreground border border-transparent hover:border-border hover:bg-card transition-all"
                                >
                                    <Bell className="w-4 h-4" />
                                    Notifications
                                </Link>
                                <button
                                    onClick={() => { signOut(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-xs font-bold uppercase tracking-wider text-brand-primary border border-brand-primary hover:bg-brand-primary hover:text-white transition-all"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <div className="space-y-2 px-3">
                                <Link
                                    href="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full flex items-center justify-center gap-2 py-4 text-xs font-bold uppercase tracking-wider text-white bg-brand-primary border border-brand-primary hover:bg-background hover:text-brand-primary transition-all"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full flex items-center justify-center py-4 text-xs font-bold uppercase tracking-wider text-foreground border border-border hover:bg-foreground hover:text-background transition-all"
                                >
                                    Create Account
                                </Link>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </>
    );
}
