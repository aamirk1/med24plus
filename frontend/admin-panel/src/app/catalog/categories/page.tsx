"use client";

import React, { useState, useEffect, useRef } from "react";
import { Plus, FolderTree, Edit3, Trash2, Loader2, CheckCircle2, XCircle, X, Upload, Image as ImageIcon } from "lucide-react";
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
  imageUrl?: string;
  productCount: number;
  status: string;
  isActive: boolean;
}

export default function AdminCategoriesPage() {
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState<CategoryRow[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Category Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<CategoryRow | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    description: "",
    slug: "",
    image_url: "",
  });

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
            imageUrl: c.image_url,
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

  const handleOpenCreateModal = () => {
    setEditingCategory(null);
    setFormData({ name: "", description: "", slug: "", image_url: "" });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (cat: CategoryRow) => {
    setEditingCategory(cat);
    setFormData({
      name: cat.name,
      description: cat.description || "",
      slug: cat.slug,
      image_url: cat.imageUrl || "",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingImage(true);
    setModalError(null);
    try {
      const res = await adminCatalogService.uploadImage(file, "categories");
      if (res?.url) {
        setFormData((prev) => ({ ...prev, image_url: res.url }));
      }
    } catch (err: any) {
      setModalError(err.message || "Failed to upload image. Please ensure valid PNG/JPG/WebP up to 5MB.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleSubmitCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setModalError("Category name is required.");
      return;
    }
    setIsSubmitting(true);
    setModalError(null);

    const payload = {
      name: formData.name.trim(),
      description: formData.description.trim() || undefined,
      slug: formData.slug.trim() || undefined,
      image_url: formData.image_url.trim() || undefined,
    };

    try {
      if (editingCategory) {
        await adminCatalogService.updateCategory(editingCategory.id, payload);
      } else {
        await adminCatalogService.createCategory(payload);
      }
      setIsModalOpen(false);
      await loadCategories();
    } catch (e: any) {
      setModalError(e.message || `Failed to ${editingCategory ? "update" : "create"} category.`);
    } finally {
      setIsSubmitting(false);
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
          {c.imageUrl ? (
            <img
              src={c.imageUrl}
              alt={c.name}
              className="w-8 h-8 rounded-lg object-cover border border-slate-200 shrink-0"
              onError={(e) => {
                // Fallback to icon on image error
                (e.target as HTMLElement).style.display = "none";
              }}
            />
          ) : (
            <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0D9488] flex items-center justify-center shrink-0">
              <FolderTree className="w-4 h-4" />
            </div>
          )}
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
            className="p-1.5 rounded-md text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition"
            title="Edit Category"
            onClick={() => handleOpenEditModal(c)}
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title={c.isActive ? "Deactivate" : "Activate"}
            onClick={() => handleToggleStatus(c)}
          >
            {c.isActive ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
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
            onClick={handleOpenCreateModal}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold shadow-sm transition"
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
          <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
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

      {/* Creation / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingCategory ? "Edit Therapeutic Category" : "Add New Therapeutic Category"}
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

            <form onSubmit={handleSubmitCategory} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Cardiovascular Care"
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      name: e.target.value,
                      slug:
                        editingCategory
                          ? formData.slug
                          : e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, ""),
                    })
                  }
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  URL Slug (Optional)
                </label>
                <input
                  type="text"
                  placeholder="e.g. cardiovascular-care"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              {/* Image Upload & Preview */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Category Image / Icon
                </label>
                <div className="space-y-2">
                  {formData.image_url ? (
                    <div className="flex items-center gap-3 p-2 border border-slate-200 rounded-lg bg-slate-50">
                      <img
                        src={formData.image_url}
                        alt="Preview"
                        className="w-12 h-12 object-cover rounded-md border border-slate-300"
                      />
                      <div className="flex-1 min-w-0">
                        <p className="text-[11px] font-mono text-slate-600 truncate">{formData.image_url}</p>
                        <p className="text-[10px] text-teal-600 font-semibold">Image uploaded</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData((prev) => ({ ...prev, image_url: "" }))}
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
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleImageFileChange}
                      />
                      {isUploadingImage ? (
                        <div className="flex items-center justify-center gap-2 text-slate-500 text-xs">
                          <Loader2 className="w-4 h-4 animate-spin text-[#0D9488]" />
                          <span>Uploading image...</span>
                        </div>
                      ) : (
                        <div className="flex flex-col items-center justify-center gap-1 text-slate-500">
                          <Upload className="w-4 h-4 text-slate-400" />
                          <span className="text-[11px] font-medium text-slate-700">Click to upload category image</span>
                          <span className="text-[10px] text-slate-400">PNG, JPG or WebP (max 5MB)</span>
                        </div>
                      )}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Or enter public image URL directly"
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    className="w-full px-3 py-1.5 text-[11px] border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Description
                </label>
                <textarea
                  rows={2}
                  placeholder="Clinical therapeutic description and indications..."
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
                  disabled={isSubmitting || isUploadingImage}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? (editingCategory ? "Saving..." : "Creating...") : (editingCategory ? "Update Category" : "Save Category")}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
