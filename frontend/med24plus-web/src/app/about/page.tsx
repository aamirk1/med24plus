import React from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { siteConfig } from "@/config/site";
import { ShieldCheck, UserCheck, ThermometerSnowflake, Award, CheckCircle2 } from "lucide-react";

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <Breadcrumb items={[{ label: "About Us" }]} />

      <div className="space-y-2 pb-4 border-b border-slate-200">
        <span className="text-xs font-bold text-[#0D9488] bg-[#F0FDFA] px-2.5 py-1 rounded-full uppercase tracking-wider">
          Single Licensed Retail Pharmacy
        </span>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#172B24]">About Med24Plus Pharmacy</h1>
        <p className="text-xs sm:text-sm text-slate-500">
          Providing authentic pharmaceutical dispensing, cold chain logistics, and registered pharmacist care across India.
        </p>
      </div>

      <div className="prose prose-sm max-w-none text-slate-600 space-y-4 text-xs leading-relaxed">
        <p>
          <strong>Med24Plus</strong> was founded with a singular healthcare mission: to bring 100% genuine medicines and doctor-supervised dispensing to Indian families quickly and transparently. Unlike unregulated aggregator marketplaces, Med24Plus operates as a dedicated licensed retail pharmacy establishment holding valid drug licenses under Forms 20 and 21 of the <em>Drugs and Cosmetics Rules, 1945</em>.
        </p>

        <h3 className="text-base font-bold text-[#172B24] pt-2">Our Operating Standards</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 not-prose">
          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#172B24]">
              <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
              <span>Zero Counterfeits Guarantee</span>
            </div>
            <p className="text-[11px] text-slate-500">
              Procurement is handled exclusively through authorized pharmaceutical distributors and directly with manufacturers.
            </p>
          </div>

          <div className="p-4 rounded-xl border border-slate-200 bg-white space-y-1.5">
            <div className="flex items-center gap-2 text-sm font-bold text-[#172B24]">
              <UserCheck className="w-4 h-4 text-[#2563EB]" />
              <span>Pharmacy Council Oversight</span>
            </div>
            <p className="text-[11px] text-slate-500">
              A Registered Pharmacist personally verifies every Schedule H prescription before packing or dispatch.
            </p>
          </div>
        </div>

        <h3 className="text-base font-bold text-[#172B24] pt-2">Retail Drug License Credentials</h3>
        <ul className="list-disc list-inside space-y-1">
          <li><strong>Operating License:</strong> {siteConfig.licenseNumber}</li>
          <li><strong>Supervising Pharmacist:</strong> Ramesh Sharma (PCI: {siteConfig.pharmacistCouncilReg})</li>
          <li><strong>Dispensing Location:</strong> {siteConfig.address.line1}, {siteConfig.address.city}, {siteConfig.address.state} - {siteConfig.address.pincode}</li>
        </ul>
      </div>
    </div>
  );
}

