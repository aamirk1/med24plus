"use client";

import React, { useEffect, useState } from "react";
import { formatPriceINR } from "@/lib/utils";
import {
  TrendingUp,
  FileCheck2,
  Package,
  AlertTriangle,
  Clock,
  CheckCircle,
  Loader2,
} from "lucide-react";
import { adminOrderService } from "@/services/adminOrderService";
import { adminPrescriptionService } from "@/services/admin-prescription.service";
import { adminInventoryService } from "@/services/admin-inventory.service";

export const StatCards: React.FC = () => {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    processingOrders: 0,
    pendingRx: 0,
    lowStockCount: 0,
    totalValuation: 0,
  });

  useEffect(() => {
    async function loadStats() {
      try {
        const [metricsRes, rxCountsRes, invSummaryRes] = await Promise.allSettled([
          adminOrderService.getMetrics(),
          adminPrescriptionService.getSummaryCounts(),
          adminInventoryService.getSummary(),
        ]);

        const metrics = metricsRes.status === "fulfilled" ? metricsRes.value : null;
        const rxCounts = rxCountsRes.status === "fulfilled" ? rxCountsRes.value?.data : null;
        const invSummary = invSummaryRes.status === "fulfilled" ? invSummaryRes.value : null;

        setStats({
          totalOrders: metrics?.total_orders || 0,
          processingOrders: (metrics?.processing || 0) + (metrics?.ready_for_dispatch || 0),
          pendingRx: rxCounts?.pending_review || rxCounts?.submitted || 0,
          lowStockCount: invSummary?.low_stock_items_count || 0,
          totalValuation: Number(invSummary?.total_valuation || 0),
        });
      } catch (err) {
        console.warn("Could not load dashboard metrics:", err);
      } finally {
        setLoading(false);
      }
    }
    loadStats();
  }, []);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
      {/* Total Orders & Sales Card */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Total System Orders</span>
          <div className="p-2 rounded-lg bg-teal-50 text-teal-600">
            <TrendingUp className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-teal-600 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-slate-900">{stats.totalOrders}</p>
          )}
          <p className="text-[11px] text-teal-600 font-medium mt-1 flex items-center gap-1">
            <span>Live Database Count</span>
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
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-[#0066CC] my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-[#0066CC]">{stats.pendingRx}</p>
          )}
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <Clock className="w-3.5 h-3.5 text-amber-500" />
            <span>Rule 65 Pharmacist Queue</span>
          </p>
        </div>
      </div>

      {/* Active Orders in Dispensing */}
      <div className="bg-white rounded-xl p-5 border border-slate-200/80 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-slate-500">Orders in Fulfillment</span>
          <div className="p-2 rounded-lg bg-indigo-50 text-indigo-600">
            <Package className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-slate-900">{stats.processingOrders}</p>
          )}
          <p className="text-[11px] text-slate-500 mt-1 flex items-center gap-1">
            <CheckCircle className="w-3.5 h-3.5 text-teal-500" />
            <span>Processing &amp; Ready for Dispatch</span>
          </p>
        </div>
      </div>

      {/* Batch Expiry / Stock Alert */}
      <div className="bg-white rounded-xl p-5 border border-amber-200/80 bg-amber-50/20 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-medium text-amber-900">Inventory Stock Alerts</span>
          <div className="p-2 rounded-lg bg-amber-100 text-amber-700">
            <AlertTriangle className="w-4 h-4" />
          </div>
        </div>
        <div className="mt-3">
          {loading ? (
            <Loader2 className="w-6 h-6 animate-spin text-amber-700 my-1" />
          ) : (
            <p className="text-2xl font-extrabold text-amber-900">
              {stats.lowStockCount} {stats.lowStockCount === 1 ? "SKU" : "SKUs"}
            </p>
          )}
          <p className="text-[11px] text-amber-700 font-medium mt-1">
            Low stock &amp; reorder threshold warnings
          </p>
        </div>
      </div>
    </div>
  );
};

