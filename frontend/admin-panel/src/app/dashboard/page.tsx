import React from "react";
import { StatCards } from "@/components/dashboard/StatCards";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { InventoryBatchSummary } from "@/components/dashboard/InventoryBatchSummary";
import { ShieldCheck, AlertCircle } from "lucide-react";

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      {/* Demo Notice Banner */}
      <div className="bg-blue-50 border border-blue-200 text-blue-900 rounded-xl p-4 flex items-start gap-3">
        <ShieldCheck className="w-5 h-5 text-[#0066CC] shrink-0 mt-0.5" />
        <div className="text-xs leading-relaxed">
          <p className="font-semibold text-blue-950">Phase 1 Initialized: Pharmacy Admin & Pharmacist Console</p>
          <p className="text-blue-800 mt-0.5">
            Static demonstration UI initialized. Real dispensing, drug inventory updates, and live prescription verification will be connected to PostgreSQL & backend APIs in future phases.
          </p>
        </div>
      </div>

      {/* Overview Stat Cards */}
      <StatCards />

      {/* Main Grid: Orders & Batches */}
      <div className="grid grid-cols-1 gap-6">
        <RecentOrdersTable />
        <InventoryBatchSummary />
      </div>
    </div>
  );
}

