"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Eye, Loader2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AdminCustomer } from "@/types";
import { adminCustomerService } from "@/services/admin-customer.service";

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const [customers, setCustomers] = useState<AdminCustomer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchCustomers = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await adminCustomerService.getCustomers({ search: search || undefined });
        if (active) {
          setCustomers(res?.items || []);
        }
      } catch (err: any) {
        if (active) {
          console.error("Failed to load customers:", err);
          setError(err?.message || "Could not load customers from server.");
        }
      } finally {
        if (active) setLoading(false);
      }
    };

    const timer = setTimeout(fetchCustomers, 300);
    return () => {
      active = false;
      clearTimeout(timer);
    };
  }, [search]);

  const columns: Column<AdminCustomer>[] = [
    {
      header: "Customer",
      cell: (c) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-teal-50 text-[#0D9488] flex items-center justify-center font-bold text-xs">
            {c.name ? c.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{c.name || "Registered User"}</p>
            <p className="text-[10px] text-slate-400">{c.email || "No email"}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Contact",
      cell: (c) => <span className="text-xs text-slate-700 font-mono">{c.phone}</span>,
    },
    {
      header: "Location",
      cell: (c) => (
        <span className="text-xs text-slate-600">
          {c.city && c.city !== "N/A" ? `${c.city}, ${c.pincode}` : "Not registered yet"}
        </span>
      ),
    },
    {
      header: "Order History",
      cell: (c) => (
        <div className="text-xs">
          <span className="font-semibold text-slate-900">{c.totalOrders} orders</span>
          <p className="text-[10px] text-slate-500">₹{c.totalSpentINR.toLocaleString("en-IN")} spent</p>
        </div>
      ),
    },
    {
      header: "Status",
      cell: (c) => <StatusBadge status={c.status} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (c) => (
        <Link
          href={`/customers/${c.id}`}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold text-[#0D9488] bg-teal-50 hover:bg-teal-100 rounded-lg transition"
        >
          <Eye className="w-3.5 h-3.5" />
          <span>Profile</span>
        </Link>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Customer Directory"
        subtitle="Live database of registered patients, delivery addresses, and chronic medicine order records."
      />

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search patient name, phone number, or email..."
      />

      {error && (
        <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-[#0D9488] mb-2" />
          <p className="text-xs">Loading live customer accounts from database...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={customers}
          keyExtractor={(c) => c.id}
          emptyMessage="No customer records found in database."
        />
      )}
    </div>
  );
}
