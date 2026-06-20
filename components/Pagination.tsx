import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface PaginationProps {
  currentPage: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
}

export default function Pagination({
  currentPage,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
}: PaginationProps) {
  const totalPages = Math.ceil(totalItems / pageSize) || 1;
  const startRange = (currentPage - 1) * pageSize + 1;
  const endRange = Math.min(currentPage * pageSize, totalItems);

  const sizes = [5, 10, 20, 50];

  return (
    <div className="flex flex-col sm:flex-row items-center justify-between gap-4 px-6 py-4 border-t border-slate-100 dark:border-white/[0.06] bg-slate-50/40 dark:bg-white/[0.02]">
      {/* Items Range Info */}
      <p className="text-xs text-slate-500 dark:text-foreground/40 font-medium">
        Showing <span className="font-semibold text-slate-700 dark:text-foreground/75">{totalItems > 0 ? startRange : 0}</span> to{" "}
        <span className="font-semibold text-slate-700 dark:text-foreground/75">{endRange}</span> of{" "}
        <span className="font-semibold text-slate-700 dark:text-foreground/75">{totalItems}</span> entries
      </p>

      {/* Pagination Controls */}
      <div className="flex flex-wrap items-center gap-3">
        {/* Page Size Selector */}
        <div className="flex items-center gap-2">
          <label htmlFor="pageSize-select" className="text-xs text-slate-500 dark:text-foreground/40 font-medium">
            Page size:
          </label>
          <select
            id="pageSize-select"
            value={pageSize}
            onChange={(e) => onPageSizeChange(Number(e.target.value))}
            className="text-xs font-semibold bg-white dark:bg-white/5 border border-slate-200 dark:border-white/10 rounded-xl px-2.5 py-1.5 focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 dark:text-foreground/80 cursor-pointer"
          >
            {sizes.map((size) => (
              <option key={size} value={size} className="bg-white dark:bg-slate-900 text-slate-900 dark:text-white">
                {size}
              </option>
            ))}
          </select>
        </div>

        {/* Page Navigation Buttons */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => onPageChange(currentPage - 1)}
            disabled={currentPage <= 1}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-foreground/50 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-white/5 active:scale-95 transition-all"
            title="Previous Page"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>

          <span className="text-xs font-semibold text-slate-650 dark:text-foreground/60 px-2 select-none">
            Page {currentPage} of {totalPages}
          </span>

          <button
            onClick={() => onPageChange(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="p-1.5 rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-white/5 text-slate-500 dark:text-foreground/50 hover:bg-slate-50 dark:hover:bg-white/10 disabled:opacity-40 disabled:hover:bg-white dark:disabled:hover:bg-white/5 active:scale-95 transition-all"
            title="Next Page"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
