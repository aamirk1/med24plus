import React from "react";
import { PackageOpen } from "lucide-react";

export interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center text-center p-8 border border-dashed border-slate-200 rounded-xl bg-slate-50/50">
      <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2.5">
        {icon || <PackageOpen className="w-5 h-5" />}
      </div>
      <h4 className="text-sm font-bold text-[#172B24]">{title}</h4>
      {description && <p className="text-xs text-slate-500 max-w-sm mt-1">{description}</p>}
      {action && <div className="mt-3.5">{action}</div>}
    </div>
  );
};

export const LoadingState: React.FC<{ message?: string }> = ({
  message = "Loading records...",
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 space-y-3">
      <div className="w-6 h-6 border-2 border-[#087F5B] border-t-transparent rounded-full animate-spin" />
      <span className="text-xs font-medium text-slate-500">{message}</span>
    </div>
  );
};
