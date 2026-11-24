"use client";

import React, { useState, useEffect } from "react";
import { Save, ShieldCheck, CheckCircle2, AlertCircle, Loader2, Building, Phone, MapPin, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection } from "@/components/ui/FormSection";
import { apiClient } from "@/services/api";

interface StoreSettingsData {
  business_legal_name: string;
  trade_name: string;
  drug_license_form_20: string;
  drug_license_form_21: string;
  gstin: string;
  fssai_license: string;
  supervising_pharmacist: string;
  supervising_pharmacist_reg_no: string;
  registered_address: string;
  store_phone: string;
  support_email: string;
  operating_hours: string;
  emergency_helpline: string;
  serviceable_pincodes: string[];
}

const defaultSettings: StoreSettingsData = {
  business_legal_name: "Med24Plus Retail Healthcare Pvt Ltd",
  trade_name: "Med24Plus Pharmacy",
  drug_license_form_20: "DL-KA-2026-PHAR-008472",
  drug_license_form_21: "DL-KA-2026-PHAR-008473",
  gstin: "29AABCM9482Q1Z8",
  fssai_license: "11224334000192",
  supervising_pharmacist: "Ramesh Sharma, B.Pharm",
  supervising_pharmacist_reg_no: "PCI-REG-94821/2020",
  registered_address: "No. 42, 80 Feet Road, 4th Block, Koramangala, Bengaluru, Karnataka - 560034",
  store_phone: "+91 80 8069 0161",
  support_email: "care@med24plus.in",
  operating_hours: "24 Hours / 7 Days (Continuous Critical Care)",
  emergency_helpline: "+91 80 2345 6789",
  serviceable_pincodes: ["560034", "560095", "560047", "560001", "400001", "400051", "110001"],
};

