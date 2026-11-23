"use client";

import React, { useState, useEffect } from "react";
import { Download, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { adminOrderService, AdminOrderDetail } from "@/services/adminOrderService";

export default function AdminPaymentsPage() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<AdminOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchPayments = async () => {
      setLoading(true);
      try {
        const res = await adminOrderService.listOrders({
          search: search.trim() || undefined,
          page_size: 50,
        });
        if (active) {
          setOrders(res?.items || []);
        }
      } catch (e) {
        console.error("Failed to load payment transactions:", e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchPayments();
    return () => {
      active = false;
    };
  }, [search]);

  const totalCollected = orders.reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0);
  const upiCount = orders.filter((o) => (o.payment_status || "").toUpperCase() === "PAID" || (o.payment_status || "").toUpperCase() === "COMPLETED").length;
  const digitalShare = orders.length > 0 ? Math.round((upiCount / orders.length) * 100) : 100;
  const codPending = orders
    .filter((o) => (o.payment_status || "").toUpperCase() !== "PAID" && (o.payment_status || "").toUpperCase() !== "COMPLETED")
    .reduce((sum, o) => sum + (Number(o.grand_total) || 0), 0);

  const columns: Column<AdminOrderDetail>[] = [
    {
      header: "Transaction / Order",
      cell: (o) => (
        <div>
          <p className="font-bold text-slate-900 text-xs font-mono">
            {o.order_number}
          </p>
          <span className="text-[10px] text-slate-500">
            {o.created_at ? new Date(o.created_at).toLocaleDateString() : "Recent"}
          </span>
        </div>
      ),
    },
    {
      header: "Customer",
      cell: (o) => (
        <span className="text-xs text-slate-800 font-medium">
          {o.customer_name || "Customer"}
        </span>
      ),
    },
    {
      header: "Payment Settlement",
      cell: (o) => (
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {o.payment_status || "PENDING"}
        </span>
      ),
    },
    {
      header: "Gross Amount",
      cell: (o) => (
        <span className="font-bold text-slate-900 text-xs">
          ₹{Number(o.grand_total || 0).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "GST Component (Estimated)",
      cell: (o) => (
        <span className="text-xs text-slate-600 font-mono">
          ₹{Number(o.tax_amount || (Number(o.grand_total) * 0.12) || 0).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
        </span>
      ),
    },
    {
      header: "Payment Status",
      cell: (o) => {
        const isPaid = (o.payment_status || "").toUpperCase() === "PAID" || (o.payment_status || "").toUpperCase() === "COMPLETED";
        return (
          <span className={`text-[10px] font-semibold px-2 py-0.5 rounded ${isPaid ? "text-teal-700 bg-teal-50" : "text-amber-700 bg-amber-50"}`}>
            {o.payment_status || "PENDING"}
          </span>
        );
      },
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Payments & Merchant Settlements"
        subtitle="Live reconciliation from PostgreSQL database orders and transactions."
        actions={
          <button
            type="button"
            onClick={() => window.print()}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Download className="w-4 h-4 text-slate-500" />
            <span>Export / Print Summary</span>
          </button>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total Order Volume</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">₹{totalCollected.toLocaleString("en-IN")}</p>
          <span className="text-[10px] text-teal-600 font-medium">{orders.length} orders recorded</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Digital UPI / Cards Share</p>
          <p className="text-2xl font-bold text-teal-600 mt-1">{digitalShare}%</p>
          <span className="text-[10px] text-slate-400">Electronic transactions</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Cash on Delivery Pending</p>
          <p className="text-2xl font-bold text-amber-700 mt-1">₹{codPending.toLocaleString("en-IN")}</p>
          <span className="text-[10px] text-amber-600">Pending reconciliation</span>
        </div>
      </div>

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search transaction or order ID..."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-[#0D9488] mb-2" />
          <p className="text-xs">Loading live payment transactions...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          keyExtractor={(o) => o.id}
          emptyMessage="No payment transactions found in database."
        />
      )}
    </div>
  );
}
