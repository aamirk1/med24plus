"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, FileCheck2, User, Clock, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_ADMIN_PRESCRIPTIONS } from "@/mock/adminData";
import { AdminPrescription } from "@/types";

export default function AdminPrescriptionsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"ALL" | "PENDING_REVIEW" | "APPROVED" | "REJECTED">("ALL");

  const filtered = MOCK_ADMIN_PRESCRIPTIONS.filter((p) => {
    const matchesSearch =
      p.prescriptionNumber.toLowerCase().includes(search.toLowerCase()) ||
      p.patientName.toLowerCase().includes(search.toLowerCase()) ||
      p.patientPhone.includes(search);
    const matchesTab = tab === "ALL" || p.statusCode === tab;
    return matchesSearch && matchesTab;
  });

  const columns: Column<AdminPrescription>[] = [
    {
      header: "Rx Token / Date",
      cell: (p) => (
        <div>
          <p className="font-bold text-slate-900 text-xs font-mono">{p.prescriptionNumber}</p>
          <span className="text-[10px] text-slate-400">{p.uploadedAt}</span>
        </div>
      ),
    },
    {
      header: "Patient Details",
      cell: (p) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{p.patientName}</p>
          <span className="text-[10px] text-slate-500 font-mono">{p.patientPhone}</span>
        </div>
      ),
    },
    {
      header: "Doctor / Reg No",
      cell: (p) => (
        <div>
          <p className="text-xs text-slate-700">{p.doctorName || "Not captured"}</p>
          <span className="text-[10px] font-mono text-slate-400">{p.doctorRegistrationNo || "—"}</span>
        </div>
      ),
    },
    {
      header: "Prescription Document",
      cell: (p) => (
        <span className="text-[11px] text-blue-600 bg-blue-50 px-2 py-0.5 rounded font-mono">
          {p.fileName}
        </span>
      ),
    },
    {
      header: "Clinical Review Status",
      cell: (p) => <StatusBadge status={p.statusCode} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (p) => (
        <Link
          href={`/prescriptions/${p.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#087F5B] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Audit & Review</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacist Prescription Verification Queue"
        subtitle="Mandatory verification queue for Schedule H and H1 clinical orders per Rule 65."
      />

      {/* Demo Notice */}
      <div className="bg-amber-50/80 border border-amber-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-amber-900">
        <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <span className="font-bold">Phase 2 Verification Queue Prototype:</span> Displays mock prescription audit states (Pending Review, Approved, Rejected). Clinical approval, OCR ingestion, and batch dispensing triggers will connect to backend APIs in subsequent phases.
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold">
        {[
          { id: "ALL", label: "All Uploads", count: MOCK_ADMIN_PRESCRIPTIONS.length },
          { id: "PENDING_REVIEW", label: "Pending Review", count: 2 },
          { id: "APPROVED", label: "Approved", count: 1 },
          { id: "REJECTED", label: "Rejected", count: 0 },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => setTab(t.id as any)}
            className={`px-4 py-2 border-b-2 flex items-center gap-2 transition ${
              tab === t.id
                ? "border-[#087F5B] text-[#087F5B]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                tab === t.id ? "bg-emerald-100 text-[#087F5B]" : "bg-slate-100 text-slate-600"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search Rx token, patient name, doctor..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(p) => p.id}
        emptyMessage="No prescriptions currently in queue."
      />
    </div>
  );
}

