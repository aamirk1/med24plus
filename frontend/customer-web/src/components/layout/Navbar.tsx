"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Search,
  ShoppingCart,
  UploadCloud,
  User,
  MapPin,
  Menu,
  X,
  ShieldCheck,
  ChevronDown,
  Phone,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";

export const Navbar: React.FC = () => {
  const router = useRouter();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [pincode, setPincode] = useState("560034");
  const [searchVal, setSearchVal] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/products?q=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white shadow-subtle border-b border-slate-200">
      {/* 1. Announcement Bar */}
      <div className="bg-[#066649] text-white text-[11px] py-1.5 px-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span className="font-medium">
              Form 20/21 Licensed Pharmacy • Express Same-Day Delivery across Bengaluru
            </span>
          </div>
          <div className="hidden sm:flex items-center gap-4 text-emerald-100">
            <span className="flex items-center gap-1">
              <Phone className="w-3 h-3" /> Pharmacist Helpline: +91 80 2345 6789
            </span>
            <span>•</span>
            <Link href="/prescription/upload" className="hover:text-white underline">
              Upload Prescription (Rule 65)
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Main Navigation Bar */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          {/* Logo */}
          <div className="shrink-0">
            <BrandLogo />
          </div>

          {/* Delivery Pincode Selector */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1.5 rounded-lg border border-slate-200 bg-slate-50 text-xs text-[#172B24]">
            <MapPin className="w-3.5 h-3.5 text-[#087F5B] shrink-0" />
            <div className="leading-tight">
              <p className="text-[10px] text-slate-400 font-medium">Deliver to</p>
              <button
                type="button"
                onClick={() => {
                  const newPin = prompt("Enter 6-digit delivery pincode:", pincode);
                  if (newPin && newPin.length === 6) setPincode(newPin);
                }}
                className="font-semibold text-slate-800 hover:text-[#087F5B] flex items-center gap-1"
              >
                <span>{pincode}, Bengaluru</span>
                <ChevronDown className="w-3 h-3 text-slate-400" />
              </button>
            </div>
          </div>

          {/* 3. Global Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-xl relative hidden md:block">
            <div className="relative">
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search medicines, salts, health devices (e.g. Paracetamol, Metformin)..."
                className="w-full pl-10 pr-24 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50/50 text-[#172B24] placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#087F5B] focus:bg-white transition"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" />
              <button
                type="submit"
                className="absolute right-1.5 top-1/2 -translate-y-1/2 px-3 py-1 bg-[#087F5B] hover:bg-[#066649] text-white rounded-lg text-xs font-semibold transition"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right CTAs */}
          <div className="flex items-center gap-3">
            {/* 1-Tap Prescription Upload Button */}
            <Link
              href="/prescription/upload"
              className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-2 bg-[#E6F4EF] hover:bg-[#c3e7db] text-[#087F5B] border border-[#087F5B]/30 rounded-xl text-xs font-bold transition"
            >
              <UploadCloud className="w-4 h-4 text-[#087F5B]" />
              <span>Upload Rx</span>
            </Link>

            {/* Account / Login */}
            <Link
              href="/auth/login"
              className="inline-flex items-center gap-1.5 px-3 py-2 text-xs font-semibold text-slate-700 hover:text-[#087F5B] hover:bg-slate-50 rounded-xl transition"
            >
              <User className="w-4 h-4" />
              <span className="hidden sm:inline">Sign In</span>
            </Link>

            {/* Cart Counter */}
            <Link
              href="/cart"
              className="relative inline-flex items-center justify-center p-2 rounded-xl text-slate-700 hover:bg-slate-50 hover:text-[#087F5B] transition"
              aria-label="Shopping Cart"
            >
              <ShoppingCart className="w-5 h-5" />
              <span className="absolute -top-1 -right-1 w-4 h-4 bg-[#2563EB] text-white text-[10px] font-bold rounded-full flex items-center justify-center">
                2
              </span>
            </Link>

            {/* Mobile Hamburger */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle Navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Bar */}
        <form onSubmit={handleSearch} className="mt-2.5 md:hidden">
          <div className="relative">
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search medicines, salts..."
              className="w-full pl-9 pr-4 py-2 text-xs rounded-xl border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          </div>
        </form>
      </div>

      {/* Category Subnav (Desktop) */}
      <div className="hidden md:block border-t border-slate-100 bg-slate-50/70 py-2">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between text-xs font-semibold text-slate-600">
          <div className="flex items-center gap-6 overflow-x-auto">
            <Link href="/products" className="hover:text-[#087F5B] transition">
              All Medicines
            </Link>
            <Link href="/categories/diabetes-care" className="hover:text-[#087F5B] transition">
              Diabetes Care
            </Link>
            <Link href="/categories/cardiac-care" className="hover:text-[#087F5B] transition">
              Cardiac & BP
            </Link>
            <Link href="/categories/vitamins-supplements" className="hover:text-[#087F5B] transition">
              Vitamins & Daily Health
            </Link>
            <Link href="/categories/ayurveda-herbal" className="hover:text-[#087F5B] transition">
              Ayurveda & Herbal
            </Link>
            <Link href="/categories/first-aid-surgical" className="hover:text-[#087F5B] transition">
              First Aid & Surgical
            </Link>
          </div>
          <div className="flex items-center gap-4 text-slate-500 text-[11px]">
            <Link href="/prescription/upload" className="hover:text-[#087F5B]">
              Rx Verification Policy
            </Link>
            <span>•</span>
            <Link href="/contact" className="hover:text-[#087F5B]">
              Store Helpline
            </Link>
          </div>
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg">
          <Link
            href="/prescription/upload"
            onClick={() => setMobileMenuOpen(false)}
            className="flex items-center justify-center gap-2 bg-[#087F5B] text-white py-2.5 rounded-lg font-semibold text-xs shadow-sm"
          >
            <UploadCloud className="w-4 h-4" /> Upload Doctor Prescription
          </Link>
          <div className="border-t border-slate-100 pt-2 space-y-2 text-xs font-medium text-slate-700">
            <Link href="/products" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-[#087F5B]">
              Browse All Products
            </Link>
            <Link href="/categories" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-[#087F5B]">
              Medicine Categories
            </Link>
            <Link href="/account/orders" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-[#087F5B]">
              My Orders & History
            </Link>
            <Link href="/account/prescriptions" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-[#087F5B]">
              Uploaded Prescriptions
            </Link>
            <Link href="/auth/login" onClick={() => setMobileMenuOpen(false)} className="block py-2 hover:text-[#087F5B]">
              Account Login / Register
            </Link>
            <Link href="/contact" onClick={() => setMobileMenuOpen(false)} className="block py-2 text-slate-500 hover:text-slate-800">
              Helpline & Pharmacy Location
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
