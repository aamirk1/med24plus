"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Truck, CheckCircle2, Clock, MapPin, AlertCircle, Phone } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_ADMIN_ORDERS, MOCK_DELIVERY_PARTNERS } from "@/mock/adminData";
import { AdminOrder } from "@/types";

export default function AdminDeliveryPage() {
  const [search, setSearch] = useState("");

  const activeDeliveries = MOCK_ADMIN_ORDERS.filter(
    (o) => o.statusCode === "DISPATCHED" || o.statusCode === "PACKED" || o.statusCode === "DELIVERED"
  );

  const columns: Column<AdminOrder>[] = [
    {
      header: "Dispatch / Order No",
      cell: (o) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{o.orderNumber}</p>
          <span className="text-[10px] text-slate-400 font-mono">Pincode: {o.deliveryPincode}</span>
        </div>
      ),
    },
    {
      header: "Patient Destination",
      cell: (o) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{o.customerName}</p>
          <span className="text-[10px] text-slate-500">{o.customerPhone}</span>
        </div>
      ),
    },
    {
      header: "Assigned Courier / Fleet",
      cell: (o) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Truck className="w-3.5 h-3.5 text-blue-600" />
          <span>Med24 Cold-Chain Fleet</span>
        </div>
      ),
    },
    {
      header: "Amount / Mode",
      cell: (o) => (
        <span className="text-xs font-semibold text-slate-900">
          ₹{o.totalAmount.toLocaleString("en-IN")} ({o.paymentMethod})
        </span>
      ),
    },
    {
      header: "Delivery Status",
      cell: (o) => <StatusBadge status={o.statusCode} />,
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery & Dispatch Management"
        subtitle="Track cold-chain and express medicine couriers for same-day local home delivery."
        actions={
          <Link
            href="/delivery/partners"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-semibold transition"
          >
            <Truck className="w-4 h-4 text-slate-500" />
            <span>Manage Delivery Fleets</span>
          </Link>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Active Dispatches</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">13</p>
          <span className="text-[10px] text-slate-400">On-road couriers</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Average Delivery Time</p>
          <p className="text-2xl font-bold text-teal-700 mt-1">3.4 hrs</p>
          <span className="text-[10px] text-teal-600">Local Bengaluru area</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Cold-Chain Temp Compliance</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">100%</p>
          <span className="text-[10px] text-slate-400">Insulin kept at 2°C – 8°C</span>
        </div>
      </div>

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search order number or destination pincode..."
      />

      <DataTable
        columns={columns}
        data={activeDeliveries}
        keyExtractor={(o) => o.id}
        emptyMessage="No orders currently in dispatch."
      />
    </div>
  );
}

