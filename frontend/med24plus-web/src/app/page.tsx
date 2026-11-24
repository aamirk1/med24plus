"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  ShieldCheck,
  Truck,
  Headphones,
  RotateCcw,
  Tag,
  ArrowRight,
  CheckCircle2,
  Pill,
  Sparkles,
  Thermometer,
  Baby,
  BriefcaseMedical,
  Heart,
  Grid,
  ChevronRight,
  Award,
} from "lucide-react";
import { catalogService } from "@/services/catalog.service";
import { Product } from "@/types";
import { ProductCard } from "@/components/ui/ProductCard";
import { MembershipBanner } from "@/components/common/MembershipBanner";
import { SmartSavingsWidget } from "@/components/common/SmartSavingsWidget";

// Quick Categories from Mockup
const QUICK_CATEGORIES = [
  {
    name: "Pain Relief",
    slug: "pain-analgesics",
    color: "from-blue-50 to-indigo-50 text-blue-600",
    icon: Pill,
  },
  {
    name: "Vitamins & Supplements",
    slug: "vitamins-nutrition",
    color: "from-sky-50 to-blue-50 text-sky-600",
    icon: Sparkles,
  },
  {
    name: "Personal Care",
    slug: "personal-care",
    color: "from-teal-50 to-emerald-50 text-teal-600",
    icon: Heart,
  },
  {
    name: "Health Devices",
    slug: "devices",
    color: "from-blue-50 to-cyan-50 text-blue-600",
    icon: Thermometer,
  },
  {
    name: "Baby Care",
    slug: "baby-care",
    color: "from-amber-50 to-orange-50 text-amber-600",
    icon: Baby,
  },
  {
    name: "First Aid",
    slug: "first-aid",
    color: "from-red-50 to-rose-50 text-red-600",
    icon: BriefcaseMedical,
  },
  {
    name: "Wellness",
    slug: "wellness",
    color: "from-emerald-50 to-green-50 text-emerald-600",
    icon: Sparkles,
  },
  {
    name: "View All",
    slug: "all",
    color: "from-slate-100 to-slate-200 text-slate-700",
    icon: Grid,
  },
];

const defaultProductProps = {
  images: [],
  description: "Authentic clinical formulation compliant with Drugs and Cosmetics Act.",
  keyBenefits: ["100% Genuine", "Pharmacist Verified"],
  directionsForUse: "As advised by your physician.",
  safetyInformation: ["Keep out of reach of children.", "Store in a cool, dry place."],
  manufacturer: "Licensed Manufacturer",
  countryOfOrigin: "India",
};

// Fallback high-demand Indian pharmaceuticals matching the mockup
const MOCKUP_DEAL_PRODUCTS: Product[] = [
  {
    ...defaultProductProps,
    id: "deal-1",
    name: "Crocin Advance Tablets (15s)",
    slug: "crocin-advance-tablets-15s",
    sku: "MED-CRO-ADV",
    brand: "Crocin",
    categorySlug: "pain-analgesics",
    categoryName: "Pain Relief",
    packSize: "15 Tablets / Strip",
    dosageForm: "Tablet",
    composition: "Paracetamol 650mg",
    mrp: 110,
    sellingPrice: 82,
    discountPercent: 25,
    requiresPrescription: false,
    scheduleType: "OTC",
    rating: 4.8,
    reviewCount: 342,
    inStock: true,
    stockCount: 150,
  },
  {
    ...defaultProductProps,
    id: "deal-2",
    name: "Dolo 650 Tablets (15s)",
    slug: "dolo-650-tablets-15s",
    sku: "MED-DOLO-650",
    brand: "Micro Labs",
    categorySlug: "pain-analgesics",
    categoryName: "Pain Relief",
    packSize: "15 Tablets / Strip",
    dosageForm: "Tablet",
    composition: "Paracetamol 650mg",
    mrp: 60,
    sellingPrice: 45,
    discountPercent: 25,
    requiresPrescription: false,
    scheduleType: "OTC",
    rating: 4.9,
    reviewCount: 520,
    inStock: true,
    stockCount: 200,
  },
  {
    ...defaultProductProps,
    id: "deal-3",
    name: "Ecosprin 75mg Tablets (15s)",
    slug: "ecosprin-75mg-tablets-15s",
    sku: "MED-ECO-75",
    brand: "USV Pharma",
    categorySlug: "cardiovascular",
    categoryName: "Cardiovascular",
    packSize: "15 Tablets / Strip",
    dosageForm: "Tablet",
    composition: "Aspirin 75mg",
    mrp: 85,
    sellingPrice: 65,
    discountPercent: 24,
    requiresPrescription: true,
    scheduleType: "SCHEDULE_H",
    rating: 4.7,
    reviewCount: 198,
    inStock: true,
    stockCount: 120,
  },
  {
    ...defaultProductProps,
    id: "deal-4",
    name: "Revital H Daily Health Capsules (30s)",
    slug: "revital-h-capsules-30s",
    sku: "MED-REV-30",
    brand: "Sun Pharma",
    categorySlug: "vitamins-nutrition",
    categoryName: "Vitamins & Nutrition",
    packSize: "30 Capsules / Bottle",
    dosageForm: "Capsule",
    composition: "Multivitamins + Minerals + Ginseng",
    mrp: 280,
    sellingPrice: 210,
    discountPercent: 25,
    requiresPrescription: false,
    scheduleType: "OTC",
    rating: 4.6,
    reviewCount: 412,
    inStock: true,
    stockCount: 85,
  },
  {
    ...defaultProductProps,
    id: "deal-5",
    name: "ORS Powder Electrolyte Drink (21.8g)",
    slug: "ors-powder-electrolyte-21g",
    sku: "MED-ORS-21",
    brand: "FDC Ltd",
    categorySlug: "gastrointestinal",
    categoryName: "Gastrointestinal",
    packSize: "21.8g Sachet",
    dosageForm: "Powder",
    composition: "Oral Rehydration Salts (WHO formula)",
    mrp: 25,
    sellingPrice: 18,
    discountPercent: 28,
    requiresPrescription: false,
    scheduleType: "OTC",
    rating: 4.9,
    reviewCount: 650,
    inStock: true,
    stockCount: 350,
  },
];

