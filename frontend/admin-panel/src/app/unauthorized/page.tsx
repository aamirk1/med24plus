"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { ShieldAlert, ArrowLeft } from "lucide-react";

export default function UnauthorizedPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-red-200 p-8 space-y-6 text-center">
        <div className="flex justify-center">
          <BrandLogo />
        </div>
        <div className="w-16 h-16 rounded-full bg-red-50 text-red-600 flex items-center justify-center mx-auto">
          <ShieldAlert className="w-8 h-8" />
        </div>
        <div className="space-y-1.5">
          <h2 className="text-xl font-bold text-slate-900">Access Restricted</h2>
          <p className="text-xs text-slate-500">
            You do not possess the required administrative or pharmacist operational role to access this module.
          </p>
        </div>
        <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-600 text-left">
          <p>
            If you are a Registered Pharmacist, verify that your state council registration has been verified under Rule 65.
          </p>
        </div>
        <Link
          href="/login"
          className="w-full inline-flex justify-center items-center gap-1.5 py-2.5 px-4 bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-lg text-xs font-semibold transition"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Return to Staff Login</span>
        </Link>
      </div>
    </div>
  );
}

