"use client";

import React, { useState } from "react";
import { Plus, FolderTree, Edit3, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_ADMIN_CATEGORIES, AdminCategory } from "@/mock/adminData";

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<AdminCategory[]>(MOCK_ADMIN_CATEGORIES);

  const filtered = categories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.slug.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<AdminCategory>[] = [
    {
      header: "Category Name",
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#087F5B] flex items-center justify-center shrink-0">
            <FolderTree className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{c.name}</p>
            <p className="text-[10px] font-mono text-slate-400">/{c.slug}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Active Catalog Items",
      cell: (c) => <span className="text-xs text-slate-700 font-medium">{c.productCount} medicines</span>,
    },
    {
      header: "Status",
      cell: (c) => <StatusBadge status={c.status} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (c) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            onClick={() => alert(`Mock: Edit category ${c.name}`)}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            onClick={() => {
              if (confirm(`Deactivate category ${c.name}?`)) {
                setCategories((prev) =>
                  prev.map((item) =>
                    item.id === c.id ? { ...item, status: "INACTIVE" } : item
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
        title="Therapeutic Categories"
        subtitle="Organize pharmaceutical inventory and customer navigation taxonomy."
        actions={
          <button
            type="button"
            onClick={() => {
              const name = prompt("Enter new category name:");
              if (name) {
                const newCat: AdminCategory = {
                  id: `cat-${Date.now()}`,
                  name,
                  slug: name.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
                  productCount: 0,
                  status: "ACTIVE",
                };
                setCategories((prev) => [newCat, ...prev]);
              }
            }}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#087F5B] hover:bg-[#066649] text-white rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Category</span>
          </button>
        }
      />

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search category name or slug..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(c) => c.id}
        emptyMessage="No categories found."
      />
    </div>
  );
}

