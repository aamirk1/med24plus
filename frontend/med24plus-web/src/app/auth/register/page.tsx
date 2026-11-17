"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Checkbox } from "@/components/ui/Checkbox";
import { Smartphone, User, Mail, Lock, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { authService } from "@/services/auth.service";

export default function RegisterPage() {
  const router = useRouter();

  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptedTerms, setAcceptedTerms] = useState(true);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!acceptedTerms) {
      setErrorMessage("Please accept the terms of dispensing to continue.");
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (password.length < 8) {
      setErrorMessage("Password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.register({
        full_name: fullName.trim(),
        phone: phone.trim(),
        password,
        confirm_password: confirmPassword,
        email: email.trim() || undefined,
      });

      setSuccessMessage("Account created successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || "Registration failed. Please check your details and try again.");
    } finally {
      setIsLoading(false);
    }
  };

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

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3.5">
          <Input
            label="Full Patient Name"
            placeholder="e.g. Aarav Sharma"
            value={fullName}
            onChange={(e) => setFullName(e.target.value)}
            leftIcon={<User className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Mobile Number (+91)"
            placeholder="10-digit mobile number"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            leftIcon={<Smartphone className="w-4 h-4 text-slate-400" />}
            required
            helperText="Used for delivery OTP verification and pharmacist consultation"
          />

          <Input
            label="Email Address (Optional)"
            type="email"
            placeholder="your.email@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            leftIcon={<Mail className="w-4 h-4 text-slate-400" />}
          />

          <Input
            label="Create Password"
            type="password"
            placeholder="At least 8 chars, 1 uppercase, 1 number, 1 special"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />

          <Input
            label="Confirm Password"
            type="password"
            placeholder="Re-enter password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
            required
          />

          <Checkbox
            id="terms"
            checked={acceptedTerms}
            onChange={(e) => setAcceptedTerms(e.target.checked)}
            label="I accept terms of dispensing"
            description="I confirm understanding that prescription drugs require valid doctor prescription under Rule 65."
          />

          <Button
            variant="primary"
            size="md"
            type="submit"
            className="w-full mt-2 flex items-center justify-center gap-2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Registering Account...</span>
              </>
            ) : (
              <>
                <span>Register Account</span>
                <ArrowRight className="w-4 h-4 ml-1.5" />
              </>
            )}
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