export default function HomePage() {
  const [dealProducts, setDealProducts] = useState<Product[]>(MOCKUP_DEAL_PRODUCTS);

  useEffect(() => {
    catalogService
      .getProducts({ page_size: 5 })
      .then((res) => {
        if (res?.items && res.items.length >= 3) {
          setDealProducts(res.items.slice(0, 5));
        }
      })
      .catch((err) => {
        console.warn("Using curated mockup deals:", err);
      });
  }, []);

  return (
    <div className="space-y-8 sm:space-y-12 pb-16 text-slate-800">
      {/* 1. Hero Banner Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-[#E6F3FB] via-[#EFF8FE] to-[#D9EDFC] border border-sky-100 p-8 sm:p-12 shadow-xs">
          {/* Background Decorative Rings */}
          <div className="absolute -right-20 -top-20 w-80 h-80 rounded-full bg-blue-200/30 blur-2xl pointer-events-none" />

          <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-6 text-left">
              <div>
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#0B3060] tracking-tight leading-[1.15]">
                  Your Trusted <br />
                  <span className="text-[#0052CC]">Online Pharmacy</span>
                </h1>
                <p className="text-sm sm:text-base font-semibold text-slate-500 mt-2">
                  Medicines &nbsp;|&nbsp; Health Services &nbsp;|&nbsp; Better Care
                </p>
              </div>

              {/* 4 Checklist Features */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs sm:text-sm font-semibold text-slate-700">
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span>Genuine Medicines</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span>Fast & Reliable Delivery</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span>Expert Doctor Consultation</span>
                </div>
                <div className="flex items-center gap-2.5">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  </div>
                  <span>Affordable Health Plans</span>
                </div>
              </div>

              {/* CTA Button */}
              <div className="pt-2">
                <Link
                  href="/products"
                  className="inline-flex items-center gap-2 px-7 py-3.5 bg-[#00A88F] hover:bg-[#008F7A] text-white rounded-xl font-bold text-sm shadow-md transition transform hover:scale-[1.02]"
                >
                  <span>Shop Now</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Right Hero Graphic Representation */}
            <div className="lg:col-span-5 flex items-center justify-center relative">
              {/* Circular Discount Badge */}
              <div className="absolute -top-3 right-4 z-20 w-24 h-24 rounded-full bg-[#0052CC] text-white shadow-lg flex flex-col items-center justify-center border-4 border-white transform rotate-6">
                <span className="text-[10px] font-bold uppercase tracking-wider text-sky-200">Up to</span>
                <span className="text-xl font-black leading-none">60%</span>
                <span className="text-xs font-extrabold text-amber-300">OFF</span>
              </div>

              {/* 3D Visual Composition */}
              <div className="relative w-full max-w-sm h-64 sm:h-72 rounded-3xl bg-gradient-to-tr from-white/90 to-blue-50/80 border border-white/60 p-6 shadow-sm flex items-center justify-center">
                {/* Pill bottle with cross */}
                <div className="relative flex flex-col items-center justify-center">
                  <div className="w-24 h-36 rounded-2xl bg-white border-2 border-slate-200 shadow-md flex flex-col items-center justify-between p-2">
                    <div className="w-16 h-4 bg-slate-200 rounded-md" />
                    <div className="w-12 h-12 rounded-full bg-blue-50 text-[#0052CC] flex items-center justify-center">
                      <Pill className="w-6 h-6 text-[#0052CC]" />
                    </div>
                    <div className="w-16 h-2 bg-slate-100 rounded" />
                  </div>
                </div>

                {/* Blister Strip Graphic */}
                <div className="absolute left-6 bottom-4 w-28 h-20 rounded-xl bg-white/90 border border-slate-300 shadow-sm p-2 grid grid-cols-4 gap-1.5 transform -rotate-12">
                  {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="w-4 h-4 rounded-full bg-sky-200/80 border border-sky-300" />
                  ))}
                </div>

                {/* Loose capsules */}
                <div className="absolute right-8 bottom-6 flex items-center gap-2 transform rotate-12">
                  <div className="w-7 h-3 rounded-full bg-amber-400 border border-amber-500 shadow-xs" />
                  <div className="w-7 h-3 rounded-full bg-red-400 border border-red-500 shadow-xs" />
                </div>
              </div>
            </div>
          </div>

          {/* Carousel Indicator Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-6">
            <span className="w-2.5 h-2.5 rounded-full bg-[#0052CC]" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
            <span className="w-2 h-2 rounded-full bg-slate-300" />
          </div>
        </div>
      </section>

      {/* 2. Quick Categories Grid (8 Cards matching Mockup) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-3 sm:gap-4">
          {QUICK_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const targetUrl = cat.slug === "all" ? "/categories" : `/products?category=${cat.slug}`;
            return (
              <Link
                key={cat.name}
                href={targetUrl}
                className="group flex flex-col items-center justify-center p-3 sm:p-4 rounded-2xl bg-white border border-slate-200/90 hover:border-[#0052CC] hover:shadow-md transition-all text-center"
              >
                <div
                  className={`w-12 h-12 rounded-full bg-gradient-to-br ${cat.color} flex items-center justify-center mb-2.5 group-hover:scale-110 transition-transform`}
                >
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-xs font-bold text-slate-800 group-hover:text-[#0052CC] transition line-clamp-2">
                  {cat.name}
                </span>
                {cat.slug === "all" && (
                  <span className="text-[10px] text-[#0052CC] font-bold mt-0.5">Explore →</span>
                )}
              </Link>
            );
          })}
        </div>
      </section>

      {/* Smart Savings - Compare Brand Substitutes Showcase (Matches Mockup) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <SmartSavingsWidget />
      </section>

      {/* 3. "Great Deals for You" Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-4">
        {/* Section Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Tag className="w-5 h-5 text-[#0052CC]" />
            <h2 className="text-lg sm:text-xl font-extrabold text-slate-900 tracking-tight">
              Great Deals for You
            </h2>
          </div>
          <Link
            href="/products"
            className="text-xs font-bold text-[#0052CC] hover:text-[#0043A8] flex items-center gap-1 transition"
          >
            <span>View All Offers</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
        </div>

        {/* 5-Column Product Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3.5">
          {dealProducts.map((p, idx) => (
            <ProductCard key={p.id} product={p} isBestSeller={idx === 0} />
          ))}
        </div>
      </section>

      {/* 4. Trust & Quality Assurance Pillars (4 Columns) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="rounded-2xl bg-sky-50/70 border border-sky-100 p-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
                <ShieldCheck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">100% Genuine</h4>
                <p className="text-[11px] text-slate-500">Medicines direct from licensed sources</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Fast Delivery</h4>
                <p className="text-[11px] text-slate-500">Across India with cold-chain care</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center shrink-0">
                <Headphones className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">24x7 Customer Support</h4>
                <p className="text-[11px] text-slate-500">Supervising pharmacists on duty</p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
                <RotateCcw className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-xs text-slate-900">Easy Returns</h4>
                <p className="text-[11px] text-slate-500">& Hassle-free refunds policy</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 5. Med24Plus Membership Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <MembershipBanner variant="heart" />
      </section>
    </div>
  );
}
