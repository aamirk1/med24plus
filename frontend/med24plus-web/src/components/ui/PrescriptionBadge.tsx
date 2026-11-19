import React from "react";
import { ShieldAlert, Check } from "lucide-react";
import { Badge } from "./Badge";

export interface PrescriptionBadgeProps {
  required: boolean;
  scheduleType?: "OTC" | "SCHEDULE_H" | "SCHEDULE_H1" | "AYUSH" | "DEVICE";
}

export const PrescriptionBadge: React.FC<PrescriptionBadgeProps> = ({
  required,
  scheduleType = "OTC",
}) => {
  if (!required) {
    return (
      <Badge variant="neutral" size="sm" className="gap-1 text-[10px] font-semibold bg-slate-50 text-slate-600 border border-slate-200">
        <Check className="w-2.5 h-2.5 text-teal-600" />
        <span>No Rx Needed</span>
      </Badge>
    );
  }

  return (
    <Badge variant="warning" size="sm" className="gap-1 text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
      <ShieldAlert className="w-2.5 h-2.5 text-amber-700" />
      <span>Rx Required {scheduleType !== "OTC" ? `(${scheduleType})` : ""}</span>
    </Badge>
  );
};

