"use client";

import React, { useState, useEffect } from "react";
import { ShieldCheck, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminInventoryService } from "@/services/admin-inventory.service";

interface BatchRow {
  id: string;
  productName: string;
  batchNumber: string;
  manufacturer: string;
  manufacturingDate: string;
  expiryDate: string;
  unitsAvailable: number;
  sellableUnits: number;
  purchaseCost: number;
  mrp: number;
  status: string;
  daysToExpiry: number;
}

export default function AdminBatchesPage() {
  const [search, setSearch] = useState("");
  const [batches, setBatches] = useState<BatchRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadBatches = async () => {
    setIsLoading(true);
    try {
      const data = await adminInventoryService.getBatches({
        search: search || undefined,
        page_size: 50,
      });
      if (data?.items) {
        setBatches(
          data.items.map((b: any) => ({
            id: b.id,
            productName: b.product_name || "N/A",
            batchNumber: b.batch_number,
            manufacturer: b.supplier_name || "Direct Supplier",
            manufacturingDate: b.manufacturing_date,
            expiryDate: b.expiry_date,
            unitsAvailable: b.available_quantity,
            sellableUnits: b.sellable_quantity,
            purchaseCost: parseFloat(b.purchase_price),
            mrp: parseFloat(b.batch_mrp),
            status: b.batch_status.toUpperCase(),
            daysToExpiry: b.days_to_expiry,
          }))
        );
      }
    } catch (e) {
      console.warn("Could not load batches:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBatches();
  }, [search]);

  const handleToggleQuarantine = async (b: BatchRow) => {
    const newStatus = b.status === "ACTIVE" ? "quarantined" : "active";
    if (!confirm(`Change batch ${b.batchNumber} status to ${newStatus}?`)) return;
    try {
      await adminInventoryService.setBatchStatus(b.id, newStatus);
      await loadBatches();
    } catch (e: any) {
      alert(`Status update failed: ${e.message}`);
    }
  };

  const columns: Column<BatchRow>[] = [
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
          <p className={`text-[10px] ${b.daysToExpiry <= 30 ? "text-red-600 font-bold" : "text-slate-500"}`}>
            {b.daysToExpiry <= 0 ? "EXPIRED" : `${b.daysToExpiry} days remaining`}
          </p>
        </div>
      ),
    },
    {
      header: "Available / Sellable",
      cell: (b) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-800">{b.sellableUnits} sellable</span>
          <span className="text-[10px] text-slate-400 block">({b.unitsAvailable} physical)</span>
        </div>
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
    {
      header: "Actions",
      className: "text-right",
      cell: (b) => (
        <button
          type="button"
          onClick={() => handleToggleQuarantine(b)}
          className={`px-2 py-0.5 text-[10px] font-semibold rounded transition ${
            b.status === "ACTIVE"
              ? "bg-amber-50 text-amber-700 hover:bg-amber-100"
              : "bg-emerald-50 text-emerald-700 hover:bg-emerald-100"
          }`}
        >
          {b.status === "ACTIVE" ? "Quarantine" : "Release"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Batch & Expiry Register (Rule 65 FEFO)"
        subtitle="Mandatory First-Expiry-First-Out dispensing control and statutory drug batch traceability ledger."
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
        placeholder="Search batch number, medicine title, supplier..."
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#087F5B]" />
          <p className="text-xs">Loading batch records from ledger...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={batches}
          keyExtractor={(b) => b.id}
          emptyMessage="No batches found in the ledger."
        />
      )}
    </div>
  );
}
