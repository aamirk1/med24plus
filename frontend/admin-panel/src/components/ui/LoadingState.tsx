"use client";

import React from "react";
import { Loader2 } from "lucide-react";

export interface LoadingStateProps {
  message?: string;
  minHeight?: string;
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  message = "Loading records...",
  minHeight = "min-h-[240px]",
}) => {
  return (
    <div className={`flex flex-col items-center justify-center ${minHeight} p-8 text-center bg-white rounded-xl border border-slate-200/80`}>
      <Loader2 className="w-8 h-8 text-[#087F5B] animate-spin mb-3" />
      <p className="text-xs font-medium text-slate-500">{message}</p>
    </div>
  );
};

