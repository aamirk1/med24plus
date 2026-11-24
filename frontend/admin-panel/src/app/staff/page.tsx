"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  UserCheck,
  ShieldCheck,
  Loader2,
  Plus,
  X,
  Trash2,
  CheckCircle2,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { AdminStaff } from "@/types";
import { adminCustomerService } from "@/services/admin-customer.service";

const ROLES_LIST = [
  { value: "pharmacist", label: "Licensed Pharmacist", desc: "Drug dispensing, prescription review under Rule 65" },
  { value: "inventory_manager", label: "Inventory Manager", desc: "Batch FEFO allocations, PO stock adjustments" },
  { value: "staff", label: "Operations Staff", desc: "Order picking, packaging, and dispatch tracking" },
  { value: "admin", label: "Administrator", desc: "Full catalog, pricing, store rules, and staff management" },
  { value: "super_admin", label: "Super Admin", desc: "Global sovereign administrative access" },
];

export default function AdminStaffPage() {
  const [search, setSearch] = useState("");
  const [staff, setStaff] = useState<AdminStaff[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [modalError, setModalError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    full_name: "",
    email: "",
    phone: "",
    password: "",
    role: "pharmacist",
    department: "Pharmacy Operations",
    designation: "Registered Pharmacist",
    registration_number: "",
    state_pharmacy_council: "Karnataka State Pharmacy Council",
    registration_valid_upto: "",
  });

  const loadStaff = async () => {
    setLoading(true);
    try {
      const data = await adminCustomerService.getStaff();
      setStaff(data || []);
    } catch (e) {
      console.error("Failed to load staff:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadStaff();
  }, []);

  const handleOpenModal = () => {
    setFormData({
      full_name: "",
      email: "",
      phone: "+91",
      password: "",
      role: "pharmacist",
      department: "Pharmacy Operations",
      designation: "Registered Pharmacist",
      registration_number: "",
      state_pharmacy_council: "Karnataka State Pharmacy Council",
      registration_valid_upto: "2029-12-31",
    });
    setModalError(null);
    setIsModalOpen(true);
  };

  const handleCreateStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.full_name.trim()) {
      setModalError("Staff member full name is required.");
      return;
    }
    if (!formData.phone.trim() || formData.phone.length < 10) {
      setModalError("Please enter a valid phone number with country code (e.g. +919876543210).");
      return;
    }
    if (!formData.password || formData.password.length < 8) {
      setModalError("Password must be at least 8 characters.");
      return;
    }
    if (formData.role === "pharmacist" && !formData.registration_number.trim()) {
      setModalError("Pharmacist Council Registration number is mandatory under Rule 65.");
      return;
    }

    setIsSubmitting(true);
    setModalError(null);

    try {
      await adminCustomerService.createStaff({
        full_name: formData.full_name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        password: formData.password,
        role: formData.role,
        department: formData.department.trim() || undefined,
        designation: formData.designation.trim() || undefined,
        registration_number: formData.role === "pharmacist" ? formData.registration_number.trim() : undefined,
        state_pharmacy_council: formData.role === "pharmacist" ? formData.state_pharmacy_council.trim() : undefined,
        registration_valid_upto: formData.role === "pharmacist" ? formData.registration_valid_upto : undefined,
      });

      setIsModalOpen(false);
      await loadStaff();
    } catch (err: any) {
      console.error("Failed to create staff:", err);
      setModalError(err.message || "Failed to create staff member.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleToggleStatus = async (s: AdminStaff) => {
    try {
      await adminCustomerService.toggleStaffStatus(s.id);
      setStaff((prev) =>
        prev.map((item) =>
          item.id === s.id
            ? { ...item, status: item.status === "ACTIVE" ? "INACTIVE" : "ACTIVE" }
            : item
        )
      );
    } catch (err: any) {
      alert("Failed to toggle status: " + (err.message || "Error"));
    }
  };

  const handleDeleteStaff = async (s: AdminStaff) => {
    if (!confirm(`Are you sure you want to revoke platform access for "${s.name}"?`)) return;
    try {
      await adminCustomerService.deleteStaff(s.id);
      setStaff((prev) => prev.filter((item) => item.id !== s.id));
    } catch (err: any) {
      alert("Failed to delete staff member: " + (err.message || "Error"));
    }
  };

  const filtered = staff.filter((s) =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.email.toLowerCase().includes(search.toLowerCase()) ||
    s.role.toLowerCase().includes(search.toLowerCase())
  );

  const columns: Column<AdminStaff>[] = [
    {
      header: "Employee Name",
      cell: (s) => (
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-slate-100 text-slate-700 flex items-center justify-center font-bold text-xs">
            {s.name.charAt(0)}
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{s.name}</p>
            <p className="text-[10px] text-slate-400">{s.email}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Operational Role",
      cell: (s) => (
        <span
          className={`inline-flex px-2 py-0.5 rounded text-[11px] font-semibold ${
            s.role === "Pharmacist"
              ? "bg-teal-50 text-[#0D9488] border border-teal-200"
              : s.role === "Admin" || s.role === "Super Admin"
              ? "bg-purple-50 text-purple-700 border border-purple-200"
              : "bg-slate-100 text-slate-700"
          }`}
        >
          {s.role}
        </span>
      ),
    },
    {
      header: "License / Council Reg",
      cell: (s) =>
        s.licenseNo ? (
          <span className="text-xs font-mono font-bold text-blue-700 bg-blue-50 px-2 py-0.5 rounded">
            {s.licenseNo}
          </span>
        ) : (
          <span className="text-xs text-slate-400 font-mono">—</span>
        ),
    },
    {
      header: "Phone",
      cell: (s) => <span className="text-xs text-slate-700 font-mono">{s.phone}</span>,
    },
    {
      header: "Status",
      cell: (s) => <StatusBadge status={s.status} />,
    },
    {
      header: "Joined Date",
      accessorKey: "joinedDate",
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (s) => (
        <div className="flex items-center justify-end gap-1.5">
          <button
            type="button"
            className="p-1.5 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
            title={s.status === "ACTIVE" ? "Deactivate Access" : "Activate Access"}
            onClick={() => handleToggleStatus(s)}
          >
            {s.status === "ACTIVE" ? (
              <CheckCircle2 className="w-3.5 h-3.5 text-teal-600" />
            ) : (
              <XCircle className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
          <button
            type="button"
            className="p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition"
            title="Revoke Access"
            onClick={() => handleDeleteStaff(s)}
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Staff & Role Directory"
        subtitle="Manage licensed pharmacists, inventory operators, and system administrators."
        actions={
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleOpenModal}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Staff Member</span>
            </button>
            <Link
              href="/staff/pharmacists"
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold shadow-xs transition"
            >
              <ShieldCheck className="w-4 h-4 text-teal-600" />
              <span>Rule 65 Pharmacist Council</span>
            </Link>
          </div>
        }
      />

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search staff name, role, or email..."
      />

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-500 bg-white rounded-xl border border-slate-200">
          <Loader2 className="w-6 h-6 animate-spin text-[#0D9488] mb-2" />
          <p className="text-xs">Loading staff from database...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={filtered}
          keyExtractor={(s) => s.id}
          emptyMessage="No staff members registered in database."
        />
      )}

      {/* Add Staff Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-bold text-slate-900 text-sm">Add New Staff Member</h3>
                <p className="text-[11px] text-slate-400">
                  Assign administrative or Rule 65 dispensing privileges
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {modalError && (
              <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{modalError}</span>
              </div>
            )}

            <form onSubmit={handleCreateStaff} className="space-y-4 text-left">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Full Legal Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Dr. Rajesh Sharma"
                  value={formData.full_name}
                  onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rajesh@med24plus.in"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Mobile Phone (+91...) <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+919876543210"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Temporary Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  required
                  placeholder="Min 8 characters (e.g. Staff@Med24)"
                  value={formData.password}
                  onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                />
              </div>

              {/* Role Selection */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Operational Role & Access Tier <span className="text-red-500">*</span>
                </label>
                <select
                  value={formData.role}
                  onChange={(e) => {
                    const r = e.target.value;
                    let dept = "Operations";
                    let desig = "Staff Executive";
                    if (r === "pharmacist") {
                      dept = "Pharmacy Operations";
                      desig = "Registered Pharmacist";
                    } else if (r === "inventory_manager") {
                      dept = "Supply Chain";
                      desig = "Inventory Lead";
                    } else if (r === "admin" || r === "super_admin") {
                      dept = "Management";
                      desig = "Administrator";
                    }
                    setFormData({ ...formData, role: r, department: dept, designation: desig });
                  }}
                  className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                >
                  {ROLES_LIST.map((r) => (
                    <option key={r.value} value={r.value}>
                      {r.label} — {r.desc}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Department
                  </label>
                  <input
                    type="text"
                    value={formData.department}
                    onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Designation
                  </label>
                  <input
                    type="text"
                    value={formData.designation}
                    onChange={(e) => setFormData({ ...formData, designation: e.target.value })}
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              {/* Pharmacist Specific Regulatory Fields */}
              {formData.role === "pharmacist" && (
                <div className="p-3.5 bg-teal-50/50 border border-teal-200 rounded-xl space-y-3">
                  <div className="flex items-center gap-1.5 text-xs font-bold text-teal-800">
                    <ShieldCheck className="w-4 h-4 text-[#0D9488]" />
                    <span>Rule 65 Pharmacist Council Verification</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Pharmacy Council Registration Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. PCI-REG-94821/2020"
                      value={formData.registration_number}
                      onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                      className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D9488] bg-white"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        State Pharmacy Council
                      </label>
                      <input
                        type="text"
                        value={formData.state_pharmacy_council}
                        onChange={(e) => setFormData({ ...formData, state_pharmacy_council: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D9488] bg-white"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                        Valid Upto
                      </label>
                      <input
                        type="date"
                        value={formData.registration_valid_upto}
                        onChange={(e) => setFormData({ ...formData, registration_valid_upto: e.target.value })}
                        className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-1 focus:ring-[#0D9488] bg-white"
                      />
                    </div>
                  </div>
                </div>
              )}

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold transition disabled:opacity-50"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? "Provisioning..." : "Save Staff Member"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
