"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { apiClient } from "@/services/api";
import { Product } from "@/types";

interface CartContextType {
  cartCount: number;
  addToCart: (product: Product, quantity?: number) => Promise<boolean>;
  refreshCart: () => Promise<void>;
  isAdding: boolean;
  lastAddedProduct: Product | null;
}

const CartContext = createContext<CartContextType>({
  cartCount: 0,
  addToCart: async () => false,
  refreshCart: async () => {},
  isAdding: false,
  lastAddedProduct: null,
});

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [cartCount, setCartCount] = useState<number>(0);
  const [isAdding, setIsAdding] = useState(false);
  const [lastAddedProduct, setLastAddedProduct] = useState<Product | null>(null);

  const refreshCart = useCallback(async () => {
    try {
      const res = await apiClient<any>("/cart");
      if (res?.success && res?.data) {
        setCartCount(res.data.total_quantity || res.data.item_count || 0);
        return;
      }
    } catch {
      // Guest local storage fallback
      if (typeof window !== "undefined") {
        try {
          const guestCart = JSON.parse(localStorage.getItem("med24_guest_cart") || "[]");
          const totalQty = guestCart.reduce((sum: number, item: any) => sum + (item.quantity || 1), 0);
          setCartCount(totalQty);
        } catch {
          setCartCount(0);
        }
      }
    }
  }, []);

  useEffect(() => {
    refreshCart();
  }, [refreshCart]);

  const addToCart = async (product: Product, quantity: number = 1): Promise<boolean> => {
    setIsAdding(true);
    setLastAddedProduct(product);
    try {
      // 1. Attempt backend cart addition
      try {
        await apiClient<any>("/cart/items", {
          method: "POST",
          data: {
            product_id: product.id,
            quantity,
          },
        });
        await refreshCart();
      } catch {
        // 2. Guest fallback in localStorage
        if (typeof window !== "undefined") {
          const guestCart = JSON.parse(localStorage.getItem("med24_guest_cart") || "[]");
          const existingIdx = guestCart.findIndex((i: any) => i.id === product.id);
          if (existingIdx >= 0) {
            guestCart[existingIdx].quantity += quantity;
          } else {
            guestCart.push({
              id: product.id,
              name: product.name,
              price: product.sellingPrice,
              mrp: product.mrp,
              image_url: product.imageUrl,
              quantity,
            });
          }
          localStorage.setItem("med24_guest_cart", JSON.stringify(guestCart));
          const totalQty = guestCart.reduce((sum: number, item: any) => sum + item.quantity, 0);
          setCartCount(totalQty);
        }
      }
      return true;
    } finally {
      setIsAdding(false);
      setTimeout(() => setLastAddedProduct(null), 2500);
    }
  };

  return (
    <CartContext.Provider value={{ cartCount, addToCart, refreshCart, isAdding, lastAddedProduct }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
