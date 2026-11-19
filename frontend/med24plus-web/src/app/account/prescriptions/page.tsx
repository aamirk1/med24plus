"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { prescriptionService, Prescription } from "@/services/prescription.service";
import {
  FileText,
  UploadCloud,
  Eye,
  UserCheck,
  AlertCircle,
  Clock,
  CheckCircle2,
  XCircle,
  HelpCircle,
  Loader2,
} from "lucide-react";

export default function PrescriptionHistoryPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string>("ALL");

  const loadPrescriptions = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await prescriptionService.listPrescriptions(statusFilter);
      if (res.success && res.data) {
        setPrescriptions(res.data.items || []);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load prescriptions from vault.");
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    loadPrescriptions();
  }, [loadPrescriptions]);

  const filterTabs = [
    { id: "ALL", label: "All Records" },
    { id: "PENDING_REVIEW", label: "Pending" },
    { id: "UNDER_REVIEW", label: "Under Review" },
    { id: "APPROVED", label: "Approved" },
    { id: "CLARIFICATION_REQUIRED", label: "Action Needed" },
    { id: "REJECTED", label: "Rejected" },
  ];

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

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-100 text-xs font-medium">
        {filterTabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setStatusFilter(t.id)}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              statusFilter === t.id
                ? "bg-[#0D9488] text-white font-semibold"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p>{error}</p>
        </div>
      )}

      {/* Loading state */}
      {loading ? (
        <div className="py-16 flex flex-col items-center justify-center space-y-3 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
          <p className="text-xs">Loading prescriptions from secure vault...</p>
        </div>
      ) : prescriptions.length === 0 ? (
        <div className="py-16 text-center space-y-4 bg-white rounded-2xl border border-slate-200 p-8">
          <div className="w-16 h-16 rounded-full bg-teal-50 text-[#0D9488] flex items-center justify-center mx-auto">
            <FileText className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h3 className="text-base font-bold text-slate-800">No Prescriptions Found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto">
              {statusFilter !== "ALL"
                ? "There are no prescriptions matching the selected filter in your vault."
                : "You haven't uploaded any doctor prescriptions yet. Upload your prescription to order Schedule H/H1 medicines."}
            </p>
          </div>
          <Link href="/prescription/upload">
            <Button variant="primary" size="md" className="mt-2">
              <UploadCloud className="w-4 h-4 mr-2" />
              <span>Upload Prescription</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {prescriptions.map((rx) => {
            const uploadDate = rx.uploaded_at
              ? new Date(rx.uploaded_at).toLocaleDateString("en-IN", {
                  day: "2-digit",
                  month: "short",
                  year: "numeric",
                })
              : "—";

            return (
              <div
                key={rx.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-3 hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center font-bold">
                      Rx
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-sm text-[#172B24]">
                          {rx.prescription_number || rx.prescription_reference}
                        </span>
                        <StatusBadge status={rx.status || rx.prescription_status} />
                      </div>
                      <p className="text-[11px] text-slate-400">Uploaded on {uploadDate}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <Link href={`/account/prescriptions/${rx.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        <Eye className="w-3.5 h-3.5 mr-1" />
                        <span>View Details</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs text-slate-600">
                  <div>
                    <span className="text-slate-400 block text-[10px]">Patient Name:</span>
                    <strong className="text-slate-800">{rx.patient_name || "Self"}</strong>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Prescribing Doctor:</span>
                    <span className="text-slate-700">{rx.doctor_name || "Extracted on Review"}</span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[10px]">Attached Documents:</span>
                    <span className="text-slate-700 font-mono text-[11px]">
                      {rx.files && rx.files.length > 0
                        ? `${rx.files.length} document${rx.files.length > 1 ? "s" : ""}`
                        : "1 document"}
                    </span>
                  </div>
                </div>

                {/* Clarification Alert */}
                {rx.status === "clarification_required" && rx.clarification_remarks && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs space-y-1 text-amber-900">
                    <div className="flex items-center gap-1.5 font-bold text-amber-800">
                      <HelpCircle className="w-4 h-4 text-amber-600" />
                      <span>Pharmacist Action Required:</span>
                    </div>
                    <p className="text-[11px]">{rx.clarification_remarks}</p>
                    <Link
                      href={`/account/prescriptions/${rx.id}`}
                      className="inline-block mt-1 text-xs font-semibold text-amber-800 underline hover:text-amber-950"
                    >
                      Upload requested document &rarr;
                    </Link>
                  </div>
                )}

                {/* Pharmacist Remarks */}
                {rx.pharmacist_notes && (
                  <div className="p-3 bg-slate-50 border border-slate-100 rounded-lg text-xs flex items-start gap-2 text-slate-700">
                    <UserCheck className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                    <p>
                      <strong className="text-slate-900 font-semibold">Pharmacist Remark: </strong>
                      {rx.pharmacist_notes}
                    </p>
                  </div>
                )}

                {/* Rejection Notice */}
                {rx.status === "rejected" && rx.rejection_reason && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs flex items-start gap-2 text-red-800">
                    <XCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                    <div>
                      <strong className="font-semibold">Rejection Reason: </strong>
                      <span>{rx.rejection_reason}</span>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
