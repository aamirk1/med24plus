"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, User, Phone, MapPin, ShoppingBag } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_CUSTOMERS } from "@/mock/adminData";
import { AdminCustomer } from "@/types";

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");

  const filtered = MOCK_CUSTOMERS.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.phone.includes(search) ||
    c.email.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<AdminCustomer>[] = [
    {
      header: "Customer",
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center font-bold text-xs">
            {c.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{c.name}</p>
            <p className="text-[10px] text-slate-400">{c.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      cell: (c) => <span className="text-xs text-slate-700 font-mono">{c.phone}</span>,
    },
    {
      header: "Location",
      cell: (c) => (
        <span className="text-xs text-slate-600">
          {c.city}, {c.pincode}
        </span>
      ),
    },
    {
      header: "Order History",
      cell: (c) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-900">{c.totalOrders} orders</span>
          <p className="text-[10px] text-slate-500">₹{c.totalSpentINR.toLocaleString("en-IN")} spent</p>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (c) => <StatusBadge status={c.status} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (c) => (
        <Link
          href={`/customers/${c.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#087F5B] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Profile</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        subtitle="Manage patient profiles, delivery addresses, and chronic medicine order records."
      />

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search patient name, phone number, or email..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(c) => c.id}
        emptyMessage="No customer records match your search."
      />
    </div>
  );
}
