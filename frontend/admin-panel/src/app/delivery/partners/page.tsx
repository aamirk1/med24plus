"use client";

import React, { useState } from "react";
import Link from "next/link";
import { ArrowLeft, Plus, Truck } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { DeliveryPartner } from "@/types";

export default function DeliveryPartnersPage() {
  const [partners, setPartners] = useState<DeliveryPartner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [name, setName] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [phone, setPhone] = useState("");

  const handleAddPartner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newPartner: DeliveryPartner = {
      id: `dp-${Date.now()}`,
      name: name.trim(),
      contactPerson: contactPerson.trim() || "Operations Lead",
      phone: phone.trim() || "+91 98000 00000",
      activeOrders: 0,
      completedOrders: 0,
      avgDeliveryTime: "2-4 hours",
      status: "ACTIVE",
    };

    setPartners((prev) => [newPartner, ...prev]);
    setName("");
    setContactPerson("");
    setPhone("");
    setIsModalOpen(false);
  };

  const columns: Column<DeliveryPartner>[] = [
    {
      header: "Fleet / Partner Name",
      cell: (dp) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-teal-50 text-[#0D9488] flex items-center justify-center shrink-0">
            <Truck className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{dp.name}</p>
            <p className="text-[10px] text-slate-400">Contact: {dp.contactPerson}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Phone",
      cell: (dp) => <span className="text-xs font-mono text-slate-700">{dp.phone}</span>,
    },
    {
      header: "Active Deliveries",
      cell: (dp) => <span className="text-xs font-bold text-[#0D9488]">{dp.activeOrders} active</span>,
    },
    {
      header: "Completed Deliveries",
      cell: (dp) => <span className="text-xs text-slate-700 font-medium">{dp.completedOrders} orders</span>,
    },
    {
      header: "Average TAT",
      cell: (dp) => <span className="text-xs font-semibold text-teal-700">{dp.avgDeliveryTime}</span>,
    },
    {
      header: "Status",
      cell: (dp) => <StatusBadge status={dp.status} />,
    },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href="/delivery"
          className="inline-flex items-center gap-1 text-xs font-semibold text-slate-500 hover:text-slate-900 transition"
        >
          <ArrowLeft className="w-3.5 h-3.5" />
          <span>Back to Delivery Overview</span>
        </Link>
      </div>

      <PageHeader
        title="Delivery Fleet & Courier Partners"
        subtitle="Manage temperature-controlled cold-chain couriers and local express delivery fleets."
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Delivery Partner</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={partners}
        keyExtractor={(dp) => dp.id}
        emptyMessage="No delivery partners configured yet. Click 'Add Delivery Partner' to onboard a fleet."
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Add Delivery Fleet Partner</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddPartner} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Fleet / Partner Name *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Med24 Cold-Chain Express"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operations Contact Person
                </label>
                <input
                  type="text"
                  placeholder="Contact Name"
                  value={contactPerson}
                  onChange={(e) => setContactPerson(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Dispatch Phone Number
                </label>
                <input
                  type="text"
                  placeholder="+91 98..."
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-50 border border-slate-200 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-xs font-semibold text-white bg-[#0D9488] hover:bg-[#0F766E] rounded-lg shadow-sm"
                >
                  Save Partner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
