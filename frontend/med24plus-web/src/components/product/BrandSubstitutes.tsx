"use client";

import React, { useState } from "react";
import {
  RefreshCw,
  Info,
  CheckCircle2,
  ShieldCheck,
  Percent,
  Check,
  PackageCheck,
  HelpCircle,
} from "lucide-react";
import { ProductSubstituteOption, ProductSubstitutesData } from "@/types";

interface BrandSubstitutesProps {
  data: ProductSubstitutesData;
  onSelectOption?: (option: ProductSubstituteOption) => void;
  className?: string;
}

export function BrandSubstitutes({
  data,
  onSelectOption,
  className = "",
}: BrandSubstitutesProps) {
  const [selectedId, setSelectedId] = useState<string>(
    data.originalProduct.id || "orig"
  );
  const [showInfoModal, setShowInfoModal] = useState(false);

  const allOptions: ProductSubstituteOption[] = [
    { ...data.originalProduct, isOriginal: true },
    ...(data.substitutes || []),
  ];

  const handleSelect = (option: ProductSubstituteOption) => {
    setSelectedId(option.id);
    if (onSelectOption) {
      onSelectOption(option);
    }
  };

  return (
    <div
      className={`rounded-2xl bg-white border border-slate-200 p-5 sm:p-6 shadow-sm space-y-4 ${className}`}
    >
      {/* Header Row */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="w-9 h-9 rounded-xl bg-teal-50 border border-teal-100 flex items-center justify-center text-[#0D9488] shrink-0 mt-0.5">
            <RefreshCw className="w-5 h-5 animate-[spin_6s_linear_infinite]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 tracking-tight">
                Compare Brand Substitutes
              </h3>
            </div>
            <p className="text-xs sm:text-sm text-slate-500 font-medium">
              Same composition • Same strength • Verified by Pharmacist
            </p>
          </div>
        </div>

        <button
          onClick={() => setShowInfoModal(true)}
          className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
          title="Clinical Substitution Information"
        >
          <Info className="w-5 h-5" />
        </button>
      </div>

      {/* Options List */}
      <div className="space-y-3 pt-1">
        {allOptions.map((opt) => {
          const isSelected = opt.id === selectedId;
          const topTag = opt.isOriginal
            ? "Your Prescription"
            : opt.badge === "Popular Choice"
            ? "Popular Choice"
            : opt.badge === "Best Value"
            ? "Best Value"
            : undefined;

          return (
            <div
              key={opt.id}
              onClick={() => handleSelect(opt)}
              className={`relative rounded-xl border transition-all cursor-pointer overflow-hidden p-4 sm:p-5 ${
                isSelected
                  ? "bg-[#F0FDF9] border-[#0D9488] ring-1 ring-[#0D9488]/30 shadow-sm"
                  : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
              }`}
            >
              {/* Top Tag & Checkmark Row */}
              <div className="flex items-center justify-between gap-2 mb-2">
                {topTag ? (
                  <span
                    className={`inline-flex items-center text-[10px] sm:text-xs font-bold px-2 py-0.5 rounded-md ${
                      isSelected
                        ? "bg-[#0D9488] text-white"
                        : "bg-teal-50 text-[#0F766E] border border-teal-100"
                    }`}
                  >
                    {topTag}
                  </span>
                ) : (
                  <div />
                )}

                {isSelected && (
                  <div className="w-5 h-5 rounded-full bg-[#0D9488] flex items-center justify-center text-white shadow-xs">
                    <Check className="w-3.5 h-3.5 stroke-[3]" />
                  </div>
                )}
              </div>

              {/* Main Content: Thumbnail, Details & Price/CTA */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center gap-3.5">
                  <div className="w-12 h-12 rounded-lg bg-slate-100 border border-slate-200/80 flex items-center justify-center text-[#0D9488] shrink-0">
                    <PackageCheck className="w-6 h-6" />
                  </div>
                  <div>
                    <h4 className="text-sm sm:text-base font-bold text-slate-900">
                      {opt.name}
                    </h4>
                    <p className="text-xs text-slate-500 font-medium">
                      {opt.genericName || `${data.activeSalt} ${data.strength}`}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-base sm:text-lg font-extrabold text-slate-900">
                        ₹{opt.sellingPrice.toFixed(2)}
                      </span>
                      {opt.mrp > opt.sellingPrice && (
                        <span className="text-xs text-slate-400 line-through">
                          ₹{opt.mrp.toFixed(2)}
                        </span>
                      )}
                      {opt.savingsAmount > 0 && (
                        <span className="inline-flex items-center text-[10px] sm:text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          Save ₹{Math.round(opt.savingsAmount)} ({opt.savingsPercent}%)
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {/* Right Action / Badge */}
                <div className="sm:self-center shrink-0">
                  {isSelected ? (
                    <span className="inline-block text-xs font-bold text-emerald-700 bg-emerald-100/70 px-3 py-1.5 rounded-lg">
                      {opt.badge || (opt.isOriginal ? "Original Brand" : "Selected")}
                    </span>
                  ) : (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelect(opt);
                      }}
                      className="w-full sm:w-auto text-xs font-bold text-[#0052CC] border border-[#0052CC] hover:bg-blue-50 px-4 py-1.5 rounded-lg transition-colors text-center"
                    >
                      Select
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Chemical Equivalence Regulatory Banner */}
      <div className="flex items-center justify-between gap-3 p-3 rounded-xl bg-sky-50 border border-sky-100 text-slate-800 text-xs sm:text-sm">
        <div className="flex items-center gap-2">
          <Info className="w-4 h-4 text-[#0052CC] shrink-0" />
          <span>
            All these brands contain the same active salt (
            <strong className="text-slate-900">{data.activeSalt}</strong>) with{" "}
            {data.strength} strength.
          </span>
        </div>
        <button
          onClick={() => setShowInfoModal(true)}
          className="text-xs font-bold text-[#0052CC] hover:underline shrink-0"
        >
          Know More &gt;
        </button>
      </div>

      {/* Trust Badges Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <ShieldCheck className="w-5 h-5 text-[#0D9488] shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900">
              Trusted &amp; Verified
            </div>
            <div className="text-[11px] text-slate-500">
              By our licensed pharmacists
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2.5 p-3 rounded-xl bg-slate-50 border border-slate-200/60">
          <Percent className="w-5 h-5 text-[#0D9488] shrink-0" />
          <div>
            <div className="text-xs font-bold text-slate-900">
              Save Upto 26%+
            </div>
            <div className="text-[11px] text-slate-500">
              with Med24Plus Substitutes
            </div>
          </div>
        </div>
      </div>

      {/* Regulatory Info Modal */}
      {showInfoModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="flex items-center gap-2 text-slate-900">
              <HelpCircle className="w-5 h-5 text-[#0D9488]" />
              <h4 className="text-base font-bold">
                About Clinical Brand Substitution
              </h4>
            </div>
            <div className="text-xs sm:text-sm text-slate-600 space-y-2.5 leading-relaxed">
              <p>
                Under the Indian Drugs and Cosmetics Act &amp; Rules (Rule 65),
                medicines having identical Active Pharmaceutical Ingredients
                (API), molecular salt equivalence, and clinical dosage strengths
                are bioequivalent therapeutic substitutes.
              </p>
              <p>
                Med24Plus offers verified generic alternatives manufactured by
                top licensed pharmaceutical firms (e.g., Sun Pharma, Cipla,
                Alkem, Abbott) at significant savings without compromising
                therapeutic efficacy.
              </p>
            </div>
            <div className="pt-2 text-right">
              <button
                onClick={() => setShowInfoModal(false)}
                className="px-4 py-2 bg-[#0052CC] text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
