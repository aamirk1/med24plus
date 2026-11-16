"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Plus, UserCheck, ShieldCheck, Phone, Mail } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_STAFF } from "@/mock/adminData";
import { AdminStaff } from "@/types";

export default function AdminStaffPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_STAFF.filter((s) =>
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
              ? "bg-emerald-50 text-[#087F5B] border border-emerald-200"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {s.role}
        </span>
      ),
    },
    {
      header: "Pharmacy Council Reg No",
      cell: (s) => (
        <span className="font-mono text-xs text-slate-800 font-semibold">
          {s.licenseNo || "N/A (Non-Clinical)"}
        </span>
      ),
    },
    {
      header: "Contact Phone",
      cell: (s) => <span className="font-mono text-xs text-slate-600">{s.phone}</span>,
    },
    {
      header: "Joined Date",
      accessorKey: "joinedDate",
    },
    {
      header: "Status",
      cell: (s) => <StatusBadge status={s.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy Staff & Personnel Directory"
        subtitle="Manage licensed pharmacists, inventory clerks, delivery supervisors, and administrators."
        actions={
          <div className="flex items-center gap-2">
            <Link
              href="/staff/pharmacists"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
            >
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Pharmacist Council Registry</span>
            </Link>
            <button
              type="button"
              onClick={() => alert("Mock: Add staff member dialog")}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#087F5B] hover:bg-[#066649] text-white rounded-lg text-xs font-semibold transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
          </div>
        }
      />

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search staff name, email, or role..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(s) => s.id}
        emptyMessage="No staff records match your query."
      />
    </div>
  );
}

