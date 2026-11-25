"use client";

import React, { useState, useEffect } from "react";
import { Plus, Tag, Trash2, CheckCircle2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { CouponItem } from "@/types";
import { apiClient } from "@/services/api";

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState<CouponItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState<"PERCENT" | "FLAT">("PERCENT");
  const [discountValue, setDiscountValue] = useState("10");
  const [minOrder, setMinOrder] = useState("500");
  const [validUntil, setValidUntil] = useState("31 Dec 2026");
  const [feedback, setFeedback] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fetchCoupons = async () => {
    setIsLoading(true);
    try {
      const res: any = await apiClient("/admin/coupons");
      const list = res?.data || res?.items || (Array.isArray(res) ? res : []);
      if (Array.isArray(list)) {
        setCoupons(list);
      }
    } catch (err: any) {
      console.warn("Could not fetch coupons from backend, trying public endpoint:", err);
      try {
        const publicRes: any = await apiClient("/coupons");
        const list = publicRes?.data || [];
        if (Array.isArray(list) && list.length > 0) {
          setCoupons(list);
        }
      } catch (_) {}
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchCoupons();
  }, []);

  const handleCreateCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) return;

    const payload = {
      code: code.trim().toUpperCase(),
      discountType,
      value: parseFloat(discountValue) || 10,
      minOrderValue: parseFloat(minOrder) || 0,
      validUntil: validUntil || "31 Dec 2026",
      status: "ACTIVE",
    };

    try {
      const res: any = await apiClient("/admin/coupons", {
        method: "POST",
        data: payload,
      });

      const created = res?.data || {
        id: `cp-${Date.now()}`,
        ...payload,
        usageCount: 0,
      };

      setCoupons((prev) => [created, ...prev.filter((c) => c.code !== created.code)]);
      setCode("");
      setIsModalOpen(false);
      setFeedback({ message: `Coupon "${payload.code}" created and published to mobile app!`, type: "success" });
      setTimeout(() => setFeedback(null), 4000);
    } catch (err: any) {
      setFeedback({ message: err?.message || "Failed to save coupon to server", type: "error" });
      setTimeout(() => setFeedback(null), 4000);
    }
  };

  const handleToggleStatus = async (cp: CouponItem) => {
    const nextStatus = cp.status === "ACTIVE" ? "EXPIRED" : "ACTIVE";
    try {
      await apiClient(`/admin/coupons/${cp.id}`, {
        method: "PATCH",
        data: { status: nextStatus },
      });
      setCoupons((prev) =>
        prev.map((c) => (c.id === cp.id ? { ...c, status: nextStatus } : c))
      );
    } catch (_) {
      // Fallback local toggle
      setCoupons((prev) =>
        prev.map((c) => (c.id === cp.id ? { ...c, status: nextStatus } : c))
      );
    }
  };

  const handleDelete = async (cp: CouponItem) => {
    if (!confirm(`Are you sure you want to delete coupon ${cp.code}?`)) return;
    try {
      await apiClient(`/admin/coupons/${cp.id}`, {
        method: "DELETE",
      });
      setCoupons((prev) => prev.filter((c) => c.id !== cp.id));
      setFeedback({ message: `Coupon "${cp.code}" deleted.`, type: "success" });
      setTimeout(() => setFeedback(null), 3000);
    } catch (err: any) {
      setCoupons((prev) => prev.filter((c) => c.id !== cp.id));
    }
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
      cell: (cp) => {
        const type = (cp.discountType || (cp as any).discount_type || "PERCENT").toUpperCase();
        return (
          <span className="text-xs font-semibold text-teal-700">
            {type === "PERCENT" ? `${cp.value}% Off` : `₹${cp.value} Flat Off`}
          </span>
        );
      },
    },
    {
      header: "Min Order Value",
      cell: (cp) => {
        const minOrderVal = cp.minOrderValue ?? (cp as any).min_order_value ?? 0;
        return <span className="text-xs text-slate-600">₹{minOrderVal}</span>;
      },
    },
    {
      header: "Valid Until",
      cell: (cp) => <span className="text-xs text-slate-600">{cp.validUntil || (cp as any).valid_until || "31 Dec 2026"}</span>,
    },
    {
      header: "Redemptions",
      cell: (cp) => <span className="text-xs text-slate-700">{cp.usageCount ?? (cp as any).usage_count ?? 0} used</span>,
    },
    {
      header: "Status",
      cell: (cp) => <StatusBadge status={cp.status} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (cp) => (
        <div className="flex items-center justify-end gap-3">
          <button
            type="button"
            onClick={() => handleToggleStatus(cp)}
            className="text-xs text-slate-500 hover:text-slate-800 underline font-medium"
          >
            {cp.status === "ACTIVE" ? "Deactivate" : "Activate"}
          </button>
          <button
            type="button"
            onClick={() => handleDelete(cp)}
            title="Delete coupon"
            className="text-slate-400 hover:text-red-600 transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {feedback && (
        <div
          className={`flex items-center gap-2 p-3 text-xs rounded-lg border ${
            feedback.type === "success"
              ? "bg-emerald-50 text-emerald-800 border-emerald-200"
              : "bg-red-50 text-red-800 border-red-200"
          }`}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      <PageHeader
        title="Promotional Coupons & Patient Discounts"
        subtitle="Configure marketing codes, discount percentages or flat amounts, and order minimums. Real-time synced with customer app."
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
        isLoading={isLoading}
        keyExtractor={(cp) => cp.id || cp.code}
        emptyMessage="No promotional coupons active. Click 'Create New Coupon' to add one."
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Create Marketing Coupon</h3>
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
                  placeholder="e.g. SUMMER25 or HEALTH100"
                  value={code}
                  onChange={(e) => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3 py-2 text-xs font-mono uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Discount Type</label>
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
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    {discountType === "PERCENT" ? "Discount Percentage (%)" : "Discount Amount (₹)"}
                  </label>
                  <input
                    type="number"
                    required
                    min="1"
                    max={discountType === "PERCENT" ? "100" : undefined}
                    value={discountValue}
                    onChange={(e) => setDiscountValue(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Minimum Order (₹)
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={minOrder}
                    onChange={(e) => setMinOrder(e.target.value)}
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Valid Until
                  </label>
                  <input
                    type="text"
                    value={validUntil}
                    onChange={(e) => setValidUntil(e.target.value)}
                    placeholder="31 Dec 2026"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
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
                  Create & Publish Coupon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
