"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAdminAuth } from "@/context/AdminAuthContext";
import { Loader2 } from "lucide-react";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();

  const isPublicRoute = pathname === "/login" || pathname === "/unauthorized";

  useEffect(() => {
    if (!isLoading && !isAuthenticated && !isPublicRoute) {
      router.push("/login");
    }
  }, [isLoading, isAuthenticated, isPublicRoute, router]);

  if (isLoading && !isPublicRoute) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center gap-3 bg-slate-50">
        <Loader2 className="w-8 h-8 animate-spin text-[#0066CC]" />
        <p className="text-xs text-slate-500 font-medium">Validating administrative credentials...</p>
      </div>
    );
  }

  return <>{children}</>;
}

