"use client";

import React, { useState } from "react";
import { Download, FileSpreadsheet, BarChart3, Calendar } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DateRangePicker } from "@/components/ui/DateRangePicker";

export default function AdminReportsPage() {
  const [startDate, setStartDate] = useState("2026-11-01");
  const [endDate, setEndDate] = useState("2026-11-30");

  const reports = [
    {
      title: "GSTR-1 Monthly Sales Return Summary",
      description: "B2C outward taxable medicine supplies itemized with 5%, 12% and 18% GST splits.",
      format: "Excel (.xlsx) / CSV",
      schedule: "Monthly",
    },
    {
      title: "Form 20 / Schedule H & H1 Dispensing Register",
      description: "Statutory drug inspector audit report with doctor registration numbers and batch allocations.",
      format: "PDF (Signed) / CSV",
      schedule: "On-Demand Statutory",
    },
    {
      title: "Inventory Turn & FEFO Expiry Analysis",
      description: "Batch age report with slow-moving inventory warnings and near-expiry valuation.",
      format: "Excel (.xlsx)",
      schedule: "Weekly",
    },
    {
      title: "Payment Gateway Reconciliation & Settlement",
      description: "Razorpay / UPI settlement reconciliation vs net orders delivered.",
      format: "CSV",
      schedule: "Daily",
    },
  ];

  return (
    <div className="space-y-6 max-w-5xl">
      <PageHeader
        title="GST, Financial & Statutory Reports"
        subtitle="Download regulatory audit trails, GST returns, and pharmacy financial statements."
        actions={
          <DateRangePicker
            startDate={startDate}
            endDate={endDate}
            onStartDateChange={setStartDate}
            onEndDateChange={setEndDate}
          />
        }
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {reports.map((r, i) => (
          <div
            key={i}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-3 flex flex-col justify-between"
          >
            <div>
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-bold text-slate-900 text-sm">{r.title}</h3>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded shrink-0">
                  {r.schedule}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-2 leading-relaxed">{r.description}</p>
              <p className="text-[10px] text-slate-400 mt-2 font-mono">Format: {r.format}</p>
            </div>

            <div className="pt-3 border-t border-slate-100 flex justify-end">
              <button
                type="button"
                onClick={() => alert(`Mock: Downloading ${r.title} for ${startDate} to ${endDate}`)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#087F5B] bg-emerald-50 hover:bg-emerald-100 rounded-lg transition"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download Report</span>
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
