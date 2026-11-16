"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { RadioButton } from "@/components/ui/RadioButton";
import { formatPriceINR } from "@/lib/utils";
import { MOCK_ADDRESSES, MOCK_PRODUCTS } from "@/mock/data";
import {
  ShieldCheck,
  UploadCloud,
  CheckCircle2,
  AlertTriangle,
  CreditCard,
  QrCode,
  Banknote,
  Building,
  Lock,
} from "lucide-react";

export default function CheckoutPage() {
  const [selectedAddressId, setSelectedAddressId] = useState(MOCK_ADDRESSES[0].id);
  const [paymentMethod, setPaymentMethod] = useState<string>("upi");
  const [hasUploadedRx, setHasUploadedRx] = useState(false);
  const [orderPlaced, setOrderPlaced] = useState(false);

  const orderTotal = 2320;

  const handlePlaceOrder = (e: React.FormEvent) => {
    e.preventDefault();
    setOrderPlaced(true);
  };

  if (orderPlaced) {
    return (
      <div className="max-w-xl mx-auto px-4 py-16 text-center space-y-6">
        <div className="w-16 h-16 rounded-full bg-[#E6F4EF] text-[#087F5B] flex items-center justify-center mx-auto">
          <CheckCircle2 className="w-10 h-10" />
        </div>
        <div className="space-y-2">
          <span className="text-xs font-bold text-[#087F5B] bg-[#E6F4EF] px-2.5 py-1 rounded-full uppercase tracking-wider">
            Demo Order Placed Successfully
          </span>
          <h1 className="text-2xl font-bold text-[#172B24]">Order #MED24-2026-9921</h1>
          <p className="text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
            Thank you! This is a Phase 2 UI demonstration. In production, our Registered Pharmacist will verify any uploaded prescription and confirm your delivery slot.
          </p>
        </div>

        <div className="bg-slate-50 rounded-xl p-5 text-left border border-slate-200 text-xs space-y-2">
          <div className="flex justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Amount to Pay (COD/UPI):</span>
            <strong className="text-[#172B24]">{formatPriceINR(orderTotal)}</strong>
          </div>
          <div className="flex justify-between pb-2 border-b border-slate-200">
            <span className="text-slate-500">Delivery Address:</span>
            <span className="text-right font-medium text-slate-700">Flat 402, Green Glen Heights, Bengaluru 560103</span>
          </div>
          <div className="flex justify-between">
            <span className="text-slate-500">Pharmacist Status:</span>
            <span className="text-amber-700 font-bold">Assigned to Lead Pharmacist</span>
          </div>
        </div>

        <div className="flex justify-center gap-3">
          <Link href="/account/orders">
            <Button variant="primary" size="md">
              View Order Tracking
            </Button>
          </Link>
          <Link href="/">
            <Button variant="outline" size="md">
              Return to Home
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Cart", href: "/cart" },
          { label: "Secure Checkout" },
        ]}
      />

      <div className="pb-3 border-b border-slate-200 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[#172B24]">Secure Checkout</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Complete your delivery details and choose your preferred Indian payment method
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-[#087F5B] bg-[#E6F4EF] px-3 py-1 rounded-full font-semibold">
          <Lock className="w-3.5 h-3.5" />
          <span>256-Bit SSL Encrypted</span>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Form Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Customer Contact */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4">
            <h2 className="text-sm font-bold text-[#172B24] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#087F5B] text-white text-xs flex items-center justify-center">1</span>
              <span>Patient & Customer Information</span>
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Full Name" defaultValue="Aarav Sharma" required />
              <Input label="Mobile Number (+91)" defaultValue="+91 98451 22340" required helperText="For delivery OTP and pharmacist call" />
              <Input label="Email Address" defaultValue="aarav.sharma@example.com" type="email" />
              <Input label="Age / Date of Birth" defaultValue="34 Years" helperText="Required for clinical dispensing records" />
            </div>
          </div>

          {/* Section 2: Delivery Address Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#172B24] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#087F5B] text-white text-xs flex items-center justify-center">2</span>
                <span>Select Delivery Address</span>
              </h2>
              <button type="button" className="text-xs text-[#087F5B] font-semibold hover:underline">
                + Add New Address
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {MOCK_ADDRESSES.map((addr) => (
                <div
                  key={addr.id}
                  onClick={() => setSelectedAddressId(addr.id)}
                  className={`p-4 rounded-xl border cursor-pointer transition ${
                    selectedAddressId === addr.id
                      ? "border-[#087F5B] bg-[#E6F4EF]/20 shadow-xs"
                      : "border-slate-200 bg-white hover:border-slate-300"
                  }`}
                >
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="text-xs font-bold text-[#172B24]">{addr.type}</span>
                    {addr.isDefault && (
                      <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                        Default
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-slate-800">{addr.fullName} • {addr.phone}</p>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                    {addr.addressLine1}, {addr.addressLine2 && `${addr.addressLine2}, `}{addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Section 3: Prescription Upload Placeholder */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#172B24] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#087F5B] text-white text-xs flex items-center justify-center">3</span>
                <span>Doctor&apos;s Prescription (Optional / If Required)</span>
              </h2>
              <span className="text-[11px] text-slate-400">Rule 65 Compliant</span>
            </div>

            <div className="border-2 border-dashed border-slate-300 rounded-xl p-5 text-center bg-slate-50/60">
              <UploadCloud className="w-8 h-8 text-[#087F5B] mx-auto mb-1.5" />
              <p className="text-xs font-bold text-[#172B24]">
                {hasUploadedRx ? "Prescription Attached: DrMurthy_Nov2026.pdf" : "Attach Prescription for Schedule H Drugs"}
              </p>
              <p className="text-[11px] text-slate-500 mt-0.5">
                Our registered pharmacist will verify doctor credentials and dosage before packing.
              </p>
              <button
                type="button"
                onClick={() => setHasUploadedRx(!hasUploadedRx)}
                className="mt-3 text-xs font-semibold text-[#087F5B] hover:underline"
              >
                {hasUploadedRx ? "Remove Prescription" : "+ Simulate Uploading Prescription"}
              </button>
            </div>
          </div>

          {/* Section 4: Payment Method Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4">
            <h2 className="text-sm font-bold text-[#172B24] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#087F5B] text-white text-xs flex items-center justify-center">4</span>
              <span>Payment Method (India)</span>
            </h2>

            <div className="space-y-2.5">
              <label
                onClick={() => setPaymentMethod("upi")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "upi" ? "border-[#087F5B] bg-[#E6F4EF]/30" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 text-[#087F5B] flex items-center justify-center">
                    <QrCode className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#172B24] block">UPI / QR Code (Instant)</span>
                    <span className="text-[11px] text-slate-500">Google Pay, PhonePe, Paytm, BHIM UPI</span>
                  </div>
                </div>
                <input type="radio" checked={paymentMethod === "upi"} readOnly className="accent-[#087F5B]" />
              </label>

              <label
                onClick={() => setPaymentMethod("cards")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "cards" ? "border-[#087F5B] bg-[#E6F4EF]/30" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-blue-50 text-[#2563EB] flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#172B24] block">Credit / Debit Cards</span>
                    <span className="text-[11px] text-slate-500">Visa, Mastercard, RuPay & Corporate Cards</span>
                  </div>
                </div>
                <input type="radio" checked={paymentMethod === "cards"} readOnly className="accent-[#087F5B]" />
              </label>

              <label
                onClick={() => setPaymentMethod("cod")}
                className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "cod" ? "border-[#087F5B] bg-[#E6F4EF]/30" : "border-slate-200 hover:bg-slate-50"
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center">
                    <Banknote className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-[#172B24] block">Cash on Delivery (COD)</span>
                    <span className="text-[11px] text-slate-500">Pay cash or UPI to delivery agent at door</span>
                  </div>
                </div>
                <input type="radio" checked={paymentMethod === "cod"} readOnly className="accent-[#087F5B]" />
              </label>
            </div>
          </div>
        </div>

        {/* Right Summary Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4 text-xs">
            <h3 className="font-bold text-sm text-[#172B24] pb-2 border-b border-slate-100">
              Order Summary (2 Items)
            </h3>

            <div className="space-y-3 pb-3 border-b border-slate-100">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-[#172B24]">Accu-Chek Active Strips</p>
                  <p className="text-[11px] text-slate-400">Qty: 2 • Box of 50</p>
                </div>
                <span className="font-semibold text-slate-800">{formatPriceINR(1890)}</span>
              </div>
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-bold text-[#172B24]">Calcirol D3 60,000 IU Oral Solution</p>
                  <p className="text-[11px] text-slate-400">Qty: 4 • 5ml Shots</p>
                </div>
                <span className="font-semibold text-slate-800">{formatPriceINR(420)}</span>
              </div>
            </div>

            <div className="space-y-2 text-slate-600">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>{formatPriceINR(2310)}</span>
              </div>
              <div className="flex justify-between text-[#087F5B]">
                <span>Coupon (MED24):</span>
                <span>- {formatPriceINR(100)}</span>
              </div>
              <div className="flex justify-between">
                <span>Delivery:</span>
                <span className="text-[#087F5B] font-bold">FREE</span>
              </div>
              <div className="flex justify-between">
                <span>GST (CGST + SGST):</span>
                <span>{formatPriceINR(110)}</span>
              </div>
            </div>

            <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
              <span className="text-sm font-bold text-[#172B24]">Total Payable:</span>
              <span className="text-xl font-extrabold text-[#172B24]">
                {formatPriceINR(orderTotal)}
              </span>
            </div>

            <Button
              variant="primary"
              size="lg"
              onClick={handlePlaceOrder}
              className="w-full shadow-sm"
            >
              Place Demo Order
            </Button>

            <div className="p-3 bg-slate-50 rounded-lg text-[10px] text-slate-500 text-center leading-relaxed">
              <p className="font-semibold text-slate-700">Indian Drugs & Cosmetics Act Notice:</p>
              <p>Prescription drugs are checked by Registered Pharmacist prior to packing. No payment charged if Rx is unapproved.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

