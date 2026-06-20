"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/lib/auth-context";
import { Loader2 } from "lucide-react";

/**
 * MaintenanceRequestPage Component
 * 
 * Provides a form for university staff/students to submit maintenance requests.
 * Aligns with the Maintenance Management Module requirement: "Log repair and maintenance requests".
 */
export default function MaintenanceRequestPage() {
  const { user } = useAuth();
  const [formData, setFormData] = useState({
    resource: "",
    description: "",
    date: "",
    priority: "Medium",
  });

  const [errors, setErrors] = useState({
    resource: false,
    description: false,
  });

  const [isSubmitted, setIsSubmitted] = useState(false);
  const [resources, setResources] = useState<any[]>([]);
  const [loadingResources, setLoadingResources] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [submissionError, setSubmissionError] = useState<string | null>(null);

  const getToken = useCallback(async () => {
    if (user && typeof user.getIdToken === "function") return user.getIdToken();
    return "dev-token";
  }, [user]);

  useEffect(() => {
    const loadResources = async () => {
      try {
        const token = await getToken();
        const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
        const res = await fetch(`${API}/api/resources`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const json = await res.json();
          setResources(json.data || []);
        }
      } catch (err) {
        console.error("Failed to load resources:", err);
      } finally {
        setLoadingResources(false);
      }
    };
    if (user) {
      loadResources();
    }
  }, [user, getToken]);

  const handleChange = (
    e: React.ChangeEvent<HTMLSelectElement | HTMLTextAreaElement | HTMLInputElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    
    // Clear error when user interacts with the field
    if (errors[name as keyof typeof errors]) {
      setErrors((prev) => ({ ...prev, [name]: false }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Basic validation: Resource and Description are required
    const newErrors = {
      resource: !formData.resource,
      description: !formData.description.trim(),
    };

    setErrors(newErrors);

    // If there are errors, stop submission
    if (newErrors.resource || newErrors.description) {
      return;
    }

    setSubmitting(true);
    setSubmissionError(null);

    try {
      const token = await getToken();
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
      
      const body = {
        resourceId: formData.resource,
        title: formData.description.slice(0, 50) || "Maintenance Request",
        description: formData.description,
        priority: formData.priority,
      };

      const res = await fetch(`${API}/api/maintenance-tickets`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || "Failed to submit maintenance request");
      }

      // Show success state
      setIsSubmitted(true);
      
      // Reset form after a short delay
      setTimeout(() => {
        setIsSubmitted(false);
        setFormData({
          resource: "",
          description: "",
          date: "",
          priority: "Medium",
        });
      }, 3000);
    } catch (err: any) {
      setSubmissionError(err.message || "Failed to submit maintenance request. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex-grow flex items-center justify-center p-4 md:p-8 bg-slate-50 min-h-[calc(100vh-140px)]">
      <div className="w-full max-w-2xl bg-white rounded-3xl shadow-xl border border-slate-100 overflow-hidden transform transition-all">
        {/* Header Section */}
        <div className="bg-brand-primary p-8 text-white relative">
          <div className="relative z-10">
            <h1 className="text-3xl font-extrabold tracking-tight">Submit Maintenance Request</h1>
            <p className="text-blue-100 mt-2 text-lg opacity-90">
              Provide details about the issue to notify our maintenance team.
            </p>
          </div>
          {/* Subtle background decoration */}
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-32 h-32 bg-slate-100 dark:bg-white/10 rounded-full blur-2xl"></div>
          <div className="absolute bottom-0 left-0 -mb-8 -ml-8 w-24 h-24 bg-brand-accent/20 rounded-full blur-xl"></div>
        </div>

        <div className="p-8">
          {isSubmitted ? (
            <div className="py-12 text-center space-y-4 animate-in fade-in zoom-in duration-300">
              <div className="bg-brand-success/10 w-20 h-20 rounded-full flex items-center justify-center mx-auto text-brand-success">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-10 w-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="text-2xl font-bold text-slate-800">Request Submitted!</h2>
              <p className="text-slate-600 max-w-xs mx-auto">
                Your maintenance request has been logged successfully. We will get back to you soon.
              </p>
              <button 
                onClick={() => setIsSubmitted(false)}
                className="mt-6 text-brand-primary font-semibold hover:underline"
              >
                Submit another request
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              {submissionError && (
                <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-655 dark:text-red-400 text-sm font-semibold rounded-2xl flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                  {submissionError}
                </div>
              )}

              {/* Resource Selection */}
              <div className="space-y-2 group">
                <label htmlFor="resource" className="block text-sm font-bold text-slate-700 transition-colors group-focus-within:text-brand-primary">
                  Select Resource <span className="text-brand-danger">*</span>
                </label>
                <div className="relative">
                  {loadingResources ? (
                    <div className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center gap-2">
                      <Loader2 className="w-4 h-4 animate-spin text-brand-primary" />
                      <span className="text-sm font-bold text-slate-400">Loading resources...</span>
                    </div>
                  ) : (
                    <select
                      id="resource"
                      name="resource"
                      value={formData.resource}
                      onChange={handleChange}
                      disabled={submitting}
                      className={`w-full appearance-none px-4 py-3 bg-slate-55 border rounded-xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all cursor-pointer ${
                        errors.resource ? "border-brand-danger bg-red-50" : "border-slate-200"
                      }`}
                    >
                      <option value="" disabled>Choose a resource...</option>
                      {resources.map((r) => (
                        <option key={r.id} value={r.id}>
                          {r.name} ({r.location}) - {r.availability_status}
                        </option>
                      ))}
                    </select>
                  )}
                  {!loadingResources && (
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  )}
                </div>
                {errors.resource && (
                  <p className="text-xs font-medium text-brand-danger flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    Selection is required
                  </p>
                )}
              </div>

              {/* Issue Description */}
              <div className="space-y-2 group">
                <label htmlFor="description" className="block text-sm font-bold text-slate-700 transition-colors group-focus-within:text-brand-primary">
                  Issue Description <span className="text-brand-danger">*</span>
                </label>
                <textarea
                  id="description"
                  name="description"
                  rows={4}
                  placeholder="Tell us what's wrong (e.g., screen flickering, wifi not connecting...)"
                  value={formData.description}
                  onChange={handleChange}
                  disabled={submitting}
                  className={`w-full px-4 py-3 bg-slate-50 border rounded-xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all resize-none placeholder:text-slate-400 ${
                    errors.description ? "border-brand-danger bg-red-50" : "border-slate-200"
                  }`}
                ></textarea>
                {errors.description && (
                  <p className="text-xs font-medium text-brand-danger flex items-center gap-1">
                    <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
                    </svg>
                    A brief description helps us fix it faster
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Date */}
                <div className="space-y-2 group">
                  <label htmlFor="date" className="block text-sm font-bold text-slate-700 transition-colors group-focus-within:text-brand-primary">
                    Requested Date
                  </label>
                  <input
                    id="date"
                    name="date"
                    type="date"
                    value={formData.date}
                    onChange={handleChange}
                    disabled={submitting}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all"
                  />
                </div>

                {/* Priority */}
                <div className="space-y-2 group">
                  <label htmlFor="priority" className="block text-sm font-bold text-slate-700 transition-colors group-focus-within:text-brand-primary">
                    Priority Level
                  </label>
                  <div className="relative">
                    <select
                      id="priority"
                      name="priority"
                      value={formData.priority}
                      onChange={handleChange}
                      disabled={submitting}
                      className="w-full appearance-none px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-brand-primary/10 focus:border-brand-primary outline-none transition-all cursor-pointer"
                    >
                      <option value="Low">Low - Improvement / Minor</option>
                      <option value="Medium">Medium - Normal usage affected</option>
                      <option value="High">High - Urgent / Safety issue</option>
                    </select>
                    <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none text-slate-400">
                      <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Submit Button */}
              <div className="pt-6">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full bg-brand-primary hover:bg-brand-secondary active:scale-[0.98] text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-brand-primary/20 transition-all duration-200 flex items-center justify-center gap-2 group disabled:opacity-60"
                >
                  {submitting ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Submitting Request…</>
                  ) : (
                    <>
                      <span>Submit Request</span>
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 transition-transform group-hover:translate-x-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
        
        {/* Footer Info */}
        <div className="px-8 pb-8 text-center">
          <p className="text-xs text-slate-400 border-t border-slate-100 pt-6">
            University Resource Management System &bull; Maintenance Module v1.0
          </p>
        </div>
      </div>
    </div>
  );
}
