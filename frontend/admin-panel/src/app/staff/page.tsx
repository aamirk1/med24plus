"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { UserCheck, ShieldCheck, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AdminStaff } from "@/types";
import { adminCustomerService } from "@/services/admin-customer.service";

export default function AdminStaffPage() {
  const [search, setSearch] = useState("");
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminCustomerService
      .getStaff()
      .then((data) => {
        if (active) setStaff(data || []);
      })
      .catch((e) => console.error("Failed to load staff:", e))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<AdminStaff>[] = [
    {
      header: "Employee Name",
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
            {s.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{s.name}</p>
            <p className="text-[10px] text-slate-400">{s.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Operational Role",
      cell: (s) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
            s.role === "Pharmacist"
              ? "bg-teal-50 text-[#0D9488] border border-teal-200"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {s.role}
        </span>
      ),
    },
    {
      header: "License / Council Reg",
      cell: (s) =>
        s.licenseNo ? (
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            {s.licenseNo}
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-mono">—</span>
        ),
    },
    {
      header: "Phone",
      cell: (s) => <span className="text-xs text-slate-700 font-mono">{s.phone}</span>,
    },
    {
      header: "Status",
      cell: (s) => <StatusBadge status={s.status} />,
    },
    {
      header: "Joined Date",
      accessorKey: "joinedDate",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Role Directory"
        subtitle="Manage licensed pharmacists, inventory operators, and system administrators."
        actions={
          <Link
            href="/staff/pharmacists"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <ShieldCheck className="w-4 h-4" />
            <span>Rule 65 Pharmacist Council</span>
          </Link>
        }
      />

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search staff name, role, or email..."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-[#0D9488] mb-2" />
          <p className="text-xs">Loading staff from database...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(s) => s.id}
          emptyMessage="No staff members registered in database."
        />
      )}
    </div>
  );
}
