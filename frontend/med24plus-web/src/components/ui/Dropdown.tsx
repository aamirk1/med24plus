"use client";

import React, { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DropdownItem {
  label: string;
  value: string;
  icon?: React.ReactNode;
  disabled?: boolean;
}

export interface DropdownProps {
  label: string;
  items: DropdownItem[];
  onSelect: (item: DropdownItem) => void;
  selectedItem?: string;
  className?: string;
}

export const Dropdown: React.FC<DropdownProps> = ({
  label,
  items,
  onSelect,
  selectedItem,
  className,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative inline-block text-left", className)}>
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="inline-flex items-center justify-between gap-2 px-3.5 py-2 text-xs font-semibold text-[#172B24] bg-white border border-slate-300 rounded-lg hover:bg-slate-50 focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
      >
        <span>{selectedItem || label}</span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
      </button>

      {isOpen && (
        <div className="absolute right-0 mt-1 w-48 rounded-lg bg-white shadow-elevated border border-slate-200 py-1 z-30 animate-in fade-in zoom-in-95 duration-100">
          {items.map((item) => (
            <button
              key={item.value}
              disabled={item.disabled}
              onClick={() => {
                onSelect(item);
                setIsOpen(false);
              }}
              className={cn(
                "w-full text-left px-3.5 py-2 text-xs flex items-center gap-2 transition hover:bg-slate-50",
                selectedItem === item.value ? "text-[#0D9488] font-bold bg-[#F0FDFA]/50" : "text-slate-700",
                item.disabled && "opacity-40 cursor-not-allowed"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

