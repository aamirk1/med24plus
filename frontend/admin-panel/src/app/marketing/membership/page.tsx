"use client";

import React, { useState, useEffect } from "react";
import {
  Crown,
  Plus,
  Edit2,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Loader2,
  Gift,
  Truck,
  Percent,
  Users,
  ShieldCheck,
  Check,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { apiClient } from "@/services/api";

interface MembershipPlan {
  id: string;
  name: string;
  slug: string;
  badge?: string | null;
  price: number;
  original_price: number;
  duration_months: number;
  medicine_discount_percent: number;
  diagnostic_discount_percent: number;
  free_delivery: boolean;
  welcome_kit?: string | null;
  perks: string[];
  subscribers_count: number;
  is_active: boolean;
  created_at?: string;
}

const BADGE_PRESETS = [
  "Most Popular",
  "Best Value",
  "Recommended",
  "Family Saver",
  "VIP Exclusive",
  "Entry Choice",
];

export default function AdminMembershipPage() {
  const [plans, setPlans] = useState<MembershipPlan[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<MembershipPlan | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [formData, setFormData] = useState({
    name: "",
    badge: "Most Popular",
    price: 499,
    original_price: 1199,
    duration_months: 12,
    medicine_discount_percent: 26,
    diagnostic_discount_percent: 60,
    free_delivery: true,
    welcome_kit: "Free Basic Blood Glucose Monitor Kit",
    perks: [
      "Up to 26% Flat OFF on all prescription & OTC medications",
      "Up to 60% Discount on Diagnostic Lab Tests & Health Panels",
      "Free Express Home Delivery on all orders",
      "Free Annual Doctor Teleconsultation vouchers (x2)",
    ],
    is_active: true,
  });

  const [newPerkInput, setNewPerkInput] = useState("");

  const loadPlans = async () => {
    setIsLoading(true);
    try {
      const res: any = await apiClient("/admin/membership/plans");
      if (res?.data) {
        setPlans(res.data);
      }
    } catch (err: any) {
      console.warn("Failed to load membership plans from backend:", err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();
  }, []);

  const handleOpenCreateModal = () => {
    setEditingPlan(null);
    setFormData({
      name: "",
      badge: "Most Popular",
      price: 499,
      original_price: 1199,
      duration_months: 12,
      medicine_discount_percent: 26,
      diagnostic_discount_percent: 60,
      free_delivery: true,
      welcome_kit: "Free Basic Blood Glucose Monitor Kit",
      perks: [
        "Up to 26% Flat OFF on all prescription & OTC medications",
        "Up to 60% Discount on Diagnostic Lab Tests & Health Panels",
        "Free Express Home Delivery on all orders",
        "Free Annual Doctor Teleconsultation vouchers (x2)",
      ],
      is_active: true,
    });
    setNewPerkInput("");
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (plan: MembershipPlan) => {
    setEditingPlan(plan);
    setFormData({
      name: plan.name,
      badge: plan.badge || "",
      price: plan.price,
      original_price: plan.original_price,
      duration_months: plan.duration_months,
      medicine_discount_percent: plan.medicine_discount_percent,
      diagnostic_discount_percent: plan.diagnostic_discount_percent,
      free_delivery: plan.free_delivery,
      welcome_kit: plan.welcome_kit || "",
      perks: [...plan.perks],
      is_active: plan.is_active,
    });
    setNewPerkInput("");
    setIsModalOpen(true);
  };

  const handleAddPerk = () => {
    if (!newPerkInput.trim()) return;
    setFormData((prev) => ({
      ...prev,
      perks: [...prev.perks, newPerkInput.trim()],
    }));
    setNewPerkInput("");
  };

  const handleRemovePerk = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      perks: prev.perks.filter((_, i) => i !== index),
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setStatusMessage(null);

    try {
      if (editingPlan) {
        // Update Plan
        const res: any = await apiClient(`/admin/membership/plans/${editingPlan.id}`, {
          method: "PUT",
          data: formData,
        });
        if (res?.data) {
          setPlans((prev) => prev.map((p) => (p.id === editingPlan.id ? res.data : p)));
        }
        setStatusMessage({ type: "success", text: `Plan "${formData.name}" updated successfully.` });
      } else {
        // Create Plan
        const res: any = await apiClient("/admin/membership/plans", {
          method: "POST",
          data: formData,
        });
        if (res?.data) {
          setPlans((prev) => [...prev, res.data]);
        }
        setStatusMessage({ type: "success", text: `Plan "${formData.name}" created successfully.` });
      }
      setIsModalOpen(false);
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage({ type: "error", text: err?.message || "Failed to save membership plan." });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDeletePlan = async (plan: MembershipPlan) => {
    if (!confirm(`Are you sure you want to deactivate and delete plan "${plan.name}"?`)) return;

    try {
      await apiClient(`/admin/membership/plans/${plan.id}`, {
        method: "DELETE",
      });
      setPlans((prev) => prev.filter((p) => p.id !== plan.id));
      setStatusMessage({ type: "success", text: `Plan "${plan.name}" deleted successfully.` });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      alert(`Delete failed: ${err.message}`);
    }
  };

  const handleToggleActive = async (plan: MembershipPlan) => {
    try {
      const res: any = await apiClient(`/admin/membership/plans/${plan.id}`, {
        method: "PUT",
        data: { is_active: !plan.is_active },
      });
      if (res?.data) {
        setPlans((prev) => prev.map((p) => (p.id === plan.id ? res.data : p)));
      }
    } catch (err: any) {
      alert(`Toggle status failed: ${err.message}`);
    }
  };

  const totalSubscribers = plans.reduce((acc, p) => acc + (p.subscribers_count || 0), 0);
  const activePlansCount = plans.filter((p) => p.is_active).length;

  return (
    <div className="space-y-6 max-w-7xl">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <PageHeader
          title="Med24Plus Membership Plans & Benefits"
          subtitle="Manage customer subscription tiers, medicine discounts, lab vouchers, free delivery rules, and welcome kits."
        />
        <button
          onClick={handleOpenCreateModal}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#0052CC] hover:bg-[#0043A8] text-white text-xs font-semibold rounded-xl shadow-sm transition shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span>Add Membership Plan</span>
        </button>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#0052CC] flex items-center justify-center shrink-0">
            <Crown className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Active Plans</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{activePlansCount} / {plans.length}</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-emerald-50 text-emerald-700 flex items-center justify-center shrink-0">
            <Percent className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Max Medicine Benefit</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">
              {Math.max(...plans.map((p) => p.medicine_discount_percent), 0)}% OFF
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-50 text-indigo-700 flex items-center justify-center shrink-0">
            <Gift className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Diagnostics Saving</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">Up to 60% OFF</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200/80 shadow-2xs flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-700 flex items-center justify-center shrink-0">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <p className="text-[11px] text-slate-500 font-medium">Subscribed Customers</p>
            <p className="text-xl font-bold text-slate-900 mt-0.5">{totalSubscribers.toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Plan Cards Grid */}
      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-6 h-6 animate-spin text-[#0052CC] mr-2" />
          <span className="text-xs text-slate-500 font-medium">Loading membership tiers...</span>
        </div>
      ) : plans.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200/80 p-12 text-center">
          <Crown className="w-12 h-12 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-bold text-slate-800">No Membership Plans Created</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Create membership packages offering recurring customer discounts, free lab testing, and welcome kits.
          </p>
          <button
            onClick={handleOpenCreateModal}
            className="mt-4 px-4 py-2 bg-[#0052CC] text-white text-xs font-semibold rounded-lg shadow-sm"
          >
            Create First Plan
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {plans.map((plan) => {
            const savingsPercent = Math.round(
              ((plan.original_price - plan.price) / plan.original_price) * 100
            );

            return (
              <div
                key={plan.id}
                className={`relative bg-white rounded-2xl border flex flex-col justify-between transition shadow-xs hover:shadow-md ${
                  plan.is_active ? "border-slate-200/90" : "border-slate-200 bg-slate-50/50 opacity-70"
                }`}
              >
                {/* Header Strip */}
                <div className="p-5 border-b border-slate-100">
                  <div className="flex items-center justify-between gap-2 mb-2">
                    {plan.badge ? (
                      <span className="bg-amber-100 text-amber-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-amber-200">
                        {plan.badge}
                      </span>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-medium">Tier</span>
                    )}

                    <div className="flex items-center gap-1.5">
                      <span
                        className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                          plan.is_active
                            ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {plan.is_active ? "Active" : "Disabled"}
                      </span>
                    </div>
                  </div>

                  <h3 className="text-base font-bold text-slate-900 line-clamp-1">{plan.name}</h3>
                  <p className="text-xs text-slate-500 mt-0.5">Valid for {plan.duration_months} Months</p>

                  <div className="flex items-baseline gap-2 mt-4">
                    <span className="text-2xl font-black text-slate-900">₹{plan.price}</span>
                    <span className="text-xs text-slate-400 line-through">₹{plan.original_price}</span>
                    {savingsPercent > 0 && (
                      <span className="text-[11px] font-bold text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
                        {savingsPercent}% OFF
                      </span>
                    )}
                  </div>
                </div>

                {/* Benefits */}
                <div className="p-5 space-y-3 flex-1">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div className="p-2.5 rounded-xl bg-blue-50/80 border border-blue-100">
                      <span className="text-[10px] text-blue-600 font-semibold block">Medicine Flat Discount</span>
                      <span className="text-sm font-black text-blue-950 mt-0.5 block">
                        {plan.medicine_discount_percent}% OFF
                      </span>
                    </div>
                    <div className="p-2.5 rounded-xl bg-teal-50/80 border border-teal-100">
                      <span className="text-[10px] text-teal-600 font-semibold block">Lab Diagnostics</span>
                      <span className="text-sm font-black text-teal-950 mt-0.5 block">
                        {plan.diagnostic_discount_percent}% OFF
                      </span>
                    </div>
                  </div>

                  {plan.welcome_kit && (
                    <div className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-100 flex items-start gap-2">
                      <Gift className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
                      <div>
                        <span className="text-[10px] text-amber-800 font-bold block">Free Welcome Kit</span>
                        <span className="text-xs text-amber-950 font-medium">{plan.welcome_kit}</span>
                      </div>
                    </div>
                  )}

                  <div className="space-y-1.5 pt-2 border-t border-slate-100">
                    <p className="text-[11px] font-semibold text-slate-600">Included Privileges:</p>
                    {plan.perks.map((perk, i) => (
                      <div key={i} className="flex items-start gap-2 text-xs text-slate-600">
                        <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0 mt-0.5" />
                        <span className="line-clamp-2">{perk}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Footer Actions */}
                <div className="p-4 bg-slate-50 border-t border-slate-100 rounded-b-2xl flex items-center justify-between">
                  <span className="text-[11px] text-slate-500 font-medium">
                    {plan.subscribers_count} subscribers
                  </span>

                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleToggleActive(plan)}
                      className={`text-xs font-semibold px-2.5 py-1 rounded-lg border transition ${
                        plan.is_active
                          ? "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                          : "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                      }`}
                    >
                      {plan.is_active ? "Deactivate" : "Activate"}
                    </button>
                    <button
                      onClick={() => handleOpenEditModal(plan)}
                      className="p-1.5 text-slate-600 hover:text-[#0052CC] hover:bg-blue-50 rounded-lg transition"
                      title="Edit Plan"
                    >
                      <Edit2 className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => handleDeletePlan(plan)}
                      className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition"
                      title="Delete Plan"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-5 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div className="flex items-center gap-2">
                <Crown className="w-5 h-5 text-[#0052CC]" />
                <h3 className="text-sm font-bold text-slate-900">
                  {editingPlan ? "Edit Membership Plan" : "Create New Membership Plan"}
                </h3>
              </div>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Plan Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g. Med24Plus Member Plan (Gold VIP)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Badge Tag (Optional)
                  </label>
                  <input
                    type="text"
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="e.g. Most Popular"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                  />
                  <div className="flex flex-wrap gap-1 mt-1.5">
                    {BADGE_PRESETS.map((preset) => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormData({ ...formData, badge: preset })}
                        className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                          formData.badge === preset
                            ? "bg-blue-50 text-[#0052CC] border-blue-200 font-bold"
                            : "bg-slate-50 text-slate-600 border-slate-200"
                        }`}
                      >
                        {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Duration (Months) *
                  </label>
                  <select
                    value={formData.duration_months}
                    onChange={(e) =>
                      setFormData({ ...formData, duration_months: parseInt(e.target.value) || 12 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                  >
                    <option value={3}>3 Months</option>
                    <option value={6}>6 Months</option>
                    <option value={12}>12 Months (1 Year)</option>
                    <option value={24}>24 Months (2 Years)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Selling Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={formData.price}
                    onChange={(e) =>
                      setFormData({ ...formData, price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Original / Strikethrough Price (₹) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    step={1}
                    value={formData.original_price}
                    onChange={(e) =>
                      setFormData({ ...formData, original_price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Medicine Flat Discount (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={formData.medicine_discount_percent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        medicine_discount_percent: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Diagnostic Lab Discount (%) *
                  </label>
                  <input
                    type="number"
                    required
                    min={0}
                    max={100}
                    value={formData.diagnostic_discount_percent}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        diagnostic_discount_percent: parseInt(e.target.value) || 0,
                      })
                    }
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Free Welcome Kit Description
                  </label>
                  <input
                    type="text"
                    value={formData.welcome_kit}
                    onChange={(e) => setFormData({ ...formData, welcome_kit: e.target.value })}
                    placeholder="e.g. Free Basic Blood Glucose Monitor Kit"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                  />
                </div>

                <div className="sm:col-span-2 flex items-center gap-3">
                  <label className="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={formData.free_delivery}
                      onChange={(e) =>
                        setFormData({ ...formData, free_delivery: e.target.checked })
                      }
                      className="w-4 h-4 text-[#0052CC] rounded focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">
                      Include Free Express Home Delivery
                    </span>
                  </label>

                  <label className="flex items-center gap-2 cursor-pointer ml-4">
                    <input
                      type="checkbox"
                      checked={formData.is_active}
                      onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                      className="w-4 h-4 text-[#0052CC] rounded focus:ring-0"
                    />
                    <span className="text-xs font-semibold text-slate-700">Plan Is Active</span>
                  </label>
                </div>

                {/* Perks Checklist */}
                <div className="sm:col-span-2 space-y-2 pt-2 border-t border-slate-100">
                  <label className="block text-xs font-semibold text-slate-700">
                    Plan Privileges &amp; Perks List
                  </label>

                  <div className="space-y-1.5">
                    {formData.perks.map((perk, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs text-slate-700"
                      >
                        <span className="flex items-center gap-2">
                          <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                          <span>{perk}</span>
                        </span>
                        <button
                          type="button"
                          onClick={() => handleRemovePerk(idx)}
                          className="text-slate-400 hover:text-red-600 p-0.5"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>

                  <div className="flex gap-2 mt-2">
                    <input
                      type="text"
                      value={newPerkInput}
                      onChange={(e) => setNewPerkInput(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          handleAddPerk();
                        }
                      }}
                      placeholder="e.g. Free 24/7 dedicated pharmacist helpline support"
                      className="flex-1 px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
                    />
                    <button
                      type="button"
                      onClick={handleAddPerk}
                      className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
                    >
                      Add Perk
                    </button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#0052CC] hover:bg-[#0043A8] disabled:opacity-50 rounded-lg shadow-sm transition"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Saving Plan...</span>
                    </>
                  ) : (
                    <span>{editingPlan ? "Update Plan" : "Create Plan"}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
