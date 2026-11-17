import React from "react";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Textarea } from "@/components/ui/Textarea";
import { siteConfig } from "@/config/site";
import { MapPin, Phone, Mail, Clock, ShieldCheck, Award } from "lucide-react";

export default function ContactPage() {
  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-left">
      <Breadcrumb items={[{ label: "Contact Us" }]} />

      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-[#172B24]">Contact Central Dispensing Unit</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Speak with our Registered Pharmacist team or visit our licensed premises
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pharmacy Info Card */}
        <div className="space-y-6">
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
            <h2 className="text-sm font-bold text-[#172B24] uppercase tracking-wider text-[#087F5B]">
              Licensed Pharmacy Details
            </h2>

            <div className="space-y-3.5 text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-[#087F5B] shrink-0 mt-0.5" />
                <div>
                  <strong className="block text-slate-900 font-semibold">{siteConfig.name}</strong>
                  <p className="text-slate-500 mt-0.5">
                    {siteConfig.address.line1}, {siteConfig.address.city}, {siteConfig.address.state} - {siteConfig.address.pincode}, India.
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Phone className="w-4 h-4 text-[#087F5B] shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Customer Care Helpline</span>
                  <a href={`tel:${siteConfig.phone}`} className="font-semibold text-slate-900 hover:text-[#087F5B]">
                    {siteConfig.phone}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Mail className="w-4 h-4 text-[#087F5B] shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Email Enquiries</span>
                  <a href={`mailto:${siteConfig.email}`} className="font-semibold text-slate-900 hover:text-[#087F5B]">
                    {siteConfig.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Clock className="w-4 h-4 text-[#087F5B] shrink-0" />
                <div>
                  <span className="text-slate-400 block text-[10px]">Operating Hours</span>
                  <span className="font-semibold text-slate-900">{siteConfig.operatingHours}</span>
                </div>
              </div>
            </div>

            <div className="p-3 bg-[#E6F4EF] rounded-xl border border-[#C3E7DB] text-xs text-[#066649] space-y-1">
              <div className="flex items-center gap-1.5 font-bold">
                <Award className="w-4 h-4" />
                <span>Regulatory Credentials</span>
              </div>
              <p className="text-[11px]">Retail Drug License Form 20/21: <strong>{siteConfig.licenseNumber}</strong></p>
              <p className="text-[11px]">Pharmacy Council Registration: <strong>{siteConfig.pharmacistCouncilReg}</strong></p>
            </div>
          </div>
        </div>

        {/* Contact Form */}
        <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-subtle space-y-4">
          <h2 className="text-sm font-bold text-[#172B24]">Send a Clinical or Order Inquiry</h2>
          <form className="space-y-3.5">
            <Input label="Your Name" placeholder="e.g. Aarav Sharma" required />
            <Input label="Phone Number" placeholder="+91 98451 •••••" required />
            <Input label="Email Address" type="email" placeholder="name@domain.com" />
            <Textarea label="Message / Drug Availability Inquiry" placeholder="Enter medicine details or query..." rows={4} required />
            <Button variant="primary" size="md" className="w-full">
              Submit Inquiry
            </Button>
          </form>
        </div>
      </div>
    </div>
  );
}

