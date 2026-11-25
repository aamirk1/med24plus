"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { QuantitySelector } from "@/components/ui/QuantitySelector";
import { PrescriptionBadge } from "@/components/ui/PrescriptionBadge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPriceINR } from "@/lib/utils";
import { apiClient } from "@/services/api";
import {
  ShoppingBag,
  Trash2,
  ArrowRight,
  ShieldCheck,
  Truck,
  AlertTriangle,
  ArrowLeft,
  AlertCircle,
  FileText,
  RefreshCw,
} from "lucide-react";

interface CartItemData {
  id: string;
  cart_id: string;
  product_id: string;
  product_name: string;
  product_slug: string;
  product_sku: string;
  generic_name: string;
  pack_size: string;
  dosage_form: string;
  strength?: string;
  brand_name?: string;
  category_name?: string;
  image_url?: string;
  is_cold_chain: boolean;
  unit_price: number | string;
  unit_mrp: number | string;
  unit_price_snapshot?: number | string;
  is_price_changed: boolean;
  previous_price?: number | string;
  quantity: number;
  subtotal: number | string;
  mrp_subtotal: number | string;
  discount_amount: number | string;
  gst_rate: number | string;
  tax_amount: number | string;
  is_available: boolean;
  sellable_stock: number;
  requires_prescription: boolean;
  schedule_classification: string;
  prescription_status: string;
  prescription_reference?: string;
  prescription_message?: string;
  validation_status: string;
  status_message?: string;
}

interface CartData {
  id: string;
  customer_id: string;
  status: string;
  items: CartItemData[];
  item_count: number;
  total_quantity: number;
  subtotal: number | string;
  total_mrp: number | string;
  total_discount: number | string;
  taxable_amount: number | string;
  total_tax: number | string;
  delivery_fee: number | string;
  free_delivery_threshold: number | string;
  amount_needed_for_free_delivery: number | string;
  grand_total: number | string;
  has_prescription_items: boolean;
  has_cold_chain_items: boolean;
  has_price_changes: boolean;
  is_valid_for_checkout: boolean;
  warnings: string[];
  blocking_errors: string[];
}

