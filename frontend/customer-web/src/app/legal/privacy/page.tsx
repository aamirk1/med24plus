import React from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";

export default function PrivacyPolicyPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Legal", href: "/legal/terms" },
          { label: "Privacy Policy" },
        ]}
      />

      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-[#172B24]">Patient Data Privacy Policy</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          In compliance with the Digital Personal Data Protection (DPDP) Act, 2023 & IT Act 2000 (India)
        </p>
      </div>

      <div className="space-y-4 text-xs text-slate-600 leading-relaxed">
        <section className="space-y-1.5">
          <h2 className="text-sm font-bold text-[#172B24]">1. Protection of Health Data & Prescriptions</h2>
          <p>
            Med24Plus treats doctor prescriptions, medication histories, and clinical diagnostic documents as sensitive personal data. All prescription uploads are stored in an encrypted private cloud bucket and accessible exclusively to authorized Registered Pharmacists for the explicit purpose of verifying and dispensing your medications.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-bold text-[#172B24]">2. Information We Collect</h2>
          <ul className="list-disc list-inside space-y-1 pl-2">
            <li>Contact details: Patient name, mobile number, email address, delivery postal pincode.</li>
            <li>Prescription metadata: Prescribing physician&apos;s name, medical council registration, diagnostic indications, and dosage schedule.</li>
            <li>Order records: Specific drug batch numbers, manufacturer details, and tax invoice information.</li>
          </ul>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-bold text-[#172B24]">3. Zero Commercial Data Monetization</h2>
          <p>
            We strictly enforce a policy of never selling, renting, or leasing patient clinical data to third-party advertisers or insurance brokers.
          </p>
        </section>

        <section className="space-y-1.5">
          <h2 className="text-sm font-bold text-[#172B24]">4. Statutory Audit Retention</h2>
          <p>
            Under Rule 65 of the Drugs and Cosmetics Rules, 1945, registers for Schedule H and H1 medications must be maintained for a statutory minimum of 2 years from the date of dispensing.
          </p>
        </section>
      </div>
    </div>
  );
}

