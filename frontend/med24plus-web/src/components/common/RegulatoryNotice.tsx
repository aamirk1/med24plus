import React from "react";
import { AlertCircle, ShieldAlert, Award } from "lucide-react";
import { siteConfig } from "@/config/site";

export const RegulatoryNotice: React.FC = () => {
  return (
    <div className="bg-amber-50 border-b border-amber-200 py-2.5 px-4 text-xs text-amber-900">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-start md:items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0" />
          <p>
            <strong className="font-semibold text-amber-950">Statutory Notice: </strong>
            In compliance with the Drugs and Cosmetics Act, 1940 and Rules, 1945 (India), Schedule H, H1 & X medicines cannot be dispensed without a valid prescription by a Registered Medical Practitioner (RMP).
          </p>
        </div>
        <div className="flex items-center gap-3 shrink-0 text-[11px] text-amber-800 font-medium">
          <span className="flex items-center gap-1">
            <Award className="w-3.5 h-3.5 text-amber-700" />
            Lic: {siteConfig.licenseNumber}
          </span>
          <span className="hidden sm:inline">•</span>
          <span>{siteConfig.pharmacistCouncilReg}</span>
        </div>
      </div>
    </div>
  );
};

