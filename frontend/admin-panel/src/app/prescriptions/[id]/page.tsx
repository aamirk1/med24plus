"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, CheckCircle2, XCircle, FileText, UserCheck, ShieldCheck, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_ADMIN_PRESCRIPTIONS } from "@/mock/adminData";

export default function AdminPrescriptionDetailPage() {
  const params = useParams();
  const rxId = params?.id as string;
  const rx = MOCK_ADMIN_PRESCRIPTIONS.find((p) => p.id === rxId) || MOCK_ADMIN_PRESCRIPTIONS[0];
  const [reviewStatus, setReviewStatus] = useState(rx.statusCode);
  const [pharmacistNotes, setPharmacistNotes] = useState(rx.reviewNotes || "");

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Link
          href="/prescriptions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Prescription Queue</span>
        </Link>
      </div>

      <PageHeader
        title={`Rx Audit: ${rx.prescriptionNumber}`}
        subtitle={`Uploaded by ${rx.patientName} on ${rx.uploadedAt}`}
        badge={<StatusBadge status={reviewStatus} />}
      />

      {/* Mock verification banner */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-900">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <p className="font-semibold text-blue-950">Statutory Clinical Review Workbench (Rule 65)</p>
          <p className="text-blue-800">
            Registered Pharmacists must verify: 1) Registered Medical Practitioner name & State Council Reg No, 2) Patient identity, 3) Dosage instructions & course duration, 4) Absence of drug interactions.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Document Viewer Preview Placeholder */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Scanned Clinical Prescription
            </h3>
            <span className="text-[10px] font-mono text-slate-400">{rx.fileName}</span>
          </div>

          <div className="h-96 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50 flex flex-col items-center justify-center p-6 text-center">
            <FileText className="w-12 h-12 text-slate-400 mb-2" />
            <p className="font-semibold text-slate-700 text-xs">{rx.fileName}</p>
            <p className="text-[11px] text-slate-400 max-w-xs mt-1">
              High-resolution prescription document preview rendered in secure S3-compatible private storage.
            </p>
            <button
              type="button"
              onClick={() => alert("Mock: Opening high-resolution zoom viewer")}
              className="mt-4 px-3 py-1.5 text-xs font-semibold text-[#087F5B] bg-white border border-[#087F5B] rounded-lg hover:bg-emerald-50 transition"
            >
              Expand Document Viewer
            </button>
          </div>
        </div>

        {/* Clinical Audit Details & Decision Form */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Prescriber & Patient Metadata
            </h3>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Patient Name</p>
                <p className="font-semibold text-slate-900 mt-0.5">{rx.patientName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Phone Number</p>
                <p className="font-semibold text-slate-900 mt-0.5 font-mono">{rx.patientPhone}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Registered Doctor</p>
                <p className="font-semibold text-slate-900 mt-0.5">{rx.doctorName || "Dr. Rajesh Khanna, MBBS"}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Medical Council Reg</p>
                <p className="font-semibold text-slate-900 mt-0.5 font-mono">{rx.doctorRegistrationNo || "KMC-48201-B"}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Pharmacist Clinical Verification
            </h3>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Clinical Audit Notes / Dispensing Instructions
              </label>
              <textarea
                rows={3}
                value={pharmacistNotes}
                onChange={(e) => setPharmacistNotes(e.target.value)}
                placeholder="Enter remarks e.g. Validated for 30-day course. Verified doctor credentials on State Medical Register."
                className="w-full p-2.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setReviewStatus("APPROVED");
                  alert("Mock: Prescription APPROVED. Order marked ready for dispensing batch allocation.");
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-white bg-[#087F5B] hover:bg-[#066649] rounded-lg transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Approve & Release for Dispensing</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setReviewStatus("REJECTED");
                  alert("Mock: Prescription REJECTED. Patient notified with rejection reason.");
                }}
                className="flex-1 inline-flex items-center justify-center gap-1.5 py-2 text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 rounded-lg transition"
              >
                <XCircle className="w-4 h-4" />
                <span>Reject Prescription</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
