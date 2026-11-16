"use client";

import React, { useState } from "react";
import { Plus, Award, Edit3, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_ADMIN_BRANDS, AdminBrand } from "@/mock/adminData";

export default function AdminBrandsPage() {
  const [search, setSearch] = useState("");
  const [brands, setBrands] = useState<AdminBrand[]>(MOCK_ADMIN_BRANDS);

  const filtered = brands.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()) ||
    b.manufacturer.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<AdminBrand>[] = [
    {
      header: "Brand / Manufacturer",
      cell: (b) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{b.name}</p>
            <p className="text-[10px] text-slate-500">{b.manufacturer}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Active Products",
      cell: (b) => <span className="text-xs text-slate-700 font-medium">{b.productCount} SKUs</span>,
    },
    {
      header: "Status",
      cell: (b) => <StatusBadge status={b.status} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (b) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            onClick={() => alert(`Mock: Edit brand ${b.name}`)}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            onClick={() => {
              if (confirm(`Deactivate brand ${b.name}?`)) {
                setBrands((prev) =>
                  prev.map((item) =>
                    item.id === b.id ? { ...item, status: "INACTIVE" } : item
                  )
                );
              }
            }}
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
        title="Pharmaceutical Brands & Manufacturers"
        subtitle="Manage licensed Indian pharmaceutical manufacturers and OTC healthcare brands."
        actions={
          <button
            type="button"
            onClick={() => {
              const name = prompt("Enter brand name:");
              if (name) {
                const newBrand: AdminBrand = {
                  id: `br-${Date.now()}`,
                  name,
                  manufacturer: `${name} Laboratories India`,
                  productCount: 0,
                  status: "ACTIVE",
                };
                setBrands((prev) => [newBrand, ...prev]);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#087F5B] hover:bg-[#066649] text-white rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Brand</span>
          </button>
        }
      />

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search brand or corporate manufacturer..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(b) => b.id}
        emptyMessage="No brands found matching your search."
      />
    </div>
  );
}
