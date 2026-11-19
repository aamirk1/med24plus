import React from "react";
import { CheckCircle2, Clock, XCircle, AlertTriangle, Truck, Package } from "lucide-react";

export interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  const norm = status.toLowerCase();

  if (norm.includes("approved") || norm.includes("good") || norm.includes("delivered") || norm === "active") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
        <CheckCircle2 className="w-3 h-3" />
        <span>{status}</span>
      </span>
    );
  }

  if (norm.includes("pending") || norm.includes("review") || norm.includes("packed")) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-amber-50 text-amber-700 border border-amber-200">
        <Clock className="w-3 h-3" />
        <span>{status}</span>
      </span>
    );
  }

  if (norm.includes("near_expiry") || norm.includes("low_stock") || norm.includes("on_leave")) {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-orange-50 text-orange-700 border border-orange-200">
        <AlertTriangle className="w-3 h-3" />
        <span>{status}</span>
      </span>
    );
  }

  if (norm.includes("rejected") || norm.includes("cancelled") || norm.includes("expired") || norm === "blocked" || norm === "inactive") {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full bg-red-50 text-red-700 border border-red-200">
        <XCircle className="w-3 h-3" />
        <span>{status}</span>
      </span>
    );
  }

  return (
    <span className="inline-flex items-center text-[11px] font-semibold px-2 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200">
      {status}
    </span>
  );
};
