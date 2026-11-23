"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { AlertCircle, Calendar, Layers, ShieldCheck, Loader2, Package } from "lucide-react";
import { adminInventoryService } from "@/services/admin-inventory.service";

interface LiveBatchItem {
  id: string;
  product_name: string;
  batch_number: string;
  manufacturer_name?: string;
  expiry_date: string;
  current_stock: number;
  batch_status: string;
  is_expired?: boolean;
}

export const InventoryBatchSummary: React.FC = () => {
  const [batches, setBatches] = useState<LiveBatchItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadBatches() {
      try {
        const res = await adminInventoryService.getBatches({ page_size: 5 });
        if (res?.items) {
          setBatches(res.items);
        }
      } catch (err) {
        console.warn("Could not load inventory batches:", err);
      } finally {
        setLoading(false);
      }
    }
    loadBatches();
  }, []);

  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden text-left">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Critical Inventory Batches &amp; FEFO Status</h3>
          <p className="text-xs text-slate-500 mt-0.5">Live warehouse batches tracked for expiry compliance</p>
        </div>
        <Link href="/inventory/batches" className="text-xs text-[#0066CC] font-semibold hover:underline">
          Manage All Batches
        </Link>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <th className="py-3 px-4">Medication &amp; Strength</th>
              <th className="py-3 px-4">Batch Number</th>
              <th className="py-3 px-4">Expiry Date</th>
              <th className="py-3 px-4">Stock Units</th>
              <th className="py-3 px-4 text-right">FEFO Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {loading ? (
              <tr>
                <td colSpan={5} className="py-10 text-center text-slate-400">
                  <div className="flex items-center justify-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin text-[#0D9488]" />
                    <span>Loading warehouse inventory batches from database...</span>
                  </div>
                </td>
              </tr>
            ) : batches.length === 0 ? (
              <tr>
                <td colSpan={5} className="py-8 text-center text-slate-400">
                  <Package className="w-6 h-6 mx-auto mb-1 text-slate-300" />
                  <p>No inventory batches received in warehouse yet.</p>
                </td>
              </tr>
            ) : (
              batches.map((batch) => {
                const expiry = new Date(batch.expiry_date);
                const isNearExpiry = !batch.is_expired && expiry.getTime() - Date.now() < 60 * 86400000;
                return (
                  <tr key={batch.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-medium text-slate-900">{batch.product_name}</div>
                      <div className="text-[11px] text-slate-400">{batch.manufacturer_name || "Licensed Manufacturer"}</div>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium text-slate-700">
                      {batch.batch_number}
                    </td>
                    <td className="py-3.5 px-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Calendar className="w-3.5 h-3.5 text-slate-400" />
                        <span>{expiry.toLocaleDateString("en-IN", { month: "short", year: "numeric", day: "numeric" })}</span>
                      </div>
                    </td>
                    <td className="py-3.5 px-4">
                      <span className={`font-semibold ${batch.current_stock < 10 ? "text-amber-600" : "text-slate-800"}`}>
                        {batch.current_stock} units
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      {batch.is_expired ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-red-50 text-red-700 border border-red-200">
                          <AlertCircle className="w-3 h-3" /> Expired
                        </span>
                      ) : isNearExpiry ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                          <AlertCircle className="w-3 h-3" /> Near Expiry
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-semibold px-2 py-0.5 rounded bg-teal-50 text-teal-700 border border-teal-200">
                          <ShieldCheck className="w-3 h-3" /> FEFO Verified
                        </span>
                      )}
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
