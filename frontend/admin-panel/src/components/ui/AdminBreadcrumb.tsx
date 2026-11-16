import React from "react";
import Link from "next/link";
import { ChevronRight, LayoutDashboard } from "lucide-react";

export interface AdminBreadcrumbItem {
  label: string;
  href?: string;
}

export interface AdminBreadcrumbProps {
  items: AdminBreadcrumbItem[];
}

export const AdminBreadcrumb: React.FC<AdminBreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex items-center text-xs text-slate-500 mb-4">
      <ol className="flex items-center gap-1.5 flex-wrap">
        <li>
          <Link href="/dashboard" className="hover:text-[#087F5B] flex items-center gap-1">
            <LayoutDashboard className="w-3.5 h-3.5" />
            <span className="sr-only">Dashboard</span>
          </Link>
        </li>
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          return (
            <React.Fragment key={idx}>
              <li>
                <ChevronRight className="w-3 h-3 text-slate-400" />
              </li>
              <li>
                {item.href && !isLast ? (
                  <Link href={item.href} className="hover:text-[#087F5B] transition">
                    {item.label}
                  </Link>
                ) : (
                  <span className="font-semibold text-slate-800">{item.label}</span>
                )}
              </li>
            </React.Fragment>
          );
        })}
      </ol>
    </nav>
  );
};
