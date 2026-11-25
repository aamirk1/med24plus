"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatPriceINR } from "@/lib/utils";
import { orderService, OrderDetail } from "@/services/orderService";
import { ShoppingBag, Eye, RefreshCw, AlertCircle, Clock } from "lucide-react";

export default function OrderHistoryPage() {
  const [orders, setOrders] = useState<OrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  const fetchOrders = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await orderService.listOrders({
        status: statusFilter,
        page,
        page_size: 10,
      });
      setOrders(res.items);
      setTotalPages(res.total_pages);
    } catch (err: any) {
      setError(err.message || "Failed to load orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [statusFilter, page]);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Account", href: "/account/profile" },
          { label: "Order History" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-[#172B24]">Your Orders & Medicine Dispatches</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Track real-time pharmacist verification, packaging, and cold-chain delivery status
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => fetchOrders()} disabled={loading}>
            <RefreshCw className={`w-3.5 h-3.5 shrink-0 ${loading ? "animate-spin" : ""}`} />
            <span>Refresh</span>
          </Button>
          <Link href="/products">
            <Button variant="primary" size="sm">
              <ShoppingBag className="w-3.5 h-3.5 shrink-0" />
              <span>Order Medicines</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 border-b border-slate-100 text-xs font-semibold">
        {[
          { label: "All Orders", value: "ALL" },
          { label: "Pending Payment", value: "pending_payment" },
          { label: "Pharmacist Review", value: "pharmacist_review" },
          { label: "Processing", value: "processing" },
          { label: "Dispatched", value: "dispatched" },
          { label: "Delivered", value: "delivered" },
          { label: "Cancelled", value: "cancelled" },
        ].map((tab) => (
          <button
            key={tab.value}
            onClick={() => {
              setStatusFilter(tab.value);
              setPage(1);
            }}
            className={`px-3 py-1.5 rounded-lg whitespace-nowrap transition ${
              statusFilter === tab.value
                ? "bg-[#0D9488] text-white shadow-sm"
                : "text-slate-600 hover:bg-slate-100"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <div key={n} className="bg-white rounded-xl border border-slate-200 p-6 animate-pulse space-y-3">
              <div className="h-4 bg-slate-100 rounded w-1/4"></div>
              <div className="h-3 bg-slate-100 rounded w-1/2"></div>
              <div className="h-8 bg-slate-100 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="bg-white rounded-xl border border-slate-200 p-12 text-center space-y-4">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <div className="space-y-1">
            <h3 className="font-bold text-slate-800 text-sm">No Orders Found</h3>
            <p className="text-xs text-slate-500">
              {statusFilter !== "ALL"
                ? "No orders match the selected status filter."
                : "You have not placed any medication orders yet."}
            </p>
          </div>
          <Link href="/products">
            <Button variant="primary" size="sm">
              <ShoppingBag className="w-4 h-4 shrink-0" />
              <span>Browse Products</span>
            </Button>
          </Link>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => {
            const placedDate = order.placed_at || order.created_at;
            const dateStr = placedDate
              ? new Date(placedDate).toLocaleDateString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })
              : "Recent";

            return (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4 hover:border-slate-300 transition"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2.5">
                      <span className="font-mono font-bold text-sm text-[#172B24]">{order.order_number}</span>
                      <StatusBadge status={order.status.replace(/_/g, " ").toUpperCase()} />
                      <span className="text-[10px] uppercase font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded">
                        Payment: {order.payment_status}
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-400">Placed on {dateStr}</p>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="text-xs font-bold text-[#172B24]">
                      Total: {formatPriceINR(order.grand_total)}
                    </span>
                    <Link href={`/account/orders/${order.id}`}>
                      <Button variant="outline" size="sm" className="h-8 text-xs">
                        <Eye className="w-3.5 h-3.5 shrink-0" />
                        <span>View Details</span>
                      </Button>
                    </Link>
                  </div>
                </div>

                {/* Items Summary */}
                <div className="divide-y divide-slate-100">
                  {order.items.slice(0, 3).map((item) => (
                    <div key={item.id} className="py-2 flex items-center justify-between text-xs">
                      <div className="space-y-0.5">
                        <span className="font-semibold text-slate-800">{item.product_name_snapshot}</span>
                        <p className="text-[11px] text-slate-400">
                          Brand: {item.manufacturer_snapshot} • Qty: {item.quantity}
                          {item.batch_number_snapshot && (
                            <span className="ml-2 font-mono text-slate-500 font-medium">
                              (Batch: {item.batch_number_snapshot})
                            </span>
                          )}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-700">{formatPriceINR(item.total_amount)}</span>
                    </div>
                  ))}
                  {order.items.length > 3 && (
                    <p className="text-[11px] text-slate-400 pt-2 italic">
                      + {order.items.length - 3} more items in this order
                    </p>
                  )}
                </div>

                <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
                  <span>
                    Deliver To:{" "}
                    <strong className="text-slate-800">
                      {order.delivery_address_snapshot?.recipient_name || "Customer"},{" "}
                      {order.delivery_address_snapshot?.city} ({order.delivery_address_snapshot?.pincode})
                    </strong>
                  </span>
                  {order.status === "pharmacist_review" && (
                    <span className="text-[11px] text-amber-700 font-semibold bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                      Awaiting Pharmacist Clinical Verification (Rule 65)
                    </span>
                  )}
                </div>
              </div>
            );
          })}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center items-center gap-2 pt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                Previous
              </Button>
              <span className="text-xs text-slate-500">
                Page {page} of {totalPages}
              </span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
