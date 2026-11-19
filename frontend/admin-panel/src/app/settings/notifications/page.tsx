"use client";

import React, { useState } from "react";
import { Save, Bell, Smartphone, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection } from "@/components/ui/FormSection";

export default function AdminNotificationSettingsPage() {
  const [notify, setNotify] = useState({
    smsOrderUpdates: true,
    whatsappPrescriptionStatus: true,
    emailInvoice: true,
    pharmacistAlertOnNewRx: true,
    expiryAlertDays: "60",
  });

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    alert("Notification preferences saved.");
  };

  return (
    <div className="space-y-6 max-w-4xl">
      <PageHeader
        title="Notification & Patient Alert Settings"
        subtitle="Configure SMS gateways, WhatsApp Business notifications, and email cash memo alerts."
      />

      <form onSubmit={handleSave} className="space-y-6">
        <FormSection
          title="Patient Communications"
          description="Automated updates triggered on order confirmation, pharmacist review, and courier dispatch."
        >
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notify.smsOrderUpdates}
                onChange={(e) => setNotify({ ...notify, smsOrderUpdates: e.target.checked })}
                className="mt-0.5 rounded text-[#0D9488] focus:ring-[#0D9488]"
              />
              <div>
                <p className="text-xs font-semibold text-slate-900">SMS Transactional Alerts (DLT Registered)</p>
                <p className="text-[11px] text-slate-500">
                  Sends DLT-compliant SMS updates on OTP verification, order placed, and out-for-delivery events.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notify.whatsappPrescriptionStatus}
                onChange={(e) => setNotify({ ...notify, whatsappPrescriptionStatus: e.target.checked })}
                className="mt-0.5 rounded text-[#0D9488] focus:ring-[#0D9488]"
              />
              <div>
                <p className="text-xs font-semibold text-slate-900">WhatsApp Prescription Status Notifications</p>
                <p className="text-[11px] text-slate-500">
                  Sends WhatsApp notification when a clinical prescription is approved or requires clarification.
                </p>
              </div>
            </label>

            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notify.emailInvoice}
                onChange={(e) => setNotify({ ...notify, emailInvoice: e.target.checked })}
                className="mt-0.5 rounded text-[#0D9488] focus:ring-[#0D9488]"
              />
              <div>
                <p className="text-xs font-semibold text-slate-900">Email GST Cash Memo / Invoice</p>
                <p className="text-[11px] text-slate-500">
                  Instantly delivers digital PDF Form 20 cash memo upon order dispatch.
                </p>
              </div>
            </label>
          </div>
        </FormSection>

        <FormSection
          title="Internal Staff & Pharmacist Triggers"
          description="High-priority alerts for duty pharmacists and store inventory clerks."
        >
          <div className="space-y-3">
            <label className="flex items-start gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={notify.pharmacistAlertOnNewRx}
                onChange={(e) => setNotify({ ...notify, pharmacistAlertOnNewRx: e.target.checked })}
                className="mt-0.5 rounded text-[#0D9488] focus:ring-[#0D9488]"
              />
              <div>
                <p className="text-xs font-semibold text-slate-900">Real-time Pharmacist Alert on New Rx Upload</p>
                <p className="text-[11px] text-slate-500">
                  Plays audio chime in admin console and flashes badge for immediate triage (&lt; 15 mins).
                </p>
              </div>
            </label>
          </div>
        </FormSection>

        <div className="flex justify-end pt-4 border-t border-slate-200">
          <button
            type="submit"
            className="inline-flex items-center gap-1.5 px-5 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg shadow-sm transition"
          >
            <Save className="w-4 h-4" />
            <span>Save Notification Preferences</span>
          </button>
        </div>
      </form>
    </div>
  );
}

