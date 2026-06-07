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
    Available: "bg-green-100 text-green-700 border-green-200",
    Maintenance: "bg-orange-100 text-orange-700 border-orange-200",
    Booked: "bg-red-100 text-red-700 border-red-200",
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
      <div className="relative bg-white w-full max-w-4xl rounded-3xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-white z-10 sticky top-0">
          <div className="flex items-center gap-3">
            <h2 className="text-2xl font-extrabold text-slate-800">{resource.name}</h2>
            <span className={`px-3 py-1 text-xs font-bold rounded-full border ${statusColors[resource.status]}`}>
              {resource.status}
            </span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 rounded-full text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition-colors"
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
              <div className="relative w-full h-64 md:h-80 rounded-2xl overflow-hidden shadow-inner border border-slate-100">
                <img 
                  src={resource.image} 
                  alt={resource.name} 
                  className="w-full h-full object-cover"
                />
                <div className="absolute top-4 left-4">
                  <span className="px-3 py-1.5 text-xs font-bold rounded-lg bg-white/90 backdrop-blur-md text-blue-600 shadow-sm uppercase tracking-wider">
                    {resource.category}
                  </span>
                </div>
              </div>

              {/* Description & Quick Stats */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-3">
                  <Info className="w-5 h-5 text-blue-600" />
                  About Facility
                </h3>
                <p className="text-slate-600 leading-relaxed">
                  {resource.description}
                </p>
                
                <div className="flex flex-wrap gap-6 mt-6 p-4 bg-slate-50 rounded-2xl border border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <MapPin className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase">Location</p>
                      <p className="text-sm font-bold text-slate-800">{resource.location}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                      <Users className="w-5 h-5" />
                    </div>
                    <div>
                      <p className="text-xs text-slate-500 font-semibold uppercase">Capacity</p>
                      <p className="text-sm font-bold text-slate-800">{resource.capacity} Seats</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Specs & Features */}
              <div>
                <h3 className="text-lg font-bold text-slate-800 flex items-center gap-2 mb-4">
                  <ShieldCheck className="w-5 h-5 text-blue-600" />
                  Amenities & Tags
                </h3>
                <div className="mb-4">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Features</p>
                  <div className="flex flex-wrap gap-2">
                    {resource.features.map((feature, i) => (
                      <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 text-blue-700 text-sm font-medium rounded-lg border border-blue-100">
                        <CheckCircle2 className="w-4 h-4 text-blue-500" />
                        {feature}
                      </div>
                    ))}
                  </div>
                </div>
                <div>
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest mb-2">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {resource.tags.map((tag, i) => (
                      <span key={i} className="px-3 py-1.5 bg-slate-100 text-slate-600 text-xs font-semibold rounded-lg border border-slate-200">
                        #{tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>

            </div>

            {/* Right Column (Booking) */}
            <div className="lg:col-span-5">
              <div className="bg-white border text-left border-slate-200 shadow-xl shadow-slate-200/50 rounded-3xl p-6 sticky top-0">
                <h3 className="text-xl font-bold text-slate-800 mb-6 flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-blue-600" />
                  Book Facility
                </h3>

                {/* Date Picker (Mock) */}
                <div className="mb-6">
                  <label className="block text-sm font-bold text-slate-700 mb-2">Select Date</label>
                  <input 
                    type="date" 
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all font-medium"
                  />
                </div>

                {/* Time Slots */}
                <div className="mb-8">
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-700">Available Slots</label>
                    <span className="text-xs text-slate-400 flex items-center gap-1"><Clock className="w-3 h-3"/> Timezone: LKT</span>
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
                                ? "bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed opacity-70" 
                                : isSelected 
                                  ? "bg-blue-600 border-blue-600 text-white shadow-md shadow-blue-600/30 ring-2 ring-blue-600 ring-offset-2" 
                                  : "bg-white border-slate-200 text-slate-700 hover:border-blue-300 hover:bg-blue-50"
                            }`}
                          >
                            <span>{slot.time}</span>
                            <span className={`text-xs font-bold px-2 py-1 rounded-md ${
                              isBooked ? "bg-slate-200 text-slate-500" : isSelected ? "bg-slate-200 dark:bg-white/20 text-white" : "bg-green-100 text-green-700"
                            }`}>
                              {slot.status}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="px-4 py-8 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center text-center">
                      <Calendar className="w-8 h-8 text-slate-300 mb-2" />
                      <p className="text-sm font-medium text-slate-500">Please select a date to view slots</p>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button 
                  disabled={!selectedDate || !selectedSlot || resource.status === "Maintenance"}
                  className="w-full py-4 rounded-xl font-bold text-white bg-blue-600 hover:bg-blue-700 active:scale-[0.98] transition-all disabled:opacity-50 disabled:active:scale-100 disabled:hover:bg-blue-600 shadow-xl shadow-blue-600/20"
                >
                  {resource.status === "Maintenance" 
                    ? "Currently in Maintenance" 
                    : !selectedDate 
                      ? "Select a Date"
                      : !selectedSlot 
                        ? "Select a Time Slot"
                        : "Confirm Booking"}
                </button>
                <p className="text-center text-xs text-slate-400 mt-4">
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
