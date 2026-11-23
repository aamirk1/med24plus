"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { adminAuthService, AdminUser } from "@/services/admin-auth.service";

interface AdminAuthContextType {
  user: AdminUser | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  hasRole: (allowedRoles: string[]) => boolean;
  hasPermission: (permission: string) => boolean;
  login: (identifier: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshAdminUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthContextType | undefined>(undefined);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const refreshAdminUser = async () => {
    try {
      const res = await adminAuthService.getMe();
      if (res && res.data) {
        setUser(res.data);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshAdminUser();
  }, []);

  const login = async (identifier: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await adminAuthService.login(identifier, password);
      if (res?.data?.access_token && typeof window !== "undefined") {
        localStorage.setItem("med24_access_token", res.data.access_token);
      }
      if (res.data?.user) {
        setUser(res.data.user);
      } else {
        await refreshAdminUser();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await adminAuthService.logout();
    } catch {
      // Ignored
    } finally {
      if (typeof window !== "undefined") {
        localStorage.removeItem("med24_access_token");
      }
      setUser(null);
    }
  };

  const hasRole = (allowedRoles: string[]) => {
    if (!user) return false;
    if (user.roles.includes("super_admin")) return true;
    return allowedRoles.some((r) => user.roles.includes(r));
  };

  const hasPermission = (permission: string) => {
    if (!user) return false;
    if (user.roles.includes("super_admin")) return true;
    return !!user.permissions?.includes(permission);
  };

  return (
    <AdminAuthContext.Provider
      value={{
        user,
        isLoading,
        isAuthenticated: !!user,
        hasRole,
        hasPermission,
        login,
        logout,
        refreshAdminUser,
      }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}

export function useAdminAuth() {
  const context = useContext(AdminAuthContext);
  if (!context) {
    throw new Error("useAdminAuth must be used within an AdminAuthProvider");
  }
  return context;
}

