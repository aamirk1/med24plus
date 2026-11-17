"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { prescriptionService, Prescription } from "@/services/prescription.service";
import {
  ArrowLeft,
  FileText,
  UploadCloud,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  HelpCircle,
  Calendar,
  User,
  ShieldCheck,
  Eye,
  Download,
  Loader2,
  Ban,
} from "lucide-react";

export default function CustomerPrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Clarification re-upload state
  const [clarificationFiles, setClarificationFiles] = useState<File[]>([]);
  const [clarificationNotes, setClarificationNotes] = useState("");
  const [uploadingClarification, setUploadingClarification] = useState(false);
  const [clarificationSuccess, setClarificationSuccess] = useState(false);

  // Cancel state
  const [cancelling, setCancelling] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const loadPrescription = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await prescriptionService.getPrescription(id);
      if (res.success && res.data) {
        setPrescription(res.data);
      }
    } catch (err: any) {
      setError(err.message || "Failed to load prescription.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPrescription();
  }, [loadPrescription]);

  const handleClarificationSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (clarificationFiles.length === 0) {
      alert("Please select at least one document to upload.");
      return;
    }

    setUploadingClarification(true);
    try {
      const formData = new FormData();
      clarificationFiles.forEach((f) => formData.append("files", f));
      if (clarificationNotes) {
        formData.append("customer_notes", clarificationNotes);
      }

      const res = await prescriptionService.submitClarification(id, formData);
      if (res.success) {
        setClarificationSuccess(true);
        setClarificationFiles([]);
        setClarificationNotes("");
        await loadPrescription();
      }
    } catch (err: any) {
      alert(err.message || "Failed to upload clarification files.");
    } finally {
      setUploadingClarification(false);
    }
  };

  const handleCancelPrescription = async () => {
    setCancelling(true);
    try {
      const res = await prescriptionService.cancelPrescription(id, cancelReason);
      if (res.success) {
        setShowCancelModal(false);
        await loadPrescription();
      }
    } catch (err: any) {
      alert(err.message || "Failed to cancel prescription.");
    } finally {
      setCancelling(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-20 text-center space-y-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#087F5B] mx-auto" />
        <p className="text-xs text-slate-500">Loading prescription details from vault...</p>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-lg font-bold text-slate-800">Unable to Load Prescription</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{error || "Prescription record not found."}</p>
        <Link href="/account/prescriptions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to Vault</span>
          </Button>
        </Link>
      </div>
    );
  }

  const isPending = prescription.status === "pending_review";
  const isClarificationNeeded = prescription.status === "clarification_required";
  const canCancel = isPending || isClarificationNeeded;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Account", href: "/account/profile" },
          { label: "Prescriptions", href: "/account/prescriptions" },
          { label: prescription.prescription_number || prescription.prescription_reference },
        ]}
      />

      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <Link
              href="/account/prescriptions"
              className="text-slate-400 hover:text-slate-700 transition"
              title="Back"
            >
              <ArrowLeft className="w-4 h-4" />
            </Link>
            <h1 className="text-2xl font-bold font-mono text-[#172B24]">
              {prescription.prescription_number || prescription.prescription_reference}
            </h1>
            <StatusBadge status={prescription.status || prescription.prescription_status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Uploaded on {new Date(prescription.uploaded_at).toLocaleString("en-IN")} • Private Storage Encrypted
          </p>
        </div>

        {canCancel && (
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowCancelModal(true)}
            className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-8"
          >
            <Ban className="w-3.5 h-3.5 mr-1.5" />
            <span>Cancel Request</span>
          </Button>
        )}
      </div>

      {/* Clarification Required Alert & Resubmission Box */}
      {isClarificationNeeded && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-6 space-y-4">
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <HelpCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-amber-950">
                Action Required: Pharmacist Requested Clarification
              </h3>
              <p className="text-xs text-amber-900 mt-1 leading-relaxed">
                {prescription.clarification_remarks || "Please upload a clearer scan of your prescription."}
              </p>
            </div>
          </div>

          <form onSubmit={handleClarificationSubmit} className="pt-2 border-t border-amber-200/60 space-y-3">
            <h4 className="text-xs font-bold text-amber-950 uppercase tracking-wider">
              Upload Supplementary Documents
            </h4>
            <input
              type="file"
              multiple
              accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
              onChange={(e) => {
                if (e.target.files) {
                  setClarificationFiles(Array.from(e.target.files));
                }
              }}
              className="text-xs text-slate-600 file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-[#087F5B] file:text-white hover:file:bg-[#066649] cursor-pointer"
            />
            {clarificationFiles.length > 0 && (
              <p className="text-[11px] text-emerald-700 font-medium">
                {clarificationFiles.length} file(s) selected: {clarificationFiles.map((f) => f.name).join(", ")}
              </p>
            )}

            <textarea
              rows={2}
              value={clarificationNotes}
              onChange={(e) => setClarificationNotes(e.target.value)}
              placeholder="Add response note for pharmacist (optional)..."
              className="w-full p-2.5 text-xs rounded-xl border border-amber-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
            />

            <Button
              type="submit"
              variant="primary"
              size="sm"
              disabled={uploadingClarification || clarificationFiles.length === 0}
            >
              {uploadingClarification ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 mr-1.5 animate-spin" />
                  <span>Submitting Documents...</span>
                </>
              ) : (
                <>
                  <UploadCloud className="w-3.5 h-3.5 mr-1.5" />
                  <span>Submit Clarification</span>
                </>
              )}
            </Button>
          </form>
        </div>
      )}

      {/* Main Grid: Details & Documents */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Metadata & Notes */}
        <div className="lg:col-span-1 space-y-6">
          {/* Patient & Doctor Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              Prescription Specifications
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Patient Name</span>
                <p className="text-slate-800 font-semibold mt-0.5">{prescription.patient_name || "Self"}</p>
              </div>

              {(prescription.patient_age || prescription.patient_gender) && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Age</span>
                    <p className="text-slate-700">{prescription.patient_age ? `${prescription.patient_age} Years` : "—"}</p>
                  </div>
                  <div>
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Gender</span>
                    <p className="text-slate-700">{prescription.patient_gender || "—"}</p>
                  </div>
                </div>
              )}

              <div>
                <span className="text-[10px] uppercase font-bold text-slate-400 block">Prescribing Doctor</span>
                <p className="text-slate-800 font-semibold mt-0.5">{prescription.doctor_name || "Extracted on Review"}</p>
              </div>

              {prescription.doctor_registration_no && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Medical Council Reg</span>
                  <p className="text-slate-700 font-mono text-[11px] mt-0.5">{prescription.doctor_registration_no}</p>
                </div>
              )}

              {prescription.doctor_clinic_or_hospital && (
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block">Clinic / Hospital</span>
                  <p className="text-slate-700 mt-0.5">{prescription.doctor_clinic_or_hospital}</p>
                </div>
              )}

              {prescription.valid_until && (
                <div className="p-2.5 bg-emerald-50 border border-emerald-200 rounded-lg">
                  <span className="text-[10px] uppercase font-bold text-emerald-800 block">Valid Until</span>
                  <p className="text-emerald-950 font-bold text-xs mt-0.5 font-mono">
                    {new Date(prescription.valid_until).toLocaleDateString("en-IN", {
                      day: "2-digit",
                      month: "long",
                      year: "numeric",
                    })}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Customer Instructions */}
          {prescription.customer_notes && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-2">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Your Delivery Notes
              </h3>
              <p className="text-xs text-slate-600 whitespace-pre-wrap">{prescription.customer_notes}</p>
            </div>
          )}

          {/* Pharmacist Remarks */}
          {prescription.pharmacist_notes && (
            <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-subtle space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#087F5B]">
                <ShieldCheck className="w-4 h-4" />
                <span>Pharmacist Assessment Note</span>
              </div>
              <p className="text-xs text-slate-700 leading-relaxed">{prescription.pharmacist_notes}</p>
            </div>
          )}
        </div>

        {/* Right Column: Attached Files & Audit History */}
        <div className="lg:col-span-2 space-y-6">
          {/* Scanned Files Section */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Prescription Documents ({prescription.files.length})
              </h3>
              <span className="text-[11px] text-slate-400">Encrypted at rest under Rule 65</span>
            </div>

            <div className="space-y-4">
              {prescription.files.map((file, idx) => {
                const isPdf = file.file_type === "application/pdf" || file.original_filename.endsWith(".pdf");

                return (
                  <div
                    key={file.id}
                    className="border border-slate-200 rounded-xl p-4 bg-slate-50/50 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-6 h-6 rounded-md bg-white border border-slate-200 text-xs font-bold flex items-center justify-center text-slate-600">
                          {idx + 1}
                        </span>
                        <div>
                          <p className="text-xs font-bold text-slate-900 font-mono">{file.original_filename}</p>
                          <p className="text-[10px] text-slate-400">
                            {(file.file_size / 1024).toFixed(1)} KB • {file.file_category}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center gap-2">
                        {file.secure_view_url && (
                          <a
                            href={file.secure_view_url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#087F5B] bg-white border border-slate-200 rounded-lg hover:bg-emerald-50 transition"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>View Full Screen</span>
                          </a>
                        )}
                        {file.secure_download_url && (
                          <a
                            href={file.secure_download_url}
                            className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-slate-600 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 transition"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </a>
                        )}
                      </div>
                    </div>

                    {/* Preview box */}
                    <div className="rounded-lg overflow-hidden border border-slate-200 bg-white flex items-center justify-center min-h-[180px] max-h-[380px]">
                      {isPdf ? (
                        <div className="text-center p-6 space-y-2">
                          <FileText className="w-12 h-12 text-slate-400 mx-auto" />
                          <p className="text-xs font-semibold text-slate-700">PDF Clinical Prescription Document</p>
                          {file.secure_view_url && (
                            <a
                              href={file.secure_view_url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-xs font-bold text-[#087F5B] hover:underline"
                            >
                              Open PDF in Viewer &rarr;
                            </a>
                          )}
                        </div>
                      ) : file.secure_view_url ? (
                        <img
                          src={file.secure_view_url}
                          alt={file.original_filename}
                          className="max-h-[360px] w-auto object-contain mx-auto"
                        />
                      ) : (
                        <div className="text-slate-400 text-xs">Preview unavailable</div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statutory Review Timeline */}
          {prescription.review_logs && prescription.review_logs.length > 0 && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
                Registered Pharmacist Audit Timeline
              </h3>

              <div className="space-y-3">
                {prescription.review_logs.map((log) => (
                  <div
                    key={log.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-900">{log.action || log.decision}</span>
                      <span className="text-[10px] text-slate-400">
                        {new Date(log.created_at).toLocaleString("en-IN")}
                      </span>
                    </div>
                    {log.pharmacist_name && (
                      <p className="text-[11px] text-slate-600">
                        Reviewed by: <strong>{log.pharmacist_name}</strong>
                        {log.pharmacist_registration_no ? ` (Reg: ${log.pharmacist_registration_no})` : ""}
                      </p>
                    )}
                    {(log.notes || log.remarks) && (
                      <p className="text-[11px] text-slate-600 italic mt-0.5">
                        &ldquo;{log.notes || log.remarks}&rdquo;
                      </p>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Cancel Confirmation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-md w-full space-y-4 shadow-xl text-left">
            <h3 className="text-base font-bold text-slate-900">Cancel Prescription Request</h3>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel this prescription verification request? This action cannot be undone.
            </p>
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Cancellation Reason</label>
              <textarea
                rows={2}
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Consulted doctor again, medicine change..."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCancelModal(false)}
                disabled={cancelling}
              >
                Keep Request
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleCancelPrescription}
                disabled={cancelling}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

