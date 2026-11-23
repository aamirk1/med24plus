"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Phone, Mail, MapPin, ShoppingBag, ShieldCheck, Loader2, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminCustomerService, AdminCustomerDetailData } from "@/services/admin-customer.service";
import { adminOrderService, AdminOrderDetail } from "@/services/adminOrderService";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id as string;

  const [customer, setCustomer] = useState<AdminCustomerDetailData | null>(null);
  const [orders, setOrders] = useState<AdminOrderDetail[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!customerId) return;
    setLoading(true);
    adminCustomerService
      .getCustomer(customerId)
      .then(async (data) => {
        setCustomer(data);
        if (data?.phone) {
          try {
            const ordersRes = await adminOrderService.listOrders({ search: data.phone, page_size: 10 });
            setOrders(ordersRes?.items || []);
          } catch (e) {
            console.warn("Could not fetch customer orders:", e);
          }
        }
      })
      .catch((err) => {
        console.error("Failed to load customer:", err);
        setError("Customer profile not found or could not be loaded.");
      })
      .finally(() => setLoading(false));
  }, [customerId]);

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center py-24 text-slate-500">
        <Loader2 className="w-8 h-8 animate-spin text-[#0D9488] mb-3" />
        <p className="text-sm font-medium">Loading patient record from database...</p>
      </div>
    );
  }

  if (error || !customer) {
    return (
      <div className="p-6 bg-red-50 border border-red-200 rounded-xl space-y-3">
        <div className="flex items-center gap-2 text-red-700 font-semibold text-sm">
          <AlertCircle className="w-5 h-5" />
          <span>Error loading customer</span>
        </div>
        <p className="text-xs text-red-600">{error || "Customer record not found."}</p>
        <Link
          href="/customers"
          className="inline-flex items-center gap-1 text-xs font-semibold text-[#0D9488] hover:underline"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-2">
        <Link
          href="/customers"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Customers</span>
        </Link>
      </div>

      <PageHeader
        title={customer.name || "Patient Profile"}
        subtitle={`Member since ${customer.registeredDate} | Patient ID: ${customer.id}`}
        badge={<StatusBadge status={customer.status} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-teal-100 text-[#0D9488] flex items-center justify-center font-bold text-lg">
              {customer.name ? customer.name.charAt(0).toUpperCase() : "U"}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{customer.name || "Registered Patient"}</p>
              <p className="text-xs text-slate-400">Verified Account</p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-mono">{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{customer.email || "No email on file"}</span>
            </div>
            {customer.blood_group && (
              <div className="flex items-center gap-2.5 text-slate-700">
                <ShieldCheck className="w-4 h-4 text-slate-400 shrink-0" />
                <span>Blood Group: {customer.blood_group}</span>
              </div>
            )}
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Orders</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{customer.totalOrders}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Spent</p>
              <p className="font-bold text-[#0D9488] text-sm mt-0.5">₹{customer.totalSpentINR.toLocaleString("en-IN")}</p>
            </div>
          </div>

          {customer.addresses && customer.addresses.length > 0 && (
            <div className="pt-3 border-t border-slate-100 space-y-2">
              <p className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Registered Addresses</p>
              {customer.addresses.map((addr) => (
                <div key={addr.id} className="p-2.5 bg-slate-50 rounded-lg text-[11px] text-slate-600 space-y-1">
                  <p className="font-semibold text-slate-800">{addr.recipient_name} ({addr.address_type})</p>
                  <p>{addr.address_line1} {addr.address_line2 || ""}</p>
                  <p>{addr.city}, {addr.state} — {addr.pincode}</p>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Order History */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Order & Prescription History
          </h3>

          {orders.length > 0 ? (
            <div className="space-y-3">
              {orders.map((o) => (
                <div
                  key={o.id}
                  className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{o.order_number}</p>
                      <StatusBadge status={o.status} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {o.created_at ? new Date(o.created_at).toLocaleDateString() : "Recent"} • {o.item_count} items • {o.payment_status || "Standard Order"}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{Number(o.grand_total || 0).toLocaleString("en-IN")}</p>
                    <Link
                      href={`/orders/${o.id}`}
                      className="inline-block text-[11px] font-semibold text-[#0D9488] hover:underline mt-0.5"
                    >
                      View Order →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 text-center text-slate-400 text-xs">
              <ShoppingBag className="w-8 h-8 mx-auto text-slate-300 mb-2" />
              <p>No orders placed by this patient yet.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
