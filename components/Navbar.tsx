"use client";

import React, { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
    LogOut,
    Menu,
    X,
    ChevronDown,
    User,
    Bell,
    Building2,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { ThemeToggle } from "./ThemeToggle";
import NotificationBell from "./NotificationBell";

/*
 * URMS LIGHT BLUE DESIGN SYSTEM
 * bg-base      : #F8FAFC  (Slate 50)
 * surface      : #FFFFFF
 * border       : #E2E8F0  (Slate 200)
 * primary      : #0EA5E9  (Sky 500)
 * primary-dark : #0284C7  (Sky 600)
 * teal         : #0D9488  (Teal 600)
 * teal-light   : #CCFBF1  (Teal 100)
 * ink-main     : #0F172A  (Slate 900)
 * ink-muted    : #64748B  (Slate 500)
 */

const roleMeta: Record<string, { label: string }> = {
    admin:       { label: "Administrator" },
    lecturer:    { label: "Lecturer"      },
    student:     { label: "Student"       },
    maintenance: { label: "Maintenance"   },
};

export default function Navbar() {
    const pathname   = usePathname();
    const { user, profile, signOut } = useAuth();
    const [isOpen,   setIsOpen]   = useState(false);
    const [scrolled, setScrolled] = useState(false);
    const [userMenu, setUserMenu] = useState(false);
    const userMenuRef = useRef<HTMLDivElement>(null);

    /* scroll shadow */
    useEffect(() => {
        const fn = () => setScrolled(window.scrollY > 4);
        window.addEventListener("scroll", fn, { passive: true });
        return () => window.removeEventListener("scroll", fn);
    }, []);

    /* close dropdown on outside click */
    useEffect(() => {
        const fn = (e: MouseEvent) => {
            if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node))
                setUserMenu(false);
        };
        document.addEventListener("mousedown", fn);
        return () => document.removeEventListener("mousedown", fn);
    }, []);

    /* close mobile drawer on route change */
    useEffect(() => { setIsOpen(false); }, [pathname]);

    /* nav links by role */
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
                { name: "Explore",   href: "/explore"   },
                { name: "Resources", href: "/resources" },
            ];
    }

    const meta     = profile?.role ? roleMeta[profile.role] : null;
    const initials = profile?.name
        ? profile.name.split(" ").map((n) => n[0]).join("").toUpperCase().slice(0, 2)
        : user?.email?.[0].toUpperCase() ?? "U";

    return (
        <>
            {/* ════════════════ NAVBAR ════════════════ */}
            <nav
                className={`sticky top-0 z-50 w-full transition-all duration-300 ${
                    scrolled
                        ? "bg-white/95 dark:bg-[#0B111E]/95 backdrop-blur-md shadow-[0_1px_12px_0_rgba(14,165,233,0.08)] border-b border-[#E2E8F0] dark:border-slate-700/60"
                        : "bg-white/80 dark:bg-[#0B111E]/80 backdrop-blur-sm border-b border-[#E2E8F0] dark:border-slate-700/60"
                }`}
            >
                <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center h-16 gap-6">

                        {/* ── LOGO ── */}
                        <Link href="/" className="flex items-center gap-2.5 group shrink-0">
                            <img src="/logo1.png" alt="UniLink URMS Logo" className="h-25 w-auto object-contain" />
                            
                        </Link>

                        {/* ── DESKTOP LINKS ── */}
                        <div className="hidden md:flex items-center gap-1 flex-1">
                            {navLinks.map((link) => {
                                const isActive = pathname === link.href;
                                return (
                                    <Link
                                        key={link.href}
                                        href={link.href}
                                        className={`relative px-3.5 py-2 text-[13px] font-medium rounded-lg transition-all duration-200 ${
                                            isActive
                                                ? "text-[#0EA5E9] bg-[#F0F9FF] dark:bg-sky-900/30"
                                                : "text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50"
                                        }`}
                                    >
                                        {link.name}
                                        {isActive && (
                                            <span className="absolute bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-[#0EA5E9]" />
                                        )}
                                    </Link>
                                );
                            })}
                        </div>

                        {/* ── SPACER (pushes right area flush right on desktop) ── */}
                        <div className="flex-1 md:hidden" />

                        {/* ── USER / AUTH AREA ── */}
                        <div className="hidden md:flex items-center gap-3 shrink-0">
                            {user && <NotificationBell />}

                            {user ? (
                                <div className="relative" ref={userMenuRef}>
                                    <button
                                        onClick={() => setUserMenu(!userMenu)}
                                        className={`flex items-center gap-2 pl-1 pr-3 py-1 rounded-full border transition-all duration-200 cursor-pointer ${
                                            userMenu
                                                ? "border-[#0EA5E9] bg-[#F0F9FF] dark:bg-sky-900/30 shadow-sm"
                                                : "border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#151E2E] hover:border-[#0EA5E9]/40 hover:bg-[#F8FAFC] dark:hover:bg-slate-800"
                                        }`}
                                    >
                                        {/* avatar */}
                                        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#0D9488] flex items-center justify-center text-[11px] font-bold text-white shrink-0">
                                            {initials}
                                        </div>
                                        <div className="text-left leading-none">
                                            <p className="text-[12px] font-semibold text-[#0F172A] dark:text-white">
                                                {profile?.name?.split(" ")[0] ?? "User"}
                                            </p>
                                            {meta && (
                                                <p className="text-[10px] text-[#64748B] dark:text-slate-400 mt-0.5">{meta.label}</p>
                                            )}
                                        </div>
                                        <ChevronDown className={`w-3.5 h-3.5 text-[#64748B] dark:text-slate-400 transition-transform duration-200 ${userMenu ? "rotate-180" : ""}`} />
                                    </button>

                                    {/* ── DROPDOWN ── */}
                                    {userMenu && (
                                        <div className="absolute right-0 mt-2 w-60 bg-white dark:bg-[#151E2E] border border-[#E2E8F0] dark:border-slate-700 rounded-2xl shadow-xl shadow-[#0EA5E9]/[0.06] dark:shadow-black/30 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                                            {/* header */}
                                            <div className="px-4 py-3.5 bg-gradient-to-br from-[#F0F9FF] to-[#F0FDFA] dark:from-sky-900/20 dark:to-teal-900/20 border-b border-[#E2E8F0] dark:border-slate-700">
                                                <div className="flex items-center gap-3">
                                                    <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#0D9488] flex items-center justify-center text-sm font-bold text-white shrink-0">
                                                        {initials}
                                                    </div>
                                                    <div className="min-w-0">
                                                        <p className="text-[12px] font-semibold text-[#0F172A] dark:text-white truncate">{profile?.name ?? "User"}</p>
                                                        <p className="text-[10px] text-[#64748B] dark:text-slate-400 truncate">{user.email}</p>
                                                    </div>
                                                </div>
                                                {meta && (
                                                    <span className="inline-flex items-center gap-1.5 mt-2.5 px-2.5 py-0.5 text-[10px] font-semibold bg-[#CCFBF1] dark:bg-teal-900/40 text-[#0D9488] dark:text-teal-400 rounded-full">
                                                        {meta.label}
                                                    </span>
                                                )}
                                            </div>

                                            {/* menu items */}
                                            <div className="p-1.5 space-y-0.5">
                                                <Link
                                                    href="/profile"
                                                    onClick={() => setUserMenu(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 text-[12px] font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F0F9FF] dark:hover:bg-sky-900/20 rounded-xl transition-colors group"
                                                >
                                                    <User className="w-4 h-4 text-[#64748B] dark:text-slate-400 group-hover:text-[#0EA5E9]" />
                                                    My Profile
                                                </Link>
                                                <Link
                                                    href="/notifications"
                                                    onClick={() => setUserMenu(false)}
                                                    className="flex items-center gap-3 px-3 py-2.5 text-[12px] font-medium text-[#0F172A] dark:text-slate-200 hover:bg-[#F0F9FF] dark:hover:bg-sky-900/20 rounded-xl transition-colors group"
                                                >
                                                    <Bell className="w-4 h-4 text-[#64748B] dark:text-slate-400 group-hover:text-[#0EA5E9]" />
                                                    Notifications
                                                </Link>
                                                <div className="my-1 mx-3 h-px bg-[#E2E8F0] dark:bg-slate-700" />
                                                <button
                                                    onClick={() => { signOut(); setUserMenu(false); }}
                                                    className="w-full flex items-center gap-3 px-3 py-2.5 text-[12px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors cursor-pointer"
                                                >
                                                    <LogOut className="w-4 h-4" />
                                                    Sign Out
                                                </button>
                                            </div>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="flex items-center gap-2.5">
                                    <Link
                                        href="/register"
                                        className="text-[13px] font-medium text-[#64748B] dark:text-slate-400 hover:text-[#0F172A] dark:hover:text-white border border-[#E2E8F0] dark:border-slate-700 px-4 py-2 rounded-full hover:border-[#0EA5E9]/40 hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-all"
                                    >
                                        Register
                                    </Link>
                                    <Link
                                        href="/login"
                                        className="inline-flex items-center gap-1.5 px-5 py-2 text-[13px] font-semibold text-white bg-gradient-to-r from-[#0EA5E9] to-[#0D9488] rounded-full shadow-sm shadow-[#0EA5E9]/20 hover:shadow-md hover:shadow-[#0EA5E9]/30 hover:-translate-y-0.5 transition-all duration-200"
                                    >
                                        Sign In
                                    </Link>
                                </div>
                            )}

                            <ThemeToggle />
                        </div>

                        {/* ── HAMBURGER ── */}
                        <button
                            onClick={() => setIsOpen(!isOpen)}
                            className="md:hidden flex items-center justify-center w-9 h-9 rounded-xl border border-[#E2E8F0] dark:border-slate-700 bg-white dark:bg-[#151E2E] hover:bg-[#F0F9FF] dark:hover:bg-slate-800 hover:border-[#0EA5E9]/40 transition-all"
                            aria-label="Toggle menu"
                        >
                            {isOpen
                                ? <X className="w-4.5 h-4.5 text-[#0F172A] dark:text-white" />
                                : <Menu className="w-4.5 h-4.5 text-[#0F172A] dark:text-white" />
                            }
                        </button>
                    </div>
                </div>
            </nav>

            {/* ════════════════ MOBILE DRAWER ════════════════ */}
            <div className={`md:hidden fixed inset-0 z-40 transition-all duration-300 ${isOpen ? "visible" : "invisible"}`}>
                {/* backdrop */}
                <div
                    className={`absolute inset-0 bg-[#0F172A]/20 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? "opacity-100" : "opacity-0"}`}
                    onClick={() => setIsOpen(false)}
                />

                {/* panel */}
                <div className={`absolute top-16 left-0 right-0 bottom-0 bg-white dark:bg-[#0B111E] overflow-y-auto transition-all duration-300 shadow-xl dark:shadow-black/40 ${
                    isOpen ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0"
                }`}>

                    {/* user strip */}
                    {user && (
                        <div className="flex items-center gap-3 px-5 py-4 border-b border-[#E2E8F0] dark:border-slate-700 bg-gradient-to-r from-[#F0F9FF] to-[#F0FDFA] dark:from-sky-900/20 dark:to-teal-900/20">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-[#0EA5E9] to-[#0D9488] flex items-center justify-center font-bold text-white text-sm shrink-0">
                                {initials}
                            </div>
                            <div className="min-w-0">
                                <p className="text-[13px] font-semibold text-[#0F172A] dark:text-white truncate">{profile?.name ?? "User"}</p>
                                <p className="text-[11px] text-[#64748B] dark:text-slate-400 truncate">{user.email}</p>
                            </div>
                            {meta && (
                                <span className="ml-auto shrink-0 px-2.5 py-0.5 text-[10px] font-semibold bg-[#CCFBF1] dark:bg-teal-900/40 text-[#0D9488] dark:text-teal-400 rounded-full">
                                    {meta.label}
                                </span>
                            )}
                        </div>
                    )}

                    {/* nav links */}
                    <div className="px-3 py-3 space-y-1 border-b border-[#E2E8F0] dark:border-slate-700">
                        {navLinks.map((link) => {
                            const isActive = pathname === link.href;
                            return (
                                <Link
                                    key={link.href}
                                    href={link.href}
                                    onClick={() => setIsOpen(false)}
                                    className={`flex items-center gap-3 px-4 py-3 text-[13px] font-medium rounded-xl transition-all ${
                                        isActive
                                            ? "bg-[#F0F9FF] dark:bg-sky-900/20 text-[#0EA5E9]"
                                            : "text-[#0F172A] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50"
                                    }`}
                                >
                                    {isActive && (
                                        <span className="w-1.5 h-1.5 rounded-full bg-[#0EA5E9] shrink-0" />
                                    )}
                                    {link.name}
                                </Link>
                            );
                        })}
                    </div>

                    {/* account actions */}
                    <div className="px-3 py-3 space-y-2">
                        {user ? (
                            <>
                                <Link
                                    href="/profile"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-[#0F172A] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                                >
                                    <User className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
                                    My Profile
                                </Link>
                                <Link
                                    href="/notifications"
                                    onClick={() => setIsOpen(false)}
                                    className="flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-[#0F172A] dark:text-slate-300 hover:bg-[#F8FAFC] dark:hover:bg-slate-800/50 rounded-xl transition-colors"
                                >
                                    <Bell className="w-4 h-4 text-[#64748B] dark:text-slate-400" />
                                    Notifications
                                </Link>
                                <button
                                    onClick={() => { signOut(); setIsOpen(false); }}
                                    className="w-full flex items-center gap-3 px-4 py-3 text-[13px] font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-colors cursor-pointer"
                                >
                                    <LogOut className="w-4 h-4" />
                                    Sign Out
                                </button>
                            </>
                        ) : (
                            <div className="space-y-2 px-1 pt-2">
                                <Link
                                    href="/login"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full flex items-center justify-center py-3 text-[13px] font-semibold text-white bg-gradient-to-r from-[#0EA5E9] to-[#0D9488] rounded-xl shadow-sm transition-all hover:opacity-90"
                                >
                                    Sign In
                                </Link>
                                <Link
                                    href="/register"
                                    onClick={() => setIsOpen(false)}
                                    className="w-full flex items-center justify-center py-3 text-[13px] font-medium text-[#0F172A] dark:text-slate-300 border border-[#E2E8F0] dark:border-slate-700 rounded-xl hover:bg-[#F8FAFC] dark:hover:bg-slate-800 transition-all"
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
