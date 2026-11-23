"use client";

import React, { createContext, useContext, useEffect, useState, useCallback } from "react";
import { apiClient } from "@/services/api";
import { useAdminAuth } from "@/context/AdminAuthContext";

export interface AdminNotificationItem {
  id: string;
  title: string;
  message: string;
  timestamp: string;
  type: "order" | "prescription" | "inventory" | "system";
  link: string;
  isRead: boolean;
}

export interface AdminCountsContextType {
  ordersCount: number;
  prescriptionsNew: number;
  nearExpiryCount: number;
  notifications: AdminNotificationItem[];
  unreadCount: number;
  refreshCounts: () => Promise<void>;
  markAsRead: (id?: string) => void;
}

const AdminCountsContext = createContext<AdminCountsContextType>({
  ordersCount: 0,
  prescriptionsNew: 0,
  nearExpiryCount: 0,
  notifications: [],
  unreadCount: 0,
  refreshCounts: async () => {},
  markAsRead: () => {},
});

export const AdminCountsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { isAuthenticated } = useAdminAuth();
  const [ordersCount, setOrdersCount] = useState<number>(0);
  const [prescriptionsNew, setPrescriptionsNew] = useState<number>(0);
  const [nearExpiryCount, setNearExpiryCount] = useState<number>(0);
  const [notifications, setNotifications] = useState<AdminNotificationItem[]>([]);
  const [readIds, setReadIds] = useState<Set<string>>(new Set());

  const refreshCounts = useCallback(async () => {
    if (!isAuthenticated) return;

    try {
      // 1. Fetch Orders Metrics
      const ordersPromise = apiClient<any>("/admin/orders/metrics").catch(() => null);

      // 2. Fetch Prescriptions Counts
      const rxPromise = apiClient<any>("/admin/prescriptions/counts").catch(() => null);

      // 3. Fetch Expiry Summary
      const expPromise = apiClient<any>("/admin/inventory/expiry/summary").catch(() => null);

      const [ordersRes, rxRes, expRes] = await Promise.all([ordersPromise, rxPromise, expPromise]);

      const totalOrders = ordersRes?.total_orders ?? ordersRes?.placed ?? 0;
      const newPrescriptions = rxRes?.data?.pending_review ?? 0;
      const nearExpiries = expRes?.data?.total_near_expiry_batches ?? 0;

      setOrdersCount(totalOrders);
      setPrescriptionsNew(newPrescriptions);
      setNearExpiryCount(nearExpiries);

      // Synthesize dynamic actionable notifications from live DB metrics
      const notifs: AdminNotificationItem[] = [];

      if (newPrescriptions > 0) {
        notifs.push({
          id: `rx-${newPrescriptions}`,
          title: "Prescription Queue Alert",
          message: `${newPrescriptions} clinical prescription(s) awaiting verification by supervising pharmacist.`,
          timestamp: "Requires review",
          type: "prescription",
          link: "/prescriptions",
          isRead: false,
        });
      }

      if (totalOrders > 0) {
        notifs.push({
          id: `orders-${totalOrders}`,
          title: "Active Orders in Pipeline",
          message: `${totalOrders} total order(s) registered in pharmacy order book.`,
          timestamp: "Real-time updates",
          type: "order",
          link: "/orders",
          isRead: false,
        });
      }

      if (nearExpiries > 0) {
        notifs.push({
          id: `expiry-${nearExpiries}`,
          title: "Near Expiry Batches",
          message: `${nearExpiries} pharmaceutical batch(es) nearing expiration horizon (FEFO review needed).`,
          timestamp: "Action recommended",
          type: "inventory",
          link: "/inventory/expiries",
          isRead: false,
        });
      }

      if (notifs.length === 0) {
        notifs.push({
          id: "system-nominal",
          title: "Operations Normal",
          message: "All clinical verification queues, order fulfillment steps, and inventory stocks are up to date.",
          timestamp: "Just now",
          type: "system",
          link: "/dashboard",
          isRead: true,
        });
      }

      setNotifications(notifs);
    } catch (e) {
      console.warn("Unable to aggregate dynamic admin counts:", e);
    }
  }, [isAuthenticated]);

  useEffect(() => {
    refreshCounts();
    // Periodic polling every 45 seconds for live dashboard updates
    const timer = setInterval(refreshCounts, 45000);
    return () => clearInterval(timer);
  }, [refreshCounts]);

  const markAsRead = (id?: string) => {
    if (!id) {
      // Mark all read
      setReadIds(new Set(notifications.map((n) => n.id)));
    } else {
      setReadIds((prev) => new Set([...Array.from(prev), id]));
    }
  };

  const dynamicNotifications = notifications.map((n) => ({
    ...n,
    isRead: n.isRead || readIds.has(n.id),
  }));

  const unreadCount = dynamicNotifications.filter((n) => !n.isRead).length;

  return (
    <AdminCountsContext.Provider
      value={{
        ordersCount,
        prescriptionsNew,
        nearExpiryCount,
        notifications: dynamicNotifications,
        unreadCount,
        refreshCounts,
        markAsRead,
      }}
    >
      {children}
    </AdminCountsContext.Provider>
  );
};

export const useAdminCounts = () => useContext(AdminCountsContext);
