"use client";

import React from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatPriceINR } from "@/lib/utils";
import { MOCK_ORDERS } from "@/mock/data";
import { ShoppingBag, ChevronRight, Eye, RefreshCw, FileText } from "lucide-react";

export default function OrderHistoryPage() {
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
            Track real-time pharmacist verification, packing and delivery status
          </p>
        </div>
        <Link href="/products">
          <Button variant="outline" size="sm">
            <ShoppingBag className="w-3.5 h-3.5 mr-1.5" />
            <span>Order Medicines</span>
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {MOCK_ORDERS.map((order) => (
          <div
            key={order.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-3 border-b border-slate-100 gap-2">
              <div className="space-y-0.5">
                <div className="flex items-center gap-2.5">
                  <span className="font-mono font-bold text-sm text-[#172B24]">{order.orderNumber}</span>
                  <StatusBadge status={order.status} />
                </div>
                <p className="text-[11px] text-slate-400">Placed on {order.orderDate}</p>
              </div>

              <div className="flex items-center gap-3">
                <span className="text-xs font-bold text-[#172B24]">
                  Total: {formatPriceINR(order.totalAmount)}
                </span>
                <Link href={`/account/orders/${order.id}`}>
                  <Button variant="outline" size="sm" className="h-8 text-xs">
                    <Eye className="w-3.5 h-3.5 mr-1" />
                    <span>View Details</span>
                  </Button>
                </Link>
              </div>
            </div>

            {/* Items Summary */}
            <div className="divide-y divide-slate-100">
              {order.items.map((item) => (
                <div key={item.id} className="py-2.5 flex items-center justify-between text-xs">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-slate-800">{item.productName}</span>
                    <p className="text-[11px] text-slate-400">
                      Brand: {item.brand} • Qty: {item.quantity} • {item.packSize}
                      {item.batchNumber && (
                        <span className="ml-2 font-mono text-slate-500 font-medium">
                          (Batch: {item.batchNumber})
                        </span>
                      )}
                    </p>
                  </div>
                  <span className="font-semibold text-slate-700">{formatPriceINR(item.totalPrice)}</span>
                </div>
              ))}
            </div>

            <div className="pt-2 border-t border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-500 gap-2">
              <span>
                Estimated Delivery: <strong className="text-slate-800">{order.estimatedDelivery}</strong>
              </span>
              <span className="text-[11px] text-slate-400">
                Payment: {order.paymentMethod} • Deliver to: {order.deliveryAddress.city} ({order.deliveryAddress.pincode})
              </span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

