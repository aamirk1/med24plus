import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { siteConfig } from "@/config/site";
import { ShieldCheck, Phone, Mail, MapPin, FileText, CheckCircle2 } from "lucide-react";

export const Footer: React.FC = () => {
  return (
    <footer className="bg-slate-900 text-slate-300 text-sm border-t border-slate-800">
      {/* Top Value Assurance Grid */}
      <div className="border-b border-slate-800 py-8">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-emerald-500/10 text-emerald-400 shrink-0">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold">100% Genuine Medicines</h4>
              <p className="text-xs text-slate-400 mt-1">Directly procured from licensed pharmaceutical manufacturers.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-blue-500/10 text-blue-400 shrink-0">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold">Registered Pharmacist Vetted</h4>
              <p className="text-xs text-slate-400 mt-1">Every prescription reviewed by Pharmacy Council registered professionals.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-amber-500/10 text-amber-400 shrink-0">
              <FileText className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold">GST & Batch Invoicing</h4>
              <p className="text-xs text-slate-400 mt-1">Complete retail invoice with drug batch numbers & expiry dates.</p>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <div className="p-2 rounded-lg bg-purple-500/10 text-purple-400 shrink-0">
              <MapPin className="w-6 h-6" />
            </div>
            <div>
              <h4 className="text-white font-semibold">Temperature Managed Delivery</h4>
              <p className="text-xs text-slate-400 mt-1">Insulated cold packs for biologics, insulins and sensitive vials.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Links */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand & Regulatory Info */}
        <div className="space-y-4 md:col-span-1">
          <BrandLogo theme="dark" size="md" />
          <p className="text-xs text-slate-400 leading-relaxed">
            Med24Plus is a licensed single retail pharmacy enterprise operating under stringent adherence to the Indian Drugs and Cosmetics Act, 1940.
          </p>
          <div className="text-xs text-slate-400 space-y-1">
            <p><span className="text-slate-200 font-medium">Drug License:</span> {siteConfig.licenseNumber}</p>
            <p><span className="text-slate-200 font-medium">Supervising Pharmacist:</span> {siteConfig.pharmacistCouncilReg}</p>
          </div>
        </div>

        {/* Quick Links */}
        <div>
          <h5 className="text-white font-semibold mb-3">Popular Categories</h5>
          <ul className="space-y-2 text-xs">
            <li><Link href="/category/diabetes-care" className="hover:text-emerald-400 transition">Diabetes Management</Link></li>
            <li><Link href="/category/cardiac-care" className="hover:text-emerald-400 transition">Cardiac & Blood Pressure</Link></li>
            <li><Link href="/category/vitamins-supplements" className="hover:text-emerald-400 transition">Vitamins & Minerals</Link></li>
            <li><Link href="/category/respiratory-asthma" className="hover:text-emerald-400 transition">Asthma & Respiratory Care</Link></li>
            <li><Link href="/category/ayurveda-herbal" className="hover:text-emerald-400 transition">Ayush & Herbal Formulations</Link></li>
          </ul>
        </div>

        {/* Legal & Compliance */}
        <div>
          <h5 className="text-white font-semibold mb-3">Compliance & Policy</h5>
          <ul className="space-y-2 text-xs">
            <li><Link href="/legal/prescription-policy" className="hover:text-emerald-400 transition">Prescription Requirement Policy</Link></li>
            <li><Link href="/legal/terms" className="hover:text-emerald-400 transition">Terms & Conditions of Dispensing</Link></li>
            <li><Link href="/legal/privacy" className="hover:text-emerald-400 transition">Patient Health Data Privacy</Link></li>
            <li><Link href="/legal/grievance" className="hover:text-emerald-400 transition">Grievance Redressal (India)</Link></li>
            <li><Link href="/legal/schedule-x" className="hover:text-emerald-400 transition">Restricted Drugs Notice</Link></li>
          </ul>
        </div>

        {/* Contact Pharmacy */}
        <div>
          <h5 className="text-white font-semibold mb-3">Retail Dispensing Unit</h5>
          <div className="space-y-2 text-xs text-slate-400">
            <p className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{siteConfig.address.line1}, {siteConfig.address.city}, {siteConfig.address.state} - {siteConfig.address.pincode}</span>
            </p>
            <p className="flex items-center gap-2">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{siteConfig.phone}</span>
            </p>
            <p className="flex items-center gap-2">
              <Mail className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>{siteConfig.email}</span>
            </p>
          </div>
        </div>
      </div>

      {/* Bottom Copyright bar */}
      <div className="border-t border-slate-800 py-4 text-center text-xs text-slate-500">
        <p>© {new Date().getFullYear()} {siteConfig.name}. All rights reserved. Software architecture developed strictly for Indian retail pharmacy standards.</p>
      </div>
    </footer>
  );
};

