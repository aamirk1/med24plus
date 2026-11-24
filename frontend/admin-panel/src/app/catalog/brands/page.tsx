"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, Award, Edit3, Trash2, Loader2, CheckCircle2, XCircle, X, Upload } from "lucide-react";
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
  logoUrl?: string;
  description?: string;
  status: string;
  isActive: boolean;
}

export default function AdminBrandsPage() {
  const [search, setSearch] = useState("");
  const [brands, setBrands] = useState<BrandRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Brand Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingBrand, setEditingBrand] = useState<BrandRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [localPreview, setLocalPreview] = useState<string | null>(null);
  const [modalError, setModalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    manufacturer_name: "",
    country_of_origin: "India",
    description: "",
    slug: "",
    logo_url: "",
  });

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
            logoUrl: b.logo_url,
            description: b.description,
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

  const handleOpenCreateModal = () => {
    setEditingBrand(null);
    setFormData({
      name: "",
      manufacturer_name: "",
      country_of_origin: "India",
      description: "",
      slug: "",
      logo_url: "",
    });
    setLocalPreview(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (brand: BrandRow) => {
    setEditingBrand(brand);
    setFormData({
      name: brand.name,
      manufacturer_name: brand.manufacturerName,
      country_of_origin: brand.countryOfOrigin || "India",
      description: brand.description || "",
      slug: brand.slug,
      logo_url: brand.logoUrl || "",
    });
    setLocalPreview(null);
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleLogoFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const localUrl = URL.createObjectURL(file);
    setLocalPreview(localUrl);
    setIsUploadingLogo(true);
    setModalError(null);
    try {
      const subfolder = formData.slug || formData.name || undefined;
      const res = await adminCatalogService.uploadImage(file, "brands", subfolder);
      if (res?.url) {
        setFormData((prev) => ({ ...prev, logo_url: res.url }));
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to upload logo image. Allowed: PNG, JPG, WebP up to 10MB.");
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleSubmitBrand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError("Brand name is required.");
      return;
    }
    const mfgName = formData.manufacturer_name.trim() || `${formData.name.trim()} Pharma Pvt Ltd`;
    setIsSubmitting(true);
    setModalError(null);

    const payload = {
      name: formData.name.trim(),
      manufacturer_name: mfgName,
      country_of_origin: formData.country_of_origin.trim() || "India",
      description: formData.description.trim() || undefined,
      slug: formData.slug.trim() || undefined,
      logo_url: formData.logo_url.trim() || undefined,
    };

    try {
      if (editingBrand) {
        await adminCatalogService.updateBrand(editingBrand.id, payload);
      } else {
        await adminCatalogService.createBrand(payload);
      }
      setIsModalOpen(false);
      await loadBrands();
    } catch (e: any) {
      setModalError(e.message || `Failed to ${editingBrand ? "update" : "create"} brand.`);
    } finally {
      setIsSubmitting(false);
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
          {b.logoUrl ? (
            <img
              src={b.logoUrl}
              alt={b.name}
              className="w-8 h-8 rounded-lg object-contain bg-white border border-slate-200 p-0.5 shrink-0"
              onError={(e) => {
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
              <Award className="w-4 h-4" />
            </div>
          )}
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
            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Edit Brand"
            onClick={() => handleOpenEditModal(b)}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title={b.isActive ? "Deactivate" : "Activate"}
            onClick={() => handleToggleStatus(b)}
          >
            {b.isActive ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
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
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold shadow-sm transition"
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
          <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
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

      {/* Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingBrand ? "Edit Brand Details" : "Add New Pharmaceutical Brand"}
              </h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs">
                {modalError}
              </div>
            )}

            <form onSubmit={handleSubmitBrand} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cipla Healthcare"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      manufacturer_name: formData.manufacturer_name || `${e.target.value} Ltd`,
                      slug:
                        editingBrand
                          ? formData.slug
                          : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Manufacturer Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cipla Ltd. Mumbai"
                  value={formData.manufacturer_name}
                  onChange={(e) => setFormData({ ...formData, manufacturer_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              {/* Brand Logo Upload & Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Brand Logo
                </label>
                <div className="space-y-2">
                  {formData.logo_url || localPreview ? (
                    <div className="flex items-center gap-3 p-2 border border-slate-200 rounded-lg bg-slate-50 relative overflow-hidden">
                      <img
                        src={formData.logo_url || localPreview || ""}
                        alt="Logo Preview"
                        className="w-12 h-12 object-contain bg-white rounded-md border border-slate-300 p-1"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono text-slate-600 truncate">
                          {formData.logo_url || "Local Preview"}
                        </p>
                        {isUploadingLogo ? (
                          <div className="flex items-center gap-1 text-[10px] text-teal-600 font-semibold">
                            <Loader2 className="w-3 h-3 animate-spin" />
                            <span>Uploading to Firebase...</span>
                          </div>
                        ) : (
                          <p className="text-[10px] text-teal-600 font-semibold">
                            {formData.logo_url ? "Uploaded to Firebase" : "Preview ready"}
                          </p>
                        )}
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setFormData((prev) => ({ ...prev, logo_url: "" }));
                          setLocalPreview(null);
                          if (fileInputRef.current) fileInputRef.current.value = "";
                        }}
                        className="text-xs text-red-500 hover:text-red-700 p-1 font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => fileInputRef.current?.click()}
                      className="border-2 border-dashed border-slate-300 hover:border-[#0D9488] rounded-lg p-3 text-center cursor-pointer transition bg-slate-50 hover:bg-teal-50/30"
                    >
                      <input
                        ref={fileInputRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleLogoFileChange}
                      />
                      {isUploadingLogo ? (
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
                          <Loader2 className="w-4 h-4 animate-spin text-[#0D9488]" />
                          <span>Uploading brand logo...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                          <Upload className="w-4 h-4 text-slate-400" />
                          <span className="text-[11px] font-medium text-slate-700">Click to upload brand logo</span>
                          <span className="text-[10px] text-slate-400">PNG, JPG or WebP (max 10MB)</span>
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Or enter public logo URL directly"
                    value={formData.logo_url}
                    onChange={(e) => setFormData({ ...formData, logo_url: e.target.value })}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Country of Origin
                  </label>
                  <input
                    type="text"
                    value={formData.country_of_origin}
                    onChange={(e) => setFormData({ ...formData, country_of_origin: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    URL Slug
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. cipla"
                    value={formData.slug}
                    onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Corporate details, pharmaceutical manufacturing background..."
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || isUploadingLogo}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? (editingBrand ? "Saving..." : "Creating...") : (editingBrand ? "Update Brand" : "Save Brand")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
