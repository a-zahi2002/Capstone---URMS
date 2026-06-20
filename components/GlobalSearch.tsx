"use client";

import React, { useState, useEffect, useRef } from "react";
import { Search, Loader2, Building2, MonitorPlay, Mic, Car, Package, Filter, ExternalLink } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/lib/auth-context";

export interface Resource {
    id: number;
    name: string;
    category: string;
    capacity: string;
    status: string;
    location: string;
}

export default function GlobalSearch() {
    const { user } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [query, setQuery] = useState("");
    const [resources, setResources] = useState<Resource[]>([]);
    const [loading, setLoading] = useState(false);
    const [hasFetched, setHasFetched] = useState(false);
    
    // Filters
    const [showFilters, setShowFilters] = useState(false);
    const [filterStatus, setFilterStatus] = useState("All");

    const searchRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
                setIsOpen(false);
                setShowFilters(false);
            }
        };

        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, []);

    const fetchResources = async () => {
        if (hasFetched) return;
        setLoading(true);
        try {
            const token = (user && typeof user.getIdToken === 'function') ? await user.getIdToken() : 'dev-token';
            const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
            const res = await fetch(`${API}/api/resources`, {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (res.ok) {
                const json = await res.json();
                setResources(json.data || []);
                setHasFetched(true);
            }
        } catch (err) {
            console.error("Failed to fetch resources for search", err);
        } finally {
            setLoading(false);
        }
    };

    const handleFocus = () => {
        setIsOpen(true);
        fetchResources();
    };

    const getCategoryIcon = (category?: string) => {
        switch (category) {
            case "Lecture Halls": return <Building2 className="w-4 h-4" />;
            case "Labs": return <MonitorPlay className="w-4 h-4" />;
            case "Equipment": return <Mic className="w-4 h-4" />;
            case "Vehicles": return <Car className="w-4 h-4" />;
            default: return <Package className="w-4 h-4" />;
        }
    };

    const filteredResources = resources.filter(res => {
        const lowerQuery = query.toLowerCase();
        const matchesQuery = 
            (res.name && String(res.name).toLowerCase().includes(lowerQuery)) ||
            (res.category && String(res.category).toLowerCase().includes(lowerQuery)) ||
            (res.capacity && String(res.capacity).toLowerCase().includes(lowerQuery)) ||
            (res.location && String(res.location).toLowerCase().includes(lowerQuery));
        
        const matchesStatus = filterStatus === "All" || res.status === filterStatus;

        return matchesQuery && matchesStatus;
    });

    return (
        <div className="relative w-full max-w-md mx-auto xl:max-w-lg hidden lg:block" ref={searchRef}>
            <div className="relative group flex items-center">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 group-focus-within:text-brand-primary transition-colors" />
                <input
                    type="text"
                    value={query}
                    onChange={(e) => {
                        setQuery(e.target.value);
                        setIsOpen(true);
                        fetchResources();
                    }}
                    onFocus={handleFocus}
                    placeholder="Search resources, labs, equipment..."
                    className="w-full pl-9 pr-10 py-2 bg-slate-50 dark:bg-foreground/5 border border-slate-200 dark:border-border rounded-full text-sm font-semibold focus:outline-none focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary transition-all text-slate-700 dark:text-foreground placeholder-slate-400 dark:placeholder-foreground/30"
                />
                
                {/* Filter Toggle */}
                <button 
                    onClick={() => setShowFilters(!showFilters)}
                    className={`absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full transition-colors ${showFilters ? 'bg-brand-primary/10 text-brand-primary' : 'text-slate-400 hover:text-slate-600 hover:bg-slate-100 dark:hover:bg-white/5'}`}
                    title="Filters"
                >
                    <Filter className="w-4 h-4" />
                </button>
            </div>

            {/* Filters Dropdown */}
            {isOpen && showFilters && (
                <div className="absolute top-full right-0 mt-2 p-3 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl z-50 w-48 animate-in fade-in slide-in-from-top-2">
                    <p className="text-xs font-black uppercase text-slate-400 dark:text-foreground/30 mb-2 tracking-widest pl-1">Availability</p>
                    <select
                        value={filterStatus}
                        onChange={(e) => setFilterStatus(e.target.value)}
                        className="w-full px-3 py-2 text-sm font-semibold rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950/40 text-slate-700 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/20"
                    >
                        <option value="All" className="dark:bg-slate-900">All Statuses</option>
                        <option value="Available" className="dark:bg-slate-900">Available</option>
                        <option value="Booked" className="dark:bg-slate-900">Booked</option>
                        <option value="Maintenance" className="dark:bg-slate-900">Maintenance</option>
                    </select>
                </div>
            )}

            {/* Results Dropdown */}
            {isOpen && query.length > 0 && !showFilters && (
                <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.08)] z-50 max-h-[400px] overflow-y-auto overscroll-contain animate-in fade-in slide-in-from-top-2 flex flex-col p-2">
                    {loading && resources.length === 0 ? (
                        <div className="p-8 flex justify-center items-center text-brand-primary">
                            <Loader2 className="w-6 h-6 animate-spin" />
                        </div>
                    ) : filteredResources.length > 0 ? (
                        <>
                            <div className="px-3 py-2 text-xs font-black uppercase tracking-widest text-slate-400 dark:text-foreground/30">
                                Results
                            </div>
                            <div className="flex flex-col gap-1">
                                {filteredResources.map((res) => (
                                    <Link
                                        key={res.id}
                                        href="/bookings"
                                        onClick={() => setIsOpen(false)}
                                        className="flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-white/[0.04] rounded-xl transition-colors group"
                                    >
                                        <div className="mt-0.5 p-2 bg-slate-100 dark:bg-white/5 text-slate-500 dark:text-foreground/50 rounded-lg group-hover:bg-brand-primary group-hover:text-white transition-colors">
                                            {getCategoryIcon(res.category)}
                                        </div>
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center justify-between gap-2 mb-1">
                                                <h4 className="text-sm font-bold text-slate-900 dark:text-foreground truncate">
                                                    {res.name || "Unnamed Resource"}
                                                </h4>
                                                <div className={`px-2 py-0.5 rounded-md text-[9px] font-black uppercase tracking-widest shrink-0 ${
                                                    res.status === 'Available' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' :
                                                    res.status === 'Booked' ? 'bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400' :
                                                    'bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400'
                                                }`}>
                                                    {res.status || "Unknown"}
                                                </div>
                                            </div>
                                            <div className="flex items-center gap-2 text-xs text-slate-500 dark:text-foreground/50 font-medium">
                                                <span className="truncate">{res.location || "Unknown"}</span>
                                                <span>•</span>
                                                <span>Capacity: {res.capacity || "N/A"}</span>
                                            </div>
                                        </div>
                                        <div className="flex items-center self-center shrink-0 text-slate-300 group-hover:text-brand-primary transition-colors pl-2">
                                            <ExternalLink className="w-4 h-4" />
                                        </div>
                                    </Link>
                                ))}
                            </div>
                        </>
                    ) : (
                        <div className="p-8 text-center flex flex-col items-center">
                            <Search className="w-8 h-8 text-slate-200 dark:text-slate-800 mb-2" />
                            <p className="text-sm font-semibold text-slate-600 dark:text-foreground/70">No resources found</p>
                            <p className="text-xs font-medium text-slate-400 dark:text-foreground/30 mt-1">Try a different term or adjust filters</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
