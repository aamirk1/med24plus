"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Save, Trash2, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection } from "@/components/ui/FormSection";
import { adminCatalogService } from "@/services/admin-catalog.service";

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    brand_name: "",
    sku: "",
    category_name: "",
    schedule_classification: "SCHEDULE_H",
    mrp: "0",
    selling_price: "0",
    description: "",
    dosage_form: "Tablet",
    pack_size: "1 Strip",
    is_active: true,
  });

  useEffect(() => {
    if (!productId) return;
    setLoading(true);
    adminCatalogService
      .getProduct(productId)
      .then((data) => {
        if (data) {
          setFormData({
            name: data.name || "",
            brand_name: data.brand?.name || data.manufacturer || "",
            sku: data.sku || "",
            category_name: data.category?.name || "",
            schedule_classification: data.schedule_classification || "SCHEDULE_H",
            mrp: String(data.mrp ?? 0),
            selling_price: String(data.selling_price ?? 0),
            description: data.description || "",
            dosage_form: data.dosage_form || "Tablet",
            pack_size: data.pack_size || "1 Strip",
            is_active: data.is_active ?? true,
          });
        }
      })
      .catch((err) => {
        console.error("Failed to load product:", err);
        setError("Could not load product details from server.");
      })
      .finally(() => setLoading(false));
  }, [productId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    try {
      await adminCatalogService.updateProduct(productId, {
        name: formData.name,
        mrp: parseFloat(formData.mrp),
        selling_price: parseFloat(formData.selling_price),
        description: formData.description,
        dosage_form: formData.dosage_form,
        pack_size: formData.pack_size,
        schedule_classification: formData.schedule_classification,
        is_active: formData.is_active,
      });

      setSuccessMsg("Product updated successfully in live database!");
      setTimeout(() => {
        router.push("/catalog/products");
      }, 1200);
    } catch (err: any) {
      console.error("Error updating product:", err);
      setError(err?.message || "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to deactivate this product?")) return;
    try {
      await adminCatalogService.setProductStatus(productId, false);
      alert("Product deactivated successfully.");
      router.push("/catalog/products");
    } catch (err: any) {
      alert("Failed to deactivate: " + (err?.message || "Server error"));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488] mb-3" />
        <p className="text-sm font-medium">Loading live product details from database...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-4xl">
      <div className="flex items-center gap-2">
        <Link
          href="/catalog/products"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Products</span>
        </Link>
      </div>

      <PageHeader
        title={`Edit Product: ${formData.name || productId}`}
        subtitle={`SKU: ${formData.sku || "N/A"} | ID: ${productId}`}
        actions={
          <button
            type="button"
            onClick={handleDeactivate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 rounded-lg transition"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Deactivate Product</span>
          </button>
        }
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-center gap-2 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 font-medium">
          {successMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Product Identity" description="Core identifiers and brand names">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Title
              </label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand</label>
              <input
                type="text"
                readOnly
                value={formData.brand_name}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">SKU</label>
              <input
                type="text"
                value={formData.sku}
                readOnly
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">Description</label>
              <textarea
                rows={3}
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              />
            </div>
          </div>
        </FormSection>

        <FormSection title="Pricing & Inventory" description="Rate cards and current stock counts">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">MRP (₹)</label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹)
              </label>
              <input
                type="number"
                step="0.01"
                required
                value={formData.selling_price}
                onChange={(e) => setFormData({ ...formData, selling_price: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              />
            </div>
          </div>
        </FormSection>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link
            href="/catalog/products"
            className="px-4 py-2 text-xs font-semibold text-slate-600 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={submitting}
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-60 rounded-lg shadow-sm transition"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{submitting ? "Saving..." : "Update Product"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
