"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  FileCheck2,
  Package,
  Layers,
  ShoppingBag,
  ShieldAlert,
  Settings,
  Users,
  AlertTriangle,
  History,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

const navItems = [
  { name: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { name: "Rx Verification Queue", href: "/dashboard#prescriptions", icon: FileCheck2, badge: "3 New" },
  { name: "Dispensing & Orders", href: "/dashboard#orders", icon: ShoppingBag },
  { name: "Inventory & Batches", href: "/dashboard#inventory", icon: Layers, badge: "2 Expiries" },
  { name: "Products Catalog", href: "/dashboard#products", icon: Package },
  { name: "Schedule H/H1 Audit", href: "/dashboard#compliance", icon: ShieldAlert },
  { name: "Dispensing Records", href: "/dashboard#audit-trail", icon: History },
  { name: "Pharmacist Staff", href: "/dashboard#staff", icon: Users },
  { name: "Settings", href: "/dashboard#settings", icon: Settings },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0">
      <div className="p-4 space-y-6">
        <BrandLogo />

        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Pharmacy Management
          </p>
          <nav className="space-y-1 pt-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-medium transition ${
                    isActive
                      ? "bg-[#0066CC] text-white"
                      : "text-slate-300 hover:bg-slate-800 hover:text-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Icon className="w-4 h-4 shrink-0" />
                    <span>{item.name}</span>
                  </div>
                  {item.badge && (
                    <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {item.badge}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Indian Regulatory Status Footer inside Sidebar */}
      <div className="p-4 border-t border-slate-800 bg-slate-950/60">
        <div className="flex items-start gap-2 text-xs text-slate-400">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
          <div className="text-[11px] leading-relaxed">
            <p className="text-slate-200 font-semibold">Strict Audit Log Active</p>
            <p className="text-[10px] text-slate-400">Schedule H & H1 logs recorded in tamper-evident ledger.</p>
          </div>
        </div>
      </div>
    </aside>
  );
};

