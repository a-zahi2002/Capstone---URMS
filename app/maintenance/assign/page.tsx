"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

interface DBUser {
  id: string;
  name: string;
  email: string;
  role: string;
  department: string;
}

interface MaintenanceTicket {
  id: string;
  resourceId: string;
  resourceName?: string;
  title: string;
  description: string;
  priority: "High" | "Medium" | "Low";
  status: string;
  createdBy: string;
  assignedTo?: string | null;
}

/**
 * AssignMaintenancePage Component
 * 
 * Provides an administrative UI for assigning submitted maintenance requests 
 * to specific technicians or staff members.
 * Aligns with the proposal requirement: "Technician assignment workflow".
 */
export default function AssignMaintenancePage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    requestId: "",
    staffId: "",
    notes: "",
  });

  const [errors, setErrors] = useState({
    requestId: false,
    staffId: false,
  });

  const [isSuccess, setIsSuccess] = useState(false);
  const [requests, setRequests] = useState<MaintenanceTicket[]>([]);
  const [staff, setStaff] = useState<DBUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    if (user && typeof user.getIdToken === "function") return user.getIdToken();
    return "dev-token";
  }, [user]);

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const token = await getToken();
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      // 1. Fetch OPEN maintenance tickets
      const ticketsRes = await fetch(`${API}/api/maintenance-tickets?status=OPEN`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!ticketsRes.ok) throw new Error("Failed to load maintenance requests");
      const resJson = await ticketsRes.json();
      const ticketsData: MaintenanceTicket[] = Array.isArray(resJson) ? resJson : (resJson.data || []);

      // 2. Fetch users and filter by role === 'maintenance'
      const usersRes = await fetch(`${API}/api/users`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!usersRes.ok) throw new Error("Failed to load user directory");
      const usersData = await usersRes.json();
      const maintenanceUsers = (usersData.data || []).filter(
        (u: any) => u.role === "maintenance"
      );

      setRequests(ticketsData || []);
      setStaff(maintenanceUsers);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An error occurred while fetching directories");
    } finally {
      setLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    if (user) {
      loadData();
    }
  }, [user, loadData]);

  const getPriorityInfo = (id: string) => {
    const selectedReq = requests.find(r => r.id === id);
    if (!selectedReq) return null;
    const priority = selectedReq.priority || "Medium";
    const colors: Record<string, string> = {
      High: "text-brand-danger bg-red-50 border-brand-danger/20",
      Medium: "text-brand-warning bg-amber-50 border-brand-warning/20",
      Low: "text-brand-success bg-emerald-50 border-brand-success/20",
    };
    return {
      label: priority,
      color: colors[priority] || "text-slate-500 bg-slate-50 border-slate-200"
    };
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear validation error on change
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    const newErrors = {
      requestId: !formData.requestId,
      staffId: !formData.staffId,
    };

    setErrors(newErrors);

    if (newErrors.requestId || newErrors.staffId) {
      return;
    }

    setSubmitting(true);
    setError(null);

    try {
      const token = await getToken();
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

      const selectedTicket = requests.find((r) => r.id === formData.requestId);
      const existingDesc = selectedTicket ? selectedTicket.description : "";
      const updatedDesc = formData.notes
        ? `${existingDesc}\n\n[Assignment Notes]: ${formData.notes}`
        : existingDesc;

      const res = await fetch(`${API}/api/maintenance-tickets/${formData.requestId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          assignedTo: formData.staffId,
          status: "IN_PROGRESS",
          description: updatedDesc,
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to update maintenance request assignment");
      }

      // Console log for verification (Requirement)
      console.log("Assignment Submitted:", {
        request: selectedTicket ? `${selectedTicket.title} - ${selectedTicket.resourceName || selectedTicket.resourceId}` : formData.requestId,
        staff: staff.find((s) => s.id === formData.staffId)?.name || formData.staffId,
        notes: formData.notes,
      });

      setIsSuccess(true);

      // Refresh list to exclude now in-progress ticket
      await loadData();

      // Reset flow
      setTimeout(() => {
        setIsSuccess(false);
        setFormData({ requestId: "", staffId: "", notes: "" });
      }, 4000);
    } catch (err: any) {
      console.error("Assignment error:", err);
      setError(err.message || "Failed to assign task. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  const currentPriority = getPriorityInfo(formData.requestId);

  return (
    <div className="flex-grow flex items-center justify-center p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-140px)]">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transform transition-all hover:shadow-2xl hover:shadow-slate-200/50">
        
        {/* Header - Using a darker professional theme for Admin functionality */}
        <div className="bg-slate-900 p-8 text-white relative">
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold tracking-tight">Assign Maintenance Task</h1>
            <p className="text-slate-400 mt-2 text-lg">
              Dispatcher Dashboard: Assign requests to staff for resolution.
            </p>
          </div>
          <div className="absolute top-0 right-0 p-4 opacity-10">
             <svg xmlns="http://www.w3.org/2000/svg" className="h-24 w-24" fill="none" viewBox="0 0 24 24" stroke="currentColor">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
             </svg>
          </div>
        </div>

        <div className="p-8">
          {isSuccess ? (
            <div className="py-12 text-center space-y-6 animate-in fade-in zoom-in slide-in-from-bottom-4 duration-500">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 bg-brand-success/20 rounded-full animate-ping"></div>
                <div className="relative bg-brand-success w-24 h-24 rounded-full flex items-center justify-center text-white shadow-lg">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
              </div>
              <div className="space-y-2">
                <h2 className="text-2xl font-bold text-slate-800">Task Assigned Successfully</h2>
                <p className="text-slate-500 max-w-sm mx-auto">
                  The assignment details have been logged and the technician has been scheduled.
                </p>
              </div>
              <button 
                onClick={() => setIsSuccess(false)}
                className="text-brand-primary font-bold hover:text-brand-secondary transition-colors"
              >
                Perform another assignment
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-7">
              {error && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-655 dark:text-red-400 text-sm font-semibold rounded-2xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  {error}
                </div>
              )}

              {/* Request Selection */}
              <div className="space-y-2 group">
                <label htmlFor="requestId" className="block text-sm font-bold text-slate-700 transition-colors group-focus-within:text-brand-primary">
                  Select Maintenance Request <span className="text-brand-danger">*</span>
                </label>
                <div className="relative">
                  {loading ? (
                    <div className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                      <span className="text-sm font-bold text-slate-400">Loading pending requests...</span>
                    </div>
                  ) : (
                    <select
                      id="requestId"
                      name="requestId"
                      value={formData.requestId}
                      onChange={handleChange}
                      disabled={submitting}
                      className={`w-full appearance-none px-4 py-3.5 bg-slate-50 border rounded-xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all cursor-pointer ${
                        errors.requestId ? "border-brand-danger bg-red-50" : "border-slate-200"
                      }`}
                    >
                      <option value="" disabled>Choose a pending request...</option>
                      {requests.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.title} - {r.resourceName || r.resourceId}
                        </option>
                      ))}
                    </select>
                  )}
                  {!loading && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.requestId && (
                  <p className="text-xs font-semibold text-brand-danger flex items-center gap-1 mt-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a0 0 000-2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    A request must be selected
                  </p>
                )}
              </div>

              {/* Priority Display (Read-only Highlight) */}
              {currentPriority && (
                <div className="animate-in fade-in slide-in-from-left-2 duration-300">
                  <div className={`inline-flex items-center gap-2 px-4 py-1.5 rounded-lg border text-sm font-bold ${currentPriority.color}`}>
                    <span className="w-2 h-2 rounded-full bg-current animate-pulse"></span>
                    Priority Level: {currentPriority.label}
                  </div>
                </div>
              )}

              {/* Staff Selection */}
              <div className="space-y-2 group">
                <label htmlFor="staffId" className="block text-sm font-bold text-slate-700 transition-colors group-focus-within:text-brand-primary">
                  Assign to Staff <span className="text-brand-danger">*</span>
                </label>
                <div className="relative">
                  {loading ? (
                    <div className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                      <span className="text-sm font-bold text-slate-400">Loading technicians...</span>
                    </div>
                  ) : (
                    <select
                      id="staffId"
                      name="staffId"
                      value={formData.staffId}
                      onChange={handleChange}
                      disabled={submitting}
                      className={`w-full appearance-none px-4 py-3.5 bg-slate-50 border rounded-xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all cursor-pointer ${
                        errors.staffId ? "border-brand-danger bg-red-50" : "border-slate-200"
                      }`}
                    >
                      <option value="" disabled>Choose a technician...</option>
                      {staff.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.name} - {s.department || "General"}
                        </option>
                      ))}
                    </select>
                  )}
                  {!loading && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none text-slate-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.staffId && (
                  <p className="text-xs font-semibold text-brand-danger flex items-center gap-1 mt-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a0 0 000-2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" /></svg>
                    Selection is required for distribution
                  </p>
                )}
              </div>

              {/* Notes */}
              <div className="space-y-2 group">
                <label htmlFor="notes" className="block text-sm font-bold text-slate-700 transition-colors group-focus-within:text-brand-primary">
                  Assignment Notes (Optional)
                </label>
                <textarea
                  id="notes"
                  name="notes"
                  rows={4}
                  placeholder="Provide instructions, location details, or urgency context..."
                  value={formData.notes}
                  onChange={handleChange}
                  disabled={submitting}
                  className="w-full px-4 py-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all resize-none placeholder:text-slate-400"
                ></textarea>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting || loading}
                  className="w-full bg-brand-primary hover:bg-brand-secondary active:scale-[0.98] text-white font-bold py-4.5 px-6 rounded-xl shadow-lg shadow-brand-primary/20 transition-all duration-200 flex items-center justify-center gap-2 disabled:opacity-60"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Assigning Task...</>
                  ) : (
                    <>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                      </svg>
                      Assign Task
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Footer */}
        <div className="bg-slate-50 px-8 py-6 text-center border-t border-slate-100">
           <p className="text-xs text-slate-400 flex items-center justify-center gap-1 font-medium">
             <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" /></svg>
             Internal URMS Maintenance Distribution Panel
           </p>
        </div>
      </div>
    </div>
  );
}
