"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Search, ShoppingBag, UploadCloud, User, PhoneCall, ShieldCheck, Menu, X } from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { siteConfig } from "@/config/site";

export const Navbar: React.FC = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur shadow-sm border-b border-slate-100">
      {/* Top micro-bar */}
      <div className="bg-slate-900 text-slate-300 text-xs py-1.5 px-4 hidden md:block">
        <div className="max-w-7xl mx-auto flex justify-between items-center">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" /> Licensed Indian Retail Pharmacy
            </span>
            <span>•</span>
            <span>Express Delivery Across City PINs</span>
          </div>
          <div className="flex items-center gap-4 text-xs">
            <a href={`tel:${siteConfig.phone}`} className="flex items-center gap-1 hover:text-white transition">
              <PhoneCall className="w-3 h-3 text-emerald-400" /> Helpline: {siteConfig.phone}
            </a>
            <span>•</span>
            <span className="text-slate-400">24x7 Certified Pharmacist On Duty</span>
          </div>
        </div>
      </div>

      {/* Main navigation */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link href="/" className="shrink-0">
          <BrandLogo size="md" />
        </Link>

        {/* Global Search Bar */}
        <div className="hidden lg:flex flex-1 max-w-xl mx-4">
          <div className="relative w-full">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search for medicines, salt compositions, brands (e.g. Paracetamol, Metformin)..."
              className="w-full pl-10 pr-4 py-2.5 rounded-full border border-slate-200 bg-slate-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC] focus:border-transparent text-sm transition"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center gap-3">
          {/* Upload Prescription CTA */}
          <Link
            href="/prescription/upload"
            className="hidden sm:inline-flex items-center gap-2 bg-[#00B074] hover:bg-[#009663] text-white px-4 py-2 rounded-full font-medium text-sm shadow-sm transition"
          >
            <UploadCloud className="w-4 h-4" />
            <span>Upload Rx</span>
          </Link>

          {/* Cart Placeholder */}
          <Link
            href="/cart"
            className="flex items-center gap-1.5 p-2 rounded-full hover:bg-slate-100 text-slate-700 transition relative"
            aria-label="View Cart"
          >
            <ShoppingBag className="w-5 h-5 text-slate-700" />
            <span className="absolute -top-1 -right-1 bg-[#0066CC] text-white text-[10px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              0
            </span>
          </Link>

          {/* Sign In */}
          <Link
            href="/auth/login"
            className="hidden md:flex items-center gap-1.5 border border-slate-200 hover:border-slate-300 text-slate-700 px-3.5 py-2 rounded-full font-medium text-sm transition"
          >
            <User className="w-4 h-4 text-slate-500" />
            <span>Sign In</span>
          </Link>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100"
            aria-label="Toggle Menu"
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Search Bar */}
      <div className="lg:hidden px-4 pb-3">
        <div className="relative w-full">
          <input
            type="text"
            placeholder="Search medicines or salts..."
            className="w-full pl-9 pr-4 py-2 rounded-full border border-slate-200 bg-slate-50 text-sm focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#0066CC]"
          />
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
        </div>
      </div>

      {/* Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3">
          <Link
            href="/prescription/upload"
            className="flex items-center justify-center gap-2 bg-[#00B074] text-white py-2.5 rounded-lg font-medium text-sm"
          >
            <UploadCloud className="w-4 h-4" /> Upload Doctor Prescription
          </Link>
          <div className="border-t border-slate-100 pt-2 space-y-2">
            <Link href="/categories" className="block py-2 text-sm text-slate-700 font-medium hover:text-[#0066CC]">
              Medicine Categories
            </Link>
            <Link href="/consult" className="block py-2 text-sm text-slate-700 font-medium hover:text-[#0066CC]">
              Consult Pharmacist
            </Link>
            <Link href="/auth/login" className="block py-2 text-sm text-slate-700 font-medium hover:text-[#0066CC]">
              Sign In / Register
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};

