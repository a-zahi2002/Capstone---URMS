import React from "react";
import { Users, MapPin } from "lucide-react";
import { ResourceInterface } from "@/data/resources";

interface ResourceCardProps {
  resource: ResourceInterface;
  onClick: () => void;
}

export default function ResourceCard({ resource, onClick }: ResourceCardProps) {
  const statusColors = {
    Available: "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400 border-green-200 dark:border-green-500/20",
    Maintenance: "bg-orange-100 dark:bg-orange-500/10 text-orange-700 dark:text-orange-400 border-orange-200 dark:border-orange-500/20",
    Booked: "bg-red-100 dark:bg-red-500/10 text-red-700 dark:text-red-400 border-red-200 dark:border-red-500/20",
  };

  return (
    <div
      onClick={onClick}
      className="group bg-white dark:bg-slate-900 rounded-2xl shadow-sm hover:shadow-xl border border-slate-100 dark:border-white/[0.06] overflow-hidden cursor-pointer transition-all duration-300 transform hover:-translate-y-1 flex flex-col h-full"
    >
      {/* Image Section */}
      <div className="relative h-48 w-full overflow-hidden">
        <img
          src={resource.image}
          alt={resource.name}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />
        <div className="absolute top-4 right-4">
          <span
            className={`px-3 py-1 text-xs font-bold rounded-full border ${
              statusColors[resource.status]
            } shadow-sm backdrop-blur-sm bg-white/90 dark:bg-slate-900/90`}
          >
            {resource.status}
          </span>
        </div>
      </div>

      {/* Body Section */}
      <div className="p-6 flex flex-col flex-grow">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md uppercase tracking-wider">
            {resource.category}
          </span>
        </div>

        <h3 className="text-xl font-bold text-slate-800 dark:text-foreground mb-2 line-clamp-1">
          {resource.name}
        </h3>

        <div className="flex items-center text-slate-500 dark:text-foreground/50 text-sm mb-4 space-x-4">
          <div className="flex items-center space-x-1">
            <MapPin className="w-4 h-4 text-slate-400" />
            <span className="truncate max-w-[120px]">{resource.location}</span>
          </div>
          <div className="flex items-center space-x-1">
            <Users className="w-4 h-4 text-slate-400" />
            <span>{resource.capacity} Seats</span>
          </div>
        </div>

        {/* Tags */}
        <div className="flex flex-wrap gap-2 mb-6 mt-auto">
          {resource.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="px-2.5 py-1 text-xs font-medium text-slate-600 dark:text-foreground/70 bg-slate-100 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10"
            >
              {tag}
            </span>
          ))}
          {resource.tags.length > 2 && (
            <span className="px-2.5 py-1 text-xs font-medium text-slate-400 dark:text-foreground/50 bg-slate-50 dark:bg-white/5 rounded-lg border border-slate-200 dark:border-white/10">
              +{resource.tags.length - 2}
            </span>
          )}
        </div>

        <div className="pt-4 border-t border-slate-100 dark:border-white/[0.06]">
          <button className="w-full py-2.5 rounded-xl bg-slate-50 dark:bg-white/5 text-blue-600 dark:text-blue-400 font-semibold text-sm hover:bg-blue-600 hover:text-white dark:hover:bg-brand-primary transition-colors duration-200">
            View Details
          </button>
        </div>
      </div>
    </div>
  );
}
