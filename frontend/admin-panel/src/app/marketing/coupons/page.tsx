"use client";

import React, { useState } from "react";
import { Plus, Tag, Edit3, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_COUPONS } from "@/mock/adminData";
import { CouponItem } from "@/types";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>(MOCK_COUPONS);

  const columns: Column<CouponItem>[] = [
    {
      header: "Coupon Code",
      cell: (cp) => (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#087F5B]" />
          <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {cp.code}
          </span>
        </div>
      ),
    },
    {
      header: "Discount Offer",
      cell: (cp) => (
        <span className="text-xs font-semibold text-emerald-700">
          {cp.discountType === "PERCENT" ? `${cp.value}% Off` : `₹${cp.value} Flat Off`}
        </span>
      ),
    },
    {
      header: "Min Order Value",
      cell: (cp) => <span className="text-xs text-slate-600">₹{cp.minOrderValue}</span>,
    },
    {
      header: "Valid Until",
      accessorKey: "validUntil",
    },
    {
      header: "Redemptions",
      cell: (cp) => <span className="text-xs text-slate-700">{cp.usageCount} used</span>,
    },
    {
      header: "Status",
      cell: (cp) => <StatusBadge status={cp.status} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (cp) => (
        <button
          type="button"
          onClick={() => {
            setCoupons((prev) =>
              prev.map((c) =>
                c.id === cp.id
                  ? { ...c, status: c.status === "ACTIVE" ? "EXPIRED" : "ACTIVE" }
                  : c
              )
            );
          }}
          className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
        >
          {cp.status === "ACTIVE" ? "Deactivate" : "Activate"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotional Coupons & Patient Discounts"
        subtitle="Configure seasonal promotional codes, first-time patient welcome offers, and minimum order criteria."
        actions={
          <button
            type="button"
            onClick={() => {
              const code = prompt("Enter coupon code (e.g. WELCOME50):");
              if (code) {
                const newCp: CouponItem = {
                  id: `cp-${Date.now()}`,
                  code: code.toUpperCase(),
                  discountType: "FLAT",
                  value: 50,
                  minOrderValue: 400,
                  validUntil: "31 Dec 2026",
                  usageCount: 0,
                  status: "ACTIVE",
                };
                setCoupons((prev) => [newCp, ...prev]);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#087F5B] hover:bg-[#066649] text-white rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create New Coupon</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={coupons}
        keyExtractor={(cp) => cp.id}
        emptyMessage="No promotional coupons active."
      />
    </div>
  );
}

