"use client";

import React, { useState, useEffect } from "react";
import { ArrowUpRight, Loader2, Plus, X, AlertCircle } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { TableToolbar } from "@/components/ui/TableToolbar";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { adminInventoryService, StockReceivePayload } from "@/services/admin-inventory.service";

interface StockProductRow {
  product_id: string;
  product_name: string;
  product_sku: string;
  category_name?: string;
  dosage_form: string;
  total_received: number;
  total_available: number;
  total_reserved: number;
  total_sellable: number;
  reorder_level: number;
  is_low_stock: boolean;
  is_out_of_stock: boolean;
  active_batches_count: number;
  expiring_soon_count: number;
}

export default function AdminStockPage() {
  const [search, setSearch] = useState("");
  const [products, setProducts] = useState<StockProductRow[]>([]);
  const [summary, setSummary] = useState<any>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [receiveModalOpen, setReceiveModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<StockProductRow | null>(null);

  const [receiveForm, setReceiveForm] = useState<StockReceivePayload>({
    product_id: "",
    batch_number: "",
    received_quantity: 100,
    manufacturing_date: new Date(Date.now() - 30 * 86400000).toISOString().split("T")[0],
    expiry_date: new Date(Date.now() + 365 * 86400000).toISOString().split("T")[0],
    purchase_price: 50.0,
    batch_mrp: 85.0,
    supplier_name: "Apex Healthcare Wholesale Ltd.",
    storage_location: "Bin-A1",
    notes: "Direct procurement consignment",
  });
  const [isReceiving, setIsReceiving] = useState(false);
  const [receiveError, setReceiveError] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [sumData, prodData] = await Promise.all([
        adminInventoryService.getSummary(),
        adminInventoryService.getProductInventory({ search: search || undefined, page_size: 50 }),
      ]);
      setSummary(sumData);
      if (prodData?.items) {
        setProducts(prodData.items);
      }
    } catch (e) {
      console.warn("Could not load inventory:", e);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [search]);

  const handleOpenReceive = (p: StockProductRow) => {
    setSelectedProduct(p);
    setReceiveForm((prev) => ({
      ...prev,
      product_id: p.product_id,
      batch_number: `B-${Date.now().toString().slice(-6)}`,
    }));
    setReceiveError(null);
    setReceiveModalOpen(true);
  };

  const handleReceiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsReceiving(true);
    setReceiveError(null);
    try {
      await adminInventoryService.receiveStock(receiveForm);
      setReceiveModalOpen(false);
      await loadData();
    } catch (err: any) {
      setReceiveError(err.message || "Failed to receive stock.");
    } finally {
      setIsReceiving(false);
    }
  };

  const columns: Column<StockProductRow>[] = [
    {
      header: "Medicine / Product",
      cell: (p) => (
        <div>
          <p className="font-semibold text-slate-900 text-xs">{p.product_name}</p>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-[10px] font-mono text-slate-500">{p.product_sku}</span>
            <span className="text-[10px] text-slate-400">•</span>
            <span className="text-[10px] text-slate-500">{p.dosage_form}</span>
          </div>
        </div>
      ),
    },
    {
      header: "Category",
      cell: (p) => <span className="text-xs text-slate-600">{p.category_name || "General"}</span>,
    },
    {
      header: "Sellable Stock",
      cell: (p) => (
        <span
          className={`font-semibold text-xs ${
            p.total_sellable === 0
              ? "text-red-600 font-bold"
              : p.is_low_stock
              ? "text-amber-600 font-bold"
              : "text-teal-700"
          }`}
        >
          {p.total_sellable} units
        </span>
      ),
    },
    {
      header: "Active Batches",
      cell: (p) => (
        <span className="text-xs text-slate-600 font-medium">
          {p.active_batches_count} batch(es)
        </span>
      ),
    },
    {
      header: "Status",
      cell: (p) => {
        if (p.is_out_of_stock) return <StatusBadge status="OUT_OF_STOCK" />;
        if (p.is_low_stock) return <StatusBadge status="LOW_STOCK" />;
        return (
          <span className="inline-flex px-2 py-0.5 rounded-full text-[10px] font-semibold bg-teal-50 text-teal-700 border border-teal-200">
            Adequate
          </span>
        );
      },
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (p) => (
        <button
          type="button"
          onClick={() => handleOpenReceive(p)}
          className="inline-flex items-center gap-1 px-2.5 py-1 text-[11px] font-semibold text-[#0D9488] bg-teal-50 hover:bg-teal-100 rounded-lg transition"
        >
          <span>Receive Inward</span>
          <ArrowUpRight className="w-3 h-3" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Pharmacy Stock Management"
        subtitle="Real-time stock monitoring with automatic low-stock alerts, FEFO validation, and inward replenishment."
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <p className="text-xs text-slate-500 font-medium">Total Catalog Products</p>
          <p className="text-2xl font-bold text-slate-900 mt-1">
            {summary?.total_catalog_products || products.length}
          </p>
          <span className="text-[10px] text-slate-400">Tracked in inventory</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-teal-200 bg-teal-50/20 shadow-sm">
          <p className="text-xs text-teal-800 font-medium">Sellable Units</p>
          <p className="text-2xl font-bold text-teal-950 mt-1">
            {summary?.total_sellable_units || 0}
          </p>
          <span className="text-[10px] text-teal-700">FEFO active & unexpired</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-amber-200 bg-amber-50/20 shadow-sm">
          <p className="text-xs text-amber-700 font-medium">Low Stock Products</p>
          <p className="text-2xl font-bold text-amber-900 mt-1">
            {summary?.low_stock_products_count || 0}
          </p>
          <span className="text-[10px] text-amber-600">Reorders suggested</span>
        </div>
        <div className="bg-white p-4 rounded-xl border border-red-200 bg-red-50/20 shadow-sm">
          <p className="text-xs text-red-700 font-medium">Out of Stock</p>
          <p className="text-2xl font-bold text-red-900 mt-1">
            {summary?.out_of_stock_products_count || 0}
          </p>
          <span className="text-[10px] text-red-600">Immediate intake needed</span>
        </div>
      </div>

      <TableToolbar
        searchQuery={search}
        onSearchChange={setSearch}
        placeholder="Search product name or SKU..."
      />

      {isLoading ? (
        <div className="flex flex-col items-center justify-center py-20 text-slate-400 space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-[#0D9488]" />
          <p className="text-xs">Computing live inventory quantities...</p>
        </div>
      ) : (
        <DataTable
          columns={columns}
          data={products}
          keyExtractor={(p) => p.product_id}
          emptyMessage="No inventory records found."
        />
      )}

      {/* Receive Stock Modal */}
      {receiveModalOpen && selectedProduct && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-xl max-w-lg w-full p-6 space-y-4 text-left">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Receive Inward Stock</h3>
                <p className="text-xs text-slate-500">
                  {selectedProduct.product_name} ({selectedProduct.product_sku})
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReceiveModalOpen(false)}
                className="p-1 rounded-md text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {receiveError && (
              <div className="p-3 rounded-lg bg-red-50 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{receiveError}</span>
              </div>
            )}

            <form onSubmit={handleReceiveSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch Number *
                  </label>
                  <input
                    type="text"
                    required
                    value={receiveForm.batch_number}
                    onChange={(e) => setReceiveForm({ ...receiveForm, batch_number: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs font-mono rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Received Units *
                  </label>
                  <input
                    type="number"
                    min="1"
                    required
                    value={receiveForm.received_quantity}
                    onChange={(e) =>
                      setReceiveForm({ ...receiveForm, received_quantity: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Manufacturing Date *
                  </label>
                  <input
                    type="date"
                    required
                    value={receiveForm.manufacturing_date}
                    onChange={(e) => setReceiveForm({ ...receiveForm, manufacturing_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Expiry Date (Statutory) *
                  </label>
                  <input
                    type="date"
                    required
                    value={receiveForm.expiry_date}
                    onChange={(e) => setReceiveForm({ ...receiveForm, expiry_date: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Purchase Price (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={receiveForm.purchase_price}
                    onChange={(e) =>
                      setReceiveForm({ ...receiveForm, purchase_price: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Batch MRP (₹) *
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={receiveForm.batch_mrp}
                    onChange={(e) =>
                      setReceiveForm({ ...receiveForm, batch_mrp: parseFloat(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Supplier Name
                </label>
                <input
                  type="text"
                  value={receiveForm.supplier_name}
                  onChange={(e) => setReceiveForm({ ...receiveForm, supplier_name: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReceiveModalOpen(false)}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isReceiving}
                  className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold disabled:opacity-50"
                >
                  {isReceiving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>Confirm Inward Stock</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
