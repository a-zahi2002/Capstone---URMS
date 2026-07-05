import React from "react";
import { Github, Twitter, Linkedin } from "lucide-react";

export default function Footer() {
    return (
        <footer className="bg-background text-foreground py-12 px-4 sm:px-6 lg:px-8 mt-auto border-t-2 border-border">
            <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-12">
                {/* Brand */}
                <div className="col-span-1 md:col-span-2">
                    <div className="flex items-center gap-3 text-foreground font-heading font-black text-2xl mb-4 tracking-tighter uppercase">
                        <img
                            src="/urms-logo.png"
                            alt="URMS Logo"
                            className="w-8 h-8 grayscale"
                        />
                        <span>Uni<span className="text-brand-primary">Link</span></span>
                    </div>
                    <p className="max-w-sm text-foreground/80 leading-relaxed text-xs font-bold uppercase tracking-wider">
                        The unified resource management platform for university faculties.
                    </p>
                </div>

                {/* Links */}
                <div>
                    <h3 className="text-foreground font-black text-[10px] uppercase tracking-widest mb-6">Platform</h3>
                    <ul className="space-y-4 text-xs font-bold uppercase tracking-wider">
                        <li><a href="/dashboard" className="hover:text-brand-primary hover:underline underline-offset-4 transition-colors">Dashboard</a></li>
                        <li><a href="/resources" className="hover:text-brand-primary hover:underline underline-offset-4 transition-colors">Resources</a></li>
                        <li><a href="/bookings" className="hover:text-brand-primary hover:underline underline-offset-4 transition-colors">Bookings</a></li>
                        <li><a href="/maintenance" className="hover:text-brand-primary hover:underline underline-offset-4 transition-colors">Maintenance</a></li>
                    </ul>
                </div>

                {/* Social / Legal */}
                <div>
                    <h3 className="text-foreground font-black text-[10px] uppercase tracking-widest mb-6">Connect</h3>
                    <div className="flex space-x-5 mb-8 text-foreground">
                        <a href="#" className="hover:text-brand-primary transition-colors"><Github className="w-5 h-5" /></a>
                        <a href="#" className="hover:text-brand-primary transition-colors"><Twitter className="w-5 h-5" /></a>
                        <a href="#" className="hover:text-brand-primary transition-colors"><Linkedin className="w-5 h-5" /></a>
                    </div>
                    <div className="text-[10px] text-foreground/60 font-black uppercase tracking-widest">
                        &copy; {new Date().getFullYear()} UniLink. Built for Capstone Project G15.
                    </div>
                </div>
            </div>
        </footer>
    );
}
