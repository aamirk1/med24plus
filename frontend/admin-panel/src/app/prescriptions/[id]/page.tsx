"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  XCircle,
  FileText,
  UserCheck,
  ShieldCheck,
  AlertTriangle,
  HelpCircle,
  Eye,
  Download,
  Loader2,
  Calendar,
  Clock,
  Plus,
  Play,
  RotateCcw,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import {
  adminPrescriptionService,
  AdminPrescription,
} from "@/services/admin-prescription.service";

export default function AdminPrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params?.id as string;

  const [prescription, setPrescription] = useState<AdminPrescription | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Active document index
  const [activeFileIndex, setActiveFileIndex] = useState(0);

  // Workbench modals state
  const [showApproveModal, setShowApproveModal] = useState(false);
  const [approveNotes, setApproveNotes] = useState("");
  const [validUntilDate, setValidUntilDate] = useState("");
  const [approving, setApproving] = useState(false);

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectNotes, setRejectNotes] = useState("");
  const [rejecting, setRejecting] = useState(false);

  const [showClarifyModal, setShowClarifyModal] = useState(false);
  const [clarifyRemarks, setClarifyRemarks] = useState("");
  const [clarifying, setClarifying] = useState(false);

  // Line item extraction state
  const [showAddItem, setShowAddItem] = useState(false);
  const [newItemName, setNewItemName] = useState("");
  const [newItemDosage, setNewItemDosage] = useState("");
  const [newItemQty, setNewItemQty] = useState(1);
  const [addingItem, setAddingItem] = useState(false);

  const [startingReview, setStartingReview] = useState(false);

  const loadPrescription = useCallback(async () => {
    if (!id) return;
    setLoading(true);
    setError(null);
    try {
      const res = await adminPrescriptionService.getPrescription(id);
      if (res.success && res.data) {
        setPrescription(res.data);
        if (res.data.valid_until) {
          setValidUntilDate(res.data.valid_until);
        } else {
          // Default 90 days
          const d = new Date();
          d.setDate(d.getDate() + 90);
          setValidUntilDate(d.toISOString().split("T")[0]);
        }
      }
    } catch (err: any) {
      setError(err.message || "Failed to load prescription dossier.");
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => {
    loadPrescription();
  }, [loadPrescription]);

  const handleStartReview = async () => {
    setStartingReview(true);
    try {
      const res = await adminPrescriptionService.startReview(id);
      if (res.success) {
        await loadPrescription();
      }
    } catch (err: any) {
      alert(err.message || "Failed to initiate clinical review.");
    } finally {
      setStartingReview(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      const res = await adminPrescriptionService.approve(id, {
        pharmacist_notes: approveNotes || undefined,
        valid_until: validUntilDate || undefined,
      });
      if (res.success) {
        setShowApproveModal(false);
        await loadPrescription();
      }
    } catch (err: any) {
      alert(err.message || "Failed to approve prescription.");
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    if (!rejectReason.trim()) {
      alert("Statutory rejection reason is mandatory under Rule 65.");
      return;
    }
    setRejecting(true);
    try {
      const res = await adminPrescriptionService.reject(id, {
        rejection_reason: rejectReason.trim(),
        pharmacist_notes: rejectNotes || undefined,
      });
      if (res.success) {
        setShowRejectModal(false);
        await loadPrescription();
      }
    } catch (err: any) {
      alert(err.message || "Failed to record rejection.");
    } finally {
      setRejecting(false);
    }
  };

  const handleRequestClarification = async () => {
    if (!clarifyRemarks.trim()) {
      alert("Clarification remarks are required.");
      return;
    }
    setClarifying(true);
    try {
      const res = await adminPrescriptionService.requestClarification(id, {
        clarification_remarks: clarifyRemarks.trim(),
      });
      if (res.success) {
        setShowClarifyModal(false);
        await loadPrescription();
      }
    } catch (err: any) {
      alert(err.message || "Failed to request clarification.");
    } finally {
      setClarifying(false);
    }
  };

  const handleAddMedicineItem = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemName.trim()) return;
    setAddingItem(true);
    try {
      const res = await adminPrescriptionService.addItem(id, {
        medicine_name_prescribed: newItemName.trim(),
        dosage: newItemDosage || undefined,
        quantity_prescribed: newItemQty,
      });
      if (res.success) {
        setNewItemName("");
        setNewItemDosage("");
        setNewItemQty(1);
        setShowAddItem(false);
        await loadPrescription();
      }
    } catch (err: any) {
      alert(err.message || "Failed to add prescription item.");
    } finally {
      setAddingItem(false);
    }
  };

  if (loading) {
    return (
      <div className="py-24 text-center space-y-3 text-slate-400">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488] mx-auto" />
        <p className="text-xs">Loading clinical prescription verification dossier...</p>
      </div>
    );
  }

  if (error || !prescription) {
    return (
      <div className="py-16 text-center space-y-4">
        <div className="w-12 h-12 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <XCircle className="w-6 h-6" />
        </div>
        <h2 className="text-base font-bold text-slate-900">Dossier Access Error</h2>
        <p className="text-xs text-slate-500 max-w-sm mx-auto">{error || "Prescription record not found."}</p>
        <Link href="/prescriptions">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-3.5 h-3.5 mr-1" />
            <span>Back to Queue</span>
          </Button>
        </Link>
      </div>
    );
  }

  const isPending = prescription.status === "pending_review";
  const isUnderReview = prescription.status === "under_review";
  const canMakeDecision = isPending || isUnderReview;
  const activeFile = prescription.files && prescription.files.length > 0 ? prescription.files[activeFileIndex] : null;

  return (
    <div className="space-y-6 max-w-6xl text-left">
      <div className="flex items-center gap-2">
        <Link
          href="/prescriptions"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Prescription Queue</span>
        </Link>
      </div>

      {/* Header with Title and Actions */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-bold font-mono text-[#172B24]">
              Rx Audit: {prescription.prescription_number || prescription.prescription_reference}
            </h1>
            <StatusBadge status={prescription.status || prescription.prescription_status} />
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Uploaded by {prescription.patient_name || prescription.customer?.full_name || "Patient"} on{" "}
            {new Date(prescription.uploaded_at).toLocaleString("en-IN")}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {isPending && (
            <Button
              variant="primary"
              size="sm"
              onClick={handleStartReview}
              disabled={startingReview}
              className="bg-blue-600 hover:bg-blue-700 text-xs h-9"
            >
              <Play className="w-3.5 h-3.5 mr-1.5" />
              <span>{startingReview ? "Assigning..." : "Start Review"}</span>
            </Button>
          )}

          {canMakeDecision && (
            <>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClarifyModal(true)}
                className="text-amber-700 border-amber-300 hover:bg-amber-50 text-xs h-9"
              >
                <HelpCircle className="w-3.5 h-3.5 mr-1.5" />
                <span>Request Clarification</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(true)}
                className="text-red-600 border-red-200 hover:bg-red-50 text-xs h-9"
              >
                <XCircle className="w-3.5 h-3.5 mr-1.5" />
                <span>Reject</span>
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowApproveModal(true)}
                className="bg-[#0D9488] hover:bg-[#0F766E] text-xs h-9"
              >
                <CheckCircle2 className="w-3.5 h-3.5 mr-1.5" />
                <span>Approve Rx</span>
              </Button>
            </>
          )}
        </div>
      </div>

      {/* Statutory Guidance */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-blue-950">
        <ShieldCheck className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
        <div className="text-[11px] leading-relaxed">
          <p className="font-semibold text-blue-950">Rule 65 Registered Pharmacist Verification Checklist:</p>
          <p className="text-blue-800">
            1) Prescribing Medical Practitioner registration on State/National Medical Register. 2) Patient identity, age, and clinical details. 3) Correct drug strength, course duration, and absence of statutory contraindications.
          </p>
        </div>
      </div>

      {/* Main Grid: Document Viewer & Clinical Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left Column: Document Inspection Viewer */}
        <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Scanned Clinical Document
              </h3>
              <p className="text-[10px] text-slate-400 font-mono mt-0.5">
                {activeFile ? activeFile.original_filename : "No file attached"}
              </p>
            </div>

            {/* Document Tabs */}
            {prescription.files.length > 1 && (
              <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                {prescription.files.map((f, i) => (
                  <button
                    key={f.id}
                    type="button"
                    onClick={() => setActiveFileIndex(i)}
                    className={`px-2 py-1 text-[11px] font-bold rounded-md transition ${
                      activeFileIndex === i
                        ? "bg-white text-[#0D9488] shadow-xs"
                        : "text-slate-500 hover:text-slate-900"
                    }`}
                  >
                    Page {i + 1}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Viewer Container */}
          <div className="rounded-xl border border-slate-200 bg-slate-50/50 p-3 min-h-[460px] flex flex-col items-center justify-center">
            {activeFile ? (
              activeFile.file_type === "application/pdf" || activeFile.original_filename.endsWith(".pdf") ? (
                <div className="text-center p-8 space-y-3">
                  <FileText className="w-16 h-16 text-slate-400 mx-auto" />
                  <p className="text-xs font-bold text-slate-800">{activeFile.original_filename}</p>
                  <p className="text-[11px] text-slate-500">PDF Clinical Prescription Record</p>
                  {activeFile.secure_view_url && (
                    <a
                      href={activeFile.secure_view_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#0D9488] bg-white border border-slate-200 rounded-lg hover:bg-teal-50 transition shadow-xs"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Inspect High-Resolution PDF</span>
                    </a>
                  )}
                </div>
              ) : activeFile.secure_view_url ? (
                <div className="w-full text-center space-y-2">
                  <img
                    src={activeFile.secure_view_url}
                    alt={activeFile.original_filename}
                    className="max-h-[440px] w-auto mx-auto object-contain rounded-lg shadow-xs"
                  />
                  <div className="pt-2">
                    <a
                      href={activeFile.secure_view_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs font-semibold text-[#0D9488] hover:underline inline-flex items-center gap-1"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Open in Full Resolution Window</span>
                    </a>
                  </div>
                </div>
              ) : (
                <div className="text-slate-400 text-xs">Preview unavailable</div>
              )
            ) : (
              <div className="text-slate-400 text-xs">No documents uploaded</div>
            )}
          </div>
        </div>

        {/* Right Column: Metadata, Line Items & Timeline */}
        <div className="space-y-6">
          {/* Metadata Card */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              Prescriber &amp; Patient Metadata
            </h3>

            <div className="grid grid-cols-2 gap-3.5 text-xs">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Patient Name</p>
                <p className="font-semibold text-slate-900 mt-0.5">{prescription.patient_name || "Self"}</p>
              </div>

              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Contact Mobile</p>
                <p className="font-semibold text-slate-900 mt-0.5 font-mono">
                  {prescription.customer?.phone_number || "—"}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Doctor&apos;s Name</p>
                <p className="font-semibold text-slate-900 mt-0.5">
                  {prescription.doctor_name || "Extracted on Review"}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Medical Council Reg</p>
                <p className="font-semibold text-slate-900 mt-0.5 font-mono">
                  {prescription.doctor_registration_no || "Pending Extraction"}
                </p>
              </div>

              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Clinic / Hospital</p>
                <p className="text-slate-700 mt-0.5">{prescription.doctor_clinic_or_hospital || "—"}</p>
              </div>

              <div>
                <p className="text-slate-400 text-[10px] uppercase font-bold">Prescription Date</p>
                <p className="text-slate-700 mt-0.5 font-mono">{prescription.prescription_date || "—"}</p>
              </div>
            </div>

            {prescription.customer_notes && (
              <div className="p-3 bg-slate-50 border border-slate-100 rounded-xl text-xs space-y-1">
                <span className="text-[10px] uppercase font-bold text-slate-400">Patient Delivery Instructions:</span>
                <p className="text-slate-700 whitespace-pre-wrap">{prescription.customer_notes}</p>
              </div>
            )}
          </div>

          {/* Line Items / Prescribed Medicines */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Prescribed Medicines / Line Items ({prescription.items?.length || 0})
              </h3>
              {canMakeDecision && (
                <button
                  type="button"
                  onClick={() => setShowAddItem(!showAddItem)}
                  className="text-xs font-semibold text-[#0D9488] hover:underline inline-flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Extract Medicine</span>
                </button>
              )}
            </div>

            {/* Add Item Form */}
            {showAddItem && (
              <form onSubmit={handleAddMedicineItem} className="p-3 bg-teal-50/60 rounded-xl border border-teal-200 space-y-3 text-xs">
                <h4 className="font-bold text-teal-950">Add Line Item From Rx Document:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="text"
                    placeholder="Medicine Name &amp; Strength"
                    value={newItemName}
                    onChange={(e) => setNewItemName(e.target.value)}
                    required
                    className="p-2 rounded-lg border border-teal-300 bg-white"
                  />
                  <input
                    type="text"
                    placeholder="Dosage Schedule (e.g. 1-0-1)"
                    value={newItemDosage}
                    onChange={(e) => setNewItemDosage(e.target.value)}
                    className="p-2 rounded-lg border border-teal-300 bg-white"
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-teal-800">Approved Qty:</span>
                    <input
                      type="number"
                      min={1}
                      value={newItemQty}
                      onChange={(e) => setNewItemQty(parseInt(e.target.value) || 1)}
                      className="w-16 p-1.5 rounded-lg border border-teal-300 bg-white"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setShowAddItem(false)}
                      className="text-xs h-7"
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      variant="primary"
                      size="sm"
                      disabled={addingItem}
                      className="text-xs h-7"
                    >
                      {addingItem ? "Saving..." : "Record Item"}
                    </Button>
                  </div>
                </div>
              </form>
            )}

            {/* Existing Items List */}
            {prescription.items && prescription.items.length > 0 ? (
              <div className="space-y-2">
                {prescription.items.map((item) => (
                  <div
                    key={item.id}
                    className="p-3 bg-slate-50 border border-slate-100 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <p className="font-bold text-slate-900">{item.medicine_name_prescribed}</p>
                      <p className="text-[11px] text-slate-500">
                        {item.dosage || "Standard Dose"} • Qty Prescribed: {item.quantity_prescribed} • Qty Approved: {item.quantity_approved}
                      </p>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 bg-teal-100 text-[#0D9488] rounded-full uppercase">
                      {item.verification_status}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No individual line items recorded yet.</p>
            )}
          </div>

          {/* Immutable Statutory History */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-xs space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-2 border-b border-slate-100">
              Statutory Clinical Audit Trail
            </h3>

            {prescription.review_logs && prescription.review_logs.length > 0 ? (
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
                        Pharmacist: <strong>{log.pharmacist_name}</strong>
                        {log.pharmacist_registration_no ? ` (${log.pharmacist_registration_no})` : ""}
                      </p>
                    )}
                    {(log.notes || log.remarks) && (
                      <p className="text-[11px] text-slate-700 italic">&ldquo;{log.notes || log.remarks}&rdquo;</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">No prior pharmacist review actions.</p>
            )}
          </div>
        </div>
      </div>

      {/* Approve Modal */}
      {showApproveModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl text-left">
            <h3 className="text-base font-bold text-slate-900">Approve Prescription (Rule 65)</h3>
            <p className="text-xs text-slate-500">
              By approving, you certify that you are a registered pharmacist who has examined the prescription and verified medical practitioner credentials.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Prescription Validity Expiry</label>
              <input
                type="date"
                value={validUntilDate}
                onChange={(e) => setValidUntilDate(e.target.value)}
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Pharmacist Clinical Notes (Optional)</label>
              <textarea
                rows={3}
                value={approveNotes}
                onChange={(e) => setApproveNotes(e.target.value)}
                placeholder="e.g. Verified doctor registration on State Medical Council. Approved 30-day course."
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowApproveModal(false)}
                disabled={approving}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleApprove}
                disabled={approving}
                className="bg-[#0D9488] hover:bg-[#0F766E] text-white"
              >
                {approving ? "Approving..." : "Confirm Statutory Approval"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl text-left">
            <h3 className="text-base font-bold text-slate-900">Reject Prescription</h3>
            <p className="text-xs text-slate-500">
              Rejection is terminal under Rule 65. A mandatory statutory reason must be communicated to the patient.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Statutory Rejection Reason *</label>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. Prescription is expired / Missing doctor's registration stamp / Illegible dosage"
                required
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-red-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowRejectModal(false)}
                disabled={rejecting}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleReject}
                disabled={rejecting || !rejectReason.trim()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {rejecting ? "Rejecting..." : "Confirm Rejection"}
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      {showClarifyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl p-6 max-w-lg w-full space-y-4 shadow-xl text-left">
            <h3 className="text-base font-bold text-slate-900">Request Patient Clarification</h3>
            <p className="text-xs text-slate-500">
              The prescription status will be updated to Clarification Required. The patient will be notified to upload supporting documents.
            </p>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Clarification Instructions *</label>
              <textarea
                rows={3}
                value={clarifyRemarks}
                onChange={(e) => setClarifyRemarks(e.target.value)}
                placeholder="e.g. Please upload page 2 containing the doctor's signature and registration stamp."
                required
                className="w-full p-2.5 text-xs rounded-xl border border-slate-300 focus:outline-none focus:ring-1 focus:ring-amber-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowClarifyModal(false)}
                disabled={clarifying}
              >
                Cancel
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={handleRequestClarification}
                disabled={clarifying || !clarifyRemarks.trim()}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                {clarifying ? "Submitting..." : "Send Clarification Request"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
