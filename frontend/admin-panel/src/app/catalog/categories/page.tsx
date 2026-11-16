"use client";

import React, { useState, useEffect } from "react";
import { Plus, FolderTree, Edit3, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminCatalogService } from "@/services/admin-catalog.service";

interface CategoryRow {
  id: string;
  name: string;
  slug: string;
  description?: string;
  productCount: number;
  status: string;
  isActive: boolean;
}

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadCategories = async () => {
    setIsLoading(true);
    try {
      const data = await adminCatalogService.getCategories({
        search: search || undefined,
        page_size: 100,
      });
      if (data?.items) {
        setCategories(
          data.items.map((c: any) => ({
            id: c.id,
            name: c.name,
            slug: c.slug,
            description: c.description,
            productCount: c.product_count || 0,
            status: c.is_active ? "ACTIVE" : "INACTIVE",
            isActive: c.is_active,
          }))
        );
      }
    } catch (e) {
      console.warn("Could not load categories:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadCategories();
  }, [search]);

  const handleCreateCategory = async () => {
    const name = prompt("Enter new therapeutic category name:");
    if (!name || !name.trim()) return;
    try {
      await adminCatalogService.createCategory({
        name: name.trim(),
        description: `Category for ${name.trim()} medications`,
      });
      await loadCategories();
    } catch (e: any) {
      alert(`Failed to create category: ${e.message}`);
    }
  };

  const handleToggleStatus = async (cat: CategoryRow) => {
    try {
      await adminCatalogService.setCategoryStatus(cat.id, !cat.isActive);
      setCategories((prev) =>
        prev.map((item) =>
          item.id === cat.id
            ? { ...item, isActive: !cat.isActive, status: !cat.isActive ? "ACTIVE" : "INACTIVE" }
            : item
        )
      );
    } catch (e: any) {
      alert(`Status update failed: ${e.message}`);
    }
  };

  const handleDelete = async (cat: CategoryRow) => {
    if (!confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;
    try {
      await adminCatalogService.deleteCategory(cat.id);
      setCategories((prev) => prev.filter((item) => item.id !== cat.id));
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  const columns: Column<CategoryRow>[] = [
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
      header: "Description",
      cell: (c) => (
        <span className="text-xs text-slate-500 line-clamp-1 max-w-xs">{c.description || "—"}</span>
      ),
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
            title={c.isActive ? "Deactivate" : "Activate"}
            onClick={() => handleToggleStatus(c)}
          >
            {c.isActive ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            title="Delete Category"
            onClick={() => handleDelete(c)}
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
            onClick={handleCreateCategory}
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

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#087F5B]" />
          <p className="text-xs">Loading categories from database...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={categories}
          keyExtractor={(c) => c.id}
          emptyMessage="No therapeutic categories found."
        />
      )}
    </div>
  );
}
