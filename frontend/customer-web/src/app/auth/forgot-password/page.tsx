"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Smartphone, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false);
  const [mobile, setMobile] = useState("");

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-card space-y-6 text-left">
        <div className="text-center space-y-1.5">
          <div className="flex justify-center">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-xl font-bold text-[#172B24] pt-2">Reset Account Password</h1>
          <p className="text-xs text-slate-500">
            Enter your registered mobile number to receive a verification OTP
          </p>
        </div>

        {sent ? (
          <div className="space-y-4 text-center">
            <div className="w-12 h-12 rounded-full bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <p className="text-xs text-slate-600">
              A 6-digit OTP code has been dispatched to <strong>{mobile}</strong> (Demo simulation).
            </p>
            <Link href="/auth/login" className="block">
              <Button variant="primary" size="md" className="w-full">
                Back to Sign In
              </Button>
            </Link>
          </div>
        ) : (
          <form onSubmit={(e) => { e.preventDefault(); setSent(true); }} className="space-y-4">
            <Input
              label="Registered Mobile Number (+91)"
              placeholder="10-digit mobile number"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              leftIcon={<Smartphone className="w-4 h-4 text-slate-400" />}
              required
            />
            <Button variant="primary" size="md" type="submit" className="w-full">
              Send Password Reset OTP
            </Button>
          </form>
        )}

        <div className="text-center pt-2 border-t border-slate-100">
          <Link href="/auth/login" className="text-xs text-slate-500 hover:text-[#087F5B] inline-flex items-center gap-1 font-medium">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Login
          </Link>
        </div>
      </div>
    </div>
  );
}

