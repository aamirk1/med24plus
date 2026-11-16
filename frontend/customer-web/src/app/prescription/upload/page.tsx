"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { Checkbox } from "@/components/ui/Checkbox";
import {
  UploadCloud,
  FileCheck2,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  Info,
  PhoneCall,
} from "lucide-react";

export default function PrescriptionUploadPage() {
  const [fileSelected, setFileSelected] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
  };

  if (submitted) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#087F5B] bg-[#E6F4EF] px-2.5 py-1 rounded-full uppercase tracking-wider">
            Prescription Submitted to Pharmacist
          </span>
          <h1 className="text-2xl font-bold text-[#172B24]">Ref: #RX-2026-0842</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Our Registered Pharmacist is reviewing your prescription. You will receive a telephone call or WhatsApp confirmation with your medication list and total invoice.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-4 text-xs text-left border border-slate-200 space-y-2">
          <div className="flex items-center gap-2 font-bold text-[#172B24]">
            <ClockIcon className="w-4 h-4 text-[#087F5B]" />
            <span>Expected Pharmacist Review: Within 15 Minutes</span>
          </div>
          <p className="text-slate-500 text-[11px]">
            Pharmacy Contact: +91 8000 124 247 • Central Dispensing Unit, Bengaluru
          </p>
        </div>

        <div className="flex justify-center gap-3">
          <Link href="/account/prescriptions">
            <Button variant="primary" size="md">
              View Prescription Vault
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="md">
              Return Home
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

      {/* Upload Form */}
      <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-5">
        <div
          onClick={() => setFileSelected(!fileSelected)}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
            fileSelected
              ? "border-[#087F5B] bg-[#E6F4EF]/30"
              : "border-slate-300 hover:border-[#087F5B] bg-slate-50/50"
          }`}
        >
          <UploadCloud className={`w-10 h-10 mx-auto mb-2 ${fileSelected ? "text-[#087F5B]" : "text-slate-400"}`} />
          <h4 className="text-sm font-bold text-[#172B24]">
            {fileSelected ? "Prescription Attached: Doctor_Prescription_Scan.pdf" : "Drag & drop prescription image or PDF here"}
          </h4>
          <p className="text-xs text-slate-500 mt-1">
            Supports clear JPG, PNG or PDF up to 10MB
          </p>
          <button type="button" className="mt-3 text-xs font-bold text-[#087F5B] hover:underline">
            {fileSelected ? "Click to change document" : "Browse Files from Device"}
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Patient Name" defaultValue="Aarav Sharma" required />
          <Input label="Contact Mobile Number (+91)" defaultValue="+91 98451 22340" required helperText="For pharmacist verification call" />
          <Input label="Doctor's Name" placeholder="e.g. Dr. K. S. Murthy" />
          <Input label="Days of Medication Supply" placeholder="e.g. 30 Days / 1 Month" />
        </div>

        <Textarea
          label="Special Instructions for Pharmacist (Optional)"
          placeholder="Mention if you require a specific brand substitution or urgent delivery time slot..."
        />

        <Checkbox
          id="confirmRx"
          defaultChecked
          label="I certify this is an authentic prescription from a Registered Medical Practitioner"
          description="In compliance with Indian pharmacy laws, dispensing will take place only after our pharmacist verifies the uploaded document."
        />

        <Button
          variant="primary"
          size="lg"
          type="submit"
          className="w-full shadow-sm"
        >
          Submit Prescription for Verification
        </Button>
      </form>
    </div>
  );
}

function ClockIcon(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg fill="none" viewBox="0 0 24 24" stroke="currentColor" {...props}>
      <circle cx="12" cy="12" r="10" strokeWidth="2" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6l4 2" />
    </svg>
  );
}