export default function CartPage() {
  const [cart, setCart] = useState<CartData | null>(null);
  const [loading, setLoading] = useState(true);
  const [updatingItemId, setUpdatingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const loadCart = async () => {
    try {
      setError(null);
      const res = await apiClient<{ success: boolean; data: CartData }>("/cart");
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load shopping cart. Please ensure you are signed in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadCart();
  }, []);

  const updateQuantity = async (itemId: string, currentQty: number, delta: number) => {
    const newQty = currentQty + delta;
    if (newQty <= 0) {
      await removeItem(itemId);
      return;
    }

    try {
      setUpdatingItemId(itemId);
      setError(null);
      const res = await apiClient<{ success: boolean; data: CartData }>(`/cart/items/${itemId}`, {
        method: "PATCH",
        data: { quantity: newQty },
      });
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Could not update item quantity.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    try {
      setUpdatingItemId(itemId);
      setError(null);
      const res = await apiClient<{ success: boolean; data: CartData }>(`/cart/items/${itemId}`, {
        method: "DELETE",
      });
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to remove item.");
    } finally {
      setUpdatingItemId(null);
    }
  };

  const clearCart = async () => {
    if (!confirm("Are you sure you want to empty your cart?")) return;
    try {
      setLoading(true);
      setError(null);
      const res = await apiClient<{ success: boolean; data: CartData }>("/cart/items", {
        method: "DELETE",
      });
      if (res.success && res.data) {
        setCart(res.data);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to clear cart.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-16 text-center space-y-4">
        <RefreshCw className="w-8 h-8 text-[#0D9488] animate-spin mx-auto" />
        <p className="text-sm font-semibold text-slate-600">Loading your medicine cart...</p>
      </div>
    );
  }

  const items = cart?.items || [];
  const subtotal = Number(cart?.subtotal || 0);
  const totalMrp = Number(cart?.total_mrp || 0);
  const totalSavings = Number(cart?.total_discount || 0);
  const deliveryFee = Number(cart?.delivery_fee || 0);
  const freeThreshold = Number(cart?.free_delivery_threshold || 499);
  const shortfall = Number(cart?.amount_needed_for_free_delivery || 0);
  const grandTotal = Number(cart?.grand_total || 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb items={[{ label: "Shopping Cart", href: "/cart" }]} />

      <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-[#172B24]">Your Medicine Cart</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            {cart?.item_count || 0} item(s) • Authoritative real-time inventory and pricing
          </p>
        </div>
        {items.length > 0 && (
          <button
            onClick={clearCart}
            className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 self-start sm:self-auto"
          >
            <Trash2 className="w-3.5 h-3.5" />
            <span>Clear Cart</span>
          </button>
        )}
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-3.5 text-xs text-red-800 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
          <div className="flex-1 font-medium">{error}</div>
        </div>
      )}

      {/* Warnings & Diagnostics */}
      {cart?.warnings && cart.warnings.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-3.5 text-xs text-amber-900 space-y-1">
          <div className="flex items-center gap-2 font-bold text-amber-800">
            <AlertTriangle className="w-4 h-4 text-amber-600" />
            <span>Cart Notices & Price Updates:</span>
          </div>
          <ul className="list-disc list-inside text-[11px] text-amber-800 pl-1 space-y-0.5">
            {cart.warnings.map((w, idx) => (
              <li key={idx}>{w}</li>
            ))}
          </ul>
        </div>
      )}

      {items.length > 0 ? (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left: Cart Items List (8 cols) */}
          <div className="lg:col-span-8 space-y-4">
            {/* Free Delivery Callout */}
            <div className="bg-[#F0FDFA]/70 border border-[#CCFBF1] rounded-xl p-3 flex items-center gap-2.5 text-xs text-[#0F766E]">
              <Truck className="w-4 h-4 text-[#0D9488] shrink-0" />
              <span>
                {deliveryFee === 0 ? (
                  <><strong>Eligible for Free Delivery!</strong> Order exceeds ₹{freeThreshold}.</>
                ) : (
                  <>Add ₹{shortfall} more of health products to qualify for <strong>Free Delivery</strong>.</>
                )}
              </span>
            </div>

            {/* Cart Items List */}
            <div className="bg-white rounded-xl border border-slate-200 divide-y divide-slate-100 shadow-subtle overflow-hidden">
              {items.map((item) => (
                <div
                  key={item.id}
                  className={`p-4 sm:p-5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition ${updatingItemId === item.id ? "opacity-50 pointer-events-none" : ""
                    }`}
                >
                  <div className="flex items-start gap-3 flex-1">
                    <div className="w-14 h-14 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-center text-[#0D9488] shrink-0 overflow-hidden">
                      {item.image_url ? (
                        <img src={item.image_url} alt={item.product_name} className="w-full h-full object-cover" />
                      ) : (
                        <ShoppingBag className="w-6 h-6" />
                      )}
                    </div>
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        {item.brand_name && (
                          <span className="text-[11px] font-semibold text-slate-500">{item.brand_name}</span>
                        )}
                        <PrescriptionBadge
                          required={item.requires_prescription}
                          scheduleType={(item.schedule_classification as any) || "OTC"}
                        />
                        {item.is_cold_chain && (
                          <span className="text-[10px] font-semibold text-cyan-700 bg-cyan-50 border border-cyan-200 px-1.5 py-0.5 rounded">
                            Cold Chain 2-8°C
                          </span>
                        )}
                      </div>

                      <Link
                        href={`/products/${item.product_slug}`}
                        className="font-bold text-xs sm:text-sm text-[#172B24] hover:text-[#0D9488] transition block"
                      >
                        {item.product_name}
                      </Link>

                      <p className="text-[11px] text-slate-400">
                        {item.dosage_form} {item.strength ? `• ${item.strength}` : ""} • {item.pack_size}
                      </p>

                      {/* Stock availability & Validation Status */}
                      {item.validation_status === "insufficient_stock" ? (
                        <span className="inline-block text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          Insufficient Stock ({item.sellable_stock} available)
                        </span>
                      ) : item.validation_status === "inactive_product" ? (
                        <span className="inline-block text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded">
                          Product Discontinued
                        </span>
                      ) : item.is_price_changed ? (
                        <span className="inline-block text-[10px] font-bold text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded">
                          Price Revised (was ₹{item.previous_price})
                        </span>
                      ) : (
                        <span className="inline-block text-[10px] font-medium text-teal-700">
                          In Stock ({item.sellable_stock} units available)
                        </span>
                      )}

                      {/* Prescription Status Details */}
                      {item.requires_prescription && (
                        <p className="text-[11px] text-slate-500 font-medium">
                          Status: <strong className="capitalize">{item.prescription_status.replace(/_/g, " ")}</strong>
                          {item.prescription_reference && ` (${item.prescription_reference})`}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Quantity Selector & Price */}
                  <div className="flex items-center justify-between w-full sm:w-auto gap-6 sm:pl-4">
                    <QuantitySelector
                      quantity={item.quantity}
                      onIncrement={() => updateQuantity(item.id, item.quantity, 1)}
                      onDecrement={() => updateQuantity(item.id, item.quantity, -1)}
                      size="sm"
                    />

                    <div className="text-right min-w-[90px]">
                      <span className="font-bold text-sm text-[#172B24] block">
                        {formatPriceINR(Number(item.subtotal))}
                      </span>
                      {Number(item.unit_mrp) > Number(item.unit_price) && (
                        <span className="text-[10px] text-slate-400 line-through">
                          {formatPriceINR(Number(item.mrp_subtotal))}
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => removeItem(item.id)}
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
              <Link href="/products" className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#0D9488] hover:underline">
                <ArrowLeft className="w-3.5 h-3.5" />
                <span>Continue Shopping</span>
              </Link>
            </div>
          </div>

          {/* Right: Bill Summary (4 cols) */}
          <div className="lg:col-span-4 space-y-4">
            <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-3.5 text-xs">
              <h3 className="font-bold text-sm text-[#172B24] pb-2 border-b border-slate-100">
                Cart Bill Summary
              </h3>

              <div className="space-y-2 text-slate-600">
                <div className="flex justify-between">
                  <span>Total MRP:</span>
                  <span>{formatPriceINR(totalMrp)}</span>
                </div>
                <div className="flex justify-between text-[#0D9488]">
                  <span>Catalog Discount:</span>
                  <span>- {formatPriceINR(totalSavings)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Item Subtotal:</span>
                  <span className="font-semibold text-slate-800">{formatPriceINR(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Estimated Delivery Fee:</span>
                  <span>{deliveryFee === 0 ? <strong className="text-[#0D9488]">FREE</strong> : formatPriceINR(deliveryFee)}</span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                  <span>Included Statutory GST:</span>
                  <span>{formatPriceINR(Number(cart?.total_tax || 0))}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                <div>
                  <span className="text-sm font-bold text-[#172B24]">Grand Total:</span>
                  <p className="text-[10px] text-slate-400">Inclusive of all taxes</p>
                </div>
                <span className="text-lg font-extrabold text-[#172B24]">
                  {formatPriceINR(grandTotal)}
                </span>
              </div>

              {cart?.blocking_errors && cart.blocking_errors.length > 0 && (
                <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-[11px] text-red-700 space-y-1">
                  <p className="font-bold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5 text-red-600" />
                    Cannot proceed to checkout:
                  </p>
                  <ul className="list-disc list-inside pl-1 text-[10px]">
                    {cart.blocking_errors.map((err, i) => (
                      <li key={i}>{err}</li>
                    ))}
                  </ul>
                </div>
              )}

              <Link href="/checkout" className="block pt-2">
                <Button
                  variant="primary"
                  size="lg"
                  disabled={!cart?.is_valid_for_checkout}
                  className="w-full shadow-sm text-sm"
                >
                  <span>Proceed to Checkout</span>
                  {/* <ArrowRight className="w-4 h-4 ml-2" /> */}
                </Button>
              </Link>

              <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-[10px] text-slate-500 text-center space-y-1">
                <p className="flex items-center justify-center gap-1 text-slate-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#0D9488]" /> Safe & Licensed Pharmacy
                </p>
                <p>Prices and sellable batch availability verified in real-time.</p>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title="Your medicine cart is empty"
          description="Explore our verified pharmaceutical products, healthcare essentials, or upload your doctor's prescription to begin."
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
