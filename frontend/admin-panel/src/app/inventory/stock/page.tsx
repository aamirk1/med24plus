"use client";

import React, { useState } from "react";
import { AlertCircle, ArrowUpRight, RotateCcw } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_ADMIN_PRODUCTS } from "@/mock/adminData";
import { AdminProduct } from "@/types";

export default function AdminStockPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_ADMIN_PRODUCTS.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.sku.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<AdminProduct>[] = [
    {
      header: "Medicine / Product",
      cell: (p) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">{p.name}</p>
          <span className="text-[10px] font-mono text-slate-500">{p.sku}</span>
        </div>
      ),
    },
    {
      header: "Therapeutic Category",
      accessorKey: "category",
    },
    {
      header: "Current Stock",
      cell: (p) => (
        <span
          className={`font-semibold text-xs ${
            p.stock <= 10
              ? "text-red-600"
              : p.stock <= 30
              ? "text-amber-600"
              : "text-emerald-700"
          }`}
        >
          {p.stock} units
        </span>
      ),
    },
    {
      header: "Stock Level Status",
      cell: (p) => {
        if (p.stock <= 10) return <StatusBadge status="LOW_STOCK" />;
        if (p.stock === 0) return <StatusBadge status="OUT_OF_STOCK" />;
        return <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">Adequate</span>;
      },
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (p) => (
        <button
          type="button"
          onClick={() => alert(`Mock: Restock order initiated for ${p.sku}`)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#087F5B] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
        >
          <span>Purchase Inward</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy Stock Management"
        subtitle="Real-time stock monitoring with automatic low-stock alerts and purchase reorder points."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total Tracked SKUs</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">468</p>
          <span className="text-[10px] text-slate-400">Across 6 medical categories</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <p className="text-xs text-amber-700 font-medium">Low Stock Alerts (&lt; 20 units)</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">12</p>
          <span className="text-[10px] text-amber-600">Reorders suggested</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-sm">
          <p className="text-xs text-red-700 font-medium">Out of Stock</p>
          <p className="text-2xl font-bold text-red-900 mt-1">2</p>
          <span className="text-[10px] text-red-600">Requires immediate purchase</span>
        </div>
      </div>

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Filter by product name or SKU..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        emptyMessage="No stock items match your search."
      />
    </div>
  );
}

