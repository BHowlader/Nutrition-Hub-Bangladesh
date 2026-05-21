"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { csrfHeader, useAuth } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface CartProduct {
  id: string;
  name: string;
  slug: string;
  price: string;
  image_url: string | null;
  stock: number;
}

export interface CartItem {
  product_id: string;
  quantity: number;
  product: CartProduct;
}

interface CartState {
  items: CartItem[];
  loading: boolean;
  totalCount: number;
  totalPrice: number;
  setQuantity: (productId: string, quantity: number) => Promise<void>;
  removeItem: (productId: string) => Promise<void>;
  clear: () => Promise<void>;
  refresh: () => Promise<void>;
}

const CartContext = createContext<CartState | null>(null);

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}

async function api(path: string, init: RequestInit = {}) {
  const method = (init.method || "GET").toUpperCase();
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...csrfHeader(method),
      ...init.headers,
    },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function CartProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [items, setItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (!user) {
      setItems([]);
      return;
    }
    setLoading(true);
    try {
      const data = await api("/api/cart");
      setItems(data || []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  const setQuantity = useCallback(
    async (productId: string, quantity: number) => {
      if (quantity < 1) {
        await api(`/api/cart/items/${productId}`, { method: "DELETE" });
      } else {
        await api(`/api/cart/items/${productId}`, {
          method: "PUT",
          body: JSON.stringify({ quantity }),
        });
      }
      await refresh();
    },
    [refresh]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      await api(`/api/cart/items/${productId}`, { method: "DELETE" });
      await refresh();
    },
    [refresh]
  );

  const clear = useCallback(async () => {
    await api("/api/cart", { method: "DELETE" });
    setItems([]);
  }, []);

  const totalCount = items.reduce((n, it) => n + it.quantity, 0);
  const totalPrice = items.reduce((n, it) => n + Number(it.product.price) * it.quantity, 0);

  return (
    <CartContext.Provider
      value={{ items, loading, totalCount, totalPrice, setQuantity, removeItem, clear, refresh }}
    >
      {children}
    </CartContext.Provider>
  );
}
