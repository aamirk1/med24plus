"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Save,
  Trash2,
  Loader2,
  AlertCircle,
  Upload,
  Check,
  Star,
  Image as ImageIcon,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection } from "@/components/ui/FormSection";
import { adminCatalogService } from "@/services/admin-catalog.service";

interface ProductImageItem {
  id: string;
  image_url: string;
  alt_text?: string;
  is_primary: boolean;
  sort_order: number;
  isUploading?: boolean;
  uploadError?: string | null;
  file?: File;
}

export default function EditProductPage() {
  const params = useParams();
  const router = useRouter();
  const productId = params?.id as string;

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [images, setImages] = useState<ProductImageItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [formData, setFormData] = useState({
    name: "",
    sku: "",
    generic_name: "",
    composition: "",
    category_id: "",
    brand_id: "",
    manufacturer: "",
    pack_size: "1 Strip",
    dosage_form: "Tablet",
    storage_temperature: "room_temperature",
    requires_prescription: true,
    schedule_classification: "SCHEDULE_H",
    mrp: "0",
    selling_price: "0",
    hsn_code: "30049099",
    gst_rate: "12",
    tag_badge: "",
    description: "",
    is_active: true,
  });

  const loadProductData = async () => {
    if (!productId) return;
    setLoading(true);
    setError(null);
    try {
      const productData = await adminCatalogService.getProduct(productId);

      if (!productData) {
        throw new Error("Product records could not be found or retrieved from database.");
      }

      setFormData({
        name: productData.name || "",
        sku: productData.sku || "",
        generic_name: productData.generic_name || "",
        composition: productData.composition || "",
        category_id: productData.category_id || "",
        brand_id: productData.brand_id || "",
        manufacturer: productData.manufacturer || "",
        pack_size: productData.pack_size || "1 Strip",
        dosage_form: productData.dosage_form || "Tablet",
        storage_temperature: productData.storage_temperature || "room_temperature",
        requires_prescription: productData.requires_prescription ?? true,
        schedule_classification: productData.schedule_classification || "SCHEDULE_H",
        mrp: String(productData.mrp ?? 0),
        selling_price: String(productData.selling_price ?? 0),
        hsn_code: productData.hsn_code || "30049099",
        gst_rate: String(productData.gst_rate ?? 12),
        tag_badge: productData.tag_badge || "",
        description: productData.description || "",
        is_active: productData.is_active ?? true,
      });

      if (productData.images) {
        setImages(
          productData.images.map((img: any) => ({
            id: img.id,
            image_url: img.image_url,
            alt_text: img.alt_text,
            is_primary: img.is_primary,
            sort_order: img.sort_order || 0,
          }))
        );
      }

      // Load categories and brands in background without blocking product edit
      try {
        const [catData, brandData] = await Promise.allSettled([
          adminCatalogService.getCategories({ page_size: 100 }),
          adminCatalogService.getBrands({ page_size: 100 }),
        ]);
        if (catData.status === "fulfilled" && catData.value?.items) {
          setCategories(catData.value.items.map((c: any) => ({ id: c.id, name: c.name })));
        }
        if (brandData.status === "fulfilled" && brandData.value?.items) {
          setBrands(brandData.value.items.map((b: any) => ({ id: b.id, name: b.name })));
        }
      } catch (taxonomyErr) {
        console.warn("Taxonomy fetch warning:", taxonomyErr);
      }
    } catch (err: any) {
      console.error("Failed to load product:", err);
      setError(err?.message || "Could not load product details from server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadProductData();
  }, [productId]);

  const executeUpload = async (tempId: string, file: File) => {
    try {
      const data = new FormData();
      data.append("file", file);
      data.append("alt_text", formData.name || "Product Packaging");
      data.append("is_primary", String(images.length <= 1));
      data.append("sort_order", String(images.length));

      const newImg = await adminCatalogService.uploadProductImage(productId, data);
      if (newImg) {
        setImages((prev) =>
          prev.map((item) =>
            item.id === tempId
              ? {
                  id: newImg.id,
                  image_url: newImg.image_url,
                  alt_text: newImg.alt_text || formData.name || "Packaging",
                  is_primary: newImg.is_primary,
                  sort_order: newImg.sort_order || 0,
                  isUploading: false,
                  uploadError: null,
                }
              : item
          )
        );
        setSuccessMsg("Product image uploaded to Firebase successfully!");
      }
    } catch (err: any) {
      console.error("Image upload failed:", err);
      const errMsg = err?.message || "Failed to upload product image to Firebase.";
      setError(errMsg);
      setImages((prev) =>
        prev.map((item) =>
          item.id === tempId
            ? { ...item, isUploading: false, uploadError: errMsg }
            : item
        )
      );
    } finally {
      setUploadingImage(false);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }

    const tempId = `temp-${Date.now()}`;
    const localPreviewUrl = URL.createObjectURL(file);
    const isFirstImage = images.length === 0;

    // Immediately display the selected image in the preview gallery with uploading status
    const tempItem: ProductImageItem = {
      id: tempId,
      image_url: localPreviewUrl,
      alt_text: file.name,
      is_primary: isFirstImage,
      sort_order: images.length,
      isUploading: true,
      uploadError: null,
      file: file,
    };

    setImages((prev) => [...prev, tempItem]);
    setUploadingImage(true);
    setError(null);

    await executeUpload(tempId, file);
  };

  const handleRetryUpload = (item: ProductImageItem) => {
    if (!item.file) return;
    setImages((prev) =>
      prev.map((img) =>
        img.id === item.id ? { ...img, isUploading: true, uploadError: null } : img
      )
    );
    setUploadingImage(true);
    executeUpload(item.id, item.file);
  };

  const handleDismissTempImage = (tempId: string) => {
    setImages((prev) => prev.filter((img) => img.id !== tempId));
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    try {
      await adminCatalogService.setPrimaryProductImage(productId, imageId);
      setImages((prev) =>
        prev.map((img) => ({
          ...img,
          is_primary: img.id === imageId,
        }))
      );
    } catch (err: any) {
      alert("Failed to set primary image: " + (err?.message || "Error"));
    }
  };

  const handleDeleteImage = async (imageId: string) => {
    if (!confirm("Are you sure you want to remove this product image?")) return;
    try {
      await adminCatalogService.deleteProductImage(productId, imageId);
      setImages((prev) => prev.filter((img) => img.id !== imageId));
    } catch (err: any) {
      alert("Failed to delete image: " + (err?.message || "Error"));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccessMsg(null);

    const mrpNum = parseFloat(formData.mrp);
    const sellNum = parseFloat(formData.selling_price);

    if (sellNum > mrpNum) {
      setError("Selling price cannot exceed Maximum Retail Price (MRP).");
      setSubmitting(false);
      return;
    }

    try {
      await adminCatalogService.updateProduct(productId, {
        name: formData.name.trim(),
        generic_name: formData.generic_name.trim() || formData.name.trim(),
        composition: formData.composition.trim() || undefined,
        category_id: formData.category_id || undefined,
        brand_id: formData.brand_id || undefined,
        manufacturer: formData.manufacturer.trim() || undefined,
        mrp: mrpNum,
        selling_price: sellNum,
        description: formData.description.trim() || undefined,
        dosage_form: formData.dosage_form,
        pack_size: formData.pack_size.trim(),
        storage_temperature: formData.storage_temperature,
        schedule_classification: formData.schedule_classification,
        requires_prescription: formData.requires_prescription,
        hsn_code: formData.hsn_code.trim(),
        gst_rate: parseFloat(formData.gst_rate),
        tag_badge: formData.tag_badge.trim() || "",
        is_active: formData.is_active,
      });

      setSuccessMsg("Product updated successfully in live database!");
      setTimeout(() => {
        router.push("/catalog/products");
      }, 1000);
    } catch (err: any) {
      console.error("Error updating product:", err);
      setError(err?.message || "Failed to update product.");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivate = async () => {
    if (!confirm("Are you sure you want to toggle status for this product?")) return;
    try {
      await adminCatalogService.setProductStatus(productId, !formData.is_active);
      setFormData((prev) => ({ ...prev, is_active: !prev.is_active }));
      setSuccessMsg(`Product marked as ${!formData.is_active ? "active" : "inactive"}.`);
    } catch (err: any) {
      alert("Failed to update status: " + (err?.message || "Server error"));
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#0052CC] mb-3" />
        <p className="text-sm font-medium">Loading live product details from database...</p>
      </div>
    );
  }

  if (error && !formData.name) {
    return (
      <div className="space-y-6 max-w-4xl py-12">
        <div className="flex items-center gap-2">
          <Link
            href="/catalog/products"
            className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Products</span>
          </Link>
        </div>
        <div className="bg-white rounded-2xl border border-red-200 p-8 text-center space-y-4 shadow-sm">
          <div className="w-12 h-12 bg-red-50 text-red-600 rounded-full flex items-center justify-center mx-auto">
            <AlertCircle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">Could Not Load Product Details</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">{error}</p>
          </div>
          <div className="flex justify-center gap-3 pt-2">
            <button
              type="button"
              onClick={loadProductData}
              className="px-4 py-2 bg-[#0052CC] hover:bg-[#0043A8] text-white text-xs font-semibold rounded-lg shadow-sm transition"
            >
              Retry Loading
            </button>
            <Link
              href="/catalog/products"
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-lg transition"
            >
              Return to Catalog
            </Link>
          </div>
        </div>
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
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition ${
              formData.is_active
                ? "text-red-600 bg-red-50 hover:bg-red-100"
                : "text-teal-700 bg-teal-50 hover:bg-teal-100"
            }`}
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>{formData.is_active ? "Deactivate Product" : "Activate Product"}</span>
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

      {/* Product Images Gallery Section */}
      <FormSection
        title="Product Images & Packaging Gallery"
        description="Statutory packaging photos, blister cards, and bottle labels visible to customers and pharmacists."
      >
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
            {images.map((img) => (
              <div
                key={img.id}
                className={`relative group rounded-xl border p-2 flex flex-col items-center justify-between bg-white transition shadow-xs overflow-hidden ${
                  img.uploadError
                    ? "border-red-400 bg-red-50/20"
                    : img.is_primary
                    ? "border-teal-500 ring-2 ring-teal-500/20"
                    : "border-slate-200"
                }`}
              >
                <div className="w-full h-28 flex items-center justify-center overflow-hidden rounded-lg bg-slate-50 relative">
                  <img
                    src={img.image_url}
                    alt={img.alt_text || "Packaging"}
                    className="w-full h-full object-contain"
                  />

                  {img.isUploading && (
                    <div className="absolute inset-0 bg-white/85 backdrop-blur-xs flex flex-col items-center justify-center p-2 text-center z-10">
                      <Loader2 className="w-5 h-5 animate-spin text-teal-600 mb-1" />
                      <span className="text-[11px] font-semibold text-teal-800">Uploading to Firebase...</span>
                    </div>
                  )}

                  {img.uploadError && (
                    <div className="absolute inset-0 bg-red-50/95 flex flex-col items-center justify-center p-2 text-center z-10">
                      <AlertCircle className="w-4 h-4 text-red-600 mb-1" />
                      <span className="text-[10px] text-red-700 font-semibold mb-1 line-clamp-2">
                        {img.uploadError}
                      </span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleRetryUpload(img)}
                          className="px-2 py-0.5 text-[10px] bg-red-600 text-white rounded font-medium hover:bg-red-700"
                        >
                          Retry
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDismissTempImage(img.id)}
                          className="px-1.5 py-0.5 text-[10px] bg-slate-200 text-slate-700 rounded font-medium hover:bg-slate-300"
                        >
                          Dismiss
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="w-full mt-2 flex items-center justify-between gap-1 pt-1.5 border-t border-slate-100 text-[10px]">
                  {img.id.startsWith("temp-") ? (
                    <span className="text-slate-400 italic">Preview</span>
                  ) : img.is_primary ? (
                    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 bg-teal-50 text-teal-700 font-bold rounded">
                      <Star className="w-3 h-3 fill-teal-600 text-teal-600" />
                      Primary
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleSetPrimaryImage(img.id)}
                      className="text-slate-500 hover:text-teal-700 font-medium transition"
                    >
                      Make Primary
                    </button>
                  )}
                  {img.id.startsWith("temp-") ? (
                    <button
                      type="button"
                      onClick={() => handleDismissTempImage(img.id)}
                      className="text-slate-400 hover:text-red-600 p-0.5 font-medium transition"
                      title="Dismiss Preview"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      className="text-red-500 hover:text-red-700 p-0.5 font-medium transition"
                      title="Remove Image"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            ))}

            {/* Upload New Image Button */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="h-36 border-2 border-dashed border-slate-300 hover:border-[#0D9488] rounded-xl flex flex-col items-center justify-center p-3 text-center cursor-pointer transition bg-slate-50 hover:bg-teal-50/20"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImageUpload}
              />
              <div className="flex flex-col items-center gap-1 text-slate-500">
                <Upload className="w-5 h-5 text-slate-400" />
                <span className="text-xs font-semibold text-slate-700">Add Packaging Image</span>
                <span className="text-[10px] text-slate-400">PNG, JPG, WebP up to 10MB</span>
              </div>
            </div>
          </div>
        </div>
      </FormSection>

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection title="Product Identity" description="Core identifiers, composition, and taxonomic classification">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product Title *
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
              <label className="block text-xs font-semibold text-slate-700 mb-1">Brand *</label>
              <select
                required
                value={formData.brand_id}
                onChange={(e) => {
                  const br = brands.find((b) => b.id === e.target.value);
                  setFormData({ ...formData, brand_id: e.target.value, manufacturer: br?.name || formData.manufacturer });
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              >
                <option value="">Select Brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Therapeutic Category *
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
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

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Dosage Form</label>
              <select
                value={formData.dosage_form}
                onChange={(e) => setFormData({ ...formData, dosage_form: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              >
                <option value="Tablet">Tablet</option>
                <option value="Capsule">Capsule</option>
                <option value="Syrup">Syrup</option>
                <option value="Injection">Injection</option>
                <option value="Ointment">Ointment / Gel</option>
                <option value="Drops">Eye / Ear Drops</option>
                <option value="Inhaler">Inhaler / Respule</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pack Size</label>
              <input
                type="text"
                placeholder="e.g. 10 Tablets / Strip"
                value={formData.pack_size}
                onChange={(e) => setFormData({ ...formData, pack_size: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Generic Composition (Salts)
              </label>
              <input
                type="text"
                placeholder="e.g. Amoxicillin 500mg + Clavulanic Acid 125mg"
                value={formData.generic_name}
                onChange={(e) =>
                  setFormData({ ...formData, generic_name: e.target.value, composition: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
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

        <FormSection
          title="Clinical & Statutory Scheduling"
          description="Drugs and Cosmetics Act regulatory parameters"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Schedule Classification
              </label>
              <select
                value={formData.schedule_classification}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    schedule_classification: e.target.value,
                    requires_prescription: e.target.value !== "OTC",
                  })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              >
                <option value="OTC">OTC (Over the Counter)</option>
                <option value="SCHEDULE_H">Schedule H (Prescription Required)</option>
                <option value="SCHEDULE_H1">Schedule H1 (High-Risk Antibiotic)</option>
                <option value="SCHEDULE_X">Schedule X (Strict Narcotics)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="req-rx-edit"
                checked={formData.requires_prescription}
                onChange={(e) => setFormData({ ...formData, requires_prescription: e.target.checked })}
                className="w-4 h-4 accent-[#0D9488] rounded"
              />
              <label htmlFor="req-rx-edit" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Mandatory Prescription (Rx)
              </label>
            </div>
          </div>
        </FormSection>

        <FormSection title="Pricing & Taxation" description="Rate cards and Indian GST structure">
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
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
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">HSN Code</label>
              <input
                type="text"
                value={formData.hsn_code}
                onChange={(e) => setFormData({ ...formData, hsn_code: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">GST Rate (%)</label>
              <select
                value={formData.gst_rate}
                onChange={(e) => setFormData({ ...formData, gst_rate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              >
                <option value="0">0%</option>
                <option value="5">5%</option>
                <option value="12">12%</option>
                <option value="18">18%</option>
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Merchandising & Tag Badge (Tag Band)"
          description="Highlight this product across web and mobile apps with badges like Best Seller, Trending, Hot Deal, or Sale."
        >
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Select Tag Badge
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {["", "Best Seller", "Trending", "Hot Deal", "Sale", "Popular Choice", "Doctor Recommended", "26% OFF"].map((badge) => (
                  <button
                    key={badge}
                    type="button"
                    onClick={() => setFormData({ ...formData, tag_badge: badge })}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      formData.tag_badge === badge
                        ? "bg-[#0D9488] text-white shadow-xs"
                        : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                    }`}
                  >
                    {badge || "None (No Badge)"}
                  </button>
                ))}
              </div>
              <input
                type="text"
                placeholder="Or enter custom tag badge text..."
                value={formData.tag_badge}
                onChange={(e) => setFormData({ ...formData, tag_badge: e.target.value })}
                className="w-full max-w-md px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              />
            </div>

            {formData.tag_badge && (
              <div className="flex items-center gap-2 pt-1 text-xs">
                <span className="text-slate-500 font-medium">Badge Preview:</span>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-extrabold bg-amber-500 text-white shadow-xs">
                  {formData.tag_badge}
                </span>
              </div>
            )}
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
            className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-[#0052CC] hover:bg-[#0043A8] disabled:opacity-60 rounded-lg shadow-sm transition"
          >
            {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            <span>{submitting ? "Saving..." : "Update Product"}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
