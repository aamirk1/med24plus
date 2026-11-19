"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { User, MapPin, FileText, ShoppingBag, ShieldCheck, LogOut, Loader2, AlertCircle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    router.push("/auth/login");
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center gap-3">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
        <p className="text-xs text-slate-500">Loading your profile details...</p>
      </div>
    );
  }

  if (!isAuthenticated || !user) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center px-4 py-12 text-center">
        <div className="w-14 h-14 rounded-full bg-slate-100 flex items-center justify-center text-slate-400 mb-4">
          <User className="w-7 h-7" />
        </div>
        <h2 className="text-xl font-bold text-slate-900">Sign in to Access Your Profile</h2>
        <p className="text-xs text-slate-500 max-w-sm mt-1 mb-6">
          Access your saved prescription vaults, active delivery tracking, and health records securely.
        </p>
        <Link href="/auth/login">
          <Button variant="primary" size="md">
            Sign In with Mobile OTP or Password
          </Button>
        </Link>
      </div>
    );
  }

  const initials = user.full_name
    ? user.full_name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .slice(0, 2)
    : "MP";

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Account", href: "/account/profile" },
          { label: "Profile" },
        ]}
      />

      <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-[#172B24]">Patient Profile & Account</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your personal details, saved delivery addresses, and health preferences
          </p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={handleLogout}
          className="self-start sm:self-auto flex items-center gap-1.5 text-red-600 hover:text-red-700 hover:bg-red-50 border-red-200"
        >
          <LogOut className="w-4 h-4" />
          <span>Sign Out</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Navigation Sidebar */}
        <div className="md:col-span-1 space-y-2">
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle space-y-3">
            <div className="flex items-center gap-3 pb-3 border-b border-slate-100">
              <div className="w-10 h-10 rounded-full bg-[#F0FDFA] text-[#0D9488] flex items-center justify-center font-bold text-sm">
                {initials}
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#172B24]">{user.full_name || "Patient"}</h3>
                <p className="text-[11px] text-slate-400">{user.phone}</p>
              </div>
            </div>

            <nav className="space-y-1 text-xs font-semibold text-slate-600">
              <Link href="/account/profile" className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[#F0FDFA] text-[#0D9488]">
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
          <div className="flex items-center justify-between pb-2 border-b border-slate-100">
            <h2 className="text-sm font-bold text-[#172B24]">Personal Information</h2>
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full ${user.is_phone_verified ? "bg-teal-50 text-teal-700 border border-teal-200" : "bg-amber-50 text-amber-700 border border-amber-200"}`}>
                <ShieldCheck className="w-3 h-3" />
                {user.is_phone_verified ? "Mobile Verified" : "Verification Pending"}
              </span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full Name" defaultValue={user.full_name || ""} />
            <Input label="Mobile Number" defaultValue={user.phone} disabled helperText="Verified contact registered under Indian telecommunications" />
            <Input label="Email Address" defaultValue={user.email || "Not specified"} type="email" />
            <Input label="Date of Birth / Age" defaultValue={user.profile?.date_of_birth || "Not specified"} />
            <Input label="Blood Group" defaultValue={user.profile?.blood_group || "Not specified"} />
            <Input label="Emergency Contact" defaultValue={user.profile?.emergency_contact || "+91 98451 99999"} />
          </div>

          <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
            <p className="text-[11px] text-slate-400">Account status: <strong className="text-slate-700 uppercase">{user.status}</strong></p>
            <Button variant="primary" size="sm">
              Save Profile Changes
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
