"use client";

import React, { useState } from "react";
import { IndianRupee, ArrowDownLeft, Download, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_ADMIN_ORDERS } from "@/mock/adminData";
import { AdminOrder } from "@/types";

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");

  const columns: Column<AdminOrder>[] = [
    {
      header: "Transaction / Order",
      cell: (o) => (
        <div>
          <p className="font-bold text-slate-900 text-xs font-mono">TXN-{o.orderNumber.replace("ORD-", "")}</p>
          <span className="text-[10px] text-slate-500">Order: {o.orderNumber}</span>
        </div>
      ),
    },
    {
      header: "Patient",
      accessorKey: "customerName",
    },
    {
      header: "Payment Method",
      cell: (o) => (
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {o.paymentMethod}
        </span>
      ),
    },
    {
      header: "Gross Amount",
      cell: (o) => (
        <span className="font-bold text-slate-900 text-xs">
          ₹{o.totalAmount.toLocaleString("en-IN")}.00
        </span>
      ),
    },
    {
      header: "GST Component (12%)",
      cell: (o) => (
        <span className="text-xs text-slate-600 font-mono">
          ₹{Math.round(o.totalAmount * 0.12).toLocaleString("en-IN")}.00
        </span>
      ),
    },
    {
      header: "Settlement Status",
      cell: (o) => {
        if (o.paymentMethod.includes("COD")) {
          return <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">Cash on Delivery</span>;
        }
        return <span className="text-[10px] font-semibold text-teal-700 bg-teal-50 px-2 py-0.5 rounded">Settled to Bank</span>;
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Merchant Settlements"
        subtitle="UPI, Debit/Credit Card gateways, and cash-on-delivery collection reconciliation."
        actions={
          <button
            type="button"
            onClick={() => alert("Mock: Exporting settlement report")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export Tally / GST Summary</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total Collected (Nov 2026)</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹18,45,200</p>
          <span className="text-[10px] text-teal-600 font-medium">+14.2% from last month</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Digital UPI / Cards Share</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">82%</p>
          <span className="text-[10px] text-slate-400">Instant gateway settlement</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Cash on Delivery Pending</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">₹24,350</p>
          <span className="text-[10px] text-amber-600">With delivery riders</span>
        </div>
      </div>

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search transaction or order ID..."
      />

      <DataTable
        columns={columns}
        data={MOCK_ADMIN_ORDERS}
        keyExtractor={(o) => o.id}
        emptyMessage="No payment transactions found."
      />
    </div>
  );
}

