"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { formatPriceINR } from "@/lib/utils";
import {
  addressService,
  AddressItem,
  AddressCreatePayload,
} from "@/services/address.service";
import {
  checkoutService,
  CheckoutValidationResponse,
} from "@/services/checkout.service";
import { orderService } from "@/services/orderService";
import { useCart } from "@/context/CartContext";
import { paymentService } from "@/services/payment.service";
import {
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  Truck,
  FileText,
  Clock,
  RefreshCw,
  Plus,
  ArrowLeft,
  Lock,
  MapPin,
  ExternalLink,
} from "lucide-react";

export default function CheckoutPage() {
  const router = useRouter();
  const { refreshCart } = useCart();
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"razorpay" | "cod">("razorpay");
  const [acknowledgePriceChanges, setAcknowledgePriceChanges] = useState(false);

  const [validation, setValidation] = useState<CheckoutValidationResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [validating, setValidating] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cartEmpty, setCartEmpty] = useState(false);
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderError, setOrderError] = useState<string | null>(null);

  // Expiry countdown in seconds
  const [secondsRemaining, setSecondsRemaining] = useState<number | null>(null);

  // Address modal state
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isSubmittingAddress, setIsSubmittingAddress] = useState(false);
  const [addressModalError, setAddressModalError] = useState<string | null>(null);

  // New Address form state
  const [newRecipientName, setNewRecipientName] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newAddressLine1, setNewAddressLine1] = useState("");
  const [newAddressLine2, setNewAddressLine2] = useState("");
  const [newLandmark, setNewLandmark] = useState("");
  const [newCity, setNewCity] = useState("Bengaluru");
  const [newState, setNewState] = useState("Karnataka");
  const [newPincode, setNewPincode] = useState("");
  const [newAddressType, setNewAddressType] = useState("home");

  // Phase 7 demo success modal
  const [showValidationSuccessModal, setShowValidationSuccessModal] = useState(false);

  // Initial Load: fetch addresses
  const loadInitialData = async () => {
    try {
      setLoading(true);
      setError(null);
      const userAddresses = await addressService.list();
      setAddresses(userAddresses);

      // Default selected address: either the default one or the first one
      const defaultAddr = userAddresses.find((a) => a.is_default) || userAddresses[0];
      if (defaultAddr) {
        setSelectedAddressId(defaultAddr.id);
      } else {
        setSelectedAddressId(null);
      }
    } catch (err: any) {
      setError(err?.message || "Failed to load addresses. Please ensure you are logged in.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInitialData();
  }, []);

  // Run validation whenever selectedAddressId or acknowledgePriceChanges changes
  const runValidation = useCallback(async () => {
    if (!selectedAddressId) {
      setValidation(null);
      return;
    }

    try {
      setValidating(true);
      setError(null);
      const valRes = await checkoutService.validate({
        delivery_address_id: selectedAddressId,
        acknowledge_price_changes: acknowledgePriceChanges,
      });
      setValidation(valRes);
      setCartEmpty(false);

      // Set expiry countdown
      if (valRes.expires_at) {
        const diffSecs = Math.max(
          0,
          Math.floor((new Date(valRes.expires_at).getTime() - Date.now()) / 1000)
        );
        setSecondsRemaining(diffSecs);
      }
    } catch (err: any) {
      if (err?.code === "CART_EMPTY" || err?.message?.toLowerCase().includes("empty")) {
        setCartEmpty(true);
      } else {
        setError(err?.message || "Checkout validation failed. Please check your cart items.");
      }
      setValidation(null);
    } finally {
      setValidating(false);
    }
  }, [selectedAddressId, acknowledgePriceChanges]);

  useEffect(() => {
    if (selectedAddressId) {
      runValidation();
    }
  }, [selectedAddressId, acknowledgePriceChanges, runValidation]);

  // Timer countdown
  useEffect(() => {
    if (secondsRemaining === null || secondsRemaining <= 0) return;
    const interval = setInterval(() => {
      setSecondsRemaining((prev) => (prev !== null && prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [secondsRemaining]);

  const handleCreateAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setAddressModalError(null);

    const cleanPhone = newPhone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setAddressModalError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    const cleanPin = newPincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setAddressModalError("Please enter a valid 6-digit Indian PIN code (e.g. 560001).");
      return;
    }

    try {
      setIsSubmittingAddress(true);
      const payload: AddressCreatePayload = {
        recipient_name: newRecipientName.trim(),
        phone: cleanPhone.slice(-10),
        address_line1: newAddressLine1.trim(),
        address_line2: newAddressLine2.trim() || undefined,
        landmark: newLandmark.trim() || undefined,
        city: newCity.trim(),
        state: newState.trim(),
        pincode: cleanPin,
        address_type: newAddressType,
        is_default: addresses.length === 0,
      };

      const created = await addressService.create(payload);
      setAddresses((prev) => [...prev, created]);
      setSelectedAddressId(created.id);
      setIsAddressModalOpen(false);

      // Reset modal inputs
      setNewRecipientName("");
      setNewPhone("");
      setNewAddressLine1("");
      setNewAddressLine2("");
      setNewLandmark("");
      setNewPincode("");
    } catch (err: any) {
      setAddressModalError(err?.message || "Failed to save address.");
    } finally {
      setIsSubmittingAddress(false);
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId || !validation) return;
    setIsPlacingOrder(true);
    setOrderError(null);
    try {
      const idempotencyKey = typeof crypto !== "undefined" && crypto.randomUUID ? crypto.randomUUID() : `order-${Date.now()}`;
      const newOrder = await orderService.createOrder(
        {
          delivery_address_id: selectedAddressId,
          acknowledge_price_changes: acknowledgePriceChanges,
          checkout_validation_id: validation.id,
        },
        idempotencyKey
      );
      const targetId = newOrder?.id || (newOrder as any)?.data?.id || (newOrder as any)?.order_number;

      if (paymentMethod === "razorpay" && targetId) {
        try {
          const rzpOrder = await paymentService.createRazorpayOrder(targetId);
          setIsPlacingOrder(false);
          paymentService.openRazorpayCheckout({
            orderData: rzpOrder,
            onSuccess: async () => {
              // Successfully paid: now refresh cart and navigate to order
              await refreshCart();
              router.push(`/account/orders/${targetId}?payment=success`);
            },
            onFailure: (err: any) => {
              // Payment cancelled or failed: keep cart intact, remain on checkout
              setOrderError(
                err?.message ||
                  "Payment cancelled or unsuccessful. Order was not placed. You can retry payment or select Cash on Delivery."
              );
            },
          });
          return;
        } catch (payErr: any) {
          setIsPlacingOrder(false);
          setOrderError(
            payErr?.message ||
              "Failed to initialize payment gateway. Please retry or choose Cash on Delivery."
          );
          return;
        }
      }

      // Cash on Delivery
      await refreshCart();
      router.push(targetId ? `/account/orders/${targetId}` : "/account/orders");
    } catch (err: any) {
      setOrderError(err.message || "Failed to place order. Please review your cart or address.");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  const formatTimer = (totalSeconds: number) => {
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        <LoadingSkeleton height="40px" />
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          <div className="lg:col-span-8 space-y-4">
            <LoadingSkeleton height="160px" />
            <LoadingSkeleton height="200px" />
          </div>
          <div className="lg:col-span-4">
            <LoadingSkeleton height="350px" />
          </div>
        </div>
      </div>
    );
  }

  if (cartEmpty) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-16 text-center space-y-6">
        <EmptyState
          title="Your Cart is Empty"
          description="You cannot proceed to checkout without items in your cart. Add medicines or healthcare essentials first."
          action={
            <Link href="/products">
              <Button variant="primary" size="md">
                Browse Medicines
              </Button>
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Cart", href: "/cart" },
          { label: "Checkout Preparation" },
        ]}
      />

      {/* Header */}
      <div className="pb-3 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-bold text-[#172B24]">Checkout Preparation</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Phase 7: Real-time inventory verification, statutory GST calculation, and Rule 65 prescription gating
          </p>
        </div>
        <div className="flex items-center gap-2">
          {validation && (
            <span
              className={`text-xs px-3 py-1 rounded-full font-bold uppercase tracking-wider ${
                validation.validation_status === "valid"
                  ? "bg-teal-100 text-teal-800"
                  : validation.validation_status === "valid_with_warnings"
                  ? "bg-amber-100 text-amber-800"
                  : "bg-red-100 text-red-800"
              }`}
            >
              Status: {validation.validation_status.replace(/_/g, " ")}
            </span>
          )}
          <div className="flex items-center gap-1.5 text-xs text-[#0D9488] bg-[#F0FDFA] px-3 py-1 rounded-full font-semibold">
            <Lock className="w-3.5 h-3.5" />
            <span>DPCO & Rule 65 Verified</span>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2.5">
          <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-bold">Validation Error</p>
            <p className="mt-0.5">{error}</p>
          </div>
          <button
            onClick={runValidation}
            className="text-xs font-semibold underline text-red-800 hover:no-underline"
          >
            Retry
          </button>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left Column (8 cols) */}
        <div className="lg:col-span-8 space-y-6">
          {/* Section 1: Delivery Address Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#172B24] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0D9488] text-white text-xs flex items-center justify-center">
                  1
                </span>
                <span>Select Delivery Destination</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAddressModalOpen(true)}
                className="text-xs text-[#0D9488] font-semibold hover:underline inline-flex items-center gap-1.5"
              >
                <Plus className="w-3.5 h-3.5 shrink-0" /> <span>Add New Address</span>
              </button>
            </div>

            {addresses.length === 0 ? (
              <div className="p-6 border-2 border-dashed border-slate-200 rounded-xl text-center space-y-2">
                <MapPin className="w-8 h-8 text-slate-400 mx-auto" />
                <p className="text-xs font-medium text-slate-600">
                  No saved delivery addresses found.
                </p>
                <Button
                  variant="primary"
                  size="sm"
                  onClick={() => setIsAddressModalOpen(true)}
                >
                  <Plus className="w-3.5 h-3.5 shrink-0" />
                  <span>Add Delivery Address</span>
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {addresses.map((addr) => (
                  <div
                    key={addr.id}
                    onClick={() => setSelectedAddressId(addr.id)}
                    className={`p-4 rounded-xl border cursor-pointer transition ${
                      selectedAddressId === addr.id
                        ? "border-[#0D9488] bg-[#F0FDFA]/25 shadow-xs ring-1 ring-[#0D9488]"
                        : "border-slate-200 bg-white hover:border-slate-300"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <span className="text-xs font-bold text-[#172B24] uppercase tracking-wider">
                        {addr.address_type}
                      </span>
                      {addr.is_default && (
                        <span className="text-[10px] bg-slate-100 text-slate-600 px-1.5 py-0.5 rounded font-medium">
                          Default
                        </span>
                      )}
                    </div>
                    <p className="text-xs font-semibold text-slate-800">
                      {addr.recipient_name} • {addr.phone || addr.recipient_phone}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">
                      {addr.address_line1}
                      {addr.address_line2 && `, ${addr.address_line2}`}
                      <br />
                      {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                    </p>
                  </div>
                ))}
              </div>
            )}

            {/* Serviceability Banner for Selected Address */}
            {validation && (
              <div
                className={`p-3.5 rounded-xl border text-xs flex items-start gap-2.5 ${
                  validation.is_address_serviceable
                    ? "bg-teal-50/70 border-teal-200 text-teal-900"
                    : "bg-red-50 border-red-200 text-red-900"
                }`}
              >
                {validation.is_address_serviceable ? (
                  <>
                    <Truck className="w-4 h-4 text-[#0D9488] shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">
                        Serviceable Delivery Zone ({validation.estimated_delivery_hours || 4}-Hour Dispatch)
                      </p>
                      <p className="text-[11px] mt-0.5 text-teal-800">
                        {validation.serviceability_message ||
                          "This address is within our verified Bengaluru delivery geofence."}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <div>
                      <p className="font-bold">Outside Serviceable Delivery Geofence</p>
                      <p className="text-[11px] mt-0.5 text-red-800">
                        {validation.serviceability_message ||
                          "Selected PIN code is outside our active delivery area. Please choose a Bengaluru address."}
                      </p>
                    </div>
                  </>
                )}
              </div>
            )}
          </div>

          {/* Section 2: Prescription Eligibility Status */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-sm font-bold text-[#172B24] flex items-center gap-2">
                <span className="w-5 h-5 rounded-full bg-[#0D9488] text-white text-xs flex items-center justify-center">
                  2
                </span>
                <span>Prescription Compliance Status</span>
              </h2>
            </div>

            {validation && validation.items.some((i) => i.requires_prescription) ? (
              <div className="space-y-3">
                <p className="text-xs text-slate-600">
                  Your cart contains Schedule H / H1 prescription medicines. Indian drug laws require an active, approved prescription matching the prescribed formulation before packing:
                </p>

                <div className="space-y-2">
                  {validation.items
                    .filter((i) => i.requires_prescription)
                    .map((item) => (
                      <div
                        key={item.id}
                        className={`p-3 rounded-xl border text-xs flex items-center justify-between ${
                          item.prescription_status === "approved"
                            ? "border-teal-200 bg-teal-50/50"
                            : "border-amber-200 bg-amber-50/50"
                        }`}
                      >
                        <div className="space-y-0.5">
                          <p className="font-bold text-[#172B24]">{item.product_name}</p>
                          <p className="text-[11px] text-slate-500">
                            Pack: {item.pack_size} • Qty: {item.quantity}
                          </p>
                        </div>
                        <div className="text-right">
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider ${
                              item.prescription_status === "approved"
                                ? "bg-teal-100 text-teal-800"
                                : "bg-amber-100 text-amber-800"
                            }`}
                          >
                            Rx: {item.prescription_status.replace(/_/g, " ")}
                          </span>
                          {item.prescription_status !== "approved" && (
                            <p className="text-[10px] text-amber-700 font-semibold mt-1">
                              Pharmacist Approval Required
                            </p>
                          )}
                        </div>
                      </div>
                    ))}
                </div>

                <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 flex items-center justify-between">
                  <span>Need to attach an approved doctor prescription?</span>
                  <Link
                    href="/account/prescriptions"
                    className="text-[#0D9488] font-semibold hover:underline flex items-center gap-1"
                  >
                    <span>View Saved Prescriptions</span>
                    <ExternalLink className="w-3 h-3" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200 text-xs text-slate-600 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-[#0D9488]" />
                <span>
                  All items in your cart are Over-The-Counter (OTC) or general healthcare products. No doctor prescription is required.
                </span>
              </div>
            )}
          </div>

          {/* Section 3: Price Change Acknowledgement (if applicable) */}
          {validation && validation.items.some((i) => i.is_price_changed) && (
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3">
              <div className="flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <h3 className="text-xs font-bold text-amber-900">
                    Product Price Updates Detected
                  </h3>
                  <p className="text-[11px] text-amber-800">
                    One or more items in your cart have received revised DPCO/manufacturer pricing since they were added. Please review and confirm the updated prices below:
                  </p>
                </div>
              </div>

              <div className="space-y-1.5 pl-6">
                {validation.items
                  .filter((i) => i.is_price_changed)
                  .map((item) => (
                    <div key={item.id} className="text-xs flex justify-between text-amber-900">
                      <span>{item.product_name}</span>
                      <span className="font-semibold">
                        {item.previous_price && (
                          <span className="line-through text-slate-400 mr-2">
                            {formatPriceINR(item.previous_price)}
                          </span>
                        )}
                        {formatPriceINR(item.unit_price)}
                      </span>
                    </div>
                  ))}
              </div>

              <label className="flex items-center gap-2 pt-2 border-t border-amber-200/70 text-xs font-semibold text-amber-900 cursor-pointer">
                <input
                  type="checkbox"
                  checked={acknowledgePriceChanges}
                  onChange={(e) => setAcknowledgePriceChanges(e.target.checked)}
                  className="rounded border-amber-400 text-[#0D9488] focus:ring-[#0D9488]"
                />
                <span>I acknowledge and accept the updated prices for these medicines</span>
              </label>
            </div>
          )}

          {/* Section 4: Payment Method Selection */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4">
            <h2 className="text-sm font-bold text-[#172B24] flex items-center gap-2">
              <span className="w-5 h-5 rounded-full bg-[#0D9488] text-white text-xs flex items-center justify-center">
                3
              </span>
              <span>Select Payment Method</span>
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div
                onClick={() => setPaymentMethod("razorpay")}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "razorpay"
                    ? "border-[#0D9488] bg-[#F0FDFA]/40 shadow-xs ring-1 ring-[#0D9488]"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "razorpay"}
                        onChange={() => setPaymentMethod("razorpay")}
                        className="text-[#0D9488] focus:ring-[#0D9488]"
                      />
                      <span className="text-xs font-bold text-[#172B24]">
                        Online Payment (Razorpay)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-5">
                      UPI, Google Pay, PhonePe, Cards, NetBanking. Instant dispatch queue.
                    </p>
                  </div>
                  <span className="bg-emerald-50 text-emerald-700 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 shrink-0">
                    Recommended
                  </span>
                </div>
              </div>

              <div
                onClick={() => setPaymentMethod("cod")}
                className={`p-4 rounded-xl border cursor-pointer transition ${
                  paymentMethod === "cod"
                    ? "border-[#0D9488] bg-[#F0FDFA]/40 shadow-xs ring-1 ring-[#0D9488]"
                    : "border-slate-200 bg-white hover:border-slate-300"
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <input
                        type="radio"
                        name="paymentMethod"
                        checked={paymentMethod === "cod"}
                        onChange={() => setPaymentMethod("cod")}
                        className="text-[#0D9488] focus:ring-[#0D9488]"
                      />
                      <span className="text-xs font-bold text-[#172B24]">
                        Cash on Delivery (COD)
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 pl-5">
                      Pay via Cash or UPI QR code at your doorstep upon medicine delivery.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section 4: Blocking Issues Banner (if any) */}
          {validation && validation.blocking_errors.length > 0 && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5 space-y-3">
              <div className="flex items-center gap-2 text-red-800 font-bold text-xs">
                <AlertCircle className="w-4 h-4 text-red-600" />
                <span>Action Required Before Checkout Can Proceed ({validation.blocking_errors.length} Issues)</span>
              </div>
              <ul className="space-y-1 pl-6 list-disc text-xs text-red-700">
                {validation.blocking_errors.map((err, idx) => (
                  <li key={idx}>{err}</li>
                ))}
              </ul>
              <div className="pt-2 flex gap-3">
                <Link href="/cart">
                  <Button variant="outline" size="sm">
                    <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
                    <span>Return to Cart to Adjust</span>
                  </Button>
                </Link>
              </div>
            </div>
          )}
        </div>

        {/* Right Summary Column (4 cols) */}
        <div className="lg:col-span-4 space-y-4">
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4 text-xs">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="font-bold text-sm text-[#172B24]">
                Authoritative Quote
              </h3>
              {validating ? (
                <RefreshCw className="w-3.5 h-3.5 animate-spin text-slate-400" />
              ) : secondsRemaining !== null && secondsRemaining > 0 ? (
                <div className="flex items-center gap-1 text-[11px] font-semibold text-amber-700 bg-amber-50 px-2 py-0.5 rounded">
                  <Clock className="w-3 h-3" />
                  <span>Valid: {formatTimer(secondsRemaining)}</span>
                </div>
              ) : null}
            </div>

            {validation ? (
              <>
                {/* Item List Preview */}
                <div className="space-y-2.5 max-h-48 overflow-y-auto pr-1">
                  {validation.items.map((item) => (
                    <div key={item.id} className="flex justify-between items-start text-xs">
                      <div className="pr-2">
                        <p className="font-semibold text-[#172B24] line-clamp-1">
                          {item.product_name}
                        </p>
                        <p className="text-[11px] text-slate-400">
                          Qty: {item.quantity} × {formatPriceINR(item.unit_price)}
                        </p>
                      </div>
                      <span className="font-semibold text-slate-800 shrink-0">
                        {formatPriceINR(item.subtotal)}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Price Breakdown */}
                <div className="space-y-2 pt-3 border-t border-slate-100 text-slate-600">
                  <div className="flex justify-between">
                    <span>Items Subtotal:</span>
                    <span>{formatPriceINR(validation.subtotal)}</span>
                  </div>

                  {Number(validation.discount_total) > 0 && (
                    <div className="flex justify-between text-[#0D9488]">
                      <span>Discount:</span>
                      <span>- {formatPriceINR(validation.discount_total)}</span>
                    </div>
                  )}

                  <div className="flex justify-between">
                    <span>Delivery Charge:</span>
                    {Number(validation.delivery_fee) === 0 ? (
                      <span className="text-[#0D9488] font-bold">FREE</span>
                    ) : (
                      <span>{formatPriceINR(validation.delivery_fee)}</span>
                    )}
                  </div>

                  {/* GST Tax Breakdown */}
                  <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                    <div className="flex justify-between text-slate-500">
                      <span>Statutory GST (Taxable: {formatPriceINR(validation.tax_breakdown.taxable_subtotal || 0)}):</span>
                      <span className="font-medium text-slate-700">
                        {formatPriceINR(validation.tax_total)}
                      </span>
                    </div>
                    {Number(validation.tax_breakdown.cgst_amount || 0) > 0 && (
                      <div className="flex justify-between text-slate-400 pl-2">
                        <span>CGST:</span>
                        <span>{formatPriceINR(validation.tax_breakdown.cgst_amount || 0)}</span>
                      </div>
                    )}
                    {Number(validation.tax_breakdown.sgst_amount || 0) > 0 && (
                      <div className="flex justify-between text-slate-400 pl-2">
                        <span>SGST:</span>
                        <span>{formatPriceINR(validation.tax_breakdown.sgst_amount || 0)}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Total */}
                <div className="pt-3 border-t border-slate-200 flex justify-between items-baseline">
                  <div>
                    <span className="text-sm font-bold text-[#172B24] block">Grand Total:</span>
                    <span className="text-[10px] text-slate-400">Inclusive of all taxes</span>
                  </div>
                  <span className="text-xl font-extrabold text-[#172B24]">
                    {formatPriceINR(validation.grand_total)}
                  </span>
                </div>

                {/* Action Button */}
                {orderError && (
                  <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                    <span>{orderError}</span>
                  </div>
                )}

                <Button
                  variant="primary"
                  size="lg"
                  disabled={!validation.is_eligible_for_checkout || validating || isPlacingOrder}
                  onClick={handlePlaceOrder}
                  className="w-full shadow-sm"
                >
                  {isPlacingOrder
                    ? paymentMethod === "razorpay"
                      ? "Opening Razorpay Gateway..."
                      : "Placing Order (COD)..."
                    : validation.is_eligible_for_checkout
                    ? paymentMethod === "razorpay"
                      ? `Proceed to Payment (${formatPriceINR(validation.grand_total)})`
                      : "Confirm & Place Order (Cash on Delivery)"
                    : "Checkout Blocked (Resolve Issues)"}
                </Button>

                <button
                  type="button"
                  onClick={runValidation}
                  className="w-full text-center text-xs text-slate-400 hover:text-[#0D9488] inline-flex items-center justify-center gap-1.5 mt-1 transition"
                >
                  <RefreshCw className="w-3 h-3 shrink-0" />
                  <span>Refresh Authoritative Quote</span>
                </button>
              </>
            ) : (
              <div className="py-8 text-center text-slate-400 text-xs">
                Select a delivery destination to generate your authoritative checkout quote.
              </div>
            )}

            <div className="p-3 bg-slate-50 rounded-lg text-[10px] text-slate-500 text-center leading-relaxed">
              <p className="font-semibold text-slate-700">Drugs & Cosmetics Act Compliance:</p>
              <p>
                Prescriptions are reviewed under Rule 65. Med24Plus operates single-pharmacy dispensing with FEFO batch traceability.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={isAddressModalOpen}
        onClose={() => setIsAddressModalOpen(false)}
        title="Add Delivery Address"
        description="Delivery available within Bengaluru city limits (4-Hour Medicine Dispatch)"
      >
        <form onSubmit={handleCreateAddress} className="space-y-3.5">
          {addressModalError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{addressModalError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Full Name"
              placeholder="e.g. Aarav Sharma"
              value={newRecipientName}
              onChange={(e) => setNewRecipientName(e.target.value)}
              required
            />
            <Input
              label="Mobile Number"
              placeholder="10-digit mobile number"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              required
            />
          </div>

          <Input
            label="Address Line 1 (Flat, Floor, Building)"
            placeholder="e.g. Flat 402, Green Glen Heights"
            value={newAddressLine1}
            onChange={(e) => setNewAddressLine1(e.target.value)}
            required
          />

          <Input
            label="Address Line 2 (Street, Area)"
            placeholder="e.g. Outer Ring Road, Bellandur"
            value={newAddressLine2}
            onChange={(e) => setNewAddressLine2(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Landmark"
              placeholder="Nearby landmark"
              value={newLandmark}
              onChange={(e) => setNewLandmark(e.target.value)}
            />
            <Input
              label="City"
              value={newCity}
              onChange={(e) => setNewCity(e.target.value)}
              required
            />
            <Input
              label="PIN Code"
              placeholder="6-digit PIN"
              value={newPincode}
              onChange={(e) => setNewPincode(e.target.value)}
              required
            />
          </div>

          <div className="pt-1">
            <label className="block text-xs font-semibold text-[#172B24] mb-1">
              Address Type
            </label>
            <select
              value={newAddressType}
              onChange={(e) => setNewAddressType(e.target.value)}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-[#172B24] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
            >
              <option value="home">Home</option>
              <option value="work">Work</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsAddressModalOpen(false)}
              disabled={isSubmittingAddress}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmittingAddress}>
              {isSubmittingAddress ? "Saving..." : "Save & Select"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Phase 7 Validation Success Modal */}
      {validation && (
        <Modal
          isOpen={showValidationSuccessModal}
          onClose={() => setShowValidationSuccessModal(false)}
          title="Checkout Validation Completed"
          description="Phase 7 Architecture Verification"
          size="md"
        >
          <div className="space-y-4 text-left text-xs">
            <div className="p-3 bg-teal-50 border border-teal-200 rounded-xl text-teal-900 flex items-start gap-2.5">
              <CheckCircle2 className="w-5 h-5 text-[#0D9488] shrink-0 mt-0.5" />
              <div>
                <p className="font-bold">Authoritative Validation Quote Generated</p>
                <p className="text-[11px] text-teal-800 mt-0.5">
                  All Phase 7 checks (sellable inventory, DPCO prices, GST extraction, and Rule 65 prescription gating) have passed.
                </p>
              </div>
            </div>

            <div className="bg-slate-50 rounded-xl p-4 border border-slate-200 space-y-2">
              <div className="flex justify-between">
                <span className="text-slate-500">Quote ID:</span>
                <span className="font-mono text-slate-800">{validation.id}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Total Payable:</span>
                <span className="font-bold text-[#172B24]">{formatPriceINR(validation.grand_total)}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Delivery Geofence:</span>
                <span className="text-teal-700 font-semibold">Serviceable (4 Hours)</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">Expiry Window:</span>
                <span className="font-medium text-amber-700">15 Minutes from calculation</span>
              </div>
            </div>

            <div className="p-3 bg-teal-50 border border-teal-200 rounded-lg text-teal-900 text-[11px] leading-relaxed">
              <strong>100% Genuine Pharmacy Assurance:</strong> Operating with licensed retail pharmacies under the Drugs and Cosmetics Act, 1940. All payments are encrypted and processed through RBI-authorized payment gateways.
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="primary"
                size="sm"
                onClick={() => setShowValidationSuccessModal(false)}
              >
                Close Verification
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
