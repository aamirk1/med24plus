import React from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { AlertTriangle, ShieldAlert, CheckCircle2 } from "lucide-react";

export default function PrescriptionPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Legal", href: "/legal/terms" },
          { label: "Prescription Policy" },
        ]}
      />

      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-[#172B24]">Prescription Verification Policy (Rule 65)</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Mandatory compliance rules under the Drugs and Cosmetics Act, 1940 (India)
        </p>
      </div>

      <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-900 space-y-2">
        <div className="flex items-center gap-2 font-bold">
          <ShieldAlert className="w-4 h-4 text-amber-700" />
          <span>Statutory Statement:</span>
        </div>
        <p>
          Medicines classified under Schedule H, Schedule H1, and Schedule X can ONLY be dispensed against a valid written prescription issued by a Registered Medical Practitioner (RMP).
        </p>
      </div>

      <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
        <section className="space-y-1">
          <h2 className="text-sm font-bold text-[#172B24]">1. Criteria for a Valid Prescription</h2>
          <ul className="list-disc list-inside space-y-1">
            <li>Prescribed on the registered doctor&apos;s or hospital&apos;s letterhead.</li>
            <li>Doctor&apos;s complete name, address, qualification, and Medical Council Registration Number (MCI / State Council).</li>
            <li>Patient name, age, gender, and date of consultation (must be within valid clinical duration).</li>
            <li>Exact generic salt or brand name, dosage form, strength, and duration of course.</li>
            <li>Original physical or certified electronic signature of the physician.</li>
          </ul>
        </section>

        <section className="space-y-1">
          <h2 className="text-sm font-bold text-[#172B24]">2. Strictly Prohibited Narcotics (Schedule X)</h2>
          <p>
            Med24Plus does NOT dispense Schedule X habit-forming narcotics online under any circumstances. Such medications can only be obtained directly at a physical pharmacy countersigned in person.
          </p>
        </section>

        <section className="space-y-1">
          <h2 className="text-sm font-bold text-[#172B24]">3. Pharmacist Verification Call</h2>
          <p>
            Before packing Schedule H drugs, our supervising pharmacist may contact the patient or prescribing clinic to clarify dosage instructions or confirm refill timelines.
          </p>
        </section>
      </div>
    </div>
  );
}

