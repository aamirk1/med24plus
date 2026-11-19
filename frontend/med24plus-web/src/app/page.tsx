"use client";

import React from "react";
import Link from "next/link";
import {
  UploadCloud,
  ShieldCheck,
  Award,
  Clock,
  ChevronRight,
  ArrowRight,
  HeartPulse,
  Activity,
  CheckCircle2,
  FileCheck,
  UserCheck,
  ThermometerSnowflake,
  Smartphone,
  Mail,
  Sparkles,
  Zap,
} from "lucide-react";
import { MOCK_CATEGORIES, MOCK_PRODUCTS } from "@/mock/data";
import { ProductCard } from "@/components/ui/ProductCard";
import { CategoryCard } from "@/components/ui/CategoryCard";
import { Button } from "@/components/ui/Button";

export default function HomePage() {
  const popularProducts = MOCK_PRODUCTS.slice(0, 4);

                      return (
                      <div className="space-y-12 pb-16">
                        {/* 5. Hero Banner Section */}
                        <section className="relative overflow-hidden bg-gradient-to-b from-[#F0FDFA]/70 via-white to-slate-50 pt-8 pb-14 border-b border-slate-100">
                          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                            <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
                              {/* Left Content */}
                              <div className="lg:col-span-7 space-y-6 text-left">
                                <div className="inline-flex items-center gap-2 bg-teal-50 border border-teal-200 text-teal-800 px-3.5 py-1.5 rounded-full text-xs font-semibold">
                                  <span className="w-2 h-2 rounded-full bg-[#0D9488] animate-pulse" />
                                  Licensed Indian Retail Community Pharmacy • Form 20/21
                                </div>

                                  <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[#172B24] tracking-tight leading-tight">
                                    Authentic Medicines, <br />
                                    <span className="text-[#0D9488]">Pharmacist Verified</span>, <br />
                                    Delivered With Care.
                                  </h1>

                                    <p className="text-sm sm:text-base text-slate-600 max-w-xl leading-relaxed">
                                      Order genuine chronic care and prescription medications from Med24Plus. Compliant with Indian Pharmacy Regulations (Rule 65), featuring temperature-controlled cold-chain delivery and supervising pharmacist consultations.
                                    </p>

                                        {/* Action Buttons */}
                                        <div className="flex flex-col sm:flex-row gap-3 pt-2">
                                          <Link
                                            href="/prescription/upload"
                                            className="inline-flex items-center justify-center gap-2 bg-[#0D9488] hover:bg-[#0F766E] text-white px-6 py-3.5 rounded-xl font-bold text-xs shadow-md transition"
                                          >
                                            <UploadCloud className="w-4 h-4" />
                                            <span>Upload Doctor&apos;s Prescription</span>
                                          </Link>

                                        <Link
                                          href="/products"
                                          className="inline-flex items-center justify-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 text-slate-700 px-6 py-3.5 rounded-xl font-semibold text-xs shadow-sm transition"
                                        >
                                          <span>Browse All Medicines</span>
                                          <ArrowRight className="w-4 h-4" />
                                        </Link>
                                    </div>

                                    {/* Trust Indicators */}
                                    <div className="grid grid-cols-3 gap-3 pt-4 border-t border-slate-200/80">
                                      <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <ShieldCheck className="w-4 h-4 text-[#0D9488] shrink-0" />
                                        <span className="text-[11px] font-medium">100% Genuine Direct</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <UserCheck className="w-4 h-4 text-[#2563EB] shrink-0" />
                                        <span className="text-[11px] font-medium">PCI Registered Pharmacists</span>
                                      </div>
                                      <div className="flex items-center gap-2 text-xs text-slate-600">
                                        <ThermometerSnowflake className="w-4 h-4 text-sky-600 shrink-0" />
                                        <span className="text-[11px] font-medium">Cold-Chain Assured</span>
                                      </div>
                                    </div>
                                  </div>

                                              {/* Right Card / Upload Widget */}
                                              <div className="lg:col-span-5">
                                                <div className="bg-white rounded-2xl border border-slate-200/90 shadow-elevated p-6 space-y-4 text-left">
                                                  <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                                                    <div className="flex items-center gap-2">
                                                      <div className="w-8 h-8 rounded-lg bg-[#F0FDFA] flex items-center justify-center text-[#0D9488]">
                                                        <UploadCloud className="w-4 h-4" />
                                                      </div>
                                                      <div>
                                                        <h3 className="text-xs font-bold text-[#172B24]">Quick Prescription Order</h3>
                                                        <p className="text-[10px] text-slate-400">Rule 65 Compliant Digital Dispensing</p>
                                                      </div>
                                                    </div>
                                                    <span className="text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full">
                                                      Rx Required
                                                    </span>
                                                  </div>

                                                    <div className="border-2 border-dashed border-[#0D9488]/30 rounded-xl p-6 text-center bg-[#F0FDFA]/20 hover:bg-[#F0FDFA]/40 transition cursor-pointer">
                                                      <UploadCloud className="w-10 h-10 text-[#0D9488] mx-auto mb-2" />
                                                      <p className="text-xs font-bold text-[#172B24]">Drag & Drop your prescription here</p>
                                                      <p className="text-[10px] text-slate-500 mt-1">Supports Clear Camera Photos, PDF, JPG, PNG (up to 10MB)</p>
                                                      <Link
                                                        href="/prescription/upload"
                                                        className="inline-block mt-3 px-4 py-1.5 bg-[#0D9488] text-white text-[11px] font-bold rounded-lg shadow-sm"
                                                      >
                                                        Select File to Upload
                                                      </Link>
                                                    </div>

                                                        <div className="space-y-1.5 text-[11px] text-slate-500">
                                                          <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                                                            <span>Our Registered Pharmacist verifies your prescription</span>
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                                                            <span>Confirmation phone call / WhatsApp for dose instructions</span>
                                                          </div>
                                                          <div className="flex items-center gap-2">
                                                            <CheckCircle2 className="w-3.5 h-3.5 text-[#0D9488] shrink-0" />
                                                            <span>Dispensed with FEFO batch number & expiry printed cash memo</span>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </div>
                                              </section>

                                    {/* 6. Shop by Category */}
                                    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                      <div className="flex items-center justify-between mb-6">
                                        <div className="text-left">
                                          <h2 className="text-xl sm:text-2xl font-bold text-[#172B24] tracking-tight">
                                            Shop by Therapeutic Category
                                          </h2>
                                          <p className="text-xs text-slate-500 mt-1">
                                            Curated healthcare essentials, chronic conditions, and daily wellness items.
                                          </p>
                                        </div>
                                        <Link
                                          href="/categories"
                                          className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 shrink-0"
                                        >
                                          <span>View All</span>
                                          <ChevronRight className="w-4 h-4" />
                                        </Link>
                                      </div>

                                                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
                                                    {MOCK_CATEGORIES.map((category) => (
                                                      <CategoryCard key={category.id} category={category} />
                                                    ))}
                                                  </div>
                                                </section>

                                                {/* 7. Popular Products Section */}
                                                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                  <div className="flex items-center justify-between mb-6">
                                                    <div className="text-left">
                                                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0D9488] bg-[#F0FDFA] px-2.5 py-0.5 rounded-full mb-1">
                                                        <Sparkles className="w-3 h-3" />
                                                        <span>Verified Essentials</span>
                                                      </div>
                                                        <h2 className="text-xl sm:text-2xl font-bold text-[#172B24] tracking-tight">
                                                          Frequently Dispensed Healthcare Products
                                                        </h2>
                                                    </div>
                                                    <Link
                                                      href="/products"
                                                      className="text-xs font-semibold text-[#0D9488] hover:text-[#0F766E] flex items-center gap-1 shrink-0"
                                                    >
                                                      <span>Explore Catalog</span>
                                                      <ChevronRight className="w-4 h-4" />
                                                    </Link>
                                                  </div>

                                                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                                                  {popularProducts.map((product) => (
                                                    <ProductCard key={product.id} product={product} />
                                                  ))}
                                                </div>
                                              </section>

                                                    {/* 8. Health and Wellness Promotional Section */}
                                                    <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                      <div className="bg-gradient-to-r from-[#0F766E] to-[#0D9488] rounded-2xl text-white p-6 sm:p-10 relative overflow-hidden shadow-card">
                                                        <div className="relative z-10 max-w-xl space-y-4 text-left">
                                                          <span className="text-[11px] font-bold uppercase tracking-wider bg-white/20 px-3 py-1 rounded-full">
                                                            Chronic Care Special
                                                          </span>
                                                          <h3 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
                                                            Timely Refills for Diabetes & Hypertension
                                                          </h3>
                                                          <p className="text-xs sm:text-sm text-teal-100 leading-relaxed">
                                                            Never run out of essential maintenance doses. Upload your doctor&apos;s prescription once and enjoy priority FEFO dispatch, insulated temperature packing, and free delivery on orders above ₹499.
                                                          </p>
                                                          <div className="pt-2 flex items-center gap-3">
                                                            <Link
                                                              href="/prescription/upload"
                                                              className="px-5 py-2.5 bg-white text-[#0D9488] hover:bg-teal-50 rounded-xl text-xs font-bold shadow-sm transition"
                                                            >
                                                              Set Up Monthly Refill
                                                            </Link>
                                                          </div>
                                                        </div>
                                                      </div>
                                                    </section>

                                                              {/* 9. Why Choose Us Section */}
                                                              <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                                <div className="text-center max-w-2xl mx-auto mb-10">
                                                                  <h2 className="text-xl sm:text-2xl font-bold text-[#172B24] tracking-tight">
                                                                    Why Bengaluru Families Trust Med24Plus
                                                                  </h2>
                                                                  <p className="text-xs text-slate-500 mt-1">
                                                                    Built as a patient-first licensed community pharmacy, combining clinical safety with hyper-local delivery speed.
                                                                  </p>
                                                                </div>

                                                            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                                                              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle space-y-3">
                                                                <div className="w-10 h-10 rounded-xl bg-teal-50 text-[#0D9488] flex items-center justify-center">
                                                                  <ShieldCheck className="w-5 h-5" />
                                                                </div>
                                                                <h4 className="font-bold text-xs text-[#172B24]">Licensed Single Pharmacy</h4>
                                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                                  Zero third-party marketplace sellers. All medicines originate from our own registered retail pharmacy shelves.
                                                                </p>
                                                              </div>

                                                              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle space-y-3">
                                                                <div className="w-10 h-10 rounded-xl bg-blue-50 text-[#2563EB] flex items-center justify-center">
                                                                  <UserCheck className="w-5 h-5" />
                                                                </div>
                                                                <h4 className="font-bold text-xs text-[#172B24]">Pharmacist Triage on Every Rx</h4>
                                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                                  Pharmacy Council registered pharmacists check medicine dosage, contraindications, and expiry dates before packaging.
                                                                </p>
                                                              </div>

                                                              <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle space-y-3">
                                                                <div className="w-10 h-10 rounded-xl bg-sky-50 text-sky-600 flex items-center justify-center">
                                                                  <ThermometerSnowflake className="w-5 h-5" />
                                                                </div>
                                                                <h4 className="font-bold text-xs text-[#172B24]">Cold-Chain Packaging</h4>
                                                                <p className="text-[11px] text-slate-500 leading-relaxed">
                                                                  Biologics, insulins, and vaccines delivered in calibrated cooling containers maintaining 2°C to 8°C throughout transit.
                                                                </p>
                                                              </div>

                                                          <div className="bg-white p-5 rounded-xl border border-slate-200/80 shadow-subtle space-y-3">
                                                            <div className="w-10 h-10 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                                                              <Clock className="w-5 h-5" />
                                                            </div>
                                                            <h4 className="font-bold text-xs text-[#172B24]">Same-Day Home Dispatch</h4>
                                                            <p className="text-[11px] text-slate-500 leading-relaxed">
                                                              Fast, reliable dispatch across Bengaluru urban pincodes directly from our Koramangala dispensary.
                                                            </p>
                                                          </div>
                                                        </div>
      </section>

                                                        {/* 10. How Ordering Works */}
                                                        <section className="bg-slate-50 py-12 border-y border-slate-200">
                                                          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                            <div className="text-center max-w-2xl mx-auto mb-10">
                                                              <h2 className="text-xl sm:text-2xl font-bold text-[#172B24] tracking-tight">
                                                                How Prescription Dispensing Works
                                                              </h2>
                                                              <p className="text-xs text-slate-500 mt-1">
                                                                Compliant, safe, and transparent in 4 straightforward steps.
                                                              </p>
                                                            </div>

                                                              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-left">
                                                                <div className="space-y-2">
                                                                  <span className="w-7 h-7 rounded-full bg-[#0D9488] text-white text-xs font-bold flex items-center justify-center">
                                                                    1
                                                                  </span>
                                                                  <h4 className="font-bold text-xs text-[#172B24] mt-2">Upload Prescription</h4>
                                                                  <p className="text-[11px] text-slate-500 leading-relaxed">
                                                                    Take a photo or upload a PDF of your doctor&apos;s signed prescription.
                                                                  </p>
                                                                </div>

                                                                <div className="space-y-2">
                                                                  <span className="w-7 h-7 rounded-full bg-[#0D9488] text-white text-xs font-bold flex items-center justify-center">
                                                                    2
                                                                  </span>
                                                                  <h4 className="font-bold text-xs text-[#172B24] mt-2">Pharmacist Verification</h4>
                                                                  <p className="text-[11px] text-slate-500 leading-relaxed">
                                                                    Our registered pharmacist validates the doctor&apos;s registration and confirms dosages.
                                                                  </p>
                                                                </div>

                                                        <div className="space-y-2">
                                                          <span className="w-7 h-7 rounded-full bg-[#0D9488] text-white text-xs font-bold flex items-center justify-center">
                                                            3
                                                          </span>
                                                          <h4 className="font-bold text-xs text-[#172B24] mt-2">FEFO Batch Packing</h4>
                                                          <p className="text-[11px] text-slate-500 leading-relaxed">
                                                            Medicines are picked adhering strictly to earliest expiry first-out rules and tamper-sealed.
                                                          </p>
                                                        </div>

                                                        <div className="space-y-2">
                                                          <span className="w-7 h-7 rounded-full bg-[#0D9488] text-white text-xs font-bold flex items-center justify-center">
                                                            4
                                                          </span>
                                                          <h4 className="font-bold text-xs text-[#172B24] mt-2">Doorstep Delivery</h4>
                                                          <p className="text-[11px] text-slate-500 leading-relaxed">
                                                            Delivered safely to your door with a printed Form 20 cash memo containing batch numbers.
                                                          </p>
                                                        </div>
                                                      </div>
                                                    </div>
                                                  </section>

                                                {/* 11. App Download Promotion Section */}
                                                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                  <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-subtle">
                                                    <div className="space-y-2 text-left">
                                                      <div className="inline-flex items-center gap-1.5 text-[11px] font-bold text-[#0D9488] bg-[#F0FDFA] px-2.5 py-0.5 rounded-full">
                                                        <Smartphone className="w-3.5 h-3.5" />
                                                        <span>Med24Plus Mobile App</span>
                                                      </div>
                                                      <h3 className="text-xl sm:text-2xl font-bold text-[#172B24]">
                                                        Manage Prescriptions & Refills on the Go
                                                      </h3>
                                                      <p className="text-xs text-slate-500 max-w-lg leading-relaxed">
                                                        Download the Med24Plus Android & iOS app for camera prescription scanning, timely dosage reminders, and instant dispatch notifications.
                                                      </p>
                                                    </div>
                                                    <div className="flex items-center gap-3 shrink-0">
                                                      <div className="border border-slate-300 rounded-xl px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-50 flex items-center gap-2">
                                                        <Smartphone className="w-4 h-4 text-[#0D9488]" />
                                                        <span>Android & iOS Ready</span>
                                                      </div>
                                                    </div>
                                                  </div>
                                                </section>

                                                {/* 12. Newsletter & Contact Section */}
                                                <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                                                  <div className="rounded-2xl bg-slate-900 text-white p-6 sm:p-8 flex flex-col md:flex-row items-center justify-between gap-6">
                                                    <div className="space-y-1 text-left">
                                                      <h3 className="text-lg font-bold">Stay Updated with Health & Medication Advisories</h3>
                                                      <p className="text-xs text-slate-400">
                                                        Receive health tips, drug safety alerts, and seasonal wellness reminders. Zero spam.
                                                      </p>
                                                    </div>
                                                    <div className="w-full md:w-auto flex items-center gap-2">
                                                      <input
                                                        type="email"
                                                        placeholder="Enter your email address"
                                                        className="px-3.5 py-2 text-xs rounded-lg bg-slate-800 border border-slate-700 text-white placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-[#0D9488] w-full md:w-64"
                                                      />
                                                      <Button variant="primary" size="sm" className="shrink-0">
                                                        Subscribe
                                                      </Button>
                                                    </div>
                                                  </div>
                                                </section>
                                              </div>
                                            );
}
