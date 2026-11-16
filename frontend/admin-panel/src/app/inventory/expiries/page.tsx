"use client";

import React, { useState, useEffect } from "react";
import { AlertTriangle, Clock, ShieldAlert, ArrowRight, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminInventoryService } from "@/services/admin-inventory.service";

interface ExpiryRow {
  batch_id: string;
  batch_number: string;
  product_name: string;
  product_sku: string;
  manufacturing_date: string;
  expiry_date: string;
  available_quantity: number;
  batch_status: string;
  days_to_expiry: number;
  storage_location?: string;
}

export default function AdminExpiriesPage() {
  const [tab, setTab] = useState<"30" | "60" | "90" | "expired">("30");
  const [expiries, setExpiries] = useState<ExpiryRow[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const days = tab === "30" ? 30 : tab === "60" ? 60 : tab === "90" ? 90 : undefined;
      const isExp = tab === "expired";

      const [sumData, expData] = await Promise.all([
        adminInventoryService.getExpirySummary(),
        adminInventoryService.getExpiries({ days_ahead: days, is_expired: isExp, page_size: 50 }),
      ]);
      setSummary(sumData);
      if (expData?.items) {
        setExpiries(expData.items);
      }
    } catch (e) {
      console.warn("Could not load expiry data:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [tab]);

  const handleQuarantine = async (batchId: string) => {
    if (!confirm("Place this near-expiry or expired batch in QUARANTINE? This will immediately remove it from sellable stock.")) return;
    try {
      await adminInventoryService.setBatchStatus(batchId, "quarantined");
      await loadData();
    } catch (e: any) {
      alert(`Quarantine action failed: ${e.message}`);
    }
  };

  const columns: Column<ExpiryRow>[] = [
    {
      header: "Medicine / Batch",
      cell: (b) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">{b.product_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono font-bold text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
              {b.batch_number}
            </span>
            <span className="text-[10px] text-slate-400">•</span>
            <span className="text-[10px] font-mono text-slate-500">{b.product_sku}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Location",
      cell: (b) => <span className="text-xs text-slate-600">{b.storage_location || "Racks"}</span>,
    },
    {
      header: "Expiry Date",
      cell: (b) => (
        <div>
          <span className="text-xs font-mono font-bold text-red-700">{b.expiry_date}</span>
          <span className="text-[10px] text-slate-500 block">
            {b.days_to_expiry <= 0 ? "EXPIRED" : `${b.days_to_expiry} days left`}
          </span>
        </div>
      ),
    },
    {
      header: "At-Risk Stock",
      cell: (b) => (
        <span className="text-xs font-bold text-red-800 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
          {b.available_quantity} units
        </span>
      ),
    },
    {
      header: "Status",
      cell: (b) => <StatusBadge status={b.batch_status.toUpperCase()} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (b) => (
        <button
          type="button"
          onClick={() => handleQuarantine(b.batch_id)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-lg transition"
        >
          <span>Quarantine Batch</span>
          <ArrowRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Expiry Horizon & Disposal Monitoring"
        subtitle="Proactive drug expiry tracking across 30, 60, and 90 day intervals to ensure zero expired dispensation."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-sm">
          <div className="flex items-center justify-between text-xs text-red-700 font-semibold">
            <span>Expired Batches</span>
            <ShieldAlert className="w-4 h-4 text-red-600" />
          </div>
          <p className="text-2xl font-bold text-red-950 mt-1">
            {summary?.expired_count || 0} batches
          </p>
          <span className="text-[10px] text-red-600">
            {summary?.expired_units || 0} units strictly blocked
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <div className="flex items-center justify-between text-xs text-amber-800 font-semibold">
            <span>Critical (&le; 30 Days)</span>
            <Clock className="w-4 h-4 text-amber-700" />
          </div>
          <p className="text-2xl font-bold text-amber-950 mt-1">
            {summary?.expiring_30_days_count || 0} batches
          </p>
          <span className="text-[10px] text-amber-700">
            {summary?.expiring_30_days_units || 0} units approaching expiry
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-amber-100 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Warning (&le; 60 Days)</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.expiring_60_days_count || 0} batches
          </p>
          <span className="text-[10px] text-slate-500">
            {summary?.expiring_60_days_units || 0} units
          </span>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between text-xs text-slate-600 font-semibold">
            <span>Horizon (&le; 90 Days)</span>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.expiring_90_days_count || 0} batches
          </p>
          <span className="text-[10px] text-slate-500">
            {summary?.expiring_90_days_units || 0} units
          </span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-200 pb-2">
        <button
          type="button"
          onClick={() => setTab("30")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            tab === "30"
              ? "bg-[#087F5B] text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Within 30 Days
        </button>
        <button
          type="button"
          onClick={() => setTab("60")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            tab === "60"
              ? "bg-[#087F5B] text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Within 60 Days
        </button>
        <button
          type="button"
          onClick={() => setTab("90")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            tab === "90"
              ? "bg-[#087F5B] text-white"
              : "text-slate-600 hover:bg-slate-100"
          }`}
        >
          Within 90 Days
        </button>
        <button
          type="button"
          onClick={() => setTab("expired")}
          className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
            tab === "expired"
              ? "bg-red-600 text-white"
              : "text-red-700 hover:bg-red-50"
          }`}
        >
          Expired Batches
        </button>
      </div>

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#087F5B]" />
          <p className="text-xs">Computing expiry horizons...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={expiries}
          keyExtractor={(b) => b.batch_id}
          emptyMessage="No batches found in this expiry horizon."
        />
      )}
    </div>
  );
}
