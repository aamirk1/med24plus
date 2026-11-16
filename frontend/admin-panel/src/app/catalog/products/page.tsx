"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Plus, Edit3, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { FilterPanel, FilterGroup } from "@/components/ui/FilterPanel";
import { adminCatalogService } from "@/services/admin-catalog.service";

interface AdminProductRow {
  id: string;
  name: string;
  sku: string;
  brand: string;
  category: string;
  schedule: string;
  sellingPrice: number;
  mrp: number;
  stock: number;
  status: string;
  isActive: boolean;
}

export default function AdminProductsPage() {
  const [products, setProducts] = useState<AdminProductRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [search, setSearch] = useState("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [filters, setFilters] = useState<Record<string, string>>({
    schedule: "ALL",
    status: "ALL",
  });
  const [totalItems, setTotalItems] = useState(0);

  const filterGroups: FilterGroup[] = [
    {
      id: "schedule",
      name: "Drug Schedule",
      options: [
        { label: "OTC (General Sale)", value: "OTC" },
        { label: "Schedule H (Prescription)", value: "SCHEDULE_H" },
        { label: "Schedule H1 (Controlled)", value: "SCHEDULE_H1" },
        { label: "Schedule X (Restricted)", value: "SCHEDULE_X" },
      ],
    },
    {
      id: "status",
      name: "Status",
      options: [
        { label: "Active", value: "ACTIVE" },
        { label: "Inactive", value: "INACTIVE" },
      ],
    },
  ];

  const loadProducts = async () => {
    setIsLoading(true);
    try {
      const isAct = filters.status === "ACTIVE" ? true : filters.status === "INACTIVE" ? false : undefined;
      const data = await adminCatalogService.getProducts({
        search: search || undefined,
        is_active: isAct,
        page_size: 50,
      });
      if (data?.items) {
        const rows: AdminProductRow[] = data.items.map((p: any) => ({
          id: p.id,
          name: p.name,
          sku: p.sku,
          brand: p.brand_name || "N/A",
          category: p.category_name || "N/A",
          schedule: p.schedule_classification || "OTC",
          sellingPrice: parseFloat(p.selling_price),
          mrp: parseFloat(p.mrp),
          stock: p.sellable_quantity || 0,
          status: p.is_active ? "ACTIVE" : "INACTIVE",
          isActive: p.is_active,
        }));
        setProducts(rows);
        setTotalItems(data.pagination?.total_items || rows.length);
      }
    } catch (e) {
      console.warn("Could not fetch products from backend:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProducts();
  }, [search, filters.status]);

  const handleToggleStatus = async (productId: string, currentActive: boolean) => {
    try {
      await adminCatalogService.setProductStatus(productId, !currentActive);
      setProducts((prev) =>
        prev.map((p) =>
          p.id === productId
            ? { ...p, isActive: !currentActive, status: !currentActive ? "ACTIVE" : "INACTIVE" }
            : p
        )
      );
    } catch (e: any) {
      alert(`Failed to update status: ${e.message}`);
    }
  };

  const handleDelete = async (productId: string, name: string) => {
    if (!confirm(`Are you sure you want to deactivate and remove product "${name}" from catalog?`)) return;
    try {
      await adminCatalogService.deleteProduct(productId);
      setProducts((prev) => prev.filter((p) => p.id !== productId));
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  const filtered = products.filter((p) => {
    const matchesSchedule =
      filters.schedule === "ALL" || p.schedule === filters.schedule;
    return matchesSchedule;
  });

  const columns: Column<AdminProductRow>[] = [
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
      header: "Available Sellable Stock",
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
          <button
            type="button"
            onClick={() => handleToggleStatus(p.id, p.isActive)}
            className="p-1 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title={p.isActive ? "Deactivate" : "Activate"}
          >
            {p.isActive ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
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
            title="Delete / Archive"
            onClick={() => handleDelete(p.id, p.name)}
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
        onExport={() => alert("Downloading CSV catalog summary...")}
      />

      <FilterPanel
        isOpen={filterOpen}
        onClose={() => setFilterOpen(false)}
        groups={filterGroups}
        selectedFilters={filters}
        onFilterChange={(g, v) => setFilters((prev) => ({ ...prev, [g]: v }))}
        onReset={() => setFilters({ schedule: "ALL", status: "ALL" })}
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#087F5B]" />
          <p className="text-xs">Loading live catalog items from database...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(p) => p.id}
          emptyMessage="No medicines or products match your search criteria."
        />
      )}
    </div>
  );
}
