"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import {
  User as UserIcon,
  MapPin,
  FileText,
  ShoppingBag,
  ShieldCheck,
  LogOut,
  Loader2,
  AlertCircle,
  CheckCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { authService } from "@/services/auth.service";

export default function ProfilePage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading, logout, refreshUser } = useAuth();

  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [dateOfBirth, setDateOfBirth] = useState("");
  const [bloodGroup, setBloodGroup] = useState("");
  const [emergencyContact, setEmergencyContact] = useState("");
  const [gender, setGender] = useState("");

  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState<string | null>(null);
  const [saveError, setSaveError] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || "");
      setEmail(user.email || "");
      setDateOfBirth(user.profile?.date_of_birth || "");
      setBloodGroup(user.profile?.blood_group || "");
      setEmergencyContact(user.profile?.emergency_contact || "");
      setGender(user.profile?.gender || "");
    }
  }, [user]);

  const handleLogout = async () => {
    await logout();
    router.push("/");
  };

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSaveSuccess(null);
    setSaveError(null);

    try {
      await authService.updateProfile({
        full_name: fullName.trim() || undefined,
        email: email.trim() || undefined,
        gender: gender.trim() || undefined,
        date_of_birth: dateOfBirth.trim() || undefined,
        blood_group: bloodGroup.trim() || undefined,
        emergency_contact: emergencyContact.trim() || undefined,
      });

      await refreshUser();
      setSaveSuccess("Profile changes saved successfully!");
      setTimeout(() => setSaveSuccess(null), 4000);
    } catch (err: any) {
      setSaveError(err?.message || "Failed to save profile changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
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
          <UserIcon className="w-7 h-7" />
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
                <UserIcon className="w-4 h-4" /> Personal Profile
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

          {saveSuccess && (
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-xs text-teal-800 flex items-center gap-2">
              <CheckCircle className="w-4 h-4 text-teal-600 shrink-0" />
              <span>{saveSuccess}</span>
            </div>
          )}

          {saveError && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>{saveError}</span>
            </div>
          )}

          <form onSubmit={handleSaveProfile} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Full Name"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Your full legal name"
              />
              <Input
                label="Mobile Number"
                value={user.phone}
                disabled
                helperText="Verified contact registered under Indian telecommunications"
              />
              <Input
                label="Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                type="email"
                placeholder="name@example.com"
              />
              <Input
                label="Date of Birth"
                type="date"
                value={dateOfBirth}
                onChange={(e) => setDateOfBirth(e.target.value)}
              />
              <Input
                label="Blood Group"
                value={bloodGroup}
                onChange={(e) => setBloodGroup(e.target.value)}
                placeholder="e.g. O+, A+, B+"
              />
              <Input
                label="Emergency Contact"
                value={emergencyContact}
                onChange={(e) => setEmergencyContact(e.target.value)}
                placeholder="+91 98765 43210"
              />
            </div>

            <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
              <p className="text-[11px] text-slate-400">
                Account status: <strong className="text-slate-700 uppercase">{user.status}</strong>
              </p>
              <Button
                variant="primary"
                size="sm"
                type="submit"
                disabled={isSaving}
                className="min-w-[160px]"
              >
                {isSaving ? (
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    Saving...
                  </span>
                ) : (
                  "Save Profile Changes"
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
