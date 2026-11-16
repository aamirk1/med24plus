import React from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export default function TermsPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      <Breadcrumb items={[{ label: "Terms of Dispensing" }]} />

      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-[#172B24]">Terms & Conditions of Dispensing</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Governing online orders and retail dispensing under Indian Pharmacy Regulations
        </p>
      </div>

      <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
        <section className="space-y-1">
          <h2 className="text-sm font-bold text-[#172B24]">1. Role as Licensed Retailer</h2>
          <p>
            Med24Plus is an independent licensed retail pharmacy. We do not manufacture pharmaceuticals. All drugs are procured from certified companies and supplied in sealed manufacturer packaging.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-sm font-bold text-[#172B24]">2. Pharmacist Discretion & Rejection</h2>
          <p>
            The Registered Pharmacist on duty reserves the legal right to decline dispensing any medication if the prescription appears illegible, expired, altered, or counter-indicated for the patient&apos;s safety.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-sm font-bold text-[#172B24]">3. Cancellation & Returns for Medicines</h2>
          <p>
            In accordance with Indian pharmaceutical regulations, dispensed prescription medicines cannot be returned once handed over, unless there is a verifiable dispatch error or transit seal breakage.
          </p>
        </section>
      </div>
    </div>
  );
}

