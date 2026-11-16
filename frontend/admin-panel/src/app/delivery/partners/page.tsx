"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Truck, Phone, CheckCircle2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_DELIVERY_PARTNERS } from "@/mock/adminData";
import { DeliveryPartner } from "@/types";

export default function DeliveryPartnersPage() {
  const [partners, setPartners] = useState<DeliveryPartner[]>(MOCK_DELIVERY_PARTNERS);

  const columns: Column<DeliveryPartner>[] = [
    {
      header: "Fleet / Partner Name",
      cell: (dp) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{dp.name}</p>
            <p className="text-[10px] text-slate-400">Contact: {dp.contactPerson}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Phone",
      cell: (dp) => <span className="text-xs font-mono text-slate-700">{dp.phone}</span>,
    },
    {
      header: "Active Deliveries",
      cell: (dp) => <span className="text-xs font-bold text-blue-700">{dp.activeOrders} active</span>,
    },
    {
      header: "Completed Deliveries",
      cell: (dp) => <span className="text-xs text-slate-700 font-medium">{dp.completedOrders} orders</span>,
    },
    {
      header: "Average TAT",
      cell: (dp) => <span className="text-xs font-semibold text-emerald-700">{dp.avgDeliveryTime}</span>,
    },
    {
      header: "Status",
      cell: (dp) => <StatusBadge status={dp.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/delivery"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Delivery Overview</span>
        </Link>
      </div>

      <PageHeader
        title="Delivery Fleet & Courier Partners"
        subtitle="Manage in-house temperature-controlled couriers and 3rd party hyper-local delivery services."
        actions={
          <button
            type="button"
            onClick={() => alert("Mock: Add Delivery Partner Dialog")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#087F5B] hover:bg-[#066649] text-white rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Partner</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={partners}
        keyExtractor={(dp) => dp.id}
        emptyMessage="No delivery partners configured."
      />
    </div>
  );
}

