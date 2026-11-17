"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Smartphone, Lock, ArrowLeft, CheckCircle2, AlertCircle, Loader2 } from "lucide-react";
import { authService } from "@/services/auth.service";

export default function ForgotPasswordPage() {
  const router = useRouter();

  const [step, setStep] = useState<"send_otp" | "reset_password">("send_otp");
  const [mobile, setMobile] = useState("+919876543210");
  const [otpCode, setOtpCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [devOtp, setDevOtp] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleSendOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!mobile.trim()) {
      setErrorMessage("Please enter your registered mobile number or email.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.forgotPassword(mobile.trim());
      setStep("reset_password");
      setSuccessMessage("Verification code has been dispatched.");
      if (res.data?.dev_otp) {
        setDevOtp(res.data.dev_otp);
        setOtpCode(res.data.dev_otp);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to dispatch password reset code. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (newPassword !== confirmPassword) {
      setErrorMessage("Passwords do not match.");
      return;
    }

    if (newPassword.length < 8) {
      setErrorMessage("New password must be at least 8 characters long.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.resetPassword({
        identifier: mobile.trim(),
        otp_code: otpCode.trim(),
        new_password: newPassword,
        confirm_password: confirmPassword,
      });

      setSuccessMessage("Password reset successfully! Redirecting to sign in...");
      setTimeout(() => {
        router.push("/auth/login");
      }, 1200);
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to reset password. Please check the OTP code.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="w-full max-w-md bg-white rounded-2xl border border-slate-200 p-8 shadow-card space-y-6 text-left">
        <div className="text-center space-y-1.5">
          <div className="flex justify-center">
            <BrandLogo size="md" />
          </div>
          <h1 className="text-xl font-bold text-[#172B24] pt-2">Reset Account Password</h1>
          <p className="text-xs text-slate-500">
            {step === "send_otp"
              ? "Enter your registered mobile number to receive a verification OTP"
              : "Enter verification code and create your new secure password"}
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-start gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {devOtp && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800">
            <strong>Development OTP:</strong> {devOtp} (Auto-filled)
          </div>
        )}

        {step === "send_otp" ? (
          <form onSubmit={handleSendOtp} className="space-y-4">
            <Input
              label="Registered Mobile Number (+91)"
              placeholder="+919876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              leftIcon={<Smartphone className="w-4 h-4 text-slate-400" />}
              required
            />
            <Button
              variant="primary"
              size="md"
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Dispatching OTP...</span>
                </>
              ) : (
                <span>Send Password Reset OTP</span>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={handleResetPassword} className="space-y-4">
            <Input
              label="Enter 6-Digit Verification OTP"
              placeholder="e.g. 123456"
              maxLength={6}
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              required
            />

            <Input
              label="New Password"
              type="password"
              placeholder="At least 8 chars with uppercase, digit & symbol"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />

            <Input
              label="Confirm New Password"
              type="password"
              placeholder="Re-enter new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
              required
            />

            <Button
              variant="primary"
              size="md"
              type="submit"
              className="w-full flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Resetting Password...</span>
                </>
              ) : (
                <span>Confirm & Reset Password</span>
              )}
            </Button>

            <div className="text-center">
              <button
                type="button"
                onClick={() => setStep("send_otp")}
                className="text-xs text-slate-500 hover:text-slate-800 underline"
              >
                Resend to a different number
              </button>
            </div>
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
