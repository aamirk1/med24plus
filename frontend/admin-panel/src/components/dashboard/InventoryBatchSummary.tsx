import React from "react";
import { BatchInventoryItem } from "@/types";
import { AlertCircle, Calendar, Layers, ShieldCheck } from "lucide-react";

const mockBatches: BatchInventoryItem[] = [
  {
    id: "batch-1",
    drugName: "Augmentin 625 Duo Tablet",
    composition: "Amoxicillin (500mg) + Clavulanic Acid (125mg)",
    batchNumber: "AUG-24-9182",
    manufacturer: "GSK Pharmaceuticals",
    expiryDate: "2026-12-31",
    daysToExpiry: 45,
    stockUnits: 14,
    schedule: "Schedule H1",
    status: "NEAR_EXPIRY",
  },
  {
    id: "batch-2",
    drugName: "Glycomet-GP 1 Forte Tablet",
    composition: "Metformin (1000mg) + Glimepiride (1mg)",
    batchNumber: "GLY-25-0193",
    manufacturer: "USV Private Limited",
    expiryDate: "2027-08-31",
    daysToExpiry: 288,
    stockUnits: 6,
    schedule: "Schedule G",
    status: "LOW_STOCK",
  },
  {
    id: "batch-3",
    drugName: "Telma 40 Tablet",
    composition: "Telmisartan (40mg)",
    batchNumber: "TEL-25-8831",
    manufacturer: "Glenmark Pharmaceuticals",
    expiryDate: "2027-11-30",
    daysToExpiry: 379,
    stockUnits: 85,
    schedule: "Schedule H",
    status: "GOOD",
  },
  {
    id: "batch-4",
    drugName: "Pan-D Capsule",
    composition: "Pantoprazole (40mg) + Domperidone (30mg)",
    batchNumber: "PAN-25-4421",
    manufacturer: "Alkem Laboratories",
    expiryDate: "2028-02-28",
    daysToExpiry: 469,
    stockUnits: 120,
    schedule: "Schedule H",
    status: "GOOD",
  },
];

export const InventoryBatchSummary: React.FC = () => {
  return (
    <div className="bg-white rounded-xl border border-slate-200/80 shadow-sm overflow-hidden">
      <div className="p-5 border-b border-slate-100 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-slate-800 text-sm">Batch & Expiry Monitoring</h3>
          <p className="text-xs text-slate-500 mt-0.5">
            Audit compliance under Indian Drugs & Cosmetics Rules (Rule 65)
          </p>
        </div>
        <span className="text-xs text-[#0066CC] font-semibold hover:underline cursor-pointer">
          Manage Inventory Batches
        </span>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-100">
              <th className="py-3 px-4">Medicine & Strength</th>
              <th className="py-3 px-4">Batch No.</th>
              <th className="py-3 px-4">Manufacturer</th>
              <th className="py-3 px-4">Drug Schedule</th>
              <th className="py-3 px-4">Available Units</th>
              <th className="py-3 px-4">Expiry Date</th>
              <th className="py-3 px-4 text-right">Audit Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 text-slate-700">
            {mockBatches.map((batch) => (
              <tr key={batch.id} className="hover:bg-slate-50/70 transition">
                <td className="py-3.5 px-4">
                  <div className="font-semibold text-slate-900">{batch.drugName}</div>
                  <div className="text-[11px] text-slate-500 truncate max-w-xs">{batch.composition}</div>
                </td>
                <td className="py-3.5 px-4 font-mono font-medium text-slate-700">{batch.batchNumber}</td>
                <td className="py-3.5 px-4 text-slate-600">{batch.manufacturer}</td>
                <td className="py-3.5 px-4">
                  <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-slate-100 text-slate-700 border border-slate-200">
                    {batch.schedule}
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <span
                    className={`font-semibold ${
                      batch.stockUnits <= 10 ? "text-amber-600 font-bold" : "text-slate-800"
                    }`}
                  >
                    {batch.stockUnits} strips
                  </span>
                </td>
                <td className="py-3.5 px-4">
                  <div className="flex items-center gap-1.5 font-mono text-[11px]">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{batch.expiryDate}</span>
                  </div>
                </td>
                <td className="py-3.5 px-4 text-right">
                  {batch.status === "NEAR_EXPIRY" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-50 text-rose-700 border border-rose-200">
                      <AlertCircle className="w-3 h-3" /> Expiring Soon ({batch.daysToExpiry}d)
                    </span>
                  )}
                  {batch.status === "LOW_STOCK" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
                      Reorder Alert
                    </span>
                  )}
                  {batch.status === "GOOD" && (
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                      <ShieldCheck className="w-3 h-3" /> Good Shelf-Life
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

