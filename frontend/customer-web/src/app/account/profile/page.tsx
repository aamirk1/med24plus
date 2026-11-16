"use client";

import React from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, Phone, Mail, ShieldCheck, MapPin, FileText, ShoppingBag } from "lucide-react";

export default function ProfilePage() {
  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Account", href: "/account/profile" },
          { label: "Profile" },
        ]}
      />

      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-[#172B24]">Patient Profile & Account</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          Manage your personal details, saved delivery addresses, and health preferences
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center font-bold text-sm">
                AS
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172B24]">Aarav Sharma</h3>
                <p className="text-[11px] text-slate-400">+91 98451 22340</p>
              </div>
            </div>

            <nav className="space-y-1 text-xs font-semibold text-slate-600">
              <Link href="/account/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#E6F4EF] text-[#087F5B]">
                <User className="w-4 h-4" /> Personal Profile
              </Link>
              <Link href="/account/addresses" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">
                <MapPin className="w-4 h-4" /> Saved Addresses
              </Link>
              <Link href="/account/orders" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">
                <ShoppingBag className="w-4 h-4" /> Order History
              </Link>
              <Link href="/account/prescriptions" className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-slate-50 text-slate-700">
                <FileText className="w-4 h-4" /> Prescriptions Vault
              </Link>
            </nav>
          </div>
        </div>

        {/* Profile Form */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-6 shadow-subtle space-y-5">
          <h2 className="text-sm font-bold text-[#172B24] pb-2 border-b border-slate-100">
            Personal Information
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" defaultValue="Aarav Sharma" />
            <Input label="Mobile Number" defaultValue="+91 98451 22340" disabled helperText="Contact support to change verified number" />
            <Input label="Email Address" defaultValue="aarav.sharma@example.com" type="email" />
            <Input label="Date of Birth / Age" defaultValue="14 July 1990 (34 Yrs)" />
            <Input label="Blood Group" defaultValue="O +ve" />
            <Input label="Emergency Contact" defaultValue="+91 98451 99999" />
          </div>

          <div className="pt-3 border-t border-slate-100 flex justify-end">
            <Button variant="primary" size="sm">
              Save Profile Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

