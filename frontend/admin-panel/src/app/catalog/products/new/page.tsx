"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection } from "@/components/ui/FormSection";
import { adminCatalogService } from "@/services/admin-catalog.service";

export default function NewProductPage() {
  const router = useRouter();
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [brands, setBrands] = useState<{ id: string; name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    name: "",
    brand_id: "",
    sku: "",
    category_id: "",
    dosageForm: "Tablet",
    generic_name: "",
    composition: "",
    schedule: "OTC",
    requiresPrescription: false,
    mrp: "",
    sellingPrice: "",
    gstRate: "12",
    hsnCode: "30049099",
    packSize: "10 Tablets / Strip",
    storageTemp: "room_temperature",
    description: "",
    manufacturer: "",
  });

  useEffect(() => {
    async function loadSelects() {
      try {
        const [catData, brandData] = await Promise.all([
          adminCatalogService.getCategories({ page_size: 100 }),
          adminCatalogService.getBrands({ page_size: 100 }),
        ]);
        if (catData?.items?.length > 0) {
          setCategories(catData.items.map((c: any) => ({ id: c.id, name: c.name })));
          setFormData((prev) => ({ ...prev, category_id: catData.items[0].id }));
        }
        if (brandData?.items?.length > 0) {
          setBrands(brandData.items.map((b: any) => ({ id: b.id, name: b.name })));
          setFormData((prev) => ({ ...prev, brand_id: brandData.items[0].id, manufacturer: brandData.items[0].name }));
        }
      } catch (e) {
        console.warn("Could not load categories/brands:", e);
      }
    }
    loadSelects();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsSubmitting(true);

    try {
      const mrpNum = parseFloat(formData.mrp);
      const sellNum = parseFloat(formData.sellingPrice);

      if (sellNum > mrpNum) {
        setErrorMessage("Selling price cannot exceed Maximum Retail Price (MRP).");
        setIsSubmitting(false);
        return;
      }

      await adminCatalogService.createProduct({
        name: formData.name.trim(),
        sku: formData.sku.trim(),
        generic_name: formData.generic_name.trim() || formData.name.trim(),
        composition: formData.composition.trim() || undefined,
        category_id: formData.category_id,
        brand_id: formData.brand_id,
        manufacturer: formData.manufacturer.trim() || "Licensed Manufacturer",
        description: formData.description.trim() || undefined,
        pack_size: formData.packSize.trim(),
        dosage_form: formData.dosageForm,
        storage_temperature: formData.storageTemp,
        requires_prescription: formData.requiresPrescription,
        schedule_classification: formData.schedule,
        mrp: mrpNum,
        selling_price: sellNum,
        hsn_code: formData.hsnCode.trim(),
        gst_rate: parseFloat(formData.gstRate),
        is_active: true,
      });

      router.push("/catalog/products");
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to create product.");
    } finally {
      setIsSubmitting(false);
    }
  };

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
        title="Add New Medicine or Healthcare Product"
        subtitle="Specify therapeutic salt composition, Indian clinical schedule, and inventory defaults."
      />

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 flex items-center gap-2.5 text-xs text-red-700">
          <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <FormSection
          title="Basic Product Identity"
          description="Official brand title, manufacturer, and packaging details."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Product / Medicine Title *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Paracetamol 650mg Tablets"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand *
              </label>
              <select
                required
                value={formData.brand_id}
                onChange={(e) => {
                  const br = brands.find((b) => b.id === e.target.value);
                  setFormData({ ...formData, brand_id: e.target.value, manufacturer: br?.name || formData.manufacturer });
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              >
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal SKU Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MED-PCM-650"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Therapeutic Category *
              </label>
              <select
                required
                value={formData.category_id}
                onChange={(e) => setFormData({ ...formData, category_id: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dosage Form *
              </label>
              <select
                value={formData.dosageForm}
                onChange={(e) => setFormData({ ...formData, dosageForm: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
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

            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Generic Composition (Salts & Strength) *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. Paracetamol IP 650mg"
                value={formData.generic_name}
                onChange={(e) => setFormData({ ...formData, generic_name: e.target.value, composition: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Clinical & Statutory Scheduling (Rule 65)"
          description="Indian Drugs & Cosmetics Rules prescription classifications."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Schedule Classification *
              </label>
              <select
                value={formData.schedule}
                onChange={(e) => {
                  const sch = e.target.value;
                  const reqRx = sch !== "OTC";
                  setFormData({ ...formData, schedule: sch, requiresPrescription: reqRx });
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              >
                <option value="OTC">OTC (Over the Counter)</option>
                <option value="SCHEDULE_H">Schedule H (Prescription Required)</option>
                <option value="SCHEDULE_H1">Schedule H1 (High-Risk Antibiotic / Narcotic)</option>
                <option value="SCHEDULE_X">Schedule X (Strict Narcotics - Restricted)</option>
              </select>
            </div>

            <div className="flex items-center gap-3 pt-6">
              <input
                type="checkbox"
                id="req-rx"
                checked={formData.requiresPrescription}
                onChange={(e) => setFormData({ ...formData, requiresPrescription: e.target.checked })}
                className="w-4 h-4 accent-[#087F5B] rounded"
              />
              <label htmlFor="req-rx" className="text-xs font-semibold text-slate-700 cursor-pointer">
                Mandatory Doctor Prescription Upload (Rx)
              </label>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Pricing, Taxation & Pack Size"
          description="Statutory MRP, selling rate, HSN classification, and Indian GST rate."
        >
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                MRP (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="100.00"
                value={formData.mrp}
                onChange={(e) => setFormData({ ...formData, mrp: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Selling Price (₹) *
              </label>
              <input
                type="number"
                step="0.01"
                required
                placeholder="85.00"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HSN Code *
              </label>
              <input
                type="text"
                required
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Rate (%) *
              </label>
              <select
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              >
                <option value="0">0% (Essential formulations)</option>
                <option value="5">5% (Life-saving items)</option>
                <option value="12">12% (Standard medicaments)</option>
                <option value="18">18% (Devices & cosmetics)</option>
              </select>
            </div>
          </div>
        </FormSection>

        <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-200">
          <Link href="/catalog/products">
            <button
              type="button"
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
            >
              Cancel
            </button>
          </Link>
          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#087F5B] hover:bg-[#066649] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
          >
            {isSubmitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            <span>Save Product to Catalog</span>
          </button>
        </div>
      </form>
    </div>
  );
}
