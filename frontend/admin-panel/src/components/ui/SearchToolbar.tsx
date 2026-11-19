"use client";

import React from "react";
import { Search, X } from "lucide-react";

export interface SearchToolbarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchToolbar: React.FC<SearchToolbarProps> = ({
  value,
  onChange,
  placeholder = "Search...",
  className = "",
}) => {
  return (
    <div className={`relative flex items-center ${className}`}>
      <Search className="w-4 h-4 text-slate-400 absolute left-3 pointer-events-none" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full pl-9 pr-8 py-1.5 rounded-lg border border-slate-300 bg-white text-xs text-[#172B24] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
      />
      {value && (
        <button
          type="button"
          onClick={() => onChange("")}
          className="absolute right-2.5 p-0.5 text-slate-400 hover:text-slate-600 rounded-full"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      )}
    </div>
  );
};

