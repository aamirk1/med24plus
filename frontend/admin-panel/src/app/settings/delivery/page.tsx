"use client";

import React, { useState } from "react";
import { Save, Truck, MapPin } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection } from "@/components/ui/FormSection";

export default function AdminDeliverySettingsPage() {
  const [delivery, setDelivery] = useState({
    freeDeliveryThreshold: "499",
    standardDeliveryFee: "40",
    expressColdChainFee: "99",
    serviceablePincodes: "560001, 560002, 560003, 560004, 560008, 560025, 560034, 560038, 560076, 560095, 560100, 560102",
    enableScheduledSlots: true,
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Delivery settings saved.");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Delivery & Serviceable Pincodes"
        subtitle="Configure hyper-local serviceable delivery areas, minimum free delivery tiers, and cold-chain fees."
      />

      <form onSubmit={handleSave} className="space-y-6">
        <FormSection
          title="Delivery Fee Matrix"
          description="Pricing thresholds for free home shipping and specialized courier options."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Free Delivery Above (₹)
              </label>
              <input
                type="number"
                value={delivery.freeDeliveryThreshold}
                onChange={(e) => setDelivery({ ...delivery, freeDeliveryThreshold: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Standard Shipping Charge (₹)
              </label>
              <input
                type="number"
                value={delivery.standardDeliveryFee}
                onChange={(e) => setDelivery({ ...delivery, standardDeliveryFee: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cold-Chain Priority Surcharge (₹)
              </label>
              <input
                type="number"
                value={delivery.expressColdChainFee}
                onChange={(e) => setDelivery({ ...delivery, expressColdChainFee: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>
          </div>
        </FormSection>

        <FormSection
          title="Serviceable Pincode Geofence"
          description="Comma-separated Indian postal codes where Med24Plus operates same-day courier dispatch."
        >
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Active Indian Pincodes (Bengaluru Region)
            </label>
            <textarea
              rows={4}
              value={delivery.serviceablePincodes}
              onChange={(e) => setDelivery({ ...delivery, serviceablePincodes: e.target.value })}
              className="w-full font-mono text-xs p-3 rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
            />
            <p className="text-[11px] text-slate-400 mt-1">
              Patients entering pincodes outside this list will be advised to contact customer support or choose store pickup.
            </p>
          </div>
        </FormSection>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#087F5B] hover:bg-[#066649] rounded-lg shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Delivery Settings</span>
          </button>
        </div>
      </form>
    </div>
  );
}

