"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatPriceINR } from "@/lib/utils";
import { Eye, ShieldAlert, CheckCircle2, Clock, Loader2, Package } from "lucide-react";
import { adminOrderService, AdminOrderDetail } from "@/services/adminOrderService";

export const RecentOrdersTable: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrders() {
      try {
        const res = await adminOrderService.listOrders({ page: 1, page_size: 5 });
        if (res?.items) {
          setOrders(res.items);
        }
      } catch (err) {
        console.warn("Could not load recent orders:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden text-left">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Recent Orders &amp; Prescription Verification</h3>
          <p className="text-xs text-slate-500 mt-0.5">Live queue of customer orders from database</p>
        </div>
        <Link href="/orders" className="text-xs text-[#0066CC] font-semibold hover:underline">
          View All Orders
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Patient / Customer</th>
              <th className="py-3 px-4">Status</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Date</th>
              <th className="py-3 px-4 text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={7} className="py-10 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0066CC]" />
                    <span>Loading live database orders...</span>
                  </div>
                </td>
              </tr>
            ) : orders.length === 0 ? (
              <tr>
                <td colSpan={7} className="py-8 text-center text-slate-400">
                  <Package className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <p>No customer orders placed yet in the database.</p>
                </td>
              </tr>
            ) : (
              orders.map((order) => {
                const totalItems = order.items?.reduce((sum, it) => sum + it.quantity, 0) || order.item_count || 0;
                const hasRx = order.items?.some((it) => it.prescription_required) || Boolean(order.prescription_id);
                return (
                  <tr key={order.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                      {order.order_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{order.customer_name || "Customer"}</div>
                      <div className="text-[11px] text-slate-400">{order.customer_phone || "—"}</div>
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        {hasRx && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                            <ShieldAlert className="w-3 h-3" /> Sched H/H1
                          </span>
                        )}
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                          {order.status}
                        </span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">{totalItems} {totalItems === 1 ? "item" : "items"}</td>
                    <td className="py-3.5 px-4 font-semibold text-slate-900">
                      {formatPriceINR(Number(order.grand_total || 0))}
                    </td>
                    <td className="py-3.5 px-4 text-slate-500">
                      {new Date(order.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <Link
                        href={`/orders/${order.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium text-xs shadow-xs hover:bg-slate-50 transition"
                      >
                        <Eye className="w-3.5 h-3.5 text-slate-500" />
                        <span>Inspect</span>
                      </Link>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
