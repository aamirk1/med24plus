"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Button } from "@/components/ui/Button";
import { formatPriceINR } from "@/lib/utils";
import { orderService, OrderDetail } from "@/services/orderService";
import { paymentService } from "@/services/payment.service";
import {
  CheckCircle2,
  Clock,
  Package,
  Truck,
  FileText,
  Printer,
  ShieldCheck,
  MapPin,
  ArrowLeft,
  AlertCircle,
  XCircle,
  AlertTriangle,
  CreditCard,
} from "lucide-react";

export default function OrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [payingOnline, setPayingOnline] = useState(false);

  // Cancellation modal state
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelling, setCancelling] = useState(false);
  const [cancelError, setCancelError] = useState<string | null>(null);

  // Invoice downloading
  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const fetchOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const res: any = await orderService.getOrderDetail(orderId);
      const data = res?.data || res;
      if (data && (data.id || data.order_number)) {
        setOrder(data);
      } else {
        setError("Order record not found.");
      }
    } catch (err: any) {
      setError(err.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      fetchOrderDetail();
    }
  }, [orderId]);

  const handleCancelOrder = async () => {
    if (!cancelReason.trim()) {
      setCancelError("Please provide a reason for cancelling this order.");
      return;
    }
    setCancelling(true);
    setCancelError(null);
    try {
      const updated = await orderService.cancelOrder(orderId, cancelReason);
      setOrder(updated);
      setShowCancelModal(false);
      setCancelReason("");
    } catch (err: any) {
      setCancelError(err.message || "Failed to cancel order");
    } finally {
      setCancelling(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const blob = await orderService.getInvoiceBlob(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${order?.order_number || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || "Could not download invoice PDF");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#0D9488] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500">Loading order credentials...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-slate-800">{error || "Order Not Found"}</h2>
        <Link href="/account/orders">
          <Button variant="outline" size="sm">
            <ArrowLeft className="w-4 h-4 shrink-0" />
            <span>Back to Orders</span>
          </Button>
        </Link>
      </div>
    );
  }

  const isTerminal = ["delivered", "cancelled", "rejected", "failed"].includes(order.status);
  const isCancellable = ["placed", "pending_payment", "payment_confirmed", "pharmacist_review", "processing", "ready_for_dispatch"].includes(order.status);

  // Timeline computation
  const statusLevels: Record<string, number> = {
    placed: 1,
    pending_payment: 1,
    payment_confirmed: 2,
    pharmacist_review: 2,
    processing: 3,
    ready_for_dispatch: 4,
    dispatched: 5,
    delivered: 6,
  };
  const currentLevel = statusLevels[order.status] || 1;

  const steps = [
    { title: "Order Placed", level: 1, desc: "Received at pharmacy system" },
    { title: "Review & Payment", level: 2, desc: "Pharmacist verification & payment" },
    { title: "Processing & Batch Allocated", level: 3, desc: "FEFO batches allocated" },
    { title: "Packed for Dispatch", level: 4, desc: "Insulated cold-chain packing" },
    { title: "Dispatched", level: 5, desc: "Handed over to courier" },
    { title: "Delivered", level: 6, desc: "Delivered to address" },
  ];

  const placedDate = order.placed_at || order.created_at;
  const dateStr = placedDate
    ? new Date(placedDate).toLocaleDateString("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "Recent";

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Account", href: "/account/profile" },
          { label: "Orders", href: "/account/orders" },
          { label: order.order_number },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-2.5">
            <h1 className="text-xl sm:text-2xl font-bold text-[#172B24] font-mono">{order.order_number}</h1>
            <StatusBadge status={order.status.replace(/_/g, " ").toUpperCase()} />
          </div>
          <p className="text-xs text-slate-500 mt-0.5">Placed on {dateStr} • Currency: {order.currency}</p>
        </div>
        <div className="flex items-center gap-2">
          {order.status !== "failed" && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
            >
              <Printer className="w-3.5 h-3.5 shrink-0" />
              <span>{downloadingInvoice ? "Downloading..." : "Download Form 20 Invoice"}</span>
            </Button>
          )}
          {isCancellable && (
            <Button
              variant="danger"
              size="sm"
              onClick={() => setShowCancelModal(true)}
            >
              <XCircle className="w-3.5 h-3.5 shrink-0" />
              <span>Cancel Order</span>
            </Button>
          )}
          <Link href="/account/orders">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-3.5 h-3.5 shrink-0" />
              <span>Back</span>
            </Button>
          </Link>
        </div>
      </div>

      {/* Status Explanations Banner */}
      {order.status === "pharmacist_review" && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3 text-xs">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-amber-900">Clinical Pharmacist Review in Progress</p>
            <p className="text-amber-800 text-[11px] mt-0.5">
              This order contains prescription medications (Schedule H / H1 / X). In accordance with Rule 65 of the
              Drugs and Cosmetics Rules, 1945, our registered pharmacist is reviewing your doctor&apos;s prescription before dispensing.
            </p>
          </div>
        </div>
      )}

      {order.payment_status !== "paid" && order.status !== "cancelled" && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 text-xs">
          <div className="flex items-start gap-3">
            <CreditCard className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-emerald-950 text-sm">Payment Pending ({formatPriceINR(order.grand_total)})</p>
              <p className="text-emerald-800 text-[11px] mt-0.5">
                Complete your payment securely via Razorpay (UPI, Google Pay, Cards, NetBanking) to confirm dispatch.
              </p>
            </div>
          </div>
          <Button
            variant="primary"
            size="sm"
            disabled={payingOnline}
            isLoading={payingOnline}
            onClick={async () => {
              setPayingOnline(true);
              try {
                const rzpData = await paymentService.createRazorpayOrder(order.id);
                paymentService.openRazorpayCheckout({
                  orderData: rzpData,
                  onSuccess: async () => {
                    await fetchOrderDetail();
                  },
                  onFailure: (err) => {
                    console.warn("Payment dismissed or cancelled:", err);
                  },
                });
              } catch (err: any) {
                alert(err?.message || "Failed to initiate Razorpay payment");
              } finally {
                setPayingOnline(false);
              }
            }}
            className="shrink-0 shadow-xs"
          >
            <CreditCard className="w-3.5 h-3.5 shrink-0" />
            <span>Pay Now with Razorpay</span>
          </Button>
        </div>
      )}

      {order.status === "pending_payment" && order.payment_status === "paid" && (
        <div className="bg-teal-50 border border-teal-200 rounded-xl p-4 flex items-start gap-3 text-xs">
          <CheckCircle2 className="w-5 h-5 text-teal-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-teal-900">Payment Confirmed</p>
            <p className="text-teal-800 text-[11px] mt-0.5">
              Your payment has been successfully captured. Pharmacy team is preparing your package.
            </p>
          </div>
        </div>
      )}

      {order.status === "cancelled" && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-start gap-3 text-xs">
          <AlertCircle className="w-5 h-5 text-red-700 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold text-red-900">Order Cancelled</p>
            <p className="text-red-800 text-[11px] mt-0.5">
              This order was cancelled. Reserved batch inventory has been returned to stock.
              {order.cancellation?.cancellation_reason && (
                <span className="block mt-1 italic">
                  Reason: &ldquo;{order.cancellation.cancellation_reason}&rdquo;
                </span>
              )}
            </p>
          </div>
        </div>
      )}

      {/* Tracking Timeline */}
      {!["cancelled", "rejected", "failed"].includes(order.status) && (
        <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle space-y-4">
          <h3 className="font-bold text-sm text-[#172B24]">Dispensing & Delivery Timeline</h3>
          <div className="grid grid-cols-2 md:grid-cols-6 gap-3 pt-2">
            {steps.map((st, idx) => {
              const isDone = currentLevel >= st.level;
              const isCurrent = currentLevel === st.level;
              return (
                <div key={idx} className="relative flex flex-col items-start space-y-1">
                  <div className="flex items-center gap-2">
                    <div
                      className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold transition ${
                        isDone
                          ? "bg-[#0D9488] text-white"
                          : isCurrent
                          ? "bg-amber-500 text-white"
                          : "bg-slate-200 text-slate-500"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="w-3.5 h-3.5" /> : idx + 1}
                    </div>
                    <span className={`text-xs font-bold ${isDone ? "text-[#172B24]" : "text-slate-400"}`}>
                      {st.title}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 pl-8 leading-tight">{st.desc}</p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Items List (8 cols) */}
        <div className="lg:col-span-8 bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-4">
          <h3 className="font-bold text-sm text-[#172B24] pb-2 border-b border-slate-100">
            Dispensed Medicines & Batch Allocation ({order.items.length} items)
          </h3>
          <div className="divide-y divide-slate-100">
            {order.items.map((item) => (
              <div key={item.id} className="py-3 flex justify-between items-start text-xs">
                <div className="space-y-1">
                  <span className="font-bold text-slate-800 text-sm">{item.product_name_snapshot}</span>
                  <p className="text-[11px] text-slate-500">
                    SKU: {item.product_sku_snapshot} • HSN: {item.hsn_code_snapshot} • Brand: {item.manufacturer_snapshot}
                  </p>
                  <div className="flex flex-wrap items-center gap-2 pt-1 text-[11px]">
                    {item.batch_number_snapshot && (
                      <span className="font-mono bg-blue-50 text-blue-800 px-2 py-0.5 rounded border border-blue-200">
                        Batch: {item.batch_number_snapshot}
                      </span>
                    )}
                    {item.expiry_date_snapshot && (
                      <span className="font-mono bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        Exp: {item.expiry_date_snapshot}
                      </span>
                    )}
                    {item.prescription_required && (
                      <span className="bg-amber-50 text-amber-800 font-semibold px-2 py-0.5 rounded border border-amber-200">
                        Rx Required
                      </span>
                    )}
                  </div>
                </div>

                <div className="text-right space-y-0.5">
                  <p className="font-bold text-slate-900 text-sm">{formatPriceINR(item.total_amount)}</p>
                  <p className="text-slate-400 text-[11px]">
                    Qty: {item.quantity} × {formatPriceINR(item.unit_price)}
                  </p>
                  {item.unit_mrp > item.unit_price && (
                    <p className="text-[10px] text-teal-600 font-medium line-through">
                      MRP: {formatPriceINR(item.unit_mrp * item.quantity)}
                    </p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right 4 cols: Price Summary & Delivery */}
        <div className="lg:col-span-4 space-y-6">
          {/* Price Breakdown */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-3 text-xs">
            <h3 className="font-bold text-sm text-[#172B24] pb-2 border-b border-slate-100">
              Statutory Bill Summary
            </h3>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span>{formatPriceINR(order.subtotal)}</span>
              </div>
              {order.discount_amount > 0 && (
                <div className="flex justify-between text-teal-700 font-medium">
                  <span>Pharmacy Discount:</span>
                  <span>- {formatPriceINR(order.discount_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>CGST (Intra-state):</span>
                <span>{formatPriceINR(order.cgst_amount)}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST (Intra-state):</span>
                <span>{formatPriceINR(order.sgst_amount)}</span>
              </div>
              {order.igst_amount > 0 && (
                <div className="flex justify-between">
                  <span>IGST (Inter-state):</span>
                  <span>{formatPriceINR(order.igst_amount)}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span>Cold-chain Delivery:</span>
                <span>{order.delivery_fee > 0 ? formatPriceINR(order.delivery_fee) : "FREE"}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-[#172B24]">
                <span>Total Amount:</span>
                <span>{formatPriceINR(order.grand_total)}</span>
              </div>
              <div className="text-[10px] text-slate-400 pt-1">
                Inclusive of all central & state statutory GST taxes
              </div>
            </div>
          </div>

          {/* Delivery Address */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-3 text-xs">
            <h3 className="font-bold text-sm text-[#172B24] pb-2 border-b border-slate-100 flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-[#0D9488]" />
              <span>Delivery Address</span>
            </h3>
            <div className="space-y-1 text-slate-700">
              <p className="font-bold text-slate-900">
                {order.delivery_address_snapshot?.recipient_name}
              </p>
              <p>{order.delivery_address_snapshot?.street_address}</p>
              <p>
                {order.delivery_address_snapshot?.city}, {order.delivery_address_snapshot?.state} -{" "}
                <span className="font-bold">{order.delivery_address_snapshot?.pincode}</span>
              </p>
              {order.delivery_address_snapshot?.recipient_phone && (
                <p className="text-slate-500 pt-1">
                  Contact: {order.delivery_address_snapshot.recipient_phone}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Cancellation Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 text-red-600 font-bold text-sm">
              <AlertTriangle className="w-5 h-5" />
              <span>Cancel Order {order.order_number}</span>
            </div>
            <p className="text-xs text-slate-500">
              Are you sure you want to cancel this order? All allocated medicine batches will be immediately
              released back to sellable pharmacy inventory.
            </p>

            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-700">Reason for Cancellation *</label>
              <textarea
                value={cancelReason}
                onChange={(e) => setCancelReason(e.target.value)}
                placeholder="e.g. Prescribed different medicine, ordered wrong pack size..."
                className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
                rows={3}
              />
            </div>

            {cancelError && (
              <p className="text-xs text-red-600 bg-red-50 p-2 rounded-lg">{cancelError}</p>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setShowCancelModal(false);
                  setCancelReason("");
                  setCancelError(null);
                }}
                disabled={cancelling}
              >
                Keep Order
              </Button>
              <Button
                variant="danger"
                size="sm"
                onClick={handleCancelOrder}
                disabled={cancelling}
              >
                {cancelling ? "Cancelling..." : "Confirm Cancellation"}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
