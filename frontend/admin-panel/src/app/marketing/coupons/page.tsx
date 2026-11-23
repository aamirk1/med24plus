"use client";

import React, { useState } from "react";
import { Plus, Tag, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CouponItem } from "@/types";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [discountValue, setDiscountValue] = useState("10");
  const [minOrder, setMinOrder] = useState("500");

  const handleCreateCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const newCp: CouponItem = {
      id: `cp-${Date.now()}`,
      code: code.trim().toUpperCase(),
      discountType,
      value: parseFloat(discountValue) || 10,
      minOrderValue: parseFloat(minOrder) || 0,
      validUntil: "31 Dec 2026",
      usageCount: 0,
      status: "ACTIVE",
    };

    setCoupons((prev) => [newCp, ...prev]);
    setCode("");
    setIsModalOpen(false);
  };

  const columns: Column<CouponItem>[] = [
    {
      header: "Coupon Code",
      cell: (cp) => (
        <div className="flex items-center gap-2">
          <Tag className="w-4 h-4 text-[#0D9488]" />
          <span className="font-mono font-bold text-slate-900 text-xs bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
            {cp.code}
          </span>
        </div>
      ),
    },
    {
      header: "Discount Offer",
      cell: (cp) => (
        <span className="text-xs font-semibold text-teal-700">
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
        subtitle="Configure promotional codes, patient welcome offers, and order discounts."
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold shadow-sm transition"
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
        emptyMessage="No promotional coupons active. Click 'Create New Coupon' to add one."
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Create New Coupon</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleCreateCoupon} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Coupon Code *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. FLAT50 or MEDSAVE20"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Type</label>
                  <select
                    value={discountType}
                    onChange={(e: any) => setDiscountType(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  >
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat (₹)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Value</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Minimum Order Value (₹)
                </label>
                <input
                  type="number"
                  min="0"
                  value={minOrder}
                  onChange={(e) => setMinOrder(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg shadow-sm"
                >
                  Create Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
