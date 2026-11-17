"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  Printer,
  ShieldCheck,
  CheckCircle2,
  Truck,
  Package,
  AlertTriangle,
  RefreshCw,
  AlertCircle,
  XCircle,
  Clock,
  FileText,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import {
  adminOrderService,
  AdminOrderDetail,
} from "@/services/adminOrderService";

export default function AdminOrderDetailPage() {
  const params = useParams();
  const router = useRouter();
  const orderId = params?.id as string;

  const [order, setOrder] = useState<AdminOrderDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");

  const [showRejectModal, setShowRejectModal] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

  const [showClarifyModal, setShowClarifyModal] = useState(false);
  const [clarifyNotes, setClarifyNotes] = useState("");

  const [downloadingInvoice, setDownloadingInvoice] = useState(false);

  const loadOrderDetail = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await adminOrderService.getOrderDetail(orderId);
      setOrder(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load order details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (orderId) {
      loadOrderDetail();
    }
  }, [orderId]);

  const handleUpdateStatus = async (newStatus: string) => {
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await adminOrderService.updateStatus(
        orderId,
        newStatus,
        `Operational status transitioned to ${newStatus}`
      );
      setOrder(updated);
    } catch (err: any) {
      setActionError(err?.message || "Failed to update order status");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePharmacistApprove = async () => {
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await adminOrderService.approvePharmacist(
        orderId,
        "Medications clinically verified against doctor prescription under Rule 65."
      );
      setOrder(updated);
    } catch (err: any) {
      setActionError(err?.message || "Failed to approve order");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePharmacistReject = async () => {
    if (!rejectReason.trim()) {
      setActionError("Statutory clinical rejection reason is mandatory.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await adminOrderService.rejectPharmacist(orderId, rejectReason);
      setOrder(updated);
      setShowRejectModal(false);
      setRejectReason("");
    } catch (err: any) {
      setActionError(err?.message || "Failed to reject order");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePharmacistClarification = async () => {
    if (!clarifyNotes.trim()) {
      setActionError("Clarification notes are required.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await adminOrderService.requestClarification(orderId, clarifyNotes);
      setOrder(updated);
      setShowClarifyModal(false);
      setClarifyNotes("");
    } catch (err: any) {
      setActionError(err?.message || "Failed to request clarification");
    } finally {
      setActionLoading(false);
    }
  };

  const handleAdminCancel = async () => {
    if (!cancelReason.trim()) {
      setActionError("Cancellation reason is mandatory.");
      return;
    }
    setActionLoading(true);
    setActionError(null);
    try {
      const updated = await adminOrderService.cancelOrder(orderId, cancelReason);
      setOrder(updated);
      setShowCancelModal(false);
      setCancelReason("");
    } catch (err: any) {
      setActionError(err?.message || "Failed to cancel order");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDownloadInvoice = async () => {
    setDownloadingInvoice(true);
    try {
      const blob = await adminOrderService.getInvoiceBlob(orderId);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `Invoice-${order?.order_number || orderId}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err: any) {
      alert(err.message || "Failed to download Form 20 cash memo PDF");
    } finally {
      setDownloadingInvoice(false);
    }
  };

  if (loading) {
    return (
      <div className="py-16 text-center space-y-3">
        <div className="w-8 h-8 border-2 border-[#087F5B] border-t-transparent rounded-full animate-spin mx-auto"></div>
        <p className="text-xs text-slate-500">Loading order credentials & batch ledger...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="py-16 text-center space-y-4">
        <AlertCircle className="w-10 h-10 text-red-500 mx-auto" />
        <p className="text-sm font-bold text-slate-800">{error || "Order Not Found"}</p>
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-xs text-[#087F5B] font-semibold hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" /> Back to Orders
        </Link>
      </div>
    );
  }

  const hasRx = order.items.some((i) => i.prescription_required);
  const isTerminal = ["delivered", "cancelled", "rejected", "failed"].includes(order.status);
  const isCancellable = ["placed", "pending_payment", "payment_confirmed", "pharmacist_review", "processing", "ready_for_dispatch"].includes(order.status);

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Link
          href="/orders"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Orders</span>
        </Link>
      </div>

      <PageHeader
        title={`Order: ${order.order_number}`}
        subtitle={`Placed on ${order.placed_at ? new Date(order.placed_at).toLocaleString("en-IN") : "Recent"} | Payment: ${order.payment_status.toUpperCase()}`}
        badge={<StatusBadge status={order.status.toUpperCase()} />}
        actions={
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={handleDownloadInvoice}
              disabled={downloadingInvoice}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 transition shadow-sm"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>{downloadingInvoice ? "Downloading..." : "Print Form 20 Cash Memo"}</span>
            </button>

            {/* Pharmacist Actions */}
            {order.status === "pharmacist_review" && (
              <>
                <button
                  type="button"
                  onClick={() => setShowClarifyModal(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-100 hover:bg-amber-200 rounded-lg transition"
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Request Clarification</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowRejectModal(true)}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-700 bg-red-100 hover:bg-red-200 rounded-lg transition"
                >
                  <XCircle className="w-3.5 h-3.5" />
                  <span>Reject (Rule 65)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePharmacistApprove}
                  disabled={actionLoading}
                  className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#087F5B] hover:bg-[#066649] rounded-lg shadow-sm transition"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Approve Dispensing</span>
                </button>
              </>
            )}

            {/* Operational transitions */}
            {order.status === "processing" && (
              <button
                type="button"
                onClick={() => handleUpdateStatus("ready_for_dispatch")}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#087F5B] hover:bg-[#066649] rounded-lg shadow-sm transition"
              >
                <Package className="w-4 h-4" />
                <span>Mark Ready for Dispatch</span>
              </button>
            )}

            {order.status === "ready_for_dispatch" && (
              <button
                type="button"
                onClick={() => handleUpdateStatus("dispatched")}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-purple-700 hover:bg-purple-800 rounded-lg shadow-sm transition"
              >
                <Truck className="w-4 h-4" />
                <span>Confirm Dispatch (Consume Stock)</span>
              </button>
            )}

            {order.status === "dispatched" && (
              <button
                type="button"
                onClick={() => handleUpdateStatus("delivered")}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg shadow-sm transition"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Confirm Delivery</span>
              </button>
            )}

            {isCancellable && (
              <button
                type="button"
                onClick={() => setShowCancelModal(true)}
                disabled={actionLoading}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-red-600 bg-white border border-red-200 hover:bg-red-50 rounded-lg transition"
              >
                <AlertTriangle className="w-3.5 h-3.5" />
                <span>Cancel Order</span>
              </button>
            )}
          </div>
        }
      />

      {actionError && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Clinical verification banner if prescription is required */}
      {hasRx && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
          <div className="text-xs text-amber-950">
            <p className="font-bold">Schedule H / H1 / X Prescription Drug Verification</p>
            <p className="text-amber-800 text-[11px] mt-0.5">
              Requires registered pharmacist authorization under Rule 65 of the Drugs and Cosmetics Rules, 1945.
              Batch allocations must remain reserved until dispatch confirmation.
            </p>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Order Items & Batch Register */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl border border-slate-200 overflow-hidden shadow-sm">
            <div className="px-4 py-3 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Dispensed Medicines & FEFO Batch Allocations
              </h3>
              <span className="text-[11px] text-slate-500 font-medium">
                {order.items.length} items
              </span>
            </div>
            <div className="divide-y divide-slate-100 text-xs">
              {order.items.map((item) => (
                <div key={item.id} className="p-4 flex items-start justify-between">
                  <div className="space-y-1">
                    <p className="font-bold text-slate-900">{item.product_name_snapshot}</p>
                    <p className="text-[11px] text-slate-500">
                      SKU: <span className="font-mono">{item.product_sku_snapshot}</span> | HSN: {item.hsn_code_snapshot} | Brand: {item.manufacturer_snapshot}
                    </p>
                    <div className="flex flex-wrap items-center gap-2 pt-1 font-mono text-[11px]">
                      <span className="bg-blue-50 text-blue-800 border border-blue-200 px-2 py-0.5 rounded font-semibold">
                        Batch: {item.batch_number_snapshot || "FEFO-ASSIGNED"}
                      </span>
                      <span className="bg-slate-100 text-slate-700 px-2 py-0.5 rounded">
                        Exp: {item.expiry_date_snapshot || "N/A"}
                      </span>
                      <span className="text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded font-medium">
                        FEFO Matched
                      </span>
                    </div>
                  </div>
                  <div className="text-right space-y-0.5">
                    <p className="font-bold text-slate-900">₹{Number(item.total_amount).toLocaleString("en-IN")}</p>
                    <p className="text-slate-500 text-[11px]">
                      Qty: {item.quantity} × ₹{Number(item.unit_price).toLocaleString("en-IN")}
                    </p>
                    <span className="text-[10px] text-slate-400">GST: {item.gst_rate_snapshot}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Batch Allocations and Reservations Audit */}
          {order.reservations && order.reservations.length > 0 && (
            <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3">
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
                Inventory Reservation Register ({order.reservations.length} allocations)
              </h3>
              <div className="divide-y divide-slate-100 text-xs">
                {order.reservations.map((res) => (
                  <div key={res.id} className="py-2.5 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-slate-800">
                        Batch ID: <span className="font-mono text-slate-600">{res.batch_id}</span>
                      </p>
                      <p className="text-[11px] text-slate-400">
                        Reserved at: {new Date(res.reserved_at).toLocaleString("en-IN")}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block text-[11px] font-bold px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        Reserved: {res.reserved_quantity} units ({res.status.toUpperCase()})
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Order Status History Timeline */}
          <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider">
              Statutory Lifecycle & Dispensing History
            </h3>
            <div className="divide-y divide-slate-100 text-xs">
              {order.status_history.map((hist) => (
                <div key={hist.id} className="py-2.5 flex justify-between items-start">
                  <div>
                    <span className="font-bold text-slate-900 font-mono">
                      {hist.new_status.toUpperCase()}
                    </span>
                    <span className="text-slate-400 text-[11px] ml-2">
                      by {hist.changed_by_name || hist.actor_role || "System"}
                    </span>
                    {hist.reason && (
                      <p className="text-[11px] text-slate-600 mt-0.5 italic">
                        Reason: {hist.reason}
                      </p>
                    )}
                    {hist.notes && (
                      <p className="text-[11px] text-slate-500 mt-0.5">{hist.notes}</p>
                    )}
                  </div>
                  <span className="text-[10px] text-slate-400">
                    {new Date(hist.created_at).toLocaleString("en-IN")}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Right Col: Customer & Payment Details */}
        <div className="space-y-6">
          {/* Customer & Address Details */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
              Customer & Delivery Address
            </h3>
            <div className="space-y-1.5 text-slate-700">
              <p className="font-bold text-slate-900">{order.customer_name || "Customer"}</p>
              <p>Phone: {order.customer_phone || "N/A"}</p>
              <p>Email: {order.customer_email || "N/A"}</p>
              <div className="pt-2 border-t border-slate-100 text-[11px] text-slate-600">
                <p className="font-semibold text-slate-800">
                  Deliver To: {order.delivery_address_snapshot?.recipient_name}
                </p>
                <p>{order.delivery_address_snapshot?.street_address}</p>
                <p>
                  {order.delivery_address_snapshot?.city}, {order.delivery_address_snapshot?.state} -{" "}
                  <strong>{order.delivery_address_snapshot?.pincode}</strong>
                </p>
              </div>
            </div>
          </div>

          {/* Payment Status & Financials */}
          <div className="bg-white rounded-xl border border-slate-200 p-4 shadow-sm space-y-3 text-xs">
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider pb-1 border-b border-slate-100">
              Financial Summary (INR)
            </h3>
            <div className="space-y-1.5 text-slate-600">
              <div className="flex justify-between">
                <span>Items Subtotal:</span>
                <span>₹{Number(order.subtotal).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Discount Total:</span>
                <span>- ₹{Number(order.discount_amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>CGST:</span>
                <span>₹{Number(order.cgst_amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>SGST:</span>
                <span>₹{Number(order.sgst_amount).toLocaleString("en-IN")}</span>
              </div>
              <div className="flex justify-between">
                <span>Cold Chain Delivery:</span>
                <span>₹{Number(order.delivery_fee).toLocaleString("en-IN")}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-bold text-sm text-slate-900">
                <span>Grand Total:</span>
                <span>₹{Number(order.grand_total).toLocaleString("en-IN")}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reject Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-red-600 flex items-center gap-2">
              <XCircle className="w-5 h-5" />
              <span>Statutory Clinical Rejection (Rule 65)</span>
            </h3>
            <p className="text-xs text-slate-500">
              Please enter the clinical reason for rejecting this prescription order.
              This note will be recorded in statutory audit history and active reservations will be released.
            </p>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="e.g. Dose exceeds maximum daily adult limit / Prescription illegible..."
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowRejectModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePharmacistReject}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Confirm Rejection
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Clarification Modal */}
      {showClarifyModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-amber-800 flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span>Request Clinical Clarification</span>
            </h3>
            <p className="text-xs text-slate-500">
              Specify what details or supplementary documents are required from the patient.
            </p>
            <textarea
              value={clarifyNotes}
              onChange={(e) => setClarifyNotes(e.target.value)}
              placeholder="e.g. Please provide page 2 showing the doctor's signature and stamp..."
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-amber-500 focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowClarifyModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handlePharmacistClarification}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-amber-700 hover:bg-amber-800 rounded-lg"
              >
                Send Request
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Admin Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 space-y-4 shadow-xl">
            <h3 className="font-bold text-sm text-red-600 flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              <span>Cancel Order {order.order_number}</span>
            </h3>
            <p className="text-xs text-slate-500">
              Are you sure? All reserved batch stock will be restored immediately.
            </p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g. Customer requested cancellation before dispatch..."
              className="w-full text-xs p-3 border border-slate-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:outline-none"
              rows={3}
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowCancelModal(false)}
                className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Back
              </button>
              <button
                onClick={handleAdminCancel}
                disabled={actionLoading}
                className="px-3 py-1.5 text-xs font-semibold text-white bg-red-600 hover:bg-red-700 rounded-lg"
              >
                Confirm Cancellation
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
