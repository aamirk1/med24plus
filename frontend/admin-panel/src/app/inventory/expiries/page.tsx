"use client";

import React, { useState } from "react";
import { AlertTriangle, Clock, RefreshCw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_ADMIN_BATCHES } from "@/mock/adminData";
import { AdminBatch } from "@/types";

export default function AdminExpiriesPage() {
  const [filterRange, setFilterRange] = useState("90");

  const sortedBatches = [...MOCK_ADMIN_BATCHES].sort(
    (a, b) => a.daysToExpiry - b.daysToExpiry
  );

  const columns: Column<AdminBatch>[] = [
    {
      header: "Medicine & Batch",
      cell: (b) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">{b.productName}</p>
          <span className="text-[10px] font-mono text-slate-500">Batch: {b.batchNumber}</span>
        </div>
      ),
    },
    {
      header: "Expiry Date",
      cell: (b) => (
        <span className="font-mono text-xs font-semibold text-slate-800">{b.expiryDate}</span>
      ),
    },
    {
      header: "Days to Expiry",
      cell: (b) => (
        <span
          className={`text-xs font-bold ${
            b.daysToExpiry <= 60
              ? "text-red-600"
              : b.daysToExpiry <= 180
              ? "text-amber-600"
              : "text-slate-700"
          }`}
        >
          {b.daysToExpiry} days
        </span>
      ),
    },
    {
      header: "Unsold Units",
      cell: (b) => <span className="text-xs text-slate-700">{b.unitsAvailable} units</span>,
    },
    {
      header: "Risk Status",
      cell: (b) => <StatusBadge status={b.status} />,
    },
    {
      header: "Action",
      className: "text-right",
      cell: (b) => (
        <button
          type="button"
          onClick={() => alert(`Mock: Return to manufacturer or discount initiated for ${b.batchNumber}`)}
          className="px-2.5 py-1 text-[11px] font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 rounded-lg transition"
        >
          Return / Discard
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drug Expiry Tracking & Quarantine"
        subtitle="Proactively track near-expiry pharmaceuticals to ensure zero expired drugs reach patients."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-red-50/40 border border-red-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-red-700 text-xs font-semibold">
            <AlertTriangle className="w-4 h-4" />
            <span>Expiring in &lt; 60 Days</span>
          </div>
          <p className="text-2xl font-bold text-red-950 mt-1">1 Batch</p>
          <p className="text-[10px] text-red-700">12 units flagged for quarantine</p>
        </div>

        <div className="bg-amber-50/40 border border-amber-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-amber-700 text-xs font-semibold">
            <Clock className="w-4 h-4" />
            <span>Expiring in 60 - 180 Days</span>
          </div>
          <p className="text-2xl font-bold text-amber-950 mt-1">2 Batches</p>
          <p className="text-[10px] text-amber-700">FEFO priority dispatch active</p>
        </div>

        <div className="bg-emerald-50/40 border border-emerald-200 p-4 rounded-xl">
          <div className="flex items-center gap-2 text-[#087F5B] text-xs font-semibold">
            <RefreshCw className="w-4 h-4" />
            <span>Healthy Shelf-Life (&gt; 180 Days)</span>
          </div>
          <p className="text-2xl font-bold text-emerald-950 mt-1">1 Batch</p>
          <p className="text-[10px] text-emerald-700">All quality checks cleared</p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={sortedBatches}
        keyExtractor={(b) => b.id}
        emptyMessage="No near-expiry batches detected."
      />
    </div>
  );
}
