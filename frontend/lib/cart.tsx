"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { csrfHeader, useAuth } from "@/lib/auth";

const API = typeof window === "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") : "";

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
  setQuantity: (productId: string, quantity: number, product?: any) => Promise<void>;
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
      if (typeof window !== "undefined") {
        let localItems: CartItem[] = [];
        try {
          const stored = window.localStorage.getItem("nhb_guest_cart");
          if (stored) localItems = JSON.parse(stored);
        } catch {}
        setItems(localItems);
      } else {
        setItems([]);
      }
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

  // Sync guest cart to database cart upon login
  useEffect(() => {
    if (user && typeof window !== "undefined") {
      const stored = window.localStorage.getItem("nhb_guest_cart");
      if (stored) {
        try {
          const localItems = JSON.parse(stored) as CartItem[];
          if (localItems.length > 0) {
            const syncCart = async () => {
              setLoading(true);
              try {
                for (const item of localItems) {
                  await fetch(`${API}/api/cart/items/${item.product_id}`, {
                    method: "PUT",
                    credentials: "include",
                    headers: {
                      "Content-Type": "application/json",
                      ...csrfHeader("PUT"),
                    },
                    body: JSON.stringify({ quantity: item.quantity }),
                  });
                }
                window.localStorage.removeItem("nhb_guest_cart");
              } catch (e) {
                console.error("Failed to sync guest cart", e);
              } finally {
                setLoading(false);
                refresh();
              }
            };
            void syncCart();
          }
        } catch (e) {
          console.error("Error parsing guest cart", e);
        }
      }
    }
  }, [user, refresh]);

  const setQuantity = useCallback(
    async (productId: string, quantity: number, product?: any) => {
      if (user) {
        if (quantity < 1) {
          await api(`/api/cart/items/${productId}`, { method: "DELETE" });
        } else {
          await api(`/api/cart/items/${productId}`, {
            method: "PUT",
            body: JSON.stringify({ quantity }),
          });
        }
        await refresh();
      } else {
        if (typeof window !== "undefined") {
          let localItems: CartItem[] = [];
          try {
            const stored = window.localStorage.getItem("nhb_guest_cart");
            if (stored) localItems = JSON.parse(stored);
          } catch {}

          if (quantity < 1) {
            localItems = localItems.filter((it) => it.product_id !== productId);
          } else {
            const index = localItems.findIndex((it) => it.product_id === productId);
            if (index > -1) {
              localItems[index].quantity = quantity;
            } else if (product) {
              localItems.push({
                product_id: productId,
                quantity,
                product: {
                  id: product.id,
                  name: product.name,
                  slug: product.slug,
                  price: product.price,
                  image_url: product.image_url,
                  stock: product.stock,
                },
              });
            }
          }
          window.localStorage.setItem("nhb_guest_cart", JSON.stringify(localItems));
          setItems(localItems);
        }
      }
    },
    [user, refresh]
  );

  const removeItem = useCallback(
    async (productId: string) => {
      if (user) {
        await api(`/api/cart/items/${productId}`, { method: "DELETE" });
        await refresh();
      } else {
        if (typeof window !== "undefined") {
          let localItems: CartItem[] = [];
          try {
            const stored = window.localStorage.getItem("nhb_guest_cart");
            if (stored) localItems = JSON.parse(stored);
          } catch {}
          localItems = localItems.filter((it) => it.product_id !== productId);
          window.localStorage.setItem("nhb_guest_cart", JSON.stringify(localItems));
          setItems(localItems);
        }
      }
    },
    [user, refresh]
  );

  const clear = useCallback(async () => {
    if (user) {
      await api("/api/cart", { method: "DELETE" });
      setItems([]);
    } else {
      if (typeof window !== "undefined") {
        window.localStorage.removeItem("nhb_guest_cart");
      }
      setItems([]);
    }
  }, [user]);

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
