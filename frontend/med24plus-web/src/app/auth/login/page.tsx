"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Input } from "@/components/ui/Input";
import { Button } from "@/components/ui/Button";
import { Smartphone, Lock, ArrowRight, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";

export default function LoginPage() {
  const router = useRouter();
  const { login, refreshUser } = useAuth();

  const [loginMode, setLoginMode] = useState<"otp" | "password">("password");
  const [mobile, setMobile] = useState("+919876543210");
  const [password, setPassword] = useState("Password@123");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [devOtpHint, setDevOtpHint] = useState<string | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handlePasswordLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!mobile.trim() || !password) {
      setErrorMessage("Please enter both your mobile number and password.");
      return;
    }

    setIsLoading(true);
    try {
      await login(mobile.trim(), password);
      setSuccessMessage("Sign in successful. Redirecting to your account...");
      setTimeout(() => {
        router.push("/account/profile");
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid credentials. Please verify your mobile number and password.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendOtp = async () => {
    setErrorMessage(null);
    setSuccessMessage(null);
    if (!mobile.trim()) {
      setErrorMessage("Please enter your 10-digit mobile number.");
      return;
    }

    setIsLoading(true);
    try {
      const res = await authService.sendOtp(mobile.trim(), "login");
      setOtpSent(true);
      setSuccessMessage("Verification OTP dispatched to your mobile.");
      if (res.data?.dev_otp) {
        setDevOtpHint(res.data.dev_otp);
        setOtpCode(res.data.dev_otp);
      }
    } catch (err: any) {
      setErrorMessage(err.message || "Failed to dispatch verification OTP. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    if (!otpCode || otpCode.length < 6) {
      setErrorMessage("Please enter the 6-digit verification code.");
      return;
    }

    setIsLoading(true);
    try {
      await authService.verifyOtp(mobile.trim(), otpCode.trim(), "login");
      await refreshUser();
      setSuccessMessage("OTP verified successfully. Redirecting to account...");
      setTimeout(() => {
        router.push("/account/profile");
      }, 800);
    } catch (err: any) {
      setErrorMessage(err.message || "Invalid verification OTP code.");
    } finally {
      setIsLoading(false);
    }
  };

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
            onClick={() => {
              setLoginMode("password");
              setErrorMessage(null);
            }}
            className={`py-1.5 rounded-md transition ${loginMode === "password" ? "bg-white text-[#0D9488] shadow-xs" : "hover:text-slate-900"}`}
          >
            Password Login
          </button>
          <button
            type="button"
            onClick={() => {
              setLoginMode("otp");
              setErrorMessage(null);
            }}
            className={`py-1.5 rounded-md transition ${loginMode === "otp" ? "bg-white text-[#0D9488] shadow-xs" : "hover:text-slate-900"}`}
          >
            Mobile OTP (Fast)
          </button>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-teal-600 shrink-0 mt-0.5" />
            <span>{successMessage}</span>
          </div>
        )}

        {devOtpHint && loginMode === "otp" && (
          <div className="p-2.5 bg-blue-50 border border-blue-200 rounded-lg text-[11px] text-blue-800">
            <strong>Development OTP:</strong> {devOtpHint} (Auto-filled)
          </div>
        )}

        {loginMode === "password" ? (
          <form onSubmit={handlePasswordLogin} className="space-y-4">
            <Input
              label="Mobile Number (+91)"
              placeholder="+919876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              leftIcon={<Smartphone className="w-4 h-4 text-slate-400" />}
              required
            />

            <div className="space-y-1">
              <Input
                label="Password"
                type="password"
                placeholder="Enter your account password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                leftIcon={<Lock className="w-4 h-4 text-slate-400" />}
                required
              />
              <div className="text-right">
                <Link href="/auth/forgot-password" className="text-[11px] text-[#0D9488] font-semibold hover:underline">
                  Forgot Password?
                </Link>
              </div>
            </div>

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
                  <span>Signing In...</span>
                </>
              ) : (
                <>
                  <span>Sign In to Account</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>
          </form>
        ) : (
          <form onSubmit={otpSent ? handleVerifyOtp : (e) => { e.preventDefault(); handleSendOtp(); }} className="space-y-4">
            <Input
              label="Mobile Number (+91)"
              placeholder="+919876543210"
              value={mobile}
              onChange={(e) => setMobile(e.target.value)}
              leftIcon={<Smartphone className="w-4 h-4 text-slate-400" />}
              disabled={otpSent}
              required
              helperText="We will send a 6-digit OTP verification code."
            />

            {otpSent && (
              <Input
                label="Enter 6-Digit OTP"
                placeholder="e.g. 123456"
                maxLength={6}
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value)}
                required
              />
            )}

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
                  <span>Processing...</span>
                </>
              ) : otpSent ? (
                <>
                  <span>Verify & Sign In</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              ) : (
                <>
                  <span>Get Verification OTP</span>
                  <ArrowRight className="w-4 h-4 ml-1.5" />
                </>
              )}
            </Button>

            {otpSent && (
              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setOtpSent(false)}
                  className="text-xs text-slate-500 hover:text-slate-800 underline"
                >
                  Change Mobile Number
                </button>
              </div>
            )}
          </form>
        )}

        <div className="pt-2 text-center text-xs text-slate-500 border-t border-slate-100">
          <span>New to Med24Plus? </span>
          <Link href="/auth/register" className="font-bold text-[#0D9488] hover:underline">
            Create an Account
          </Link>
        </div>

        <div className="p-3 bg-slate-50 rounded-lg text-[10px] text-slate-500 text-center flex items-center justify-center gap-1.5 border border-slate-100">
          <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" />
          <span>Patient data stored securely as per DPDP Act 2023 guidelines.</span>
        </div>
      </div>
    </div>
  );
}
