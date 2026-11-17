"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import { prescriptionService, Prescription } from "@/services/prescription.service";
import {
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  FileText,
  X,
  Loader2,
  Clock,
  PhoneCall,
  ShieldCheck,
} from "lucide-react";

export default function PrescriptionUploadPage() {
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [patientName, setPatientName] = useState("");
  const [patientAge, setPatientAge] = useState("");
  const [patientGender, setPatientGender] = useState("Other");
  const [doctorName, setDoctorName] = useState("");
  const [doctorRegistrationNo, setDoctorRegistrationNo] = useState("");
  const [doctorClinic, setDoctorClinic] = useState("");
  const [prescriptionDate, setPrescriptionDate] = useState(new Date().toISOString().split("T")[0]);
  const [customerNotes, setCustomerNotes] = useState("");
  const [confirmedRx, setConfirmedRx] = useState(true);

  const [submitting, setSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submittedRx, setSubmittedRx] = useState<Prescription | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const incoming = Array.from(e.target.files);
      const combined = [...selectedFiles, ...incoming].slice(0, 5);
      setSelectedFiles(combined);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles((prev) => prev.filter((_, idx) => idx !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setErrorMessage("Please select at least one prescription document (JPEG, PNG, or PDF).");
      return;
    }

    if (!confirmedRx) {
      setErrorMessage("You must certify that this is an authentic medical prescription.");
      return;
    }

    setSubmitting(true);
    setErrorMessage(null);

    try {
      const formData = new FormData();
      selectedFiles.forEach((file) => {
        formData.append("files", file);
      });

      if (patientName) formData.append("patient_name", patientName);
      if (patientAge) formData.append("patient_age", patientAge);
      if (patientGender) formData.append("patient_gender", patientGender);
      if (doctorName) formData.append("doctor_name", doctorName);
      if (doctorRegistrationNo) formData.append("doctor_registration_no", doctorRegistrationNo);
      if (doctorClinic) formData.append("doctor_clinic_or_hospital", doctorClinic);
      if (prescriptionDate) formData.append("prescription_date", prescriptionDate);
      if (customerNotes) formData.append("customer_notes", customerNotes);

      const res = await prescriptionService.uploadPrescription(formData);
      if (res.success && res.data) {
        setSubmittedRx(res.data);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to upload prescription. Please verify file format and size.");
    } finally {
      setSubmitting(false);
    }
  };

  if (submittedRx) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#087F5B] bg-[#E6F4EF] px-2.5 py-1 rounded-full uppercase tracking-wider">
            Prescription Submitted to Pharmacist
          </span>
          <h1 className="text-2xl font-bold font-mono text-[#172B24]">
            Ref: #{submittedRx.prescription_number || submittedRx.prescription_reference}
          </h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Our Registered Pharmacist is auditing your prescription under Rule 65. You can track verification progress in real-time.
          </p>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 text-xs text-left border border-slate-200 space-y-2.5">
          <div className="flex items-center gap-2 font-bold text-[#172B24]">
            <Clock className="w-4 h-4 text-[#087F5B]" />
            <span>Expected Pharmacist Review: Within 15 Minutes</span>
          </div>
          <p className="text-slate-500 text-[11px] leading-relaxed">
            Registered Pharmacy: Central Dispensing Hub • Drugs &amp; Cosmetics Rules 1945 Verification Workbench
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <Link href={`/account/prescriptions/${submittedRx.id}`}>
            <Button variant="primary" size="md">
              View Prescription Details
            </Button>
          </Link>
          <Link href="/account/prescriptions">
            <Button variant="outline" size="md">
              Return to Vault
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Prescriptions", href: "/account/prescriptions" },
          { label: "Upload New Rx" },
        ]}
      />

      <div className="space-y-1">
        <h1 className="text-2xl font-bold text-[#172B24]">Upload Doctor&apos;s Prescription</h1>
        <p className="text-xs text-slate-500">
          Fast, compliant medicine dispensing verified by licensed Indian Pharmacy Council professionals
        </p>
      </div>

      {/* Statutory Regulatory Guidelines */}
      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold">
          <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
          <span>Statutory Guidelines for Prescription Acceptance (Rule 65):</span>
        </div>
        <ul className="list-disc list-inside space-y-1 text-[11px] text-amber-800">
          <li>Doctor&apos;s Name, Clinic/Hospital details and Medical Council Registration Number must be legible.</li>
          <li>Patient name, age and date of consultation must be clearly visible.</li>
          <li>Prescription must specify medicine name, strength, dosage schedule, and doctor&apos;s signature.</li>
        </ul>
      </div>

      {/* Error alert */}
      {errorMessage && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-xs text-red-800 flex items-start gap-2">
          <X className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <p>{errorMessage}</p>
        </div>
      )}

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-5">
        {/* Dropzone */}
        <label
          htmlFor="rx-file-input"
          className="block border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition border-slate-300 hover:border-[#087F5B] bg-slate-50/50"
        >
          <UploadCloud className="w-10 h-10 mx-auto mb-2 text-[#087F5B]" />
          <h4 className="text-sm font-bold text-[#172B24]">
            Drag &amp; drop prescription documents here, or click to browse
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Supports clear JPG, PNG or PDF (up to 5 pages, max 10MB each)
          </p>
          <input
            id="rx-file-input"
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf,image/jpeg,image/png,application/pdf"
            onChange={handleFileChange}
            className="hidden"
          />
        </label>

        {/* Selected files list */}
        {selectedFiles.length > 0 && (
          <div className="space-y-2">
            <h5 className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Selected Documents ({selectedFiles.length}/5):
            </h5>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {selectedFiles.map((file, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between p-2.5 bg-slate-50 rounded-lg border border-slate-200 text-xs"
                >
                  <div className="flex items-center gap-2 overflow-hidden">
                    <FileText className="w-4 h-4 text-[#087F5B] shrink-0" />
                    <span className="truncate font-mono font-medium text-slate-800">{file.name}</span>
                    <span className="text-[10px] text-slate-400 shrink-0">
                      ({(file.size / 1024).toFixed(0)} KB)
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="text-slate-400 hover:text-red-500 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Patient and Doctor metadata fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input
            label="Patient Name"
            placeholder="e.g. Aarav Sharma"
            value={patientName}
            onChange={(e) => setPatientName(e.target.value)}
            required
          />

          <div className="grid grid-cols-2 gap-2">
            <Input
              label="Age"
              placeholder="e.g. 35"
              type="number"
              value={patientAge}
              onChange={(e) => setPatientAge(e.target.value)}
            />
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
              <select
                value={patientGender}
                onChange={(e) => setPatientGender(e.target.value)}
                className="w-full h-10 px-3 text-xs rounded-xl border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Other">Other</option>
              </select>
            </div>
          </div>

          <Input
            label="Doctor's Name"
            placeholder="e.g. Dr. K. S. Murthy, MBBS"
            value={doctorName}
            onChange={(e) => setDoctorName(e.target.value)}
          />

          <Input
            label="Medical Council Reg No"
            placeholder="e.g. KMC-48201-B"
            value={doctorRegistrationNo}
            onChange={(e) => setDoctorRegistrationNo(e.target.value)}
          />

          <Input
            label="Clinic / Hospital Name"
            placeholder="e.g. Manipal Hospital, Bengaluru"
            value={doctorClinic}
            onChange={(e) => setDoctorClinic(e.target.value)}
          />

          <Input
            label="Prescription Date"
            type="date"
            value={prescriptionDate}
            onChange={(e) => setPrescriptionDate(e.target.value)}
          />
        </div>

        <Textarea
          label="Special Instructions for Pharmacist (Optional)"
          placeholder="Mention if you require a specific brand substitution or urgent delivery time slot..."
          value={customerNotes}
          onChange={(e) => setCustomerNotes(e.target.value)}
        />

        <Checkbox
          id="confirmRx"
          checked={confirmedRx}
          onChange={(e) => setConfirmedRx(e.target.checked)}
          label="I certify this is an authentic prescription from a Registered Medical Practitioner"
          description="In compliance with Indian pharmacy laws (Rule 65), dispensing will take place only after our registered pharmacist verifies the uploaded document."
        />

        <Button
          variant="primary"
          size="lg"
          type="submit"
          disabled={submitting}
          className="w-full shadow-sm"
        >
          {submitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              <span>Verifying &amp; Uploading Prescription...</span>
            </>
          ) : (
            <span>Submit Prescription for Pharmacist Verification</span>
          )}
        </Button>
      </form>
    </div>
  );
}
