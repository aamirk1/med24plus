"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatPriceINR } from "@/lib/utils";
import { MOCK_ORDERS } from "@/mock/data";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  FileText,
  Printer,
  ShieldCheck,
  MapPin,
  ArrowLeft,
} from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const order = MOCK_ORDERS.find((o) => o.id === orderId) || MOCK_ORDERS[0];

  const steps = [
    { title: "Order Placed", done: true, desc: "Received at pharmacy system" },
    { title: "Rx & Clinical Review", done: true, desc: "Verified by Registered Pharmacist" },
    { title: "Packed & Batch Assigned", done: order.statusCode === "DELIVERED", desc: "Batch numbers stamped on invoice" },
    { title: "Out for Delivery", done: order.statusCode === "DELIVERED", desc: "Insulated parcel with delivery partner" },
    { title: "Delivered", done: order.statusCode === "DELIVERED", desc: "Handed over with OTP proof" },
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Account", href: "/account/profile" },
          { label: "Orders", href: "/account/orders" },
          { label: order.orderNumber },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#172B24] font-mono">{order.orderNumber}</h1>
            <StatusBadge status={order.status} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Placed on {order.orderDate}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => window.print()}>
            <Printer className="w-3.5 h-3.5 mr-1" />
            <span>Print Invoice</span>
          </Button>
          <Link href="/account/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 mr-1" />
              <span>Back</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Tracking Timeline */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle space-y-4">
        <h3 className="font-bold text-sm text-[#172B24]">Dispensing & Delivery Timeline</h3>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 pt-2">
          {steps.map((st, idx) => (
            <div key={idx} className="relative flex flex-col items-start space-y-1">
              <div className="flex items-center gap-2">
                <div
                  className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold ${
                    st.done ? "bg-[#087F5B] text-white" : "bg-slate-200 text-slate-500"
                  }`}
                >
                  {st.done ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                </div>
                <span className={`text-xs font-bold ${st.done ? "text-[#172B24]" : "text-slate-400"}`}>
                  {st.title}
                </span>
              </div>
              <p className="text-[11px] text-slate-400 pl-8 leading-tight">{st.desc}</p>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Items List (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4">
          <h3 className="font-bold text-sm text-[#172B24] pb-2 border-b border-slate-100">
            Dispensed Medicine Line Items
          </h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-start text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-900 text-sm">{item.productName}</span>
                  <div className="text-[11px] text-slate-500 space-x-3">
                    <span>Brand: {item.brand}</span>
                    <span>Pack: {item.packSize}</span>
                    <span>Qty: {item.quantity}</span>
                  </div>
                  {item.batchNumber && (
                    <div className="text-[10px] text-slate-600 bg-slate-50 border border-slate-200 px-2 py-0.5 rounded inline-block font-mono">
                      Batch: {item.batchNumber} • Expiry: {item.expiryDate}
                    </div>
                  )}
                </div>
                <div className="text-right">
                  <span className="font-bold text-slate-900 text-sm block">
                    {formatPriceINR(item.totalPrice)}
                  </span>
                  <span className="text-[11px] text-slate-400">
                    ({formatPriceINR(item.unitPrice)} each)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Invoice & Address Summary (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          {/* Delivery Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-2 text-xs">
            <h4 className="font-bold text-slate-800 flex items-center gap-1.5 pb-2 border-b border-slate-100">
              <MapPin className="w-3.5 h-3.5 text-[#087F5B]" /> Delivery Destination
            </h4>
            <p className="font-semibold text-slate-900">{order.deliveryAddress.fullName}</p>
            <p className="text-slate-500">{order.deliveryAddress.addressLine1}</p>
            <p className="text-slate-500">{order.deliveryAddress.city}, {order.deliveryAddress.state} - {order.deliveryAddress.pincode}</p>
            <p className="text-slate-600 pt-1 font-medium">Contact: {order.deliveryAddress.phone}</p>
          </div>

          {/* Payment & Tax Summary */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-2.5 text-xs">
            <h4 className="font-bold text-slate-800 pb-2 border-b border-slate-100">
              Tax Invoice Breakdown
            </h4>
            <div className="flex justify-between text-slate-600">
              <span>Subtotal:</span>
              <span>{formatPriceINR(order.subtotal)}</span>
            </div>
            <div className="flex justify-between text-[#087F5B]">
              <span>Discount:</span>
              <span>- {formatPriceINR(order.discount)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>Delivery Fee:</span>
              <span>{order.deliveryFee === 0 ? "FREE" : formatPriceINR(order.deliveryFee)}</span>
            </div>
            <div className="flex justify-between text-slate-600">
              <span>GST (CGST 2.5% + SGST 2.5%):</span>
              <span>{formatPriceINR(order.taxGST)}</span>
            </div>
            <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-[#172B24]">
              <span>Total Paid:</span>
              <span>{formatPriceINR(order.totalAmount)}</span>
            </div>
            <p className="text-[10px] text-slate-400 pt-1">Payment Method: {order.paymentMethod}</p>
          </div>
        </div>
      </div>
    </div>
  );
}

