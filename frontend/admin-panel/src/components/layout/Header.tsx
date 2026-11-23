"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  ShieldCheck,
  Building2,
  UserCircle2,
  CheckCheck,
  AlertCircle,
  FileCheck2,
  ShoppingBag,
  Layers,
  ChevronRight,
} from "lucide-react";
import { adminConfig } from "@/config/admin";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { useAdminCounts } from "@/context/AdminCountsContext";

export const Header: React.FC = () => {
  const pathname = usePathname();
  const { user } = useAdminAuth();
  const { notifications, unreadCount, markAsRead } = useAdminCounts();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (pathname === "/login" || pathname === "/unauthorized") {
    return null;
  }

  const displayName = user?.full_name || adminConfig.registeredPharmacistName;
  const councilId = user?.pharmacist_profile?.registration_number || adminConfig.registrationCouncilId;

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "prescription":
        return <FileCheck2 className="w-4 h-4 text-emerald-600" />;
      case "order":
        return <ShoppingBag className="w-4 h-4 text-blue-600" />;
      case "inventory":
        return <Layers className="w-4 h-4 text-amber-600" />;
      default:
        return <AlertCircle className="w-4 h-4 text-teal-600" />;
    }
  };

  return (
    <header className="h-16 border-b border-slate-200 bg-white px-6 flex items-center justify-between sticky top-0 z-30">
      {/* Branch & License Context */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-teal-50 text-teal-700">
          <Building2 className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-sm font-bold text-slate-800 flex items-center gap-1.5">
            {adminConfig.pharmacyName}
            <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-teal-50 text-teal-700 border border-teal-200">
              Active Unit
            </span>
          </h2>
          <p className="text-[11px] text-slate-500">
            Drug Lic: <span className="font-mono text-slate-700 font-medium">{adminConfig.licenseNo}</span>
          </p>
        </div>
      </div>

      {/* Right controls: Dynamic Notifications, Identity */}
      <div className="flex items-center gap-4">
        {/* Dynamic Notification Bell Dropdown */}
        <div className="relative" ref={dropdownRef}>
          <button
            type="button"
            onClick={() => setIsOpen((prev) => !prev)}
            className="p-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 relative transition"
            aria-label="View notifications"
          >
            <Bell className="w-5 h-5" />
            {unreadCount > 0 && (
              <span className="min-w-[18px] h-[18px] px-1 rounded-full bg-rose-500 text-white text-[10px] font-bold flex items-center justify-center absolute -top-1 -right-1 ring-2 ring-white">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {isOpen && (
            <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white rounded-xl shadow-xl border border-slate-200 overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-150">
              <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
                <div>
                  <h3 className="text-xs font-bold text-slate-800">Pharmacy Alerts</h3>
                  <p className="text-[10px] text-slate-500">Live operational & statutory queue status</p>
                </div>
                {unreadCount > 0 && (
                  <button
                    type="button"
                    onClick={() => markAsRead()}
                    className="text-[11px] font-medium text-teal-600 hover:text-teal-700 flex items-center gap-1"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Mark all read
                  </button>
                )}
              </div>

              <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
                {notifications.length === 0 ? (
                  <div className="p-6 text-center text-xs text-slate-400">No active alerts at this time.</div>
                ) : (
                  notifications.map((item) => (
                    <Link
                      key={item.id}
                      href={item.link}
                      onClick={() => {
                        markAsRead(item.id);
                        setIsOpen(false);
                      }}
                      className={`block p-3.5 hover:bg-slate-50 transition ${
                        !item.isRead ? "bg-teal-50/40" : ""
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <div className="p-2 rounded-lg bg-white border border-slate-200 shrink-0 shadow-sm mt-0.5">
                          {getTypeIcon(item.type)}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-1">
                            <p className="text-xs font-bold text-slate-800 truncate">{item.title}</p>
                            <span className="text-[10px] text-slate-400 shrink-0">{item.timestamp}</span>
                          </div>
                          <p className="text-[11px] text-slate-600 mt-0.5 line-clamp-2">{item.message}</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-400 shrink-0 self-center" />
                      </div>
                    </Link>
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* User Identity */}
        <div className="flex items-center gap-3 pl-3 border-l border-slate-200">
          <div className="text-right">
            <p className="text-xs font-bold text-slate-800">{displayName}</p>
            <p className="text-[10px] text-teal-600 font-medium flex items-center justify-end gap-1">
              <ShieldCheck className="w-3 h-3" /> {councilId}
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

