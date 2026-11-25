"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Breadcrumb } from "@/components/ui/Breadcrumb";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { Input } from "@/components/ui/Input";
import { ConfirmationDialog } from "@/components/ui/ConfirmationDialog";
import { LoadingSkeleton } from "@/components/ui/LoadingSkeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  addressService,
  AddressItem,
  AddressCreatePayload,
  AddressUpdatePayload,
} from "@/services/address.service";
import { MapPin, Plus, Edit2, Trash2, CheckCircle2, AlertCircle } from "lucide-react";

export default function AddressManagementPage() {
  const [addresses, setAddresses] = useState<AddressItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingAddress, setEditingAddress] = useState<AddressItem | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Delete Confirmation State
  const [deletingAddressId, setDeletingAddressId] = useState<string | null>(null);

  // Form Fields
  const [recipientName, setRecipientName] = useState("");
  const [phone, setPhone] = useState("");
  const [addressLine1, setAddressLine1] = useState("");
  const [addressLine2, setAddressLine2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [city, setCity] = useState("Bengaluru");
  const [state, setState] = useState("Karnataka");
  const [pincode, setPincode] = useState("");
  const [addressType, setAddressType] = useState("home");
  const [isDefault, setIsDefault] = useState(false);

  const fetchAddresses = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await addressService.list();
      setAddresses(data);
    } catch (err: any) {
      setError(err?.message || "Failed to load saved addresses. Please check your connection.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const resetForm = () => {
    setEditingAddress(null);
    setRecipientName("");
    setPhone("");
    setAddressLine1("");
    setAddressLine2("");
    setLandmark("");
    setCity("Bengaluru");
    setState("Karnataka");
    setPincode("");
    setAddressType("home");
    setIsDefault(false);
    setFormError(null);
  };

  const openAddModal = () => {
    resetForm();
    setIsModalOpen(true);
  };

  const openEditModal = (addr: AddressItem) => {
    setEditingAddress(addr);
    setRecipientName(addr.recipient_name);
    setPhone(addr.phone || addr.recipient_phone || "");
    setAddressLine1(addr.address_line1);
    setAddressLine2(addr.address_line2 || "");
    setLandmark(addr.landmark || "");
    setCity(addr.city);
    setState(addr.state);
    setPincode(addr.pincode);
    setAddressType(addr.address_type || "home");
    setIsDefault(addr.is_default);
    setFormError(null);
    setIsModalOpen(true);
  };

  const handleSaveAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    // Validate phone & pincode
    const cleanPhone = phone.trim().replace(/\D/g, "");
    if (cleanPhone.length < 10) {
      setFormError("Please enter a valid 10-digit Indian mobile number.");
      return;
    }
    const cleanPin = pincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setFormError("Please enter a valid 6-digit Indian PIN code (e.g. 560001).");
      return;
    }

    try {
      setIsSubmitting(true);
      if (editingAddress) {
        const payload: AddressUpdatePayload = {
          recipient_name: recipientName.trim(),
          phone: cleanPhone.slice(-10),
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || undefined,
          landmark: landmark.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: cleanPin,
          address_type: addressType,
          is_default: isDefault,
        };
        await addressService.update(editingAddress.id, payload);
      } else {
        const payload: AddressCreatePayload = {
          recipient_name: recipientName.trim(),
          phone: cleanPhone.slice(-10),
          address_line1: addressLine1.trim(),
          address_line2: addressLine2.trim() || undefined,
          landmark: landmark.trim() || undefined,
          city: city.trim(),
          state: state.trim(),
          pincode: cleanPin,
          address_type: addressType,
          is_default: isDefault,
        };
        await addressService.create(payload);
      }
      setIsModalOpen(false);
      resetForm();
      await fetchAddresses();
    } catch (err: any) {
      setFormError(err?.message || "Failed to save address. Please verify your details.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetDefault = async (id: string) => {
    try {
      await addressService.setDefault(id);
      await fetchAddresses();
    } catch (err: any) {
      setError(err?.message || "Could not set address as default.");
    }
  };

  const handleDeleteAddress = async () => {
    if (!deletingAddressId) return;
    try {
      await addressService.delete(deletingAddressId);
      setDeletingAddressId(null);
      await fetchAddresses();
    } catch (err: any) {
      setError(err?.message || "Could not delete address.");
    }
  };

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
        <Button variant="primary" size="sm" onClick={openAddModal}>
          <Plus className="w-3.5 h-3.5 shrink-0" />
          <span>Add New Address</span>
        </Button>
      </div>

      {error && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAddresses}
            className="text-xs font-semibold text-red-800 underline hover:no-underline ml-3"
          >
            Retry
          </button>
        </div>
      )}

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <LoadingSkeleton height="180px" />
          <LoadingSkeleton height="180px" />
        </div>
      ) : addresses.length === 0 ? (
        <EmptyState
          icon={<MapPin className="w-12 h-12 text-slate-300" />}
          title="No Delivery Addresses Saved"
          description="Add a delivery address to verify medicine serviceability and proceed with checkout."
          action={
            <Button variant="primary" size="sm" onClick={openAddModal}>
              <Plus className="w-3.5 h-3.5 shrink-0" />
              <span>Add Your First Address</span>
            </Button>
          }
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {addresses.map((addr) => (
            <div
              key={addr.id}
              className={`bg-white rounded-xl border p-5 shadow-subtle space-y-3 relative transition ${
                addr.is_default ? "border-[#0D9488] ring-1 ring-[#0D9488]/20" : "border-slate-200"
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-[#172B24] uppercase tracking-wider bg-slate-100 px-2 py-0.5 rounded">
                  {addr.address_type}
                </span>
                {addr.is_default ? (
                  <span className="text-[10px] font-bold text-[#0D9488] bg-[#F0FDFA] border border-[#CCFBF1] px-2 py-0.5 rounded-full flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" />
                    Default Delivery Address
                  </span>
                ) : (
                  <button
                    onClick={() => handleSetDefault(addr.id)}
                    className="text-[11px] font-semibold text-slate-500 hover:text-[#0D9488] transition"
                  >
                    Set as Default
                  </button>
                )}
              </div>

              <div>
                <p className="text-xs font-bold text-[#172B24]">{addr.recipient_name}</p>
                <p className="text-xs text-slate-600 mt-1 leading-relaxed">
                  {addr.address_line1}
                  {addr.address_line2 && `, ${addr.address_line2}`}
                  {addr.landmark && ` (Near ${addr.landmark})`}
                  <br />
                  {addr.city}, {addr.state} - <strong>{addr.pincode}</strong>
                </p>
                <p className="text-[11px] text-slate-500 mt-1.5 font-medium">
                  Phone: {addr.phone || addr.recipient_phone}
                </p>
              </div>

              <div className="pt-2 border-t border-slate-100 flex items-center justify-end gap-3 text-xs">
                <button
                  onClick={() => openEditModal(addr)}
                  className="text-slate-500 hover:text-[#0D9488] flex items-center gap-1 font-semibold transition"
                >
                  <Edit2 className="w-3.5 h-3.5" /> Edit
                </button>
                <button
                  onClick={() => setDeletingAddressId(addr.id)}
                  className="text-slate-400 hover:text-red-600 flex items-center gap-1 font-semibold transition"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add / Edit Address Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={editingAddress ? "Edit Delivery Address" : "Add New Delivery Address"}
        description="Delivery available across Bengaluru city pincodes (4-Hour Medicine Dispatch)"
      >
        <form onSubmit={handleSaveAddress} className="space-y-3.5">
          {formError && (
            <div className="p-2.5 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{formError}</span>
            </div>
          )}

          <div className="grid grid-cols-2 gap-3">
            <Input
              label="Full Name"
              placeholder="e.g. Aarav Sharma"
              value={recipientName}
              onChange={(e) => setRecipientName(e.target.value)}
              required
            />
            <Input
              label="Mobile Number"
              placeholder="10-digit mobile number"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              required
            />
          </div>

          <Input
            label="Address Line 1 (Flat, Floor, Building)"
            placeholder="e.g. Flat 402, Green Glen Heights"
            value={addressLine1}
            onChange={(e) => setAddressLine1(e.target.value)}
            required
          />

          <Input
            label="Address Line 2 (Street, Area)"
            placeholder="e.g. Outer Ring Road, Bellandur"
            value={addressLine2}
            onChange={(e) => setAddressLine2(e.target.value)}
          />

          <div className="grid grid-cols-3 gap-3">
            <Input
              label="Landmark"
              placeholder="Nearby landmark"
              value={landmark}
              onChange={(e) => setLandmark(e.target.value)}
            />
            <Input
              label="City"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              required
            />
            <Input
              label="PIN Code"
              placeholder="6-digit PIN"
              value={pincode}
              onChange={(e) => setPincode(e.target.value)}
              required
            />
          </div>

          <div className="grid grid-cols-2 gap-3 pt-1">
            <div>
              <label className="block text-xs font-semibold text-[#172B24] mb-1">
                Address Type
              </label>
              <select
                value={addressType}
                onChange={(e) => setAddressType(e.target.value)}
                className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-xs text-[#172B24] focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
              >
                <option value="home">Home</option>
                <option value="work">Work</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={isDefault}
                  onChange={(e) => setIsDefault(e.target.checked)}
                  className="rounded border-slate-300 text-[#0D9488] focus:ring-[#0D9488]"
                />
                <span>Set as primary default address</span>
              </label>
            </div>
          </div>

          <div className="pt-3 border-t border-slate-200 flex justify-end gap-2">
            <Button
              variant="outline"
              size="sm"
              type="button"
              onClick={() => setIsModalOpen(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button variant="primary" size="sm" type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : editingAddress ? "Update Address" : "Save Address"}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        isOpen={!!deletingAddressId}
        onClose={() => setDeletingAddressId(null)}
        onConfirm={handleDeleteAddress}
        title="Delete Address?"
        message="Are you sure you want to remove this delivery address? This action cannot be undone."
        confirmText="Delete"
        isDestructive
      />
    </div>
  );
}
