"use client";

import React, { useState, useEffect } from "react";
import { Plus, Award, Trash2, Loader2, CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminCatalogService } from "@/services/admin-catalog.service";

interface BrandRow {
  id: string;
  name: string;
  slug: string;
  manufacturerName: string;
  countryOfOrigin: string;
  status: string;
  isActive: boolean;
}

export default function AdminBrandsPage() {
  const [search, setSearch] = useState("");
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const loadBrands = async () => {
    setIsLoading(true);
    try {
      const data = await adminCatalogService.getBrands({
        search: search || undefined,
        page_size: 100,
      });
      if (data?.items) {
        setBrands(
          data.items.map((b: any) => ({
            id: b.id,
            name: b.name,
            slug: b.slug,
            manufacturerName: b.manufacturer_name,
            countryOfOrigin: b.country_of_origin || "India",
            status: b.is_active ? "ACTIVE" : "INACTIVE",
            isActive: b.is_active,
          }))
        );
      }
    } catch (e) {
      console.warn("Could not load brands:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadBrands();
  }, [search]);

  const handleCreateBrand = async () => {
    const name = prompt("Enter manufacturer / brand title:");
    if (!name || !name.trim()) return;
    try {
      await adminCatalogService.createBrand({
        name: name.trim(),
        manufacturer_name: `${name.trim()} Pharma Ltd.`,
        country_of_origin: "India",
      });
      await loadBrands();
    } catch (e: any) {
      alert(`Failed to create brand: ${e.message}`);
    }
  };

  const handleToggleStatus = async (brand: BrandRow) => {
    try {
      await adminCatalogService.setBrandStatus(brand.id, !brand.isActive);
      setBrands((prev) =>
        prev.map((item) =>
          item.id === brand.id
            ? { ...item, isActive: !brand.isActive, status: !brand.isActive ? "ACTIVE" : "INACTIVE" }
            : item
        )
      );
    } catch (e: any) {
      alert(`Status update failed: ${e.message}`);
    }
  };

  const handleDelete = async (brand: BrandRow) => {
    if (!confirm(`Are you sure you want to delete brand "${brand.name}"?`)) return;
    try {
      await adminCatalogService.deleteBrand(brand.id);
      setBrands((prev) => prev.filter((item) => item.id !== brand.id));
    } catch (e: any) {
      alert(`Delete failed: ${e.message}`);
    }
  };

  const columns: Column<BrandRow>[] = [
    {
      header: "Brand / Manufacturer",
      cell: (b) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
            <Award className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{b.name}</p>
            <p className="text-[10px] text-slate-500">{b.manufacturerName}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Country of Origin",
      cell: (b) => <span className="text-xs text-slate-600">{b.countryOfOrigin}</span>,
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
            title={b.isActive ? "Deactivate" : "Activate"}
            onClick={() => handleToggleStatus(b)}
          >
            {b.isActive ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <button
            type="button"
            className="p-1 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            title="Delete Brand"
            onClick={() => handleDelete(b)}
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
        subtitle="Maintain verified pharmaceutical manufacturers and licensed clinical brands."
        actions={
          <button
            type="button"
            onClick={handleCreateBrand}
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
        placeholder="Search brand name or manufacturer..."
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#087F5B]" />
          <p className="text-xs">Loading brands from database...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={brands}
          keyExtractor={(b) => b.id}
          emptyMessage="No brands found."
        />
      )}
    </div>
  );
}