export default function AdminStoreSettingsPage() {
  const [store, setStore] = useState<StoreSettingsData>(defaultSettings);
  const [pincodesInput, setPincodesInput] = useState<string>(defaultSettings.serviceable_pincodes.join(", "));
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [statusMessage, setStatusMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  useEffect(() => {
    async function fetchStoreSettings() {
      setIsLoading(true);
      try {
        const res: any = await apiClient("/admin/settings/store");
        if (res?.data) {
          setStore(res.data);
          if (Array.isArray(res.data.serviceable_pincodes)) {
            setPincodesInput(res.data.serviceable_pincodes.join(", "));
          }
        }
      } catch (err: any) {
        console.warn("Could not load backend store settings, using defaults:", err);
      } finally {
        setIsLoading(false);
      }
    }
    fetchStoreSettings();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setStatusMessage(null);

    const parsedPincodes = pincodesInput
      .split(",")
      .map((p) => p.trim())
      .filter((p) => p.length > 0);

    const payload = {
      ...store,
      serviceable_pincodes: parsedPincodes,
    };

    try {
      const res: any = await apiClient("/admin/settings/store", {
        method: "PUT",
        data: payload,
      });
      if (res?.data) {
        setStore(res.data);
      }
      setStatusMessage({
        type: "success",
        text: "Store legal identifiers, drug licenses, contact information, and delivery pincodes saved successfully.",
      });
      setTimeout(() => setStatusMessage(null), 5000);
    } catch (err: any) {
      setStatusMessage({
        type: "error",
        text: err?.message || "Failed to update store settings. Please ensure backend permissions are granted.",
      });
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Store Information & Drug Licensing"
        subtitle="Manage pharmacy identity, Form 20B/21B retail drug licenses, GSTIN, registered physical address, store phone numbers, and delivery pincodes."
      />

      <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
        <div className="text-xs text-teal-950">
          <p className="font-bold">Drug Inspector Audit & Cash Memo Compliance</p>
          <p className="text-teal-800 text-[11px] mt-0.5 leading-relaxed">
            Form 20 &amp; 21 licenses, Supervising Pharmacist council registration number, GSTIN, and store address are automatically stamped on all customer cash memos, invoices, and prescription dispensing tags across Med24Plus.
          </p>
        </div>
      </div>

      {statusMessage && (
        <div
          className={`p-3.5 rounded-xl border text-xs flex items-center gap-2.5 transition-all ${
            statusMessage.type === "success"
              ? "bg-emerald-50 border-emerald-200 text-emerald-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {statusMessage.type === "success" ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center p-12 bg-white rounded-2xl border border-slate-200/80">
          <Loader2 className="w-6 h-6 animate-spin text-[#0D9488] mr-2" />
          <span className="text-xs text-slate-500 font-medium">Loading store configuration...</span>
        </div>
      ) : (
        <form onSubmit={handleSave} className="space-y-6">
          <FormSection
            title="Legal & Licensing Identifiers"
            description="Drugs and Cosmetics Act Form 20B/21B retail license numbers and tax identifiers."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Legal Entity Name *
                </label>
                <input
                  type="text"
                  required
                  value={store.business_legal_name}
                  onChange={(e) => setStore({ ...store, business_legal_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store / Trade Name *
                </label>
                <input
                  type="text"
                  required
                  value={store.trade_name}
                  onChange={(e) => setStore({ ...store, trade_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Retail Drug License (Form 20) *
                </label>
                <input
                  type="text"
                  required
                  value={store.drug_license_form_20}
                  onChange={(e) => setStore({ ...store, drug_license_form_20: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Retail Drug License (Form 21) *
                </label>
                <input
                  type="text"
                  required
                  value={store.drug_license_form_21}
                  onChange={(e) => setStore({ ...store, drug_license_form_21: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  GSTIN Registration Number *
                </label>
                <input
                  type="text"
                  required
                  value={store.gstin}
                  onChange={(e) => setStore({ ...store, gstin: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  FSSAI Dietary Food License
                </label>
                <input
                  type="text"
                  value={store.fssai_license}
                  onChange={(e) => setStore({ ...store, fssai_license: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supervising Pharmacist Name *
                </label>
                <input
                  type="text"
                  required
                  value={store.supervising_pharmacist}
                  onChange={(e) => setStore({ ...store, supervising_pharmacist: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Pharmacy Council Reg. No. (PCI) *
                </label>
                <input
                  type="text"
                  required
                  value={store.supervising_pharmacist_reg_no}
                  onChange={(e) => setStore({ ...store, supervising_pharmacist_reg_no: e.target.value })}
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
            </div>
          </FormSection>

          <FormSection
            title="Physical Premises & Contact Details"
            description="Registered pharmacy address for customer pickup, dispatch center, and helpline contact."
          >
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Registered Physical Address *
                </label>
                <textarea
                  rows={2}
                  required
                  value={store.registered_address}
                  onChange={(e) => setStore({ ...store, registered_address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Store Primary Phone Number *
                </label>
                <input
                  type="text"
                  required
                  value={store.store_phone}
                  onChange={(e) => setStore({ ...store, store_phone: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Emergency / Pharmacist Helpline
                </label>
                <input
                  type="text"
                  value={store.emergency_helpline}
                  onChange={(e) => setStore({ ...store, emergency_helpline: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Customer Support Email *
                </label>
                <input
                  type="email"
                  required
                  value={store.support_email}
                  onChange={(e) => setStore({ ...store, support_email: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operating Dispensing Hours *
                </label>
                <input
                  type="text"
                  required
                  value={store.operating_hours}
                  onChange={(e) => setStore({ ...store, operating_hours: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Serviceable Delivery Pincodes (Comma separated)
                </label>
                <input
                  type="text"
                  value={pincodesInput}
                  onChange={(e) => setPincodesInput(e.target.value)}
                  placeholder="e.g. 560034, 560095, 400001, 400051, 110001"
                  className="w-full px-3 py-2 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Customers entering these pincodes during checkout will be permitted to place orders.
                </p>
              </div>
            </div>
          </FormSection>

          <div className="flex justify-end pt-4 border-t border-slate-200">
            <button
              type="submit"
              disabled={isSaving}
              className="inline-flex items-center gap-1.5 px-6 py-2.5 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] disabled:opacity-50 rounded-lg shadow-sm transition"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Records...</span>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4" />
                  <span>Update Store Details</span>
                </>
              )}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
