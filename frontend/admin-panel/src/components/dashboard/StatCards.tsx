import React from "react";
import { formatPriceINR } from "@/lib/utils";
import {
  TrendingUp,
  FileCheck2,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
} from "lucide-react";

export const StatCards: React.FC = () => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Sales Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Today&apos;s Dispensed Value</span>
          <div className="p-2 rounded-lg bg-emerald-50 text-emerald-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-extrabold text-slate-900">{formatPriceINR(42850)}</p>
          <p className="text-[11px] text-emerald-600 font-medium mt-1 flex items-center gap-1">
            <span>+14.8%</span>
            <span className="text-slate-400">vs yesterday (Mock)</span>
          </p>
        </div>
      </div>

      {/* Pending Rx Verifications */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Pending Rx Queue</span>
          <div className="p-2 rounded-lg bg-blue-50 text-[#0066CC]">
            <FileCheck2 className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-extrabold text-[#0066CC]">7</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Avg verification: 4.2 mins</span>
          </p>
        </div>
      </div>

      {/* Active Orders in Dispensing */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Orders in Packing</span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-extrabold text-slate-900">12</p>
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
            <span>5 ready for delivery dispatch</span>
          </p>
        </div>
      </div>

      {/* Batch Expiry / Stock Alert */}
      <div className="bg-white rounded-xl p-5 border border-amber-200/80 bg-amber-50/20 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-amber-900">Expiry & Stock Alerts</span>
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          <p className="text-2xl font-extrabold text-amber-900">3 Batches</p>
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            2 expiring &lt; 45 days • 1 reorder level
          </p>
        </div>
      </div>
    </div>
  );
};

