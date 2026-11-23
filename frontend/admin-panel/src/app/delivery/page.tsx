"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Truck, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminOrderService, AdminOrderDetail } from "@/services/adminOrderService";

export default function AdminDeliveryPage() {
  const [search, setSearch] = useState("");
  const [orders, setOrders] = useState<AdminOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const fetchDispatches = async () => {
      setLoading(true);
      try {
        const res = await adminOrderService.listOrders({
          search: search.trim() || undefined,
          page_size: 50,
        });
        if (active) {
          // Filter dispatches/orders
          setOrders(res?.items || []);
        }
      } catch (e) {
        console.error("Failed to load delivery orders:", e);
      } finally {
        if (active) setLoading(false);
      }
    };

    fetchDispatches();
    return () => {
      active = false;
    };
  }, [search]);

  const activeDispatches = orders.filter(
    (o) => o.status === "DISPATCHED" || o.status === "PACKED" || o.status === "READY_FOR_DISPATCH"
  );

  const columns: Column<AdminOrderDetail>[] = [
    {
      header: "Dispatch / Order No",
      cell: (o) => (
        <div>
          <p className="font-bold text-slate-900 text-xs">{o.order_number}</p>
          <span className="text-[10px] text-slate-400 font-mono">
            {o.shipping_address?.pincode ? `Pincode: ${o.shipping_address.pincode}` : "Local Delivery"}
          </span>
        </div>
      ),
    },
    {
      header: "Patient Destination",
      cell: (o) => (
        <div>
          <p className="font-semibold text-slate-800 text-xs">{o.customer_name || "Patient"}</p>
          <span className="text-[10px] text-slate-500">{o.shipping_address?.phone || o.customer_notes || "N/A"}</span>
        </div>
      ),
    },
    {
      header: "Assigned Courier / Fleet",
      cell: (o) => (
        <div className="flex items-center gap-1.5 text-xs text-slate-700">
          <Truck className="w-3.5 h-3.5 text-[#0D9488]" />
          <span>{o.is_cold_chain_required ? "Cold-Chain Fleet (2°C – 8°C)" : "Standard Express Fleet"}</span>
        </div>
      ),
    },
    {
      header: "Amount / Mode",
      cell: (o) => (
        <span className="text-xs font-semibold text-slate-900">
          ₹{Number(o.total_amount).toLocaleString("en-IN")} ({o.payment_method || "Prepaid"})
        </span>
      ),
    },
    {
      header: "Delivery Status",
      cell: (o) => <StatusBadge status={o.status} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (o) => (
        <Link
          href={`/orders/${o.id}`}
          className="inline-block text-xs font-semibold text-[#0D9488] hover:underline"
        >
          View Details →
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Delivery & Dispatch Management"
        subtitle="Track live order fulfillments, cold-chain couriers, and dispatch statuses from the database."
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Active Dispatches</p>
          <p className="text-2xl font-bold text-[#0D9488] mt-1">{activeDispatches.length}</p>
          <span className="text-[10px] text-slate-400">Packed / On-road</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total Orders Tracked</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">{orders.length}</p>
          <span className="text-[10px] text-teal-600">Fulfillment queue</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Cold-Chain Orders</p>
          <p className="text-2xl font-bold text-blue-600 mt-1">
            {orders.filter((o) => o.is_cold_chain_required).length}
          </p>
          <span className="text-[10px] text-slate-400">Insulin & vaccines at 2°C – 8°C</span>
        </div>
      </div>

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search order number or destination pincode..."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-[#0D9488] mb-2" />
          <p className="text-xs">Loading live delivery dispatches...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={orders}
          keyExtractor={(o) => o.id}
          emptyMessage="No delivery orders found in database."
        />
      )}
    </div>
  );
}
