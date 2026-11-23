"use client";

import React, { useState } from "react";
import { Plus, Image as ImageIcon, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";

export interface AdminBanner {
  id: string;
  title: string;
  targetUrl: string;
  position: "HOME_HERO" | "CATEGORY_TOP" | "OFFER_CAROUSEL";
  validUntil: string;
  status: "ACTIVE" | "EXPIRED" | "SCHEDULED";
}

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<AdminBanner[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [targetUrl, setTargetUrl] = useState("/catalog/products");
  const [position, setPosition] = useState<"HOME_HERO" | "CATEGORY_TOP" | "OFFER_CAROUSEL">("HOME_HERO");

  const handleAddBanner = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;
    const newBanner: AdminBanner = {
      id: `ban-${Date.now()}`,
      title: title.trim(),
      targetUrl: targetUrl.trim(),
      position,
      validUntil: new Date(Date.now() + 30 * 86400000).toLocaleDateString(),
      status: "ACTIVE",
    };
    setBanners((prev) => [newBanner, ...prev]);
    setTitle("");
    setIsModalOpen(false);
  };

  const columns: Column<AdminBanner>[] = [
    {
      header: "Banner Title / Headline",
      cell: (b) => (
        <div className="flex items-center gap-2.5">
          <div className="w-10 h-8 rounded-md bg-slate-100 flex items-center justify-center text-slate-400">
            <ImageIcon className="w-4 h-4" />
          </div>
          <div>
            <p className="font-semibold text-slate-900 text-xs">{b.title}</p>
            <p className="text-[10px] text-slate-400 font-mono">{b.targetUrl}</p>
          </div>
        </div>
      ),
    },
    {
      header: "Display Placement",
      cell: (b) => (
        <span className="text-xs font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded">
          {b.position}
        </span>
      ),
    },
    {
      header: "Active Until",
      accessorKey: "validUntil",
    },
    {
      header: "Status",
      cell: (b) => <StatusBadge status={b.status} />,
    },
    {
      header: "Actions",
      className: "text-right",
      cell: (b) => (
        <button
          type="button"
          onClick={() => setBanners((prev) => prev.filter((item) => item.id !== b.id))}
          className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg transition"
        >
          <Trash2 className="w-3.5 h-3.5" />
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotional Banners"
        subtitle="Configure homepage promotional hero carousels and health category banners."
        actions={
          <button
            type="button"
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Create Banner</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={banners}
        keyExtractor={(b) => b.id}
        emptyMessage="No promotional banners configured yet. Click 'Create Banner' to publish one."
      />

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
              <h3 className="font-bold text-slate-900 text-sm">Create Promotional Banner</h3>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 text-lg"
              >
                &times;
              </button>
            </div>
            <form onSubmit={handleAddBanner} className="p-5 space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Banner Title *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. 20% Off Chronic Cardiac Medicines"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Target URL Link
                </label>
                <input
                  type="text"
                  placeholder="/category/cardiac"
                  value={targetUrl}
                  onChange={(e) => setTargetUrl(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Placement</label>
                <select
                  value={position}
                  onChange={(e: any) => setPosition(e.target.value)}
                  className="w-full px-3 py-2 text-xs rounded-lg border border-slate-300 focus:outline-none focus:ring-1 focus:ring-[#0D9488]"
                >
                  <option value="HOME_HERO">Home Page Hero</option>
                  <option value="CATEGORY_TOP">Category Header</option>
                  <option value="OFFER_CAROUSEL">Offer Carousel</option>
                </select>
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
                  Add Banner
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
