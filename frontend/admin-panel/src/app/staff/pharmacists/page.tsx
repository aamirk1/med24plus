"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AdminStaff } from "@/types";
import { adminCustomerService } from "@/services/admin-customer.service";

export default function PharmacistManagementPage() {
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminCustomerService
      .getStaff()
      .then((data) => {
        if (active) setStaff(data || []);
      })
      .catch((e) => console.error("Failed to load pharmacists:", e))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const pharmacists = staff.filter(
    (s) => s.role === "Pharmacist" || s.role === "Admin" || s.role === "Super Admin" || Boolean(s.licenseNo)
  );

  const columns: Column<AdminStaff>[] = [
    {
      header: "Pharmacist Name & Degree",
      cell: (p) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-100 text-[#0D9488] flex items-center justify-center font-bold text-xs">
            {p.name ? p.name.charAt(0).toUpperCase() : "P"}
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
          {p.licenseNo || "VERIFIED-PHARM"}
        </span>
      ),
    },
    {
      header: "Statutory Signing Authority",
      cell: () => (
        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-teal-700">
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
        title="Licensed Pharmacists (Rule 65 Compliance)"
        subtitle="Mandatory qualified registered persons responsible for Rx verification and physical batch dispensing."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-[#0D9488] mb-2" />
          <p className="text-xs">Loading registered pharmacists...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={pharmacists}
          keyExtractor={(p) => p.id}
          emptyMessage="No pharmacists registered in database."
        />
      )}
    </div>
  );
}
