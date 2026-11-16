"use client";

import React from "react";
import Link from "next/link";
import { ArrowLeft, ShieldCheck, CheckCircle2, UserCheck, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_STAFF } from "@/mock/adminData";
import { AdminStaff } from "@/types";

export default function PharmacistManagementPage() {
  const pharmacists = MOCK_STAFF.filter((s) => s.role === "Pharmacist");

  const columns: Column<AdminStaff>[] = [
    {
      header: "Pharmacist Name & Degree",
      cell: (p) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-emerald-100 text-[#087F5B] flex items-center justify-center font-bold text-xs">
            {p.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{p.name}</p>
            <p className="text-[10px] text-slate-400">{p.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "State Pharmacy Council Reg No",
      cell: (p) => (
        <span className="font-mono text-xs font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
          {p.licenseNo}
        </span>
      ),
    },
    {
      header: "Statutory Signing Authority",
      cell: () => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5" />
          <span>Schedule H/H1 Authorized</span>
        </span>
      ),
    },
    {
      header: "Phone",
      cell: (p) => <span className="font-mono text-xs text-slate-700">{p.phone}</span>,
    },
    {
      header: "Status",
      cell: (p) => <StatusBadge status={p.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/staff"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Staff Directory</span>
        </Link>
      </div>

      <PageHeader
        title="Registered Pharmacist Authority Register"
        subtitle="Verification records of qualified Registered Pharmacists legally authorized to compound, verify and dispense medicines."
      />

      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#087F5B] shrink-0 mt-0.5" />
        <div className="text-xs text-emerald-950">
          <p className="font-bold">Drugs and Cosmetics Rules, 1945 — Rule 65 Mandate</p>
          <p className="text-emerald-800 text-[11px] mt-0.5 leading-relaxed">
            The supply of drugs on prescription shall be made only by or under the direct supervision of a Registered Pharmacist. Each prescription audited through this platform requires digital signing by one of the authorized council registered pharmacists listed below.
          </p>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={pharmacists}
        keyExtractor={(p) => p.id}
        emptyMessage="No pharmacists registered."
      />
    </div>
  );
}

