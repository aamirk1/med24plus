"use client";

import React, { useState, useEffect } from "react";
import { RotateCcw, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { adminOrderService, AdminOrderDetail } from "@/services/adminOrderService";

interface RefundItem {
  id: string;
  orderNumber: string;
  customerName: string;
  amountINR: number;
  reason: string;
  status: string;
  date: string;
}

export default function AdminRefundsPage() {
  const [refunds, setRefunds] = useState<RefundItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    adminOrderService
      .listOrders({ status: "CANCELLED", page_size: 50 })
      .then((res) => {
        if (active) {
          const items: RefundItem[] = (res?.items || []).map((o: AdminOrderDetail) => ({
            id: `REF-${o.order_number.replace("ORD-", "")}`,
            orderNumber: o.order_number,
            customerName: o.customer_name || "Patient",
            amountINR: Number(o.total_amount),
            reason: o.cancellation?.cancellation_reason || "Order cancelled before dispatch",
            status: o.cancellation?.cancellation_status || "PENDING",
            date: o.cancelled_at ? new Date(o.cancelled_at).toLocaleDateString() : "Recent",
          }));
          setRefunds(items);
        }
      })
      .catch((e) => console.error("Failed to load cancelled orders:", e))
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, []);

  const columns: Column<RefundItem>[] = [
    {
      header: "Refund Ref / Order",
      cell: (r) => (
        <div>
          <p className="font-bold text-slate-900 text-xs font-mono">{r.id}</p>
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
      cell: (r) => <span className="font-bold text-slate-900 text-xs">₹{r.amountINR.toLocaleString("en-IN")}.00</span>,
    },
    {
      header: "Clinical / Cancellation Reason",
      accessorKey: "reason",
    },
    {
      header: "Status",
      cell: (r) => (
        <span
          className={`inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            r.status === "PROCESSED" || r.status === "COMPLETED"
              ? "bg-teal-50 text-teal-700 border border-teal-200"
              : "bg-amber-50 text-amber-700 border border-amber-200"
          }`}
        >
          {r.status === "PROCESSED" || r.status === "COMPLETED" ? "Reimbursed to Source" : "Pending Review"}
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
        title="Refunds & Reversals"
        subtitle="Manage statutory refunds for prescription rejections, stockouts, and cancelled deliveries."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-[#0D9488] mb-2" />
          <p className="text-xs">Loading refund claims from database...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={refunds}
          keyExtractor={(r) => r.id}
          emptyMessage="No pending refunds or cancellations recorded in database."
        />
      )}
    </div>
  );
}
