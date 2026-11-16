"use client";

import React, { useState } from "react";
import { Save, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection } from "@/components/ui/FormSection";

export default function AdminGeneralSettingsPage() {
  const [settings, setSettings] = useState({
    platformName: "Med24Plus Online Pharmacy",
    supportEmail: "care@med24plus.in",
    emergencyHelpline: "+91 80 2345 6789",
    currency: "INR (₹)",
    timeZone: "Asia/Kolkata (IST)",
    defaultGSTRate: "12",
    feefoStrictEnforcement: true,
    autoQuarantineExpiries: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("General settings saved successfully.");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="General Pharmacy Configuration"
        subtitle="Manage platform metadata, clinical dispensing parameters, and operational defaults."
      />

      <form onSubmit={handleSave} className="space-y-6">
        <FormSection
          title="Platform Identity"
          description="Public-facing titles, contact points, and localized currency formatting."
        >
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Pharmacy Platform Name
              </label>
              <input
                type="text"
                value={settings.platformName}
                onChange={(e) => setSettings({ ...settings, platformName: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Support Email
              </label>
              <input
                type="email"
                value={settings.supportEmail}
                onChange={(e) => setSettings({ ...settings, supportEmail: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Emergency Pharmacist Helpline
              </label>
              <input
                type="text"
                value={settings.emergencyHelpline}
                onChange={(e) => setSettings({ ...settings, emergencyHelpline: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                System Timezone
              </label>
              <input
                type="text"
                readOnly
                value={settings.timeZone}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-200 bg-slate-50 text-slate-500 cursor-not-allowed"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Clinical Safety & Inventory Rules"
          description="Automated clinical safety gates for inventory dispensing."
        >
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.feefoStrictEnforcement}
                onChange={(e) => setSettings({ ...settings, feefoStrictEnforcement: e.target.checked })}
                className="mt-0.5 rounded text-[#087F5B] focus:ring-[#087F5B]"
              />
              <div>
                <p className="text-xs font-semibold text-slate-900">Enforce Strict FEFO Batch Selection</p>
                <p className="text-[11px] text-slate-500">
                  Prevents packing personnel from selecting later batches if an earlier expiring batch is available in stock.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={settings.autoQuarantineExpiries}
                onChange={(e) => setSettings({ ...settings, autoQuarantineExpiries: e.target.checked })}
                className="mt-0.5 rounded text-[#087F5B] focus:ring-[#087F5B]"
              />
              <div>
                <p className="text-xs font-semibold text-slate-900">Automatic Near-Expiry Quarantine (&lt; 60 Days)</p>
                <p className="text-[11px] text-slate-500">
                  Automatically delists batches from customer storefront if remaining shelf-life is under 60 days.
                </p>
              </div>
            </label>
          </div>
        </FormSection>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#087F5B] hover:bg-[#066649] rounded-lg shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Save General Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}

