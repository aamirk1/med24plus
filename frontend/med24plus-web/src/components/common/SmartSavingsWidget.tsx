"use client";

import React from "react";
import Link from "next/link";
import {
  RefreshCw,
  CheckCircle2,
  ChevronRight,
  ArrowRight,
  TrendingDown,
  ShieldCheck,
  PackageCheck,
} from "lucide-react";

export function SmartSavingsWidget() {
  return (
    <div className="rounded-2xl bg-white border border-teal-200/80 p-5 sm:p-7 shadow-sm relative overflow-hidden">
      {/* Decorative background glow */}
      <div className="absolute -right-12 -top-12 w-48 h-48 bg-teal-50 rounded-full blur-2xl pointer-events-none" />

      {/* Top Banner Row */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div>
          <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2.5 py-1 rounded-full mb-2">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
            Smart Savings Guarantee
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
            Compare Brand Substitutes
            <span className="text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-50 text-[#0052CC] border border-blue-200">
              Verified by Pharmacist
            </span>
          </h2>
          <p className="text-sm text-slate-500 mt-1">
            Same therapeutic active salt. Same dosage strength. Save up to 26%+ on your monthly medications!
          </p>
        </div>

        <Link
          href="/products/azithral-500-tablet"
          className="inline-flex items-center gap-2 text-xs sm:text-sm font-bold text-[#0052CC] hover:text-blue-700 hover:underline"
        >
          View all substitute comparisons <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Azithromycin Substitute Highlight */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 flex flex-col justify-between hover:border-teal-300 hover:bg-teal-50/20 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md">
                Antibacterial • Macrolide
              </span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-md">
                Save ₹37 (24%)
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0D9488] shrink-0 shadow-2xs">
                <PackageCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Azithral 500 Tablet
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Azithromycin 500 mg • Alembic / Cipla
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-lg font-black text-slate-900">₹115.00</span>
                  <span className="text-xs text-slate-400 line-through">₹152.00</span>
                  <span className="text-[11px] font-semibold text-teal-700">
                    Substitutes from ₹85.00
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/products/azithral-500-tablet"
            className="mt-4 inline-flex items-center justify-between w-full text-xs font-bold text-[#0D9488] bg-teal-50 hover:bg-teal-100/80 px-3.5 py-2.5 rounded-lg border border-teal-200/60 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> View Brand Substitutes
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Paracetamol 650mg Substitute Highlight */}
        <div className="rounded-xl border border-slate-200/90 bg-slate-50/60 p-4 sm:p-5 flex flex-col justify-between hover:border-teal-300 hover:bg-teal-50/20 transition-all">
          <div>
            <div className="flex items-center justify-between gap-2 mb-3">
              <span className="text-xs font-bold text-slate-600 bg-white border border-slate-200 px-2.5 py-0.5 rounded-md">
                Fever &amp; Analgesic
              </span>
              <span className="inline-flex items-center text-xs font-bold text-emerald-700 bg-emerald-100/70 px-2.5 py-0.5 rounded-md">
                Save ₹37 (45%)
              </span>
            </div>

            <div className="flex items-center gap-3.5">
              <div className="w-14 h-14 rounded-xl bg-white border border-slate-200 flex items-center justify-center text-[#0D9488] shrink-0 shadow-2xs">
                <PackageCheck className="w-7 h-7" />
              </div>
              <div>
                <h3 className="text-sm sm:text-base font-bold text-slate-900">
                  Crocin Advance Tablets (15s)
                </h3>
                <p className="text-xs text-slate-500 font-medium">
                  Paracetamol 650mg • GSK / Micro Labs
                </p>
                <div className="flex items-center gap-2 mt-1.5">
                  <span className="text-lg font-black text-slate-900">₹82.00</span>
                  <span className="text-xs text-slate-400 line-through">₹110.00</span>
                  <span className="text-[11px] font-semibold text-teal-700">
                    Dolo 650 at ₹45.00
                  </span>
                </div>
              </div>
            </div>
          </div>

          <Link
            href="/products/crocin-advance-tablets-15s"
            className="mt-4 inline-flex items-center justify-between w-full text-xs font-bold text-[#0D9488] bg-teal-50 hover:bg-teal-100/80 px-3.5 py-2.5 rounded-lg border border-teal-200/60 transition-colors"
          >
            <span className="flex items-center gap-1.5">
              <RefreshCw className="w-3.5 h-3.5" /> View Brand Substitutes
            </span>
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </div>
  );
}
