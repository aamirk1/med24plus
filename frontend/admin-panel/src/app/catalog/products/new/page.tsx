"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Save, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection } from "@/components/ui/FormSection";

export default function NewProductPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    brand: "",
    sku: "",
    category: "Diabetes Care & Monitoring",
    dosageForm: "Tablet",
    composition: "",
    schedule: "SCHEDULE_H",
    requiresPrescription: true,
    mrp: "",
    sellingPrice: "",
    gstRate: "12",
    hsnCode: "30049099",
    packSize: "",
    storageTemp: "Below 25°C",
    description: "",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Mock product created successfully in catalog.");
    router.push("/catalog/products");
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
                placeholder="e.g. Augmentin 625 Duo Tablets"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Brand / Manufacturer *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. GlaxoSmithKline Pharmaceuticals"
                value={formData.brand}
                onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Internal SKU Code *
              </label>
              <input
                type="text"
                required
                placeholder="e.g. MED-AUG-625"
                value={formData.sku}
                onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Therapeutic Category
              </label>
              <select
                value={formData.category}
                onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              >
                <option value="Diabetes Care & Monitoring">Diabetes Care & Monitoring</option>
                <option value="Cardiac & BP Support">Cardiac & BP Support</option>
                <option value="Vitamins, Minerals & Daily Health">Vitamins, Minerals & Daily Health</option>
                <option value="Cold, Cough & Respiratory">Cold, Cough & Respiratory</option>
                <option value="First Aid & Surgical Supplies">First Aid & Surgical Supplies</option>
                <option value="Ayurvedic & Herbal Wellness">Ayurvedic & Herbal Wellness</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Dosage Form & Pack Size
              </label>
              <input
                type="text"
                placeholder="e.g. Strip of 10 Tablets"
                value={formData.packSize}
                onChange={(e) => setFormData({ ...formData, packSize: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Clinical & Indian Regulatory Classification"
          description="Drugs and Cosmetics Act, 1940 compliance classification."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Active Salt Composition
              </label>
              <input
                type="text"
                placeholder="e.g. Amoxicillin (500mg) + Clavulanic Acid (125mg)"
                value={formData.composition}
                onChange={(e) => setFormData({ ...formData, composition: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Statutory Drug Schedule *
              </label>
              <select
                value={formData.schedule}
                onChange={(e) => {
                  const val = e.target.value;
                  setFormData({
                    ...formData,
                    schedule: val,
                    requiresPrescription: val === "SCHEDULE_H" || val === "SCHEDULE_H1",
                  });
                }}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              >
                <option value="OTC">General Sale (OTC / Non-Rx)</option>
                <option value="SCHEDULE_H">Schedule H (Prescription Mandatory)</option>
                <option value="SCHEDULE_H1">Schedule H1 (High-Alert 3-Year Register)</option>
                <option value="AYUSH">AYUSH (Herbal / Proprietary)</option>
                <option value="DEVICE">Medical Device / Equipment</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Storage & Handling Temp
              </label>
              <select
                value={formData.storageTemp}
                onChange={(e) => setFormData({ ...formData, storageTemp: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              >
                <option value="Below 25°C">Store below 25°C (Room Temp)</option>
                <option value="2°C to 8°C">2°C – 8°C (Cold-Chain Insulin/Vaccine)</option>
                <option value="Protect from Light">Store in dry place, protect from light</option>
              </select>
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Pricing & Indian GST Configuration"
          description="MRP, retail rate, and tax compliance identifiers."
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Maximum Retail Price (MRP ₹) *
              </label>
              <input
                type="number"
                required
                placeholder="220"
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
                required
                placeholder="195"
                value={formData.sellingPrice}
                onChange={(e) => setFormData({ ...formData, sellingPrice: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                GST Rate (%)
              </label>
              <select
                value={formData.gstRate}
                onChange={(e) => setFormData({ ...formData, gstRate: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              >
                <option value="0">0% (Exempt)</option>
                <option value="5">5% (Essential life-saving drugs)</option>
                <option value="12">12% (Standard formulations)</option>
                <option value="18">18% (Devices / Cosmetics)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                HSN Code
              </label>
              <input
                type="text"
                placeholder="30049099"
                value={formData.hsnCode}
                onChange={(e) => setFormData({ ...formData, hsnCode: e.target.value })}
                className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
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
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#087F5B] hover:bg-[#066649] rounded-lg shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Product to Catalog</span>
          </button>
        </div>
      </form>
    </div>
  );
}
