import React from "react";
import { Landmark, Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-card text-slate-600 dark:text-foreground/60 py-12 px-4 sm:px-6 lg:px-8 mt-auto border-t border-slate-200 dark:border-border">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                {/* Brand */}
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3 text-foreground font-black text-2xl mb-4 tracking-tighter">
                        <img
                            src="/urms-logo.png"
                            alt="URMS Logo"
                            className="w-8 h-8 rounded-lg bg-white p-0.5"
                        />
                        <span>UniLink</span>
                    </div>
                    <p className="max-w-sm text-slate-600 dark:text-foreground/50 leading-relaxed text-[15px] font-medium">
                        The unified resource management platform for university faculties. Optimizing campus equipment and laboratory utilization since 2026.
                    </p>
                </div>

                {/* Links */}
                <div>
                    <h3 className="text-foreground font-black text-[10px] uppercase tracking-widest mb-6">Platform</h3>
                    <ul className="space-y-4 text-[14px] font-bold">
                        <li><a href="/dashboard" className="hover:text-brand-primary transition-colors">Dashboard</a></li>
                        <li><a href="/resources" className="hover:text-brand-primary transition-colors">Resources</a></li>
                        <li><a href="/bookings" className="hover:text-brand-primary transition-colors">Bookings</a></li>
                        <li><a href="/maintenance" className="hover:text-brand-primary transition-colors">Maintenance</a></li>
                    </ul>
                </div>

                {/* Social / Legal */}
                <div>
                    <h3 className="text-foreground font-black text-[10px] uppercase tracking-widest mb-6">Connect</h3>
                    <div className="flex space-x-5 mb-8 text-slate-500 dark:text-foreground/40">
                        <a href="#" className="hover:text-foreground transition-colors"><Github className="w-5 h-5" /></a>
                        <a href="#" className="hover:text-foreground transition-colors"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="hover:text-foreground transition-colors"><Linkedin className="w-5 h-5" /></a>
                    </div>
                    <div className="text-[12px] text-slate-400 dark:text-foreground/30 font-black uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} UniLink. Built for Capstone Project G15.
                    </div>
                </div>
            </div>
        </footer>
    );
}
