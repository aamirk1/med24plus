"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Package,
  Layers,
  ShoppingBag,
  Users,
  FileCheck2,
  Truck,
  IndianRupee,
  Tag,
  UserCheck,
  Settings,
  ChevronDown,
  ChevronRight,
  ShieldAlert,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

interface NavSubItem {
  name: string;
  href: string;
  badge?: string;
}

interface NavGroup {
  title: string;
  icon: React.ComponentType<{ className?: string }>;
  href?: string;
  badge?: string;
  children?: NavSubItem[];
}

const navGroups: NavGroup[] = [
  {
    title: "Dashboard",
    icon: LayoutDashboard,
    href: "/dashboard",
  },
  {
    title: "Catalog",
    icon: Package,
    children: [
      { name: "Products", href: "/catalog/products" },
      { name: "Categories", href: "/catalog/categories" },
      { name: "Brands", href: "/catalog/brands" },
    ],
  },
  {
    title: "Inventory",
    icon: Layers,
    children: [
      { name: "Stock Management", href: "/inventory/stock" },
      { name: "Batch Management", href: "/inventory/batches", badge: "FEFO" },
      { name: "Expiry Tracking", href: "/inventory/expiries", badge: "3 Near" },
    ],
  },
  {
    title: "Orders",
    icon: ShoppingBag,
    href: "/orders",
    badge: "14",
  },
  {
    title: "Customers",
    icon: Users,
    href: "/customers",
  },
  {
    title: "Prescriptions",
    icon: FileCheck2,
    href: "/prescriptions",
    badge: "5 New",
  },
  {
    title: "Delivery",
    icon: Truck,
    children: [
      { name: "Delivery Management", href: "/delivery" },
      { name: "Delivery Partners", href: "/delivery/partners" },
    ],
  },
  {
    title: "Finance",
    icon: IndianRupee,
    children: [
      { name: "Payments & Settlements", href: "/finance/payments" },
      { name: "Refunds", href: "/finance/refunds" },
      { name: "GST & Sales Reports", href: "/finance/reports" },
    ],
  },
  {
    title: "Marketing",
    icon: Tag,
    children: [
      { name: "Coupons & Discounts", href: "/marketing/coupons" },
      { name: "Promotional Banners", href: "/marketing/banners" },
    ],
  },
  {
    title: "Staff & Pharmacists",
    icon: UserCheck,
    children: [
      { name: "Staff Directory", href: "/staff" },
      { name: "Registered Pharmacists", href: "/staff/pharmacists" },
    ],
  },
  {
    title: "Settings",
    icon: Settings,
    children: [
      { name: "General Settings", href: "/settings/general" },
      { name: "Store Information", href: "/settings/store" },
      { name: "Delivery Settings", href: "/settings/delivery" },
      { name: "Notification Settings", href: "/settings/notifications" },
    ],
  },
];

export const Sidebar: React.FC = () => {
  const pathname = usePathname();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Catalog: true,
    Inventory: true,
    Delivery: false,
    Finance: false,
    Marketing: false,
    "Staff & Pharmacists": false,
    Settings: false,
  });

  const toggleGroup = (title: string) => {
    setOpenGroups((prev) => ({ ...prev, [title]: !prev[title] }));
  };

  return (
    <aside className="w-64 bg-slate-900 border-r border-slate-800 flex flex-col justify-between shrink-0 h-screen sticky top-0 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-800">
      <div className="p-4 space-y-4">
        <BrandLogo />

        <div className="space-y-1">
          <p className="px-3 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
            Pharmacy Management
          </p>

          <nav className="space-y-1 pt-1">
            {navGroups.map((group) => {
              const Icon = group.icon;
              const hasChildren = Boolean(group.children && group.children.length > 0);
              const isGroupActive = hasChildren
                ? group.children?.some((c) => pathname.startsWith(c.href))
                : pathname === group.href;
              const isOpen = openGroups[group.title] || isGroupActive;

              if (!hasChildren && group.href) {
                return (
                  <Link
                    key={group.title}
                    href={group.href}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                      pathname === group.href
                        ? "bg-[#087F5B] text-white"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{group.title}</span>
                    </div>
                    {group.badge && (
                      <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        {group.badge}
                      </span>
                    )}
                  </Link>
                );
              }

              return (
                <div key={group.title} className="space-y-0.5">
                  <button
                    type="button"
                    onClick={() => toggleGroup(group.title)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition ${
                      isGroupActive
                        ? "text-white bg-slate-800/80"
                        : "text-slate-300 hover:bg-slate-800 hover:text-white"
                    }`}
                  >
                    <div className="flex items-center gap-2.5">
                      <Icon className="w-4 h-4 shrink-0" />
                      <span>{group.title}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      {group.badge && (
                        <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                          {group.badge}
                        </span>
                      )}
                      {isOpen ? (
                        <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                      ) : (
                        <ChevronRight className="w-3.5 h-3.5 text-slate-400" />
                      )}
                    </div>
                  </button>

                  {isOpen && group.children && (
                    <div className="pl-8 pr-2 py-0.5 space-y-0.5">
                      {group.children.map((sub) => {
                        const isSubActive = pathname === sub.href;
                        return (
                          <Link
                            key={sub.name}
                            href={sub.href}
                            className={`flex items-center justify-between px-2.5 py-1.5 rounded-md text-[11px] font-medium transition ${
                              isSubActive
                                ? "bg-[#087F5B] text-white"
                                : "text-slate-400 hover:text-white hover:bg-slate-800/50"
                            }`}
                          >
                            <span>{sub.name}</span>
                            {sub.badge && (
                              <span className="text-[9px] font-bold px-1 py-0.2 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                                {sub.badge}
                              </span>
                            )}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Compliance / Regulatory Status */}
      <div className="p-3.5 m-3 border border-slate-800 bg-slate-950/80 rounded-xl space-y-1.5">
        <div className="flex items-center gap-2 text-xs font-semibold text-slate-200">
          <ShieldAlert className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>Rule 65 Registered</span>
        </div>
        <p className="text-[10px] text-slate-400 leading-snug">
          Retail Drug Lic. 20B/21B valid. Supervising Pharmacist on duty.
        </p>
      </div>
    </aside>
  );
};
