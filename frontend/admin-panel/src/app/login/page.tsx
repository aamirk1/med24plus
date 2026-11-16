"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { BrandLogo } from "@/components/common/BrandLogo";
import { Lock, Mail, ShieldCheck, AlertCircle, Loader2 } from "lucide-react";
import { useAdminAuth } from "@/context/AdminAuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAdminAuth();

  const [identifier, setIdentifier] = useState("admin@med24plus.in");
  const [password, setPassword] = useState("Password@123");
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (!identifier.trim() || !password) {
      setErrorMessage("Please enter both administrative identifier and password.");
      return;
    }

    setIsLoading(true);
    try {
      await login(identifier.trim(), password);
      router.push("/dashboard");
    } catch (err: any) {
      setErrorMessage(
        err.message || "Invalid administrative credentials or insufficient authorization privileges."
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-lg border border-slate-200/80 p-8 space-y-6">
        <div className="text-center space-y-2">
          <div className="flex justify-center">
            <BrandLogo />
          </div>
          <h2 className="text-xl font-bold text-slate-900 mt-2">Authorized Personnel Access</h2>
          <p className="text-xs text-slate-500">
            For Licensed Pharmacists, Store Managers & Operations Staff
          </p>
        </div>

        {errorMessage && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <form className="space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Pharmacist Council ID / Staff Email
            </label>
            <div className="relative">
              <input
                type="text"
                value={identifier}
                onChange={(e) => setIdentifier(e.target.value)}
                placeholder="admin@med24plus.in or +919800000002"
                required
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
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
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Enter password"
                required
                className="w-full pl-9 pr-3 py-2 text-xs bg-white border border-slate-300 rounded-lg text-slate-800 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
              />
              <Lock className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] text-slate-600 flex items-start gap-2">
            <ShieldCheck className="w-4 h-4 text-[#0066CC] shrink-0 mt-0.5" />
            <span>Protected by Argon2id cryptographic hashing, RBAC, and access audit logging.</span>
          </div>

          <button
            type="submit"
            disabled={isLoading}
            className="w-full inline-flex justify-center items-center gap-2 py-2.5 px-4 bg-[#0066CC] hover:bg-[#0052A3] text-white rounded-lg text-xs font-semibold transition disabled:opacity-70"
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Authenticating Personnel...</span>
              </>
            ) : (
              <span>Enter Operations Console</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
