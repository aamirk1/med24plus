"use client";

import React from "react";
import { Calendar } from "lucide-react";

export interface DateRangePickerProps {
  startDate: string;
  endDate: string;
  onStartDateChange: (date: string) => void;
  onEndDateChange: (date: string) => void;
  label?: string;
}

export const DateRangePicker: React.FC<DateRangePickerProps> = ({
  startDate,
  endDate,
  onStartDateChange,
  onEndDateChange,
  label = "Date Range",
}) => {
  return (
    <div className="inline-flex items-center gap-2 bg-white border border-slate-300 rounded-lg px-2.5 py-1 text-xs">
      <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      <span className="text-[11px] font-medium text-slate-500">{label}:</span>
      <input
        type="date"
        value={startDate}
        onChange={(e) => onStartDateChange(e.target.value)}
        className="text-xs text-slate-700 bg-transparent focus:outline-none border-none p-0 cursor-pointer"
      />
      <span className="text-slate-400">to</span>
      <input
        type="date"
        value={endDate}
        onChange={(e) => onEndDateChange(e.target.value)}
        className="text-xs text-slate-700 bg-transparent focus:outline-none border-none p-0 cursor-pointer"
      />
    </div>
  );
};

