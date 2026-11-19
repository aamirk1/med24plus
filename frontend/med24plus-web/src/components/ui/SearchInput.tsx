import React from "react";
import { Search, X } from "lucide-react";
import { cn } from "@/lib/utils";

export interface SearchInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  onClear?: () => void;
}

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, value, onChange, onClear, placeholder = "Search medicines, symptoms, brands...", ...props }, ref) => {
    return (
      <div className="relative w-full flex items-center">
        <Search className="w-4 h-4 text-slate-400 absolute left-3.5 pointer-events-none" />
        <input
          ref={ref}
          type="text"
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          className={cn(
            "w-full rounded-full border border-slate-300 bg-white pl-10 pr-9 py-2 text-sm text-[#172B24] placeholder:text-slate-400 shadow-xs transition focus:outline-none focus:ring-2 focus:ring-[#0D9488] focus:border-transparent",
            className
          )}
          {...props}
        />
        {value && onClear && (
          <button
            type="button"
            onClick={onClear}
            className="absolute right-3 p-0.5 rounded-full text-slate-400 hover:text-slate-600 hover:bg-slate-100"
            aria-label="Clear search"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

