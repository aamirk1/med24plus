"use client";

import React from "react";
import Link from "next/link";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Smartphone, User, Mail, Lock, ArrowRight, ShieldCheck } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-card space-y-5 text-left">
        <div className="text-center space-y-1.5">
          <div className="flex justify-center">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-xl font-bold text-[#172B24] pt-2">Create Patient Account</h1>
          <p className="text-xs text-slate-500">Sign up for seamless prescription delivery & medical history</p>
        </div>

        <form onSubmit={(e) => e.preventDefault()} className="space-y-3.5">
          <Input
            label="Full Patient Name"
            placeholder="e.g. Aarav Sharma"
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Mobile Number (+91)"
            placeholder="10-digit mobile number"
            leftIcon={<Smartphone className="w-4 h-4 text-slate-400" />}
            required
            helperText="Used for delivery OTP verification and doctor call"
          />

          <Input
            label="Email Address"
            type="email"
            placeholder="your.email@example.com"
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <Input
            label="Create Password"
            type="password"
            placeholder="Minimum 8 characters"
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />

          <Checkbox
            id="terms"
            defaultChecked
            label="I accept terms of dispensing"
            description="I confirm understanding that prescription drugs require valid doctor prescription under Rule 65."
          />

          <Button
            variant="primary"
            size="md"
            className="w-full mt-2"
            onClick={() => (window.location.href = "/account/orders")}
          >
            <span>Register Account</span>
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          <span>Already registered? </span>
          <Link href="/auth/login" className="font-bold text-[#087F5B] hover:underline">
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
}

