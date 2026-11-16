"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Eye, FileCheck, CheckCircle2, Clock, XCircle, Truck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_ADMIN_ORDERS } from "@/mock/adminData";
import { AdminOrder } from "@/types";

export default function AdminOrdersPage() {
  const [activeTab, setActiveTab] = useState<"ALL" | "PENDING" | "PACKED" | "DELIVERED" | "CANCELLED">("ALL");
  const [search, setSearch] = useState("");

  const filtered = MOCK_ADMIN_ORDERS.filter((o) => {
    const matchesSearch =
      o.orderNumber.toLowerCase().includes(search.toLowerCase()) ||
      o.customerName.toLowerCase().includes(search.toLowerCase()) ||
      o.customerPhone.includes(search);
    const matchesTab =
      activeTab === "ALL" ||
      (activeTab === "PENDING" && (o.statusCode === "PENDING" || o.statusCode === "UNDER_REVIEW")) ||
      (activeTab === "PACKED" && (o.statusCode === "PACKED" || o.statusCode === "DISPATCHED")) ||
      (activeTab === "DELIVERED" && o.statusCode === "DELIVERED") ||
      (activeTab === "CANCELLED" && o.statusCode === "CANCELLED");
    return matchesSearch && matchesTab;
  });

  const columns: Column<AdminOrder>[] = [
    {
      header: "Order / Date",
      cell: (o) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{o.orderNumber}</p>
          <span className="text-[10px] text-slate-400">{o.orderDate}</span>
        </div>
      ),
    },
    {
      header: "Customer",
      cell: (o) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{o.customerName}</p>
          <span className="text-[10px] text-slate-500">{o.customerPhone} • {o.deliveryPincode}</span>
        </div>
      ),
    },
    {
      header: "Prescription",
      cell: (o) => {
        if (!o.hasPrescription) {
          return <span className="text-[10px] font-medium text-slate-400">OTC Only</span>;
        }
        return (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-1.5 py-0.5 rounded">
            <FileCheck className="w-3 h-3" />
            <span>Rx Verified</span>
          </span>
        );
      },
    },
    {
      header: "Items & Amount",
      cell: (o) => (
        <div className="text-xs">
          <p className="font-bold text-slate-900">₹{o.totalAmount.toLocaleString("en-IN")}</p>
          <span className="text-[10px] text-slate-500">{o.itemCount} items • {o.paymentMethod}</span>
        </div>
      ),
    },
    {
      header: "Order Status",
      cell: (o) => <StatusBadge status={o.statusCode} />,
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
          <span>View Details</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Dispensing & Order Management"
        subtitle="Manage licensed pharmacist dispensing, clinical verification, packaging, and dispatch tracking."
      />

      {/* Tabs */}
      <div className="flex items-center gap-1 border-b border-slate-200 text-xs font-semibold">
        {[
          { id: "ALL", label: "All Orders", count: MOCK_ADMIN_ORDERS.length },
          { id: "PENDING", label: "Pending Verification", count: 2 },
          { id: "PACKED", label: "Packed / Dispatched", count: 1 },
          { id: "DELIVERED", label: "Delivered", count: 2 },
          { id: "CANCELLED", label: "Cancelled", count: 0 },
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2.5 border-b-2 flex items-center gap-2 transition ${
              activeTab === tab.id
                ? "border-[#087F5B] text-[#087F5B]"
                : "border-transparent text-slate-500 hover:text-slate-900"
            }`}
          >
            <span>{tab.label}</span>
            <span
              className={`px-1.5 py-0.2 rounded-full text-[10px] ${
                activeTab === tab.id
                  ? "bg-emerald-100 text-[#087F5B]"
                  : "bg-slate-100 text-slate-600"
              }`}
            >
              {tab.count}
            </span>
          </button>
        ))}
      </div>

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search order number, patient name, phone..."
      />

      <DataTable
        columns={columns}
        data={filtered}
        keyExtractor={(o) => o.id}
        emptyMessage="No orders found matching the criteria."
      />
    </div>
  );
}
