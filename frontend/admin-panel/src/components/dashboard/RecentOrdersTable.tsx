import React from "react";
import { formatPriceINR } from "@/lib/utils";
import { PrescriptionOrderSummary } from "@/types";
import { Eye, ShieldAlert, CheckCircle2, Clock } from "lucide-react";

const mockOrders: PrescriptionOrderSummary[] = [
  {
    orderId: "MED-2026-0849",
    customerName: "Aarav Sharma",
    phone: "+91 98451 •••••",
    rxStatus: "PENDING_VERIFICATION",
    itemCount: 3,
    hasScheduleDrugs: true,
    totalAmountINR: 1420,
    timestamp: "10 mins ago",
  },
  {
    orderId: "MED-2026-0848",
    customerName: "Priyanka Patel",
    phone: "+91 97230 •••••",
    rxStatus: "VERIFIED",
    itemCount: 2,
    hasScheduleDrugs: true,
    totalAmountINR: 890,
    timestamp: "24 mins ago",
  },
  {
    orderId: "MED-2026-0847",
    customerName: "Karthik Raja",
    phone: "+91 94432 •••••",
    rxStatus: "DISPENSED",
    itemCount: 4,
    hasScheduleDrugs: false,
    totalAmountINR: 2150,
    timestamp: "1 hr ago",
  },
  {
    orderId: "MED-2026-0846",
    customerName: "Sunita Verma",
    phone: "+91 98114 •••••",
    rxStatus: "VERIFIED",
    itemCount: 1,
    hasScheduleDrugs: true,
    totalAmountINR: 640,
    timestamp: "1.5 hrs ago",
  },
];

export const RecentOrdersTable: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Recent Orders & Prescription Verification</h3>
          <p className="text-xs text-slate-500 mt-0.5">Live queue of customer orders requiring pharmacist review</p>
        </div>
        <span className="text-xs text-[#0066CC] font-semibold hover:underline cursor-pointer">
          View All Orders
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <th className="py-3 px-4">Order ID</th>
              <th className="py-3 px-4">Patient / Customer</th>
              <th className="py-3 px-4">Rx Compliance</th>
              <th className="py-3 px-4">Items</th>
              <th className="py-3 px-4">Amount</th>
              <th className="py-3 px-4">Received</th>
              <th className="py-3 px-4 text-right">Pharmacist Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {mockOrders.map((order) => (
              <tr key={order.orderId} className="hover:bg-slate-50/70 transition">
                <td className="py-3.5 px-4 font-mono font-semibold text-slate-900">
                  {order.orderId}
                </td>
                <td className="py-3.5 px-4">
                  <div className="font-medium text-slate-900">{order.customerName}</div>
                  <div className="text-[11px] text-slate-400">{order.phone}</div>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5">
                    {order.hasScheduleDrugs && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                        <ShieldAlert className="w-3 h-3" /> Sched H/H1
                      </span>
                    )}
                    {order.rxStatus === "PENDING_VERIFICATION" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        <Clock className="w-3 h-3" /> Rx Review
                      </span>
                    )}
                    {order.rxStatus === "VERIFIED" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
                        <CheckCircle2 className="w-3 h-3" /> Approved
                      </span>
                    )}
                    {order.rxStatus === "DISPENSED" && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        Dispensed
                      </span>
                    )}
                  </div>
                </td>
                <td className="py-3.5 px-4">{order.itemCount} items</td>
                <td className="py-3.5 px-4 font-semibold text-slate-900">
                  {formatPriceINR(order.totalAmountINR)}
                </td>
                <td className="py-3.5 px-4 text-slate-500">{order.timestamp}</td>
                <td className="py-3.5 px-4 text-right">
                  <button
                    type="button"
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 hover:border-slate-300 bg-white text-slate-700 font-medium text-xs shadow-xs hover:bg-slate-50 transition"
                  >
                    <Eye className="w-3.5 h-3.5 text-slate-500" />
                    <span>Review Rx</span>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

