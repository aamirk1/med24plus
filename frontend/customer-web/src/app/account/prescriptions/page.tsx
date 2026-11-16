"use client";

import React from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { MOCK_PRESCRIPTIONS } from "@/mock/data";
import { FileText, UploadCloud, ShieldAlert, Eye, UserCheck } from "lucide-react";

export default function PrescriptionHistoryPage() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Account", href: "/account/profile" },
          { label: "Prescription Records" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-[#172B24]">Your Prescription Vault</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Doctor prescriptions reviewed by licensed pharmacists under Drugs and Cosmetics Rules (India)
          </p>
        </div>
        <Link href="/prescription/upload">
          <Button variant="primary" size="sm">
            <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
            <span>Upload New Rx</span>
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {MOCK_PRESCRIPTIONS.map((rx) => (
          <div
            key={rx.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-3"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center font-bold">
                  Rx
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-sm text-[#172B24]">{rx.prescriptionNumber}</span>
                    <StatusBadge status={rx.status} />
                  </div>
                  <p className="text-[11px] text-slate-400">Uploaded on {rx.uploadedAt}</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="h-8 text-xs">
                  <Eye className="w-3.5 h-3.5 mr-1" />
                  <span>View Document</span>
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 block text-[10px]">Patient Name:</span>
                <strong className="text-slate-800">{rx.patientName}</strong>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Prescribing Doctor:</span>
                <span className="text-slate-700">{rx.doctorName || "Pending Extraction"}</span>
              </div>
              <div>
                <span className="text-slate-400 block text-[10px]">Document File:</span>
                <span className="text-slate-700 font-mono text-[11px]">{rx.fileName}</span>
              </div>
            </div>

            {rx.pharmacistNotes && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs flex items-start gap-2 text-slate-700">
                <UserCheck className="w-4 h-4 text-[#087F5B] shrink-0 mt-0.5" />
                <p>
                  <strong className="text-slate-900 font-semibold">Pharmacist Remark: </strong>
                  {rx.pharmacistNotes}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

