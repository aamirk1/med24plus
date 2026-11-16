"use client";

import React, { useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { MOCK_ADDRESSES } from "@/mock/data";
import { Address } from "@/types";
import { MapPin, Plus, Edit2, Trash2 } from "lucide-react";

export default function AddressManagementPage() {
  const [addresses, setAddresses] = useState<Address[]>(MOCK_ADDRESSES);
  const [isModalOpen, setIsModalOpen] = useState(false);

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6 text-left">
      <Breadcrumb
        items={[
          { label: "Account", href: "/account/profile" },
          { label: "Addresses" },
        ]}
      />

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-200">
        <div>
          <h1 className="text-2xl font-bold text-[#172B24]">Saved Delivery Addresses</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Manage your delivery destinations for express medicine dispatches
          </p>
        </div>
        <Button variant="primary" size="sm" onClick={() => setIsModalOpen(true)}>
          <Plus className="w-3.5 h-3.5 mr-1" />
          <span>Add New Address</span>
        </Button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {addresses.map((addr) => (
          <div
            key={addr.id}
            className="bg-white rounded-xl border border-slate-200 p-5 shadow-subtle space-y-3 relative"
          >
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#172B24] uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                {addr.type}
              </span>
              {addr.isDefault && (
                <span className="text-[10px] font-bold text-[#087F5B] bg-[#E6F4EF] border border-[#C3E7DB] px-2 py-0.5 rounded-full">
                  Default Delivery Address
                </span>
              )}
            </div>

            <div>
              <p className="text-xs font-bold text-[#172B24]">{addr.fullName}</p>
              <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                {addr.addressLine1}
                {addr.addressLine2 && `, ${addr.addressLine2}`}
                {addr.landmark && ` (Near ${addr.landmark})`}
                <br />
                {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
              </p>
              <p className="text-[11px] text-slate-500 mt-1.5 font-medium">Phone: {addr.phone}</p>
            </div>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
              <button className="text-slate-500 hover:text-[#087F5B] flex items-center gap-1 font-semibold">
                <Edit2 className="w-3.5 h-3.5" /> Edit
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Add Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add New Delivery Address"
        description="Delivery available across Bengaluru city pincodes (4-Hour Delivery)"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            setIsModalOpen(false);
          }}
          className="space-y-3.5"
        >
          <div className="grid grid-cols-2 gap-3">
            <Input label="Full Name" placeholder="e.g. Aarav Sharma" required />
            <Input label="Mobile Number" placeholder="10-digit mobile number" required />
          </div>
          <Input label="Address Line 1 (Flat, Floor, Building)" required />
          <Input label="Address Line 2 (Street, Area)" />
          <div className="grid grid-cols-3 gap-3">
            <Input label="Landmark" placeholder="Nearby point" />
            <Input label="City" defaultValue="Bengaluru" required />
            <Input label="PIN Code" placeholder="6-digit PIN" required />
          </div>
          <div className="pt-2 flex justify-end gap-2">
            <Button variant="outline" size="sm" type="button" onClick={() => setIsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit">
              Save Address
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}

