"use client";

import React from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import { ArrowLeft, User, Phone, Mail, MapPin, ShoppingBag, ShieldCheck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_CUSTOMERS, MOCK_ADMIN_ORDERS } from "@/mock/adminData";

export default function AdminCustomerDetailPage() {
  const params = useParams();
  const customerId = params?.id as string;
  const customer = MOCK_CUSTOMERS.find((c) => c.id === customerId) || MOCK_CUSTOMERS[0];
  const customerOrders = MOCK_ADMIN_ORDERS.filter((o) => o.customerPhone === customer.phone);

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
        title={customer.name}
        subtitle={`Member since ${customer.registeredDate} | Patient ID: ${customer.id}`}
        badge={<StatusBadge status={customer.status} />}
      />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Profile Card */}
        <div className="bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-[#087F5B] flex items-center justify-center font-bold text-lg">
              {customer.name.charAt(0)}
            </div>
            <div>
              <p className="font-bold text-slate-900 text-sm">{customer.name}</p>
              <p className="text-xs text-slate-400">Verified Patient</p>
            </div>
          </div>

          <div className="space-y-3 pt-3 border-t border-slate-100 text-xs">
            <div className="flex items-center gap-2.5 text-slate-700">
              <Phone className="w-4 h-4 text-slate-400 shrink-0" />
              <span className="font-mono">{customer.phone}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <Mail className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{customer.email}</span>
            </div>
            <div className="flex items-center gap-2.5 text-slate-700">
              <MapPin className="w-4 h-4 text-slate-400 shrink-0" />
              <span>{customer.city} — {customer.pincode}</span>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-center">
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Orders</p>
              <p className="font-bold text-slate-900 text-sm mt-0.5">{customer.totalOrders}</p>
            </div>
            <div className="p-2 bg-slate-50 rounded-lg">
              <p className="text-[10px] text-slate-400 uppercase font-semibold">Total Spent</p>
              <p className="font-bold text-[#087F5B] text-sm mt-0.5">₹{customer.totalSpentINR.toLocaleString("en-IN")}</p>
            </div>
          </div>
        </div>

        {/* Order History */}
        <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 p-5 shadow-sm space-y-4">
          <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wider border-b border-slate-100 pb-2">
            Prescription & Dispensing History
          </h3>

          {customerOrders.length > 0 ? (
            <div className="space-y-3">
              {customerOrders.map((o) => (
                <div
                  key={o.id}
                  className="p-3.5 rounded-lg border border-slate-100 bg-slate-50/50 flex items-center justify-between text-xs"
                >
                  <div>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-slate-900">{o.orderNumber}</p>
                      <StatusBadge status={o.statusCode} />
                    </div>
                    <p className="text-[11px] text-slate-500 mt-1">
                      {o.orderDate} • {o.itemCount} items • {o.paymentMethod}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">₹{o.totalAmount.toLocaleString("en-IN")}</p>
                    <Link
                      href={`/orders/${o.id}`}
                      className="text-[11px] font-semibold text-[#087F5B] hover:underline mt-1 block"
                    >
                      View Order
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8 text-xs text-slate-400">
              No recent dispensing records for this patient.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

