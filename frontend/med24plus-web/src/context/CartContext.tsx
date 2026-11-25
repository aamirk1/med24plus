"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api";
import { Product } from "@/types";

interface CartContextType {
  cartCount: number;
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  updateCartCount: (count: number) => void;
  isAdding: boolean;
  lastAddedProduct: Product | null;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  addToCart: async () => false,
  refreshCart: async () => {},
  updateCartCount: () => {},
  isAdding: false,
  lastAddedProduct: null,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);

  const getGuestCartCount = useCallback((): number => {
    if (typeof window === "undefined") return 0;
    try {
      const guestCart = JSON.parse(localStorage.getItem("med24_guest_cart") || "[]");
      if (!Array.isArray(guestCart)) return 0;
      return guestCart.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
    } catch {
      return 0;
    }
  }, []);

  const refreshCart = useCallback(async () => {
    if (typeof window === "undefined") return;
    const token = localStorage.getItem("med24_access_token");

    // If not authenticated, count guest cart items directly without generating 401s
    if (!token) {
      setCartCount(getGuestCartCount());
      return;
    }

    try {
      const res = await apiClient<any>("/cart");
      if (res?.success && res?.data) {
        const totalQty =
          typeof res.data.total_quantity === "number"
            ? res.data.total_quantity
            : Array.isArray(res.data.items)
            ? res.data.items.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0)
            : Number(res.data.item_count) || 0;
        setCartCount(totalQty);
        return;
      }
      setCartCount(getGuestCartCount());
    } catch {
      setCartCount(getGuestCartCount());
    }
  }, [getGuestCartCount]);

  const updateCartCount = useCallback((count: number) => {
    setCartCount(Math.max(0, count));
  }, []);

  useEffect(() => {
    refreshCart();

    const handleSync = () => {
      refreshCart();
    };

    const handleStorage = (e: StorageEvent) => {
      if (e.key === "med24_guest_cart" || e.key === "med24_access_token") {
        refreshCart();
      }
    };

    window.addEventListener("med24_cart_updated", handleSync);
    window.addEventListener("med24_auth_changed", handleSync);
    window.addEventListener("storage", handleStorage);

    return () => {
      window.removeEventListener("med24_cart_updated", handleSync);
      window.removeEventListener("med24_auth_changed", handleSync);
      window.removeEventListener("storage", handleStorage);
    };
  }, [refreshCart]);

  const addToCart = async (product: Product, quantity: number = 1): Promise<boolean> => {
    setIsAdding(true);
    setLastAddedProduct(product);
    try {
      const token = typeof window !== "undefined" ? localStorage.getItem("med24_access_token") : null;

      if (token) {
        // Authenticated user: save to backend cart
        try {
          await apiClient<any>("/cart/items", {
            method: "POST",
            data: {
              product_id: product.id,
              quantity,
            },
          });
          await refreshCart();
          if (typeof window !== "undefined") {
            window.dispatchEvent(new Event("med24_cart_updated"));
          }
          return true;
        } catch (err) {
          console.error("Failed to add to backend cart:", err);
        }
      }

      // Guest fallback: save to localStorage
      if (typeof window !== "undefined") {
        try {
          const guestCart = JSON.parse(localStorage.getItem("med24_guest_cart") || "[]");
          const existingIdx = guestCart.findIndex((i: any) => i.id === product.id);
          if (existingIdx >= 0) {
            guestCart[existingIdx].quantity = (Number(guestCart[existingIdx].quantity) || 1) + quantity;
          } else {
            guestCart.push({
              id: product.id,
              name: product.name,
              price: product.sellingPrice,
              mrp: product.mrp,
              image_url: product.imageUrl || (product.images && product.images[0]),
              quantity,
            });
          }
          localStorage.setItem("med24_guest_cart", JSON.stringify(guestCart));
          const totalQty = guestCart.reduce((sum: number, item: any) => sum + (Number(item.quantity) || 1), 0);
          setCartCount(totalQty);
          window.dispatchEvent(new Event("med24_cart_updated"));
        } catch (e) {
          console.error("Failed to update guest cart:", e);
        }
      }
      return true;
    } finally {
      setIsAdding(false);
      setTimeout(() => setLastAddedProduct(null), 2500);
    }
  };

  return (
    <CartContext.Provider
      value={{
        cartCount,
        addToCart,
        refreshCart,
        updateCartCount,
        isAdding,
        lastAddedProduct,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
