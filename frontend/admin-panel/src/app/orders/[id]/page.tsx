"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, Printer, ShieldCheck, CheckCircle2, Truck, Package, AlertTriangle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_ADMIN_ORDERS } from "@/mock/adminData";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const orderId = params?.id as string;
  const order = MOCK_ADMIN_ORDERS.find((o) => o.id === orderId) || MOCK_ADMIN_ORDERS[0];
  const [currentStatus, setCurrentStatus] = useState(order.statusCode);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Orders</span>
        </Link>
      </div>

      <PageHeader
        title={`Order: ${order.orderNumber}`}
        subtitle={`Placed on ${order.orderDate} | Payment: ${order.paymentMethod}`}
        badge={<StatusBadge status={currentStatus} />}
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print Form 20 Cash Memo</span>
            </button>
            <button
              type="button"
              onClick={() => {
                alert("Mock: Order transitioned to next fulfillment stage.");
                if (currentStatus === "PENDING") setCurrentStatus("PACKED");
                else if (currentStatus === "PACKED") setCurrentStatus("DISPATCHED");
                else if (currentStatus === "DISPATCHED") setCurrentStatus("DELIVERED");
              }}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#087F5B] hover:bg-[#066649] rounded-lg shadow-sm transition"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Update Fulfillment State</span>
            </button>
          </div>
        }
      />

      {/* Clinical verification banner if prescription is required */}
      {order.hasPrescription && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950">
            <p className="font-bold">Schedule H Clinical Prescription Attached</p>
            <p className="text-amber-800 text-[11px] mt-0.5">
              Verified by Registered Pharmacist (PCI-REG-94821/2020) according to Rule 65 dispensing protocols.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items & Batch Register */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Dispensed Medicines & Batch Allocation
              </h3>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              <div className="p-4 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Accu-Chek Active Blood Glucose Strips (50s)</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Batch: <span className="font-bold text-blue-700">ACC-26-904</span> | Exp: 2028-04-30
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                    FEFO Matched
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">₹945</p>
                  <p className="text-slate-500 text-[11px]">Qty: 1</p>
                </div>
              </div>

              <div className="p-4 flex items-start justify-between">
                <div>
                  <p className="font-semibold text-slate-900">Calcirol D3 60,000 IU Oral Solution</p>
                  <p className="text-[11px] text-slate-500 font-mono mt-0.5">
                    Batch: <span className="font-bold text-blue-700">CAL-26-118</span> | Exp: 2027-10-31
                  </p>
                  <span className="inline-block mt-1 text-[10px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded font-medium">
                    Schedule H Salt
                  </span>
                </div>
                <div className="text-right">
                  <p className="font-bold text-slate-900">₹105</p>
                  <p className="text-slate-500 text-[11px]">Qty: 2 (₹210)</p>
                </div>
              </div>
            </div>

            <div className="p-4 bg-slate-50/50 border-t border-slate-200 space-y-1.5 text-xs text-right">
              <div className="flex justify-between text-slate-600">
                <span>Items Subtotal:</span>
                <span>₹1,155.00</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Applicable GST (12%):</span>
                <span>Included in MRP</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Delivery Charges:</span>
                <span className="text-emerald-700 font-medium">FREE</span>
              </div>
              <div className="flex justify-between text-sm font-bold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Cash Memo Value:</span>
                <span className="text-[#087F5B]">₹{order.totalAmount.toLocaleString("en-IN")}.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Col: Patient & Delivery Info */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Patient & Delivery Details
            </h3>
            <div className="space-y-2 text-xs">
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Patient Name</p>
                <p className="font-semibold text-slate-900">{order.customerName}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Contact Phone</p>
                <p className="text-slate-800 font-mono">{order.customerPhone}</p>
              </div>
              <div>
                <p className="text-slate-400 text-[10px] uppercase font-semibold">Destination Pincode</p>
                <p className="text-slate-800 font-mono">{order.deliveryPincode} (Bengaluru Urban)</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
              Assigned Delivery Fleet
            </h3>
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div className="text-xs">
                <p className="font-semibold text-slate-900">Med24 Cold-Chain Fleet</p>
                <p className="text-slate-500 text-[11px]">Rider: Santosh Y. (+91 98452 33441)</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

