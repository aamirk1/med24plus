"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Eye, FileCheck, CheckCircle2, Clock, XCircle, Truck, Package, ShieldCheck, RefreshCw, AlertCircle, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  adminOrderService,
  AdminOrderDetail,
  AdminOrderMetrics,
} from "@/services/adminOrderService";

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<AdminOrderDetail[]>([]);
  const [metrics, setMetrics] = useState<AdminOrderMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<string>("ALL");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const loadData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [orderRes, metricRes] = await Promise.all([
        adminOrderService.listOrders({
          search: search.trim() || undefined,
          status: activeTab !== "ALL" ? activeTab : undefined,
          page,
          page_size: 15,
        }),
        adminOrderService.getMetrics(),
      ]);

      setOrders(orderRes.items);
      setTotalPages(orderRes.total_pages);
      setTotalCount(orderRes.total);
      setMetrics(metricRes);
    } catch (err: any) {
      setError(err?.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [activeTab, page]);

  const handleSearch = () => {
    setPage(1);
    loadData();
  };

  const columns: Column<AdminOrderDetail>[] = [
    {
      header: "Order / Date",
      cell: (o) => {
        const placed = o.placed_at || o.created_at;
        const dStr = placed
          ? new Date(placed).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric",
              hour: "2-digit",
              minute: "2-digit",
            })
          : "Recent";
        return (
          <div>
            <p className="font-bold text-slate-900 text-xs font-mono">{o.order_number}</p>
            <span className="text-[10px] text-slate-400">{dStr}</span>
          </div>
        );
      },
    },
    {
      header: "Customer",
      cell: (o) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{o.customer_name || "Customer"}</p>
          <span className="text-[10px] text-slate-500">
            {o.customer_phone || "No Phone"} • PIN: {o.delivery_address_snapshot?.pincode || "N/A"}
          </span>
        </div>
      ),
    },
    {
      header: "Prescription (Rule 65)",
      cell: (o) => {
        const hasRx = o.items.some((i) => i.prescription_required);
        if (!hasRx) {
          return <span className="text-[10px] font-medium text-slate-400">OTC / General</span>;
        }
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
            <ShieldCheck className="w-3 h-3 text-amber-600" />
            <span>Schedule H Rx</span>
          </span>
        );
      },
    },
    {
      header: "Items & Amount",
      cell: (o) => (
        <div className="text-xs">
          <p className="font-bold text-slate-900">₹{Number(o.grand_total).toLocaleString("en-IN")}</p>
          <span className="text-[10px] text-slate-500">
            {o.items.length} items • Pay: {o.payment_status}
          </span>
        </div>
      ),
    },
    {
      header: "Order Status",
      cell: (o) => <StatusBadge status={o.status.toUpperCase()} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (o) => (
        <Link
          href={`/orders/${o.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#087F5B] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Manage</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispensing & Order Management"
        subtitle="Manage licensed pharmacist dispensing, clinical verification under Rule 65, FEFO packaging, and dispatch tracking."
        actions={
          <button
            onClick={() => loadData()}
            disabled={loading}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh Orders</span>
          </button>
        }
      />

      {/* KPI Cards */}
      {metrics && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3">
          {[
            { label: "Total Orders", count: metrics.total_orders, color: "text-slate-900" },
            { label: "Pending Pay", count: metrics.pending_payment, color: "text-blue-600" },
            { label: "Rx Review", count: metrics.pharmacist_review, color: "text-amber-600" },
            { label: "Processing", count: metrics.processing, color: "text-indigo-600" },
            { label: "Ready", count: metrics.ready_for_dispatch, color: "text-cyan-600" },
            { label: "Dispatched", count: metrics.dispatched, color: "text-purple-600" },
            { label: "Delivered", count: metrics.delivered, color: "text-emerald-600" },
            { label: "Cancelled", count: metrics.cancelled, color: "text-red-600" },
          ].map((m) => (
            <div key={m.label} className="bg-white p-3 rounded-xl border border-slate-200 shadow-sm text-center">
              <p className="text-[10px] text-slate-500 font-semibold uppercase">{m.label}</p>
              <p className={`text-xl font-bold ${m.color} mt-0.5`}>{m.count}</p>
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold overflow-x-auto pb-1">
        {[
          { label: "All Orders", value: "ALL" },
          { label: "Pending Pay", value: "pending_payment" },
          { label: "Pharmacist Review", value: "pharmacist_review" },
          { label: "Processing", value: "processing" },
          { label: "Ready for Dispatch", value: "ready_for_dispatch" },
          { label: "Dispatched", value: "dispatched" },
          { label: "Delivered", value: "delivered" },
          { label: "Cancelled", value: "cancelled" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setActiveTab(tab.value);
              setPage(1);
            }}
            className={`px-3 py-2 border-b-2 font-medium transition whitespace-nowrap ${
              activeTab === tab.value
                ? "border-[#087F5B] text-[#087F5B] font-bold"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-4">
        <div className="flex flex-col sm:flex-row gap-3 justify-between items-center">
          <div className="flex w-full sm:w-80 gap-2">
            <input
              type="text"
              placeholder="Search order #, customer, phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="w-full text-xs px-3 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#087F5B]"
            />
            <button
              onClick={handleSearch}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 rounded-lg text-xs font-semibold text-slate-700 transition"
            >
              Search
            </button>
          </div>
          <p className="text-xs text-slate-400">Total: {totalCount} matching orders</p>
        </div>

        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
            <Loader2 className="w-8 h-8 animate-spin text-[#087F5B]" />
            <p className="text-xs">Loading medication orders from live database...</p>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={orders}
            keyExtractor={(o) => o.id}
            emptyMessage="No medication orders found matching your search and filter criteria."
          />
        )}

        {totalPages > 1 && (
          <div className="flex justify-between items-center pt-2 text-xs text-slate-500">
            <span>
              Page {page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="px-3 py-1.5 border border-slate-200 rounded-lg hover:bg-slate-50 disabled:opacity-40"
              >
                Next
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
