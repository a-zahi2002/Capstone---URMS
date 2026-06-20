import React, { useState } from "react";
import { X, MapPin, Users, Calendar, CheckCircle2, Clock, Info, ShieldCheck } from "lucide-react";
import { ResourceInterface } from "@/data/resources";

interface ResourceModalProps {
  resource: ResourceInterface | null;
  isOpen: boolean;
  onClose: () => void;
}

export default function ResourceModal({ resource, isOpen, onClose }: ResourceModalProps) {
  const [selectedDate, setSelectedDate] = useState<string>("");
  const [selectedSlot, setSelectedSlot] = useState<string>("");

  if (!isOpen || !resource) return null;

  const statusColors = {
    Available: "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20",
    Maintenance: "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20",
    Booked: "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
  };

  const timeSlots = [
    { time: "08:00 AM - 10:00 AM", status: "Available" },
    { time: "10:30 AM - 12:30 PM", status: "Booked" },
    { time: "01:00 PM - 03:00 PM", status: "Available" },
    { time: "03:30 PM - 05:30 PM", status: "Available" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white dark:bg-slate-900 w-full max-w-4xl rounded-3xl shadow-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-slate-800 dark:text-foreground">{resource.name}</h2>
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusColors[resource.status]}`}>
              {resource.status}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 dark:hover:bg-white/5 hover:text-slate-600 dark:hover:text-foreground transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Scrollable Area */}
        <div className="overflow-y-auto flex-1 p-6 md:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* Left Column (Info) */}
            <div className="lg:col-span-7 space-y-8">
              
              {/* Main Image */}
              <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-inner border border-slate-100 dark:border-white/[0.06]">
                <img 
                  src={resource.image} 
                  alt={resource.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/90 dark:bg-slate-900/90 backdrop-blur-md text-blue-600 dark:text-blue-450 shadow-sm uppercase tracking-wider">
                    {resource.category}
                  </span>
                </div>
              </div>

              {/* Description & Quick Stats */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-foreground flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-blue-650 dark:text-brand-primary" />
                  About Facility
                </h3>
                <p className="text-slate-650 dark:text-foreground/70 leading-relaxed">
                  {resource.description}
                </p>
                
                <div className="flex flex-wrap gap-6 mt-6 p-4 bg-slate-50 dark:bg-white/[0.03] rounded-2xl border border-slate-100 dark:border-slate-800">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-foreground/40 font-semibold uppercase">Location</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-foreground">{resource.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-500/10 flex items-center justify-center text-blue-600 dark:text-blue-400">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 dark:text-foreground/40 font-semibold uppercase">Capacity</p>
                      <p className="text-sm font-bold text-slate-800 dark:text-foreground">{resource.capacity} Seats</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specs & Features */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 dark:text-foreground flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-blue-650 dark:text-brand-primary" />
                  Amenities & Tags
                </h3>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-400 dark:text-foreground/40 uppercase tracking-widest mb-2">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {resource.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 dark:bg-blue-500/10 text-blue-700 dark:text-blue-400 text-sm font-medium rounded-lg border border-blue-100 dark:border-blue-500/20">
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 dark:text-foreground/40 uppercase tracking-widest mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-100 dark:bg-white/5 text-slate-605 dark:text-foreground/60 text-xs font-semibold rounded-lg border border-slate-200 dark:border-white/10">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (Booking) */}
            <div className="lg:col-span-5">
              <div className="bg-white dark:bg-slate-900 border text-left border-slate-200 dark:border-slate-800 shadow-xl shadow-slate-200/50 dark:shadow-none rounded-3xl p-6 sticky top-0">
                <h3 className="text-xl font-bold text-slate-800 dark:text-foreground mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-650 dark:text-brand-primary" />
                  Book Facility
                </h3>

                {/* Date Picker (Mock) */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 dark:text-foreground/80 mb-2">Select Date</label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 dark:bg-slate-950/40 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-800 dark:text-foreground focus:outline-none focus:ring-2 focus:ring-brand-primary/20 focus:border-brand-primary transition-all font-medium"
                  />
                </div>

                {/* Time Slots */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-700 dark:text-foreground/80">Available Slots</label>
                    <span className="text-xs text-slate-400 dark:text-foreground/40 flex items-center gap-1"><Clock className="w-3 h-3"/> Timezone: LKT</span>
                  </div>
                  
                  {selectedDate ? (
                    <div className="grid grid-cols-1 gap-2.5">
                      {timeSlots.map((slot, i) => {
                        const isBooked = slot.status === "Booked";
                        const isSelected = selectedSlot === slot.time;
                        return (
                          <button
                            key={i}
                            disabled={isBooked}
                            onClick={() => setSelectedSlot(slot.time)}
                            className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                              isBooked 
                                ? "bg-slate-50 dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-400 dark:text-foreground/30 cursor-not-allowed opacity-70" 
                                : isSelected 
                                  ? "bg-brand-primary border-brand-primary text-white shadow-md shadow-brand-primary/30 ring-2 ring-brand-primary ring-offset-2" 
                                  : "bg-white dark:bg-white/5 border-slate-200 dark:border-white/10 text-slate-700 dark:text-foreground/70 hover:border-brand-primary hover:bg-brand-primary/5"
                            }`}
                          >
                            <span>{slot.time}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                              isBooked ? "bg-slate-200 text-slate-500" : isSelected ? "bg-slate-200 dark:bg-white/20 text-white" : "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20"
                            }`}>
                              {slot.status}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-8 rounded-xl border-2 border-dashed border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950/20 flex flex-col items-center justify-center text-center">
                      <Calendar className="w-8 h-8 text-slate-300 dark:text-slate-700 mb-2" />
                      <p className="text-sm font-medium text-slate-500 dark:text-foreground/50">Please select a date to view slots</p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button 
                  disabled={!selectedDate || !selectedSlot || resource.status === "Maintenance"}
                  className="w-full py-4 rounded-xl font-bold text-white bg-brand-primary hover:bg-brand-secondary active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-brand-primary shadow-xl shadow-brand-primary/20"
                >
                  {resource.status === "Maintenance" 
                    ? "Currently in Maintenance" 
                    : !selectedDate 
                      ? "Select a Date"
                      : !selectedSlot 
                        ? "Select a Time Slot"
                        : "Confirm Booking"}
                </button>
                <p className="text-center text-xs text-slate-400 dark:text-foreground/30 mt-4">
                  By booking, you agree to the university's facility usage policy.
                </p>
              </div>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
