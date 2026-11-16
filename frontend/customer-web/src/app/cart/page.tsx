"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { PriceDisplay } from "@/components/ui/PriceDisplay";
import { PrescriptionBadge } from "@/components/ui/PrescriptionBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPriceINR } from "@/lib/utils";
import { MOCK_PRODUCTS } from "@/mock/data";
import { CartItem } from "@/types";
import {
  ShoppingBag,
  Trash2,
  Tag,
  ArrowRight,
  ShieldCheck,
  Truck,
  AlertTriangle,
  ArrowLeft,
} from "lucide-react";

export default function CartPage() {
  const [cartItems, setCartItems] = useState<CartItem[]>([
    { product: MOCK_PRODUCTS[0], quantity: 2 },
    { product: MOCK_PRODUCTS[2], quantity: 3 },
  ]);
  const [couponCode, setCouponCode] = useState("");
  const [couponApplied, setCouponApplied] = useState(false);

  const updateQuantity = (productId: string, delta: number) => {
    setCartItems((items) =>
      items
        .map((item) => {
          if (item.product.id === productId) {
            const newQty = item.quantity + delta;
            return newQty > 0 ? { ...item, quantity: newQty } : null;
          }
          return item;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeItem = (productId: string) => {
    setCartItems((items) => items.filter((item) => item.product.id !== productId));
  };

  const subtotal = cartItems.reduce(
    (acc, item) => acc + item.product.sellingPrice * item.quantity,
    0
  );
  const mrpTotal = cartItems.reduce(
    (acc, item) => acc + item.product.mrp * item.quantity,
    0
  );
  const totalSavings = mrpTotal - subtotal;
  const couponDiscount = couponApplied ? 100 : 0;
  const deliveryFee = subtotal > 500 ? 0 : 49;
  const grandTotal = Math.max(0, subtotal - couponDiscount + deliveryFee);

  const hasRxItem = cartItems.some((item) => item.product.requiresPrescription);

  const handleApplyCoupon = (e: React.FormEvent) => {
    e.preventDefault();
    if (couponCode.trim().toUpperCase() === "MED24" || couponCode.trim().toUpperCase() === "HEALTH100") {
      setCouponApplied(true);
    } else {
      alert("Invalid demo coupon. Try 'MED24' for ₹100 discount.");
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb items={[{ label: "Shopping Cart", href: "/cart" }]} />

      <div className="pb-3 border-b border-slate-200">
        <h1 className="text-2xl font-bold text-[#172B24]">Your Medicine Cart</h1>
        <p className="text-xs text-slate-500 mt-0.5">
          {cartItems.length} item(s) ready for pharmacist verification and packing
        </p>
      </div>

      {cartItems.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Cart Items List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free Delivery Callout */}
            <div className="bg-[#E6F4EF]/70 border border-[#C3E7DB] rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#066649]">
              <Truck className="w-4 h-4 text-[#087F5B] shrink-0" />
              <span>
                {deliveryFee === 0 ? (
                  <><strong>Eligible for Free Delivery!</strong> Order value exceeds ₹500.</>
                ) : (
                  <>Add ₹{500 - subtotal} more of eligible health products for <strong>Free Delivery</strong>.</>
                )}
              </span>
            </div>

            {/* Prescription Banner if applicable */}
            {hasRxItem && (
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 text-xs text-amber-900 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold">Prescription Required Items in Cart:</strong>
                  <p className="text-[11px] text-amber-800 mt-0.5">
                    Your cart contains Schedule H medicines. You can attach your prescription in the next step.
                  </p>
                </div>
              </div>
            )}

            {/* Cart Items Table */}
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-subtle overflow-hidden">
              {cartItems.map((item) => (
                <div key={item.product.id} className="p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[#087F5B] shrink-0">
                      <ShoppingBag className="w-7 h-7" />
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[11px] font-semibold text-slate-500">{item.product.brand}</span>
                        <PrescriptionBadge
                          required={item.product.requiresPrescription}
                          scheduleType={item.product.scheduleType}
                        />
                      </div>
                      <Link href={`/products/${item.product.slug}`} className="font-bold text-xs sm:text-sm text-[#172B24] hover:text-[#087F5B] transition">
                        {item.product.name}
                      </Link>
                      <p className="text-[11px] text-slate-400">Pack: {item.product.packSize}</p>
                    </div>
                  </div>

                  {/* Quantity & Price */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:pl-4">
                    <QuantitySelector
                      quantity={item.quantity}
                      onIncrement={() => updateQuantity(item.product.id, 1)}
                      onDecrement={() => updateQuantity(item.product.id, -1)}
                      size="sm"
                    />

                    <div className="text-right min-w-[80px]">
                      <span className="font-bold text-sm text-[#172B24] block">
                        {formatPriceINR(item.product.sellingPrice * item.quantity)}
                      </span>
                      {item.product.mrp > item.product.sellingPrice && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatPriceINR(item.product.mrp * item.quantity)}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.product.id)}
                      className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-50 transition"
                      aria-label="Remove item"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between pt-2">
              <Link href="/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#087F5B] hover:underline">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>

          {/* Right: Bill Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            {/* Coupon Box */}
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-subtle space-y-3">
              <div className="flex items-center gap-1.5 text-xs font-bold text-[#172B24]">
                <Tag className="w-4 h-4 text-[#087F5B]" />
                <span>Apply Promo Code</span>
              </div>
              <form onSubmit={handleApplyCoupon} className="flex gap-2">
                <input
                  type="text"
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value)}
                  placeholder="Enter 'MED24'"
                  className="w-full px-3 py-1.5 text-xs uppercase rounded-lg border border-slate-300 focus:outline-none focus:ring-2 focus:ring-[#087F5B]"
                />
                <Button variant="outline" size="sm" type="submit" className="shrink-0 text-xs">
                  Apply
                </Button>
              </form>
              {couponApplied && (
                <p className="text-[11px] text-emerald-700 font-semibold bg-emerald-50 px-2 py-1 rounded">
                  Coupon &apos;MED24&apos; applied! ₹100 saved.
                </p>
              )}
            </div>

            {/* Price Details */}
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-3 text-xs">
              <h3 className="font-bold text-sm text-[#172B24] pb-2 border-b border-slate-100">
                Order Bill Summary
              </h3>

              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Total MRP:</span>
                  <span>{formatPriceINR(mrpTotal)}</span>
                </div>
                <div className="flex justify-between text-[#087F5B]">
                  <span>Product Discount:</span>
                  <span>- {formatPriceINR(totalSavings)}</span>
                </div>
                {couponApplied && (
                  <div className="flex justify-between text-emerald-600 font-medium">
                    <span>Coupon Discount:</span>
                    <span>- {formatPriceINR(couponDiscount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span>Estimated Delivery Fee:</span>
                  <span>{deliveryFee === 0 ? <strong className="text-[#087F5B]">FREE</strong> : formatPriceINR(deliveryFee)}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-[#172B24]">To Pay:</span>
                  <p className="text-[10px] text-slate-400">Inclusive of GST</p>
                </div>
                <span className="text-lg font-extrabold text-[#172B24]">
                  {formatPriceINR(grandTotal)}
                </span>
              </div>

              <Link href="/checkout" className="block pt-2">
                <Button variant="primary" size="lg" className="w-full shadow-sm text-sm">
                  <span>Proceed to Checkout</span>
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </Link>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-500 text-center space-y-1">
                <p className="flex items-center justify-center gap-1 text-slate-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#087F5B]" /> Safe & Secure Pharmacy Dispensing
                </p>
                <p>Tax invoice with batch numbers issued on dispatch.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Your medicine cart is empty"
          description="Explore our doctor-recommended healthcare products, daily wellness items, or upload your prescription to get started."
          action={
            <div className="flex gap-3">
              <Link href="/products">
                <Button variant="primary" size="sm">
                  Explore Products
                </Button>
              </Link>
              <Link href="/prescription/upload">
                <Button variant="outline" size="sm">
                  Upload Prescription
                </Button>
              </Link>
            </div>
          }
        />
      )}
    </div>
  );
}

