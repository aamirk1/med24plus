import React from "react";
import { Search, SlidersHorizontal, Download } from "lucide-react";

export interface TableToolbarProps {
  searchQuery: string;
  onSearchChange: (q: string) => void;
  placeholder?: string;
  onFilterToggle?: () => void;
  onExport?: () => void;
  extraActions?: React.ReactNode;
}

export const TableToolbar: React.FC<TableToolbarProps> = ({
  searchQuery,
  onSearchChange,
  placeholder = "Search records...",
  onFilterToggle,
  onExport,
  extraActions,
}) => {
  return (
    <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 pb-3">
      {/* Search Input */}
      <div className="relative flex-1 max-w-sm">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-[#172B24] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F5B]"
        />
      </div>

      {/* Buttons */}
      <div className="flex items-center gap-2">
        {onFilterToggle && (
          <button
            type="button"
            onClick={onFilterToggle}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-500" />
            <span>Filters</span>
          </button>
        )}
        {onExport && (
          <button
            type="button"
            onClick={onExport}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-300 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Export CSV</span>
          </button>
        )}
        {extraActions}
      </div>
    </div>
  );
};
