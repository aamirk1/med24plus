"use client";

import React, { useState } from "react";
import { RotateCcw, CheckCircle2, Clock } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { MOCK_ADMIN_REFUNDS, AdminRefund } from "@/mock/adminData";

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<AdminRefund[]>(MOCK_ADMIN_REFUNDS);

  const columns: Column<AdminRefund>[] = [
    {
      header: "Refund Ref / Order",
      cell: (r) => (
        <div>
          <p className="font-bold text-slate-900 text-xs font-mono">{r.id.toUpperCase()}</p>
          <span className="text-[10px] text-slate-500">Order: {r.orderNumber}</span>
        </div>
      ),
    },
    {
      header: "Patient",
      accessorKey: "customerName",
    },
    {
      header: "Amount",
      cell: (r) => <span className="font-bold text-slate-900 text-xs">₹{r.amountINR}.00</span>,
    },
    {
      header: "Clinical / Dispensing Reason",
      accessorKey: "reason",
    },
    {
      header: "Status",
      cell: (r) => (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            r.status === "PROCESSED"
              ? "bg-emerald-50 text-emerald-700 border border-emerald-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {r.status === "PROCESSED" ? "Reimbursed to UPI" : "Pending Approval"}
        </span>
      ),
    },
    {
      header: "Date",
      accessorKey: "date",
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patient Refunds & Return Management"
        subtitle="Manage order cancellations, out-of-stock medicine refunds, and clinical returns."
      />

      <DataTable
        columns={columns}
        data={refunds}
        keyExtractor={(r) => r.id}
        emptyMessage="No refund requests recorded."
      />
    </div>
  );
}

