"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Lock, Mail, ShieldAlert } from "lucide-react";

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200/80 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandLogo />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Authorized Personnel Access</h2>
          <p className="text-xs text-slate-500">
            For Licensed Pharmacists, Store Managers & Compliance Officers
          </p>
        </div>

        <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pharmacist Council ID / Staff Email
            </label>
            <div className="relative">
              <input
                type="text"
                disabled
                value="pharmacist@med24plus.in"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
              <Mail className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Secure Password
            </label>
            <div className="relative">
              <input
                type="password"
                disabled
                value="••••••••••••"
                className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-500 cursor-not-allowed"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-800 flex items-start gap-2">
            <ShieldAlert className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
            <span>Authentication logic will be implemented in subsequent phases using secure JWT & MFA tokens.</span>
          </div>

          <Link
            href="/dashboard"
            className="w-full inline-flex justify-center items-center py-2.5 px-4 bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-lg text-xs font-semibold transition"
          >
            Enter Dashboard (Demo Mode)
          </Link>
        </form>
      </div>
    </div>
  );
}
