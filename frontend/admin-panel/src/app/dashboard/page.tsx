import React from "react";
import { StatCards } from "@/components/dashboard/StatCards";
import { RecentOrdersTable } from "@/components/dashboard/RecentOrdersTable";
import { InventoryBatchSummary } from "@/components/dashboard/InventoryBatchSummary";

export default function DashboardPage() {
  return (
    <div className="space-y-6 text-left">
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
