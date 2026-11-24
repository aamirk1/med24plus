import React from "react";

export interface DashboardStatCardProps {
  label: string;
  value: string | number;
  change?: string;
  isPositive?: boolean;
  icon: React.ReactNode;
  alert?: boolean;
}

export const DashboardStatCard: React.FC<DashboardStatCardProps> = ({
  label,
  value,
  change,
  isPositive = true,
  icon,
  alert = false,
}) => {
  return (
    <div
      className={`rounded-xl border p-5 shadow-subtle text-left transition ${
        alert
          ? "bg-amber-50/30 border-amber-200"
          : "bg-white border-slate-200/80 hover:border-slate-300"
      }`}
    >
      <div className="flex items-center justify-between">
        <span className="text-xs font-semibold text-slate-500">{label}</span>
        <div
          className={`p-2 rounded-lg ${
            alert ? "bg-amber-100 text-amber-700" : "bg-blue-50 text-[#0052CC]"
          }`}
        >
          {icon}
        </div>
      </div>
      <div className="mt-3">
        <p className="text-2xl font-extrabold text-[#172B24] tracking-tight">{value}</p>
        {change && (
          <p
            className={`text-[11px] font-semibold mt-1 flex items-center gap-1 ${
              alert
                ? "text-amber-700"
                : isPositive
                ? "text-[#16A34A]"
                : "text-[#DC2626]"
            }`}
          >
            <span>{change}</span>
          </p>
        )}
      </div>
    </div>
  );
};
