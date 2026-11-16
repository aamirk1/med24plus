"use client";

import React from "react";
import { Bell, ShieldCheck, ChevronDown, Building2, UserCircle2 } from "lucide-react";
import { adminConfig } from "@/config/admin";

export const Header: React.FC = () => {
  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Branch & License Context */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-blue-50 text-[#0066CC]">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            {adminConfig.pharmacyName}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              Active Unit
            </span>
          </h2>
          <p className="text-[11px] text-slate-500">
            Drug Lic: <span className="font-mono text-slate-700 font-medium">{adminConfig.licenseNo}</span>
          </p>
        </div>
      </div>

      {/* Right controls: Notifications, Pharmacist identity */}
      <div className="flex items-center gap-4">
        {/* Notification Bell */}
        <button
          type="button"
          className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 relative"
          aria-label="View notifications"
        >
          <Bell className="w-5 h-5" />
          <span className="w-2 h-2 rounded-full bg-rose-500 absolute top-2 right-2 ring-2 ring-white" />
        </button>

        {/* Pharmacist Profile */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800">{adminConfig.registeredPharmacistName}</p>
            <p className="text-[10px] text-emerald-600 font-medium flex items-center justify-end gap-1">
              <ShieldCheck className="w-3 h-3" /> {adminConfig.registrationCouncilId}
            </p>
          </div>
          <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-600 font-bold text-xs">
            <UserCircle2 className="w-6 h-6 text-slate-500" />
          </div>
        </div>
      </div>
    </header>
  );
};

