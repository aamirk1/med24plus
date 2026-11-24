"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import {
  Search,
  ShoppingCart,
  User,
  Menu,
  X,
  Truck,
  ShieldCheck,
  Headphones,
  Smartphone,
  ChevronDown,
  Pill,
  Sparkles,
  Stethoscope,
  FlaskConical,
  Tag,
  Crown,
  HelpCircle,
  FolderTree,
  LogOut,
} from "lucide-react";
import { BrandLogo } from "@/components/common/BrandLogo";
import { useAuth } from "@/context/AuthContext";
import { useCart } from "@/context/CartContext";
import { catalogService } from "@/services/catalog.service";
import { MedicineCategory } from "@/types";

export const Navbar: React.FC = () => {
  const router = useRouter();
  const pathname = usePathname();
  const { user, isAuthenticated, logout } = useAuth();
  const { cartCount } = useCart();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [categoriesOpen, setCategoriesOpen] = useState(false);
  const [searchVal, setSearchVal] = useState("");
  const [categories, setCategories] = useState<MedicineCategory[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    catalogService
      .getCategories()
      .then((cats) => {
        if (cats && cats.length > 0) setCategories(cats);
      })
      .catch((err) => console.warn("Could not load categories in nav:", err));
  }, []);

  // Close categories dropdown on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setCategoriesOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchVal.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchVal.trim())}`);
    }
  };

  const navLinks = [
    { label: "Medicines", href: "/products", icon: Pill, active: pathname === "/products" },
    { label: "Health Products", href: "/products?category=health-products", icon: Sparkles, active: pathname.includes("health-products") },
    { label: "Doctor Consultation", href: "/contact", icon: Stethoscope, active: false },
    { label: "Lab Tests", href: "/products?category=devices", icon: FlaskConical, active: false },
    { label: "Offers", href: "/products?offers=true", icon: Tag, active: false },
    { label: "Membership", href: "/#membership", icon: Crown, active: false },
    { label: "Support", href: "/contact", icon: HelpCircle, active: pathname === "/contact" },
  ];

  return (
    <header className="sticky top-0 z-40 bg-white shadow-xs border-b border-slate-200 text-slate-800">
      {/* 1. Top Utility Bar (Dark Navy) */}
      <div className="bg-[#0B2546] text-white text-[11px] py-1.5 px-4 font-medium">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          {/* Left: Value Propositions */}
          <div className="flex items-center gap-3 sm:gap-4 overflow-x-auto whitespace-nowrap scrollbar-none">
            <span className="inline-flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-sky-400 shrink-0" />
              <span>Free Delivery on Orders Above ₹499</span>
            </span>
            <span className="text-white/30 hidden sm:inline">|</span>
            <span className="hidden sm:inline-flex items-center gap-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>100% Genuine Medicines</span>
            </span>
            <span className="text-white/30 hidden md:inline">|</span>
            <span className="hidden md:inline-flex items-center gap-1.5">
              <Headphones className="w-3.5 h-3.5 text-cyan-400 shrink-0" />
              <span>24x7 Customer Support</span>
            </span>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-3 sm:gap-4 shrink-0 text-white/90">
            <Link
              href="/contact"
              className="hidden sm:inline-flex items-center gap-1.5 hover:text-white transition"
            >
              <Smartphone className="w-3 h-3 text-emerald-400" />
              <span>Download App</span>
            </Link>
            <span className="text-white/30 hidden sm:inline">|</span>
            {isAuthenticated && user ? (
              <div className="flex items-center gap-2">
                <Link
                  href="/account/profile"
                  className="inline-flex items-center gap-1 hover:text-white transition font-semibold"
                >
                  <User className="w-3.5 h-3.5 text-sky-400" />
                  <span className="max-w-[120px] truncate">{user.full_name || "Account"}</span>
                </Link>
                <button
                  type="button"
                  onClick={() => logout()}
                  title="Sign Out"
                  className="hover:text-red-300 ml-1"
                >
                  <LogOut className="w-3 h-3" />
                </button>
              </div>
            ) : (
              <Link
                href="/auth/login"
                className="inline-flex items-center gap-1 hover:text-white transition font-semibold"
              >
                <User className="w-3.5 h-3.5 text-sky-400" />
                <span>Login / Sign Up</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* 2. Main Header Bar (Logo, Large Search, My Cart) */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3.5">
        <div className="flex items-center justify-between gap-4 md:gap-8">
          {/* Brand Logo */}
          <div className="shrink-0">
            <Link href="/" className="inline-block">
              <BrandLogo size="md" />
            </Link>
          </div>

          {/* Center Search Bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl relative hidden md:block">
            <div className="relative flex items-center">
              <Search className="w-4 h-4 text-slate-400 absolute left-4 pointer-events-none" />
              <input
                type="text"
                value={searchVal}
                onChange={(e) => setSearchVal(e.target.value)}
                placeholder="Search medicines, brands and health products..."
                className="w-full pl-11 pr-28 py-2.5 text-xs rounded-full border border-slate-300 bg-slate-50/70 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-[#0052CC] focus:bg-white transition shadow-2xs"
              />
              <button
                type="submit"
                className="absolute right-1.5 px-6 py-1.5 bg-[#0052CC] hover:bg-[#0043A8] text-white rounded-full text-xs font-bold transition shadow-2xs"
              >
                Search
              </button>
            </div>
          </form>

          {/* Right: Cart Button & Mobile Menu Trigger */}
          <div className="flex items-center gap-4">
            <Link
              href="/cart"
              className="flex items-center gap-2 group px-2 py-1.5 rounded-xl hover:bg-slate-50 transition"
              aria-label="Shopping Cart"
            >
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-[#0052CC] transition-transform group-hover:scale-105" />
                <span className="absolute -top-1.5 -right-2 min-w-[18px] h-[18px] px-1 bg-[#10B981] text-white text-[10px] font-extrabold rounded-full flex items-center justify-center shadow-xs">
                  {cartCount}
                </span>
              </div>
              <span className="hidden sm:inline font-bold text-xs text-slate-800 group-hover:text-[#0052CC] transition">
                My Cart
              </span>
            </Link>

            {/* Mobile Hamburger Menu */}
            <button
              type="button"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg"
              aria-label="Toggle navigation"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile Search Input */}
        <form onSubmit={handleSearch} className="mt-3 md:hidden">
          <div className="relative flex items-center">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5" />
            <input
              type="text"
              value={searchVal}
              onChange={(e) => setSearchVal(e.target.value)}
              placeholder="Search medicines, brands..."
              className="w-full pl-10 pr-20 py-2 text-xs rounded-full border border-slate-300 bg-slate-50 text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-1 focus:ring-[#0052CC]"
            />
            <button
              type="submit"
              className="absolute right-1 px-4 py-1 bg-[#0052CC] text-white rounded-full text-xs font-semibold"
            >
              Search
            </button>
          </div>
        </form>
      </div>

      {/* 3. Sub-Navigation Bar with Category Dropdown & Nav Links */}
      <div className="border-t border-slate-200/90 bg-white hidden md:block">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between py-1.5">
          {/* Left: All Categories Button with Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={() => setCategoriesOpen(!categoriesOpen)}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#0052CC] hover:bg-[#0043A8] text-white rounded-lg text-xs font-bold transition shadow-xs"
            >
              <Menu className="w-3.5 h-3.5" />
              <span>All Categories</span>
              <ChevronDown
                className={`w-3.5 h-3.5 transition-transform duration-200 ${
                  categoriesOpen ? "rotate-180" : ""
                }`}
              />
            </button>

            {/* Categories Flyout Dropdown */}
            {categoriesOpen && (
              <div className="absolute left-0 top-full mt-2 w-72 bg-white rounded-xl shadow-xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-100 max-h-96 overflow-y-auto">
                <div className="px-3 py-1.5 border-b border-slate-100 text-[11px] font-bold text-slate-400 uppercase tracking-wider">
                  Therapeutic Categories
                </div>
                {categories.length > 0 ? (
                  categories.map((c) => (
                    <Link
                      key={c.id}
                      href={`/categories/${c.slug}`}
                      onClick={() => setCategoriesOpen(false)}
                      className="flex items-center justify-between px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-50 hover:text-[#0052CC] transition"
                    >
                      <span className="truncate">{c.name}</span>
                      <span className="text-[10px] text-slate-400 font-mono">→</span>
                    </Link>
                  ))
                ) : (
                  <div className="px-4 py-3 text-xs text-slate-400 text-center">
                    Loading categories...
                  </div>
                )}
                <div className="border-t border-slate-100 mt-1 pt-1">
                  <Link
                    href="/categories"
                    onClick={() => setCategoriesOpen(false)}
                    className="block px-4 py-2 text-xs font-bold text-[#0052CC] hover:bg-blue-50/50 text-center"
                  >
                    View All Categories →
                  </Link>
                </div>
              </div>
            )}
          </div>

          {/* Nav Items */}
          <nav className="flex items-center gap-1 lg:gap-3 overflow-x-auto whitespace-nowrap">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                    link.active
                      ? "bg-teal-50 text-[#0D9488] border border-teal-200"
                      : "text-slate-700 hover:text-[#0052CC] hover:bg-slate-50"
                  }`}
                >
                  <Icon
                    className={`w-3.5 h-3.5 ${
                      link.active ? "text-[#0D9488]" : "text-slate-500 group-hover:text-[#0052CC]"
                    }`}
                  />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </nav>
        </div>
      </div>

      {/* 4. Mobile Drawer Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg text-left">
          <div className="grid grid-cols-2 gap-2 text-xs font-semibold">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.label}
                  href={link.href}
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center gap-2 p-2 rounded-lg border border-slate-100 hover:bg-slate-50 text-slate-700"
                >
                  <Icon className="w-4 h-4 text-[#0052CC]" />
                  <span>{link.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="border-t border-slate-100 pt-3 space-y-2 text-xs font-medium text-slate-700">
            <Link
              href="/categories"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-1.5 hover:text-[#0052CC]"
            >
              <span>All Medicine Categories</span>
              <span>→</span>
            </Link>
            <Link
              href="/prescription/upload"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-between py-1.5 text-[#0D9488] font-bold"
            >
              <span>Upload Doctor Prescription (Rx)</span>
              <span>→</span>
            </Link>
            <Link
              href="/account/orders"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 hover:text-[#0052CC]"
            >
              My Orders & History
            </Link>
            <Link
              href="/contact"
              onClick={() => setMobileMenuOpen(false)}
              className="block py-1.5 text-slate-500 hover:text-slate-800"
            >
              24x7 Customer Support
            </Link>
          </div>
        </div>
      )}
    </header>
  );
};
