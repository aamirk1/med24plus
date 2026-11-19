"use client";

import React, { useState } from "react";
import { Plus, Image as ImageIcon, ExternalLink, Trash2 } from "lucide-react";
import { PageHeader } from "@/components/ui/PageHeader";
import { DataTable, Column } from "@/components/ui/DataTable";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { MOCK_ADMIN_BANNERS, AdminBanner } from "@/mock/adminData";

export default function AdminBannersPage() {
  const [banners, setBanners] = useState<AdminBanner[]>(MOCK_ADMIN_BANNERS);

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
          onClick={() => {
            setBanners((prev) => prev.filter((item) => item.id !== b.id));
          }}
          className="text-xs text-red-600 hover:text-red-700 font-medium"
        >
          Remove
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      <PageHeader
        title="Promotional Banners & Announcements"
        subtitle="Manage storefront promotional graphics, seasonal awareness banners, and policy announcements."
        actions={
          <button
            type="button"
            onClick={() => alert("Mock: Upload promotional creative dialog")}
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 bg-[#0D9488] hover:bg-[#0F766E] text-white rounded-lg text-xs font-semibold transition"
          >
            <Plus className="w-4 h-4" />
            <span>Upload New Banner</span>
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={banners}
        keyExtractor={(b) => b.id}
        emptyMessage="No promotional banners configured."
      />
    </div>
  );
}

