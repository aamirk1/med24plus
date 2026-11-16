"use client";

import React, { useState } from "react";
import { Plus, ShieldCheck, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_ADMIN_BATCHES } from "@/mock/adminData";
import { AdminBatch } from "@/types";

export default function AdminBatchesPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_ADMIN_BATCHES.filter((b) =>
    b.productName.toLowerCase().includes(search.toLowerCase()) ||
    b.batchNumber.toLowerCase().includes(search.toLowerCase()) ||
    b.manufacturer.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<AdminBatch>[] = [
    {
      header: "Medicine / Batch No",
      cell: (b) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">{b.productName}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono font-bold text-blue-700 bg-blue-50 px-1.5 py-0.5 rounded">
              Batch: {b.batchNumber}
            </span>
            <span className="text-[10px] text-slate-500">{b.manufacturer}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Mfg Date",
      cell: (b) => <span className="text-xs text-slate-600 font-mono">{b.manufacturingDate}</span>,
    },
    {
      header: "Expiry Date (FEFO)",
      cell: (b) => (
        <div>
          <span className="text-xs font-mono font-semibold text-slate-900">{b.expiryDate}</span>
          <p className="text-[10px] text-slate-500">{b.daysToExpiry} days remaining</p>
        </div>
      ),
    },
    {
      header: "Available Units",
      cell: (b) => (
        <span className="text-xs font-semibold text-slate-800">{b.unitsAvailable} units</span>
      ),
    },
    {
      header: "Rate (Cost / MRP)",
      cell: (b) => (
        <div className="text-xs">
          <span className="text-slate-600">₹{b.purchaseCost}</span>
          <span className="text-slate-400 mx-1">/</span>
          <span className="font-semibold text-slate-900">₹{b.mrp}</span>
        </div>
      ),
    },
    {
      header: "Batch Status",
      cell: (b) => <StatusBadge status={b.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch & Expiry Register (Rule 65 FEFO)"
        subtitle="Mandatory First-Expiry-First-Out dispensing control and drug batch traceability ledger."
        actions={
          <button
            type="button"
            onClick={() => alert("Mock: Add Inward Batch Dialog")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#087F5B] hover:bg-[#066649] text-white rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record New Inward Batch</span>
          </button>
        }
      />

      <div className="bg-emerald-50/50 border border-emerald-200/80 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#087F5B] shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950">
          <p className="font-semibold">Statutory Rule 65 Compliance Active</p>
          <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
            All medicines are locked to individual manufacturer batch numbers. The system automatically enforces First-Expiry-First-Out (FEFO) dispensing when pharmacists allocate orders.
          </p>
        </div>
      </div>

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search batch number, medicine or manufacturer..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(b) => b.id}
        emptyMessage="No batches match your query."
      />
    </div>
  );
}

