"use client";

import React, { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Eye, FileCheck2, User, Clock, AlertTriangle, ShieldCheck, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  adminPrescriptionService,
  AdminPrescription,
  PrescriptionSummaryCounts,
} from "@/services/admin-prescription.service";

export default function AdminPrescriptionsPage() {
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<string>("ALL");
  const [prescriptions, setPrescriptions] = useState<AdminPrescription[]>([]);
  const [counts, setCounts] = useState<PrescriptionSummaryCounts>({
    total: 0,
    pending_review: 0,
    under_review: 0,
    approved: 0,
    rejected: 0,
    clarification_required: 0,
    expired: 0,
  });
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [queueRes, countsRes] = await Promise.all([
        adminPrescriptionService.listQueue({
          status: tab !== "ALL" ? tab : undefined,
          search: search || undefined,
          page,
          page_size: 20,
        }),
        adminPrescriptionService.getCounts(),
      ]);

      if (queueRes.success && queueRes.data) {
        setPrescriptions(queueRes.data.items || []);
        setTotalPages(queueRes.data.pagination.total_pages || 1);
      }
      if (countsRes.success && countsRes.data) {
        setCounts(countsRes.data);
      }
    } catch (err: any) {
      console.error("Failed to load prescription verification queue:", err);
    } finally {
      setLoading(false);
    }
  }, [tab, search, page]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const columns: Column<AdminPrescription>[] = [
    {
      header: "Rx Reference / Date",
      cell: (p) => (
        <div>
          <p className="font-bold text-slate-900 text-xs font-mono">
            {p.prescription_number || p.prescription_reference}
          </p>
          <span className="text-[10px] text-slate-400">
            {new Date(p.uploaded_at).toLocaleDateString("en-IN", {
              day: "2-digit",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })}
          </span>
        </div>
      ),
    },
    {
      header: "Patient Details",
      cell: (p) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{p.patient_name || p.customer?.full_name || "Self"}</p>
          <span className="text-[10px] text-slate-500 font-mono">
            {p.customer?.phone_number || "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Doctor / Reg No",
      cell: (p) => (
        <div>
          <p className="text-xs text-slate-700">{p.doctor_name || "Extracted on Review"}</p>
          <span className="text-[10px] font-mono text-slate-400">
            {p.doctor_registration_no ? `Reg: ${p.doctor_registration_no}` : "—"}
          </span>
        </div>
      ),
    },
    {
      header: "Prescription Documents",
      cell: (p) => (
        <span className="text-[11px] text-teal-700 bg-teal-50 border border-teal-200 px-2 py-0.5 rounded font-mono">
          {p.files && p.files.length > 0 ? `${p.files.length} document${p.files.length > 1 ? "s" : ""}` : "1 file"}
        </span>
      ),
    },
    {
      header: "Clinical Status",
      cell: (p) => <StatusBadge status={p.status || p.prescription_status} />,
    },
    {
      header: "Auditor / Pharmacist",
      cell: (p) => (
        <span className="text-xs text-slate-600">
          {p.reviewed_by_name || p.under_review_by_name || "Unassigned"}
        </span>
      ),
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (p) => (
        <Link
          href={`/prescriptions/${p.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0D9488] bg-teal-50 hover:bg-teal-100 rounded-lg transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Audit &amp; Review</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacist Prescription Verification Queue"
        subtitle="Mandatory verification queue for Schedule H, H1 and clinical orders per Drugs and Cosmetics Rules (Rule 65)."
      />

      {/* Statutory Guidance Banner */}
      <div className="bg-teal-50/80 border border-teal-200 rounded-xl p-3.5 flex items-start gap-2.5 text-xs text-teal-950">
        <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
        <p className="text-[11px] leading-relaxed">
          <span className="font-bold">Rule 65 Clinical Verification Workbench:</span> Only licensed pharmacists registered with the State Pharmacy Council are authorized to verify prescriber credentials, dosage instructions, and release medication orders for dispensing.
        </p>
      </div>

      {/* KPI Counters */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Pending Review</span>
          <p className="text-xl font-bold font-mono text-amber-600 mt-0.5">{counts.pending_review}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Under Review</span>
          <p className="text-xl font-bold font-mono text-blue-600 mt-0.5">{counts.under_review}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Action Needed</span>
          <p className="text-xl font-bold font-mono text-purple-600 mt-0.5">{counts.clarification_required}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Approved</span>
          <p className="text-xl font-bold font-mono text-teal-600 mt-0.5">{counts.approved}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Rejected</span>
          <p className="text-xl font-bold font-mono text-red-600 mt-0.5">{counts.rejected}</p>
        </div>
        <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-xs">
          <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Total Vault</span>
          <p className="text-xl font-bold font-mono text-slate-800 mt-0.5">{counts.total}</p>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold overflow-x-auto">
        {[
          { id: "ALL", label: "All Uploads", count: counts.total },
          { id: "PENDING_REVIEW", label: "Pending Review", count: counts.pending_review },
          { id: "UNDER_REVIEW", label: "Under Review", count: counts.under_review },
          { id: "CLARIFICATION_REQUIRED", label: "Clarification Needed", count: counts.clarification_required },
          { id: "APPROVED", label: "Approved", count: counts.approved },
          { id: "REJECTED", label: "Rejected", count: counts.rejected },
        ].map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => {
              setTab(t.id);
              setPage(1);
            }}
            className={`px-4 py-2 border-b-2 flex items-center gap-2 whitespace-nowrap transition ${
              tab === t.id
                ? "border-[#0D9488] text-[#0D9488]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>{t.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                tab === t.id ? "bg-teal-100 text-[#0D9488]" : "bg-slate-100 text-slate-600"
              }`}
            >
              {t.count}
            </span>
          </button>
        ))}
      </div>

      <TableToolbar
        searchQuery={search}
        onSearchChange={(s) => {
          setSearch(s);
          setPage(1);
        }}
        placeholder="Search Rx token, patient name, doctor, phone..."
      />

      {loading ? (
        <div className="py-20 flex flex-col items-center justify-center space-y-2 text-slate-400">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
          <p className="text-xs">Loading prescription verification queue...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={prescriptions}
          keyExtractor={(p) => p.id}
          emptyMessage="No prescriptions currently in queue."
        />
      )}
    </div>
  );
}
