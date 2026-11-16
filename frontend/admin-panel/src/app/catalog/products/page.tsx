"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, Eye, Edit3, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FilterPanel, FilterGroup } from "@/components/ui/FilterPanel";
import { MOCK_ADMIN_PRODUCTS } from "@/mock/adminData";
import { AdminProduct } from "@/types";

export default function AdminProductsPage() {
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({
    schedule: "ALL",
    status: "ALL",
  });

  const filterGroups: FilterGroup[] = [
    {
      id: "schedule",
      name: "Drug Schedule",
      options: [
        { label: "OTC (General Sale)", value: "OTC" },
        { label: "Schedule H (Prescription)", value: "SCHEDULE_H" },
        { label: "Schedule H1 (Controlled)", value: "SCHEDULE_H1" },
        { label: "Ayush / Herbal", value: "AYUSH" },
        { label: "Medical Device", value: "DEVICE" },
      ],
    },
    {
      id: "status",
      name: "Status",
      options: [
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive", value: "INACTIVE" },
        { label: "Out of Stock", value: "OUT_OF_STOCK" },
      ],
    },
  ];

  const filtered = MOCK_ADMIN_PRODUCTS.filter((p) => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase()) ||
      p.brand.toLowerCase().includes(search.toLowerCase());
    const matchesSchedule =
      filters.schedule === "ALL" || p.schedule === filters.schedule;
    const matchesStatus =
      filters.status === "ALL" || p.status === filters.status;
    return matchesSearch && matchesSchedule && matchesStatus;
  });

  const columns: Column<AdminProduct>[] = [
    {
      header: "Product / SKU",
      cell: (p) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs line-clamp-1">{p.name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-slate-500">{p.sku}</span>
            <span className="text-[10px] text-slate-400">•</span>
            <span className="text-[10px] text-slate-500">{p.brand}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (p) => (
        <span className="text-xs text-slate-600 truncate max-w-[140px] block">
          {p.category}
        </span>
      ),
    },
    {
      header: "Clinical Schedule",
      cell: (p) => {
        let badgeType: "SCHEDULE_H" | "SCHEDULE_H1" | "OTC" = "OTC";
        if (p.schedule === "SCHEDULE_H") badgeType = "SCHEDULE_H";
        if (p.schedule === "SCHEDULE_H1") badgeType = "SCHEDULE_H1";
        return <StatusBadge status={badgeType} />;
      },
    },
    {
      header: "Price (MRP / Sell)",
      cell: (p) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-900">₹{p.sellingPrice}</span>
          <span className="text-[10px] text-slate-400 line-through ml-1.5">₹{p.mrp}</span>
        </div>
      ),
    },
    {
      header: "Available Stock",
      cell: (p) => (
        <span
          className={`text-xs font-semibold ${
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
      header: "Status",
      cell: (p) => <StatusBadge status={p.status} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (p) => (
        <div className="flex items-center justify-end gap-1.5">
          <Link
            href={`/catalog/products/${p.id}/edit`}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title="Edit Product"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </Link>
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            title="Deactivate"
            onClick={() => alert(`Mock action: Deactivate ${p.sku}`)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Drug & Product Catalog"
        subtitle="Manage licensed medicines, healthcare devices, OTC products, and regulatory schedules."
        actions={
          <Link
            href="/catalog/products/new"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#087F5B] hover:bg-[#066649] text-white rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Medicine / Product</span>
          </Link>
        }
      />

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search by medicine name, brand, SKU..."
        onFilterToggle={() => setFilterOpen(!filterOpen)}
        onExport={() => alert("Mock export: Downloading CSV catalog...")}
      />

      <FilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        groups={filterGroups}
        selectedFilters={filters}
        onFilterChange={(g, v) => setFilters((prev) => ({ ...prev, [g]: v }))}
        onReset={() => setFilters({ schedule: "ALL", status: "ALL" })}
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        emptyMessage="No medicines or products match your search criteria."
      />
    </div>
  );
}
