"use client";

import React, { useState } from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Smartphone, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function LoginPage() {
  const [loginMode, setLoginMode] = useState<"otp" | "password">("otp");
  const [mobile, setMobile] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-card space-y-6 text-left">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-xl font-bold text-[#172B24] pt-2">Welcome Back to Med24Plus</h1>
          <p className="text-xs text-slate-500">Sign in to manage prescriptions, track orders & view refills</p>
        </div>

        {/* Tab Switcher */}
        <div className="grid grid-cols-2 p-1 bg-slate-100 rounded-lg text-xs font-semibold text-slate-600">
          <button
            type="button"
            onClick={() => setLoginMode("otp")}
            className={`py-1.5 rounded-md transition ${loginMode === "otp" ? "bg-white text-[#087F5B] shadow-xs" : "hover:text-slate-900"}`}
          >
            Mobile OTP (Fast)
          </button>
          <button
            type="button"
            onClick={() => setLoginMode("password")}
            className={`py-1.5 rounded-md transition ${loginMode === "password" ? "bg-white text-[#087F5B] shadow-xs" : "hover:text-slate-900"}`}
          >
            Password Login
          </button>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-4">
          <Input
            label="Mobile Number (+91)"
            placeholder="Enter 10-digit mobile number"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            leftIcon={<Smartphone className="w-4 h-4 text-slate-400" />}
            required
            helperText="We will send a 6-digit OTP verification code."
          />

          {loginMode === "otp" && otpSent && (
            <Input
              label="Enter 6-Digit OTP"
              placeholder="e.g. 123456"
              maxLength={6}
              required
              helperText="Demo mode: Enter any 6-digit code"
            />
          )}

          {loginMode === "password" && (
            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="Enter your account password"
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                required
              />
              <div className="text-right">
                <Link href="/auth/forgot-password" className="text-[11px] text-[#087F5B] font-semibold hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </div>
          )}

          <Button
            variant="primary"
            size="md"
            className="w-full"
            onClick={() => {
              if (loginMode === "otp" && !otpSent) {
                setOtpSent(true);
              } else {
                window.location.href = "/account/orders";
              }
            }}
          >
            <span>{loginMode === "otp" && !otpSent ? "Get Verification OTP" : "Verify & Sign In"}</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          <span>New to Med24Plus? </span>
          <Link href="/auth/register" className="font-bold text-[#087F5B] hover:underline">
            Create an Account
          </Link>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5 border border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-[#087F5B]" />
          <span>Patient data stored securely as per DPDP Act 2023 guidelines.</span>
        </div>
      </div>
    </div>
  );
}

