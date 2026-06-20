import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "@/lib/auth-context";
import { Bookmark, Trash2, Edit2, Plus, ChevronDown, Check, Loader2 } from "lucide-react";

interface SavedSearch {
  id: string;
  name: string;
  search_parameters: {
    page: string;
    filters: Record<string, any>;
  };
}

interface SavedSearchesProps {
  pageKey: string;
  currentFilters: Record<string, any>;
  onLoadFilters: (filters: Record<string, any>) => void;
}

export default function SavedSearches({ pageKey, currentFilters, onLoadFilters }: SavedSearchesProps) {
  const { user } = useAuth();
  const [savedList, setSavedList] = useState<SavedSearch[]>([]);
  const [loading, setLoading] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [renamingId, setRenamingId] = useState<string | null>(null);
  const [renameValue, setRenameValue] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  // Fetch saved searches
  const fetchSavedSearches = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const token = typeof user.getIdToken === "function" ? await user.getIdToken() : "dev-token";
      const res = await fetch(`${API_URL}/api/saved-searches`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.status === "success") {
        // Filter by pageKey
        const filtered = (data.data || []).filter(
          (item: any) => item.search_parameters?.page === pageKey
        );
        setSavedList(filtered);
      }
    } catch (err) {
      console.error("Error fetching saved searches:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchSavedSearches();
    }
  }, [user, pageKey]);

  // Click outside to close
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
        setRenamingId(null);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // Save current search
  const handleSaveCurrent = async () => {
    const name = window.prompt("Enter a name for this saved search:");
    if (!name || !name.trim()) return;

    try {
      const token = typeof user?.getIdToken === "function" ? await user.getIdToken() : "dev-token";
      const res = await fetch(`${API_URL}/api/saved-searches`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          search_parameters: {
            page: pageKey,
            filters: currentFilters,
          },
        }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        fetchSavedSearches();
      } else {
        alert(data.message || "Failed to save search");
      }
    } catch (err: any) {
      alert("Error saving search: " + err.message);
    }
  };

  // Delete saved search
  const handleDelete = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!window.confirm("Are you sure you want to delete this saved search?")) return;

    try {
      const token = typeof user?.getIdToken === "function" ? await user.getIdToken() : "dev-token";
      const res = await fetch(`${API_URL}/api/saved-searches/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        setSavedList(prev => prev.filter(item => item.id !== id));
      } else {
        alert(data.message || "Failed to delete saved search");
      }
    } catch (err: any) {
      alert("Error deleting search: " + err.message);
    }
  };

  // Start Rename
  const startRename = (e: React.MouseEvent, item: SavedSearch) => {
    e.stopPropagation();
    setRenamingId(item.id);
    setRenameValue(item.name);
  };

  // Save Rename
  const saveRename = async (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (!renameValue.trim()) return;

    try {
      const token = typeof user?.getIdToken === "function" ? await user.getIdToken() : "dev-token";
      const res = await fetch(`${API_URL}/api/saved-searches/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ name: renameValue.trim() }),
      });

      const data = await res.json();
      if (res.ok && data.status === "success") {
        setSavedList(prev =>
          prev.map(item => (item.id === id ? { ...item, name: renameValue.trim() } : item))
        );
        setRenamingId(null);
      } else {
        alert(data.message || "Failed to rename");
      }
    } catch (err: any) {
      alert("Error renaming search: " + err.message);
    }
  };

  return (
    <div className="relative inline-block text-left" ref={dropdownRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex items-center gap-2 bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 hover:bg-slate-50 dark:hover:bg-white/10 active:scale-95 text-slate-700 dark:text-foreground/80 font-semibold px-4 py-2.5 rounded-xl shadow-sm transition-all duration-200 text-sm"
        >
          <Bookmark className="w-4 h-4 text-brand-primary text-blue-500" />
          <span>Saved Searches</span>
          <ChevronDown className="w-4 h-4 text-slate-400" />
        </button>
      </div>

      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-white/10 shadow-xl z-50 overflow-hidden animate-in fade-in-50 slide-in-from-top-1">
          <div className="p-3 border-b border-slate-100 dark:border-white/5 flex items-center justify-between bg-slate-50/50 dark:bg-white/[0.01]">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">My Searches</span>
            <button
              onClick={handleSaveCurrent}
              title="Save current search"
              className="inline-flex items-center gap-1 text-xs font-bold text-[#1E3A8A] dark:text-blue-400 hover:opacity-80 transition-opacity"
            >
              <Plus className="w-3.5 h-3.5" />
              Save Current
            </button>
          </div>

          <div className="max-h-60 overflow-y-auto divide-y divide-slate-100 dark:divide-white/5">
            {loading && savedList.length === 0 ? (
              <div className="flex items-center justify-center py-6">
                <Loader2 className="w-5 h-5 animate-spin text-slate-400" />
              </div>
            ) : savedList.length === 0 ? (
              <div className="py-6 px-4 text-center text-xs text-slate-400">
                No saved searches on this page yet.
              </div>
            ) : (
              savedList.map(item => (
                <div
                  key={item.id}
                  onClick={() => {
                    if (renamingId !== item.id) {
                      onLoadFilters(item.search_parameters.filters);
                      setIsOpen(false);
                    }
                  }}
                  className="group px-4 py-3 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-white/5 cursor-pointer transition-colors"
                >
                  <div className="flex-1 min-w-0 pr-2">
                    {renamingId === item.id ? (
                      <input
                        type="text"
                        value={renameValue}
                        onChange={e => setRenameValue(e.target.value)}
                        onClick={e => e.stopPropagation()}
                        className="w-full bg-slate-50 dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded px-2 py-1 text-xs font-semibold focus:outline-none focus:ring-1 focus:ring-blue-500 text-slate-900 dark:text-white"
                      />
                    ) : (
                      <p className="text-sm font-semibold text-slate-700 dark:text-foreground/80 truncate">
                        {item.name}
                      </p>
                    )}
                  </div>

                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    {renamingId === item.id ? (
                      <button
                        onClick={e => saveRename(e, item.id)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-emerald-600 dark:text-emerald-400"
                        title="Save rename"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={e => startRename(e, item)}
                        className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-slate-600 dark:hover:text-white"
                        title="Rename"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button
                      onClick={e => handleDelete(e, item.id)}
                      className="p-1 rounded hover:bg-slate-200 dark:hover:bg-white/10 text-slate-400 hover:text-red-500"
                      title="Delete"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
