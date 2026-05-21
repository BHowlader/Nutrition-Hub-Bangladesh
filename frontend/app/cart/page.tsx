"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Minus, Plus, ShoppingBag, Trash2 } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Header } from "@/components/Header";
import { PageLoading } from "@/components/PageLoading";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function CartPage() {
  const { user, loading: authLoading } = useAuth();
  const { items, loading, totalCount, totalPrice, setQuantity, removeItem, clear, refresh } = useCart();
  const router = useRouter();

  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.replace("/login?redirect=/cart");
  }, [authLoading, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/orders`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customer_name: name,
          phone,
          address,
          payment_method: "cod",
          items: items.map((it) => ({ product_id: it.product_id, quantity: it.quantity })),
        }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Checkout failed");
      }
      await clear();
      await refresh();
      router.push("/dashboard?tab=orders");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Checkout failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (authLoading || !user) return <PageLoading label="Loading cart" />;

  return (
    <div className="min-h-screen bg-ink pt-24 md:pt-28 pb-10">
      <Header />
      <div className="mx-auto max-w-5xl px-4">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h1 className="text-3xl font-black text-cream">Your cart</h1>
            <p className="mt-1 text-sm text-cream/50">
              {totalCount === 0 ? "Empty" : `${totalCount} item${totalCount === 1 ? "" : "s"}`}
            </p>
          </div>
          {items.length > 0 && (
            <button
              onClick={clear}
              className="text-sm font-bold text-cream/50 transition hover:text-red-400"
            >
              Clear cart
            </button>
          )}
        </div>

        {loading ? (
          <p className="py-16 text-center text-sm text-cream/40">Loading…</p>
        ) : items.length === 0 ? (
          <div className="premium-card flex flex-col items-center justify-center p-12 text-center">
            <ShoppingBag size={48} className="mb-4 text-cream/20" />
            <p className="text-lg font-bold text-cream/60">Your cart is empty</p>
            <p className="mt-1 text-sm text-cream/40">Browse products and add something you love</p>
            <Link href="/products" className="btn-primary mt-6">Shop products</Link>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-[1fr_320px]">
            <div className="space-y-3">
              {items.map((it) => {
                const img = it.product.image_url
                  ? it.product.image_url.startsWith("http")
                    ? it.product.image_url
                    : `${API}${it.product.image_url}`
                  : null;
                const lineTotal = Number(it.product.price) * it.quantity;
                return (
                  <div
                    key={it.product_id}
                    className="premium-card flex flex-col items-stretch gap-4 p-4 sm:flex-row sm:items-center"
                  >
                    <div className="flex h-20 w-20 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-cream/[0.05]">
                      {img ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={img} alt={it.product.name} className="h-full w-full object-cover" />
                      ) : (
                        <ShoppingBag size={24} className="text-cream/30" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/products/${it.product.slug}`}
                        className="block truncate text-base font-extrabold text-cream hover:text-gold"
                      >
                        {it.product.name}
                      </Link>
                      <p className="mt-0.5 text-xs text-cream/40">
                        ৳{Number(it.product.price).toLocaleString()} · {it.product.stock} in stock
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setQuantity(it.product_id, it.quantity - 1)}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream/10 text-cream/70 hover:bg-cream/[0.05]"
                        aria-label="Decrease quantity"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="min-w-[24px] text-center text-sm font-bold text-cream">{it.quantity}</span>
                      <button
                        onClick={() => setQuantity(it.product_id, it.quantity + 1)}
                        disabled={it.quantity >= it.product.stock}
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-cream/10 text-cream/70 hover:bg-cream/[0.05] disabled:opacity-40"
                        aria-label="Increase quantity"
                      >
                        <Plus size={14} />
                      </button>
                    </div>

                    <div className="flex items-center gap-3 sm:flex-col sm:items-end">
                      <p className="text-lg font-black text-cream">৳{lineTotal.toLocaleString()}</p>
                      <button
                        onClick={() => removeItem(it.product_id)}
                        className="text-cream/40 transition hover:text-red-400"
                        aria-label="Remove item"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <aside className="premium-card h-fit p-5">
              <h2 className="text-sm font-black uppercase tracking-wider text-cream/40">Summary</h2>
              <div className="mt-4 space-y-2 border-b border-cream/10 pb-4 text-sm text-cream/70">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span>৳{totalPrice.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-xs text-cream/40">
                  <span>Delivery</span>
                  <span>Calculated at next step</span>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm font-bold text-cream">Total</span>
                <span className="text-2xl font-black text-cream">৳{totalPrice.toLocaleString()}</span>
              </div>
              <button
                onClick={() => setCheckoutOpen(true)}
                className="btn-primary mt-5 w-full"
              >
                Proceed to checkout
              </button>
            </aside>
          </div>
        )}
      </div>

      {checkoutOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/80 p-4">
          <div className="w-full max-w-md rounded-xl border border-cream/10 bg-ink p-6 shadow-2xl">
            <h2 className="text-xl font-black text-cream">Delivery details</h2>
            <p className="mt-1 text-xs text-cream/50">Cash on delivery · Total ৳{totalPrice.toLocaleString()}</p>

            {error && (
              <div className="mt-4 rounded-lg border border-red-500/30 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleCheckout} className="mt-4 space-y-3">
              <CheckoutField label="Full name" value={name} onChange={setName} required />
              <CheckoutField label="Phone" value={phone} onChange={setPhone} type="tel" required placeholder="+880 1XXX XXXXXX" />
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-cream/40">Address</label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  required
                  className="w-full resize-none rounded-xl border border-cream/10 bg-cream/[0.03] px-3 py-2 text-sm text-cream outline-none focus:border-gold/50"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setCheckoutOpen(false)}
                  className="rounded-lg border border-cream/15 px-4 py-2 text-sm font-bold text-cream/70"
                >
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-primary flex-1 disabled:opacity-50">
                  {submitting ? "Placing order…" : "Place order"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

function CheckoutField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-black uppercase tracking-wider text-cream/40">{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        className="w-full rounded-xl border border-cream/10 bg-cream/[0.03] px-3 py-2 text-sm text-cream outline-none focus:border-gold/50"
      />
    </div>
  );
}
