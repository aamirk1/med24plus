"use client";

import React, { useEffect, useState } from "react";
import {
  Save,
  Truck,
  MapPin,
  Plus,
  Trash2,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  Search,
  Check,
  X,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { FormSection } from "@/components/ui/FormSection";
import { apiClient } from "@/services/api";

interface CheckoutSettings {
  id?: string;
  standard_delivery_fee: number | string;
  free_delivery_threshold: number | string;
  express_cold_chain_fee: number | string;
  minimum_cart_value: number | string;
  max_quantity_per_product: number;
  is_serviceability_enforced: boolean;
  updated_at?: string;
}

interface ServiceablePincode {
  id: string;
  pincode: string;
  area_name?: string | null;
  city: string;
  state: string;
  is_active: boolean;
  estimated_delivery_hours: number;
  min_order_value: number | string;
  created_at?: string;
}

export default function AdminDeliverySettingsPage() {
  const [settings, setSettings] = useState<CheckoutSettings>({
    standard_delivery_fee: "40",
    free_delivery_threshold: "499",
    express_cold_chain_fee: "99",
    minimum_cart_value: "0",
    max_quantity_per_product: 10,
    is_serviceability_enforced: true,
  });

  const [pincodes, setPincodes] = useState<ServiceablePincode[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingSettings, setSavingSettings] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Search filter
  const [searchTerm, setSearchTerm] = useState("");

  // Add pincode state
  const [newPincode, setNewPincode] = useState("");
  const [newAreaName, setNewAreaName] = useState("");
  const [newCity, setNewCity] = useState("Bengaluru");
  const [newState, setNewState] = useState("Karnataka");
  const [newEstHours, setNewEstHours] = useState(4);
  const [isAddingPin, setIsAddingPin] = useState(false);
  const [pinError, setPinError] = useState<string | null>(null);

  const fetchData = async () => {
    try {
      setLoading(true);
      setErrorMessage(null);

      const [settingsRes, pincodesRes] = await Promise.all([
        apiClient<{ success: boolean; data: CheckoutSettings }>("/admin/checkout-settings"),
        apiClient<{ success: boolean; data: ServiceablePincode[] }>("/admin/serviceability?page_size=100"),
      ]);

      if (settingsRes?.data) {
        setSettings(settingsRes.data);
      }
      if (pincodesRes?.data) {
        setPincodes(pincodesRes.data);
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to load delivery settings and serviceable pincodes.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      setSavingSettings(true);
      const res = await apiClient<{ success: boolean; data: CheckoutSettings }>("/admin/checkout-settings", {
        method: "PATCH",
        data: {
          standard_delivery_fee: Number(settings.standard_delivery_fee),
          free_delivery_threshold: Number(settings.free_delivery_threshold),
          express_cold_chain_fee: Number(settings.express_cold_chain_fee),
          minimum_cart_value: Number(settings.minimum_cart_value),
          max_quantity_per_product: Number(settings.max_quantity_per_product),
          is_serviceability_enforced: Boolean(settings.is_serviceability_enforced),
        },
      });

      if (res?.data) {
        setSettings(res.data);
      }
      setSuccessMessage("Delivery configuration updated successfully.");
      setTimeout(() => setSuccessMessage(null), 4000);
    } catch (err: any) {
      setErrorMessage(err?.message || "Failed to update delivery settings.");
    } finally {
      setSavingSettings(false);
    }
  };

  const handleAddPincode = async (e: React.FormEvent) => {
    e.preventDefault();
    setPinError(null);

    const cleanPin = newPincode.trim();
    if (!/^[1-9][0-9]{5}$/.test(cleanPin)) {
      setPinError("Please enter a valid 6-digit Indian PIN code (e.g. 560001).");
      return;
    }

    try {
      setIsAddingPin(true);
      const res = await apiClient<{ success: boolean; data: ServiceablePincode }>("/admin/serviceability", {
        method: "POST",
        data: {
          pincode: cleanPin,
          area_name: newAreaName.trim() || undefined,
          city: newCity.trim(),
          state: newState.trim(),
          estimated_delivery_hours: Number(newEstHours),
          is_active: true,
          min_order_value: 0,
        },
      });

      if (res?.data) {
        setPincodes((prev) => [res.data, ...prev]);
        setNewPincode("");
        setNewAreaName("");
      }
    } catch (err: any) {
      setPinError(err?.message || "Failed to add serviceable PIN code.");
    } finally {
      setIsAddingPin(false);
    }
  };

  const handleTogglePincodeStatus = async (id: string, currentStatus: boolean) => {
    try {
      const res = await apiClient<{ success: boolean; data: ServiceablePincode }>(`/admin/serviceability/${id}`, {
        method: "PATCH",
        data: {
          is_active: !currentStatus,
        },
      });

      if (res?.data) {
        setPincodes((prev) =>
          prev.map((p) => (p.id === id ? { ...p, is_active: res.data.is_active } : p))
        );
      }
    } catch (err: any) {
      setErrorMessage(err?.message || "Could not update pincode status.");
    }
  };

  const handleDeletePincode = async (id: string) => {
    if (!window.confirm("Are you sure you want to remove this PIN code from the delivery geofence?")) {
      return;
    }

    try {
      await apiClient(`/admin/serviceability/${id}`, {
        method: "DELETE",
      });
      setPincodes((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      setErrorMessage(err?.message || "Could not delete PIN code.");
    }
  };

  const filteredPincodes = pincodes.filter((p) => {
    const query = searchTerm.toLowerCase();
    return (
      p.pincode.toLowerCase().includes(query) ||
      (p.area_name && p.area_name.toLowerCase().includes(query)) ||
      p.city.toLowerCase().includes(query)
    );
  });

  return (
    <div className="space-y-6 max-w-4xl text-left">
      <PageHeader
        title="Delivery & Serviceable Pincodes"
        subtitle="Configure hyper-local serviceable delivery areas, free delivery tiers, and cold-chain fees."
      />

      {successMessage && (
        <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs text-emerald-800 flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-[#087F5B] shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-3.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={fetchData}
            className="text-xs font-semibold underline text-red-800 hover:no-underline ml-2"
          >
            Retry
          </button>
        </div>
      )}

      <form onSubmit={handleSaveSettings} className="space-y-6">
        <FormSection
          title="Delivery Fee Matrix & Constraints"
          description="Pricing thresholds for free home shipping, specialized cold chain surcharges, and order constraints."
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Free Delivery Above (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.free_delivery_threshold}
                onChange={(e) =>
                  setSettings({ ...settings, free_delivery_threshold: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Carts exceeding this enjoy free shipping</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Standard Shipping Charge (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.standard_delivery_fee}
                onChange={(e) =>
                  setSettings({ ...settings, standard_delivery_fee: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Applied when cart is below free threshold</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Cold-Chain Priority Surcharge (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.express_cold_chain_fee}
                onChange={(e) =>
                  setSettings({ ...settings, express_cold_chain_fee: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Insulated vaccine & insulin packaging</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Minimum Cart Value (₹)
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={settings.minimum_cart_value}
                onChange={(e) =>
                  setSettings({ ...settings, minimum_cart_value: e.target.value })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
              <p className="text-[10px] text-slate-400 mt-1">0 allows any positive order subtotal</p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Max Quantity Per Product
              </label>
              <input
                type="number"
                min="1"
                max="100"
                value={settings.max_quantity_per_product}
                onChange={(e) =>
                  setSettings({ ...settings, max_quantity_per_product: Number(e.target.value) })
                }
                className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
              <p className="text-[10px] text-slate-400 mt-1">Anti-hoarding limit per cart row</p>
            </div>

            <div className="flex items-center pt-5">
              <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-700">
                <input
                  type="checkbox"
                  checked={settings.is_serviceability_enforced}
                  onChange={(e) =>
                    setSettings({ ...settings, is_serviceability_enforced: e.target.checked })
                  }
                  className="rounded border-slate-300 text-[#087F5B] focus:ring-[#087F5B]"
                />
                <span>Enforce PIN Code Geofencing at Checkout</span>
              </label>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100">
            <button
              type="submit"
              disabled={savingSettings}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white bg-[#087F5B] hover:bg-[#066649] rounded-lg shadow-sm transition disabled:opacity-50"
            >
              <Save className="w-3.5 h-3.5" />
              <span>{savingSettings ? "Saving Settings..." : "Save Delivery Settings"}</span>
            </button>
          </div>
        </FormSection>
      </form>

      {/* Serviceable Pincodes Geofence Management */}
      <div className="bg-white rounded-xl border border-slate-200 p-6 shadow-subtle space-y-5">
        <div>
          <h2 className="text-sm font-bold text-[#172B24] flex items-center gap-2">
            <MapPin className="w-4 h-4 text-[#087F5B]" />
            <span>Serviceable Postal Codes Geofence ({pincodes.length} Configured)</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Active Indian postal codes where Med24Plus operates temperature-controlled courier dispatch.
          </p>
        </div>

        {/* Add Pincode Bar */}
        <form
          onSubmit={handleAddPincode}
          className="p-4 rounded-xl bg-slate-50 border border-slate-200 space-y-3"
        >
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-[#172B24]">Add Serviceable PIN Code</span>
            <span className="text-[11px] text-slate-400">Bengaluru Metro Region</span>
          </div>

          {pinError && (
            <div className="p-2 rounded bg-red-50 text-[11px] text-red-700 flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-red-500" />
              <span>{pinError}</span>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
            <div>
              <input
                type="text"
                placeholder="6-Digit PIN (e.g. 560034)"
                value={newPincode}
                onChange={(e) => setNewPincode(e.target.value)}
                maxLength={6}
                required
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>
            <div>
              <input
                type="text"
                placeholder="Locality / Area Name (e.g. Koramangala)"
                value={newAreaName}
                onChange={(e) => setNewAreaName(e.target.value)}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>
            <div>
              <select
                value={newEstHours}
                onChange={(e) => setNewEstHours(Number(e.target.value))}
                className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 bg-white focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              >
                <option value={2}>2 Hours (Hyper-Express)</option>
                <option value={4}>4 Hours (Standard Express)</option>
                <option value={8}>8 Hours (Same Day)</option>
                <option value={24}>24 Hours (Next Day)</option>
              </select>
            </div>
            <div>
              <button
                type="submit"
                disabled={isAddingPin}
                className="w-full inline-flex items-center justify-center gap-1 px-4 py-1.5 text-xs font-semibold text-white bg-[#087F5B] hover:bg-[#066649] rounded-lg transition disabled:opacity-50"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>{isAddingPin ? "Adding..." : "Add PIN"}</span>
              </button>
            </div>
          </div>
        </form>

        {/* Filter and Table */}
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <div className="relative flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
              <input
                type="text"
                placeholder="Search PIN code or locality..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#087F5B]"
              />
            </div>
            <span className="text-[11px] text-slate-400">
              Showing {filteredPincodes.length} of {pincodes.length} postal zones
            </span>
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 font-semibold">
                <tr>
                  <th className="px-4 py-2.5">PIN Code</th>
                  <th className="px-4 py-2.5">Locality / Area</th>
                  <th className="px-4 py-2.5">City & State</th>
                  <th className="px-4 py-2.5">Turnaround</th>
                  <th className="px-4 py-2.5">Status</th>
                  <th className="px-4 py-2.5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredPincodes.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-4 py-8 text-center text-slate-400">
                      No serviceable postal codes found matching your search.
                    </td>
                  </tr>
                ) : (
                  filteredPincodes.map((pin) => (
                    <tr key={pin.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-2.5 font-bold text-[#172B24] font-mono">
                        {pin.pincode}
                      </td>
                      <td className="px-4 py-2.5 text-slate-700">
                        {pin.area_name || <span className="text-slate-400 italic">Unspecified</span>}
                      </td>
                      <td className="px-4 py-2.5 text-slate-500">
                        {pin.city}, {pin.state}
                      </td>
                      <td className="px-4 py-2.5">
                        <span className="text-slate-600 font-medium">
                          {pin.estimated_delivery_hours} Hours
                        </span>
                      </td>
                      <td className="px-4 py-2.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePincodeStatus(pin.id, pin.is_active)}
                          className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider cursor-pointer ${
                            pin.is_active
                              ? "bg-emerald-100 text-emerald-800 hover:bg-emerald-200"
                              : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                          }`}
                        >
                          {pin.is_active ? <Check className="w-2.5 h-2.5" /> : <X className="w-2.5 h-2.5" />}
                          {pin.is_active ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <button
                          type="button"
                          onClick={() => handleDeletePincode(pin.id)}
                          className="text-slate-400 hover:text-red-600 p-1 transition"
                          title="Delete PIN code"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
