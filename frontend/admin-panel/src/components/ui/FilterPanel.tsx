"use client";

import React from "react";
import { X, RotateCcw } from "lucide-react";

export interface FilterOption {
  label: string;
  value: string;
}

export interface FilterGroup {
  id: string;
  name: string;
  options: FilterOption[];
  selectedValue?: string;
}

export interface FilterPanelProps {
  isOpen: boolean;
  onClose: () => void;
  groups: FilterGroup[];
  selectedFilters: Record<string, string>;
  onFilterChange: (groupId: string, value: string) => void;
  onReset: () => void;
}

export const FilterPanel: React.FC<FilterPanelProps> = ({
  isOpen,
  onClose,
  groups,
  selectedFilters,
  onFilterChange,
  onReset,
}) => {
  if (!isOpen) return null;

  return (
    <div className="bg-white border border-slate-200 rounded-xl p-4 mb-4 shadow-sm space-y-4">
      <div className="flex items-center justify-between border-b border-slate-100 pb-2">
        <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
          Filter Options
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={onReset}
            type="button"
            className="inline-flex items-center gap-1 text-[11px] text-slate-500 hover:text-slate-800 transition"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Reset</span>
          </button>
          <button
            onClick={onClose}
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {groups.map((group) => (
          <div key={group.id} className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-700">
              {group.name}
            </label>
            <select
              value={selectedFilters[group.id] || "ALL"}
              onChange={(e) => onFilterChange(group.id, e.target.value)}
              className="w-full px-2.5 py-1.5 text-xs rounded-lg border border-slate-300 bg-white text-slate-800 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
            >
              <option value="ALL">All {group.name}</option>
              {group.options.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {opt.label}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
    </div>
  );
};

