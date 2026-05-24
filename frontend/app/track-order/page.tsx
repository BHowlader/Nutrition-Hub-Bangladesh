"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Package, Search } from "lucide-react";
import { Header } from "@/components/Header";
import { productImage } from "@/lib/products";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
  product_name: string | null;
  product_image_url: string | null;
  product_slug: string | null;
}

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  payment_method: string;
  status: string;
  subtotal: string;
  discount_amount: string;
  coupon_code: string | null;
  total: string;
  items: OrderItem[];
  created_at: string | null;
}

export default function TrackOrderPage() {
  return (
    <Suspense>
      <TrackOrderContent />
    </Suspense>
  );
}

function TrackOrderContent() {
  const searchParams = useSearchParams();
  const [orderId, setOrderId] = useState(searchParams.get("order_id") || "");
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<Order | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch(
        `/api/orders/track?order_id=${encodeURIComponent(orderId.trim())}&phone=${encodeURIComponent(phone.trim())}`,
        { credentials: "include" }
      );
      if (res.status === 429) {
        throw new Error("Too many attempts. Please wait a minute and try again.");
      }
      if (res.status === 404) {
        throw new Error("Order not found. Please check your order ID and phone number.");
      }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Something went wrong");
      }
      setOrder(await res.json());
    } catch (e) {
      setOrder(null);
      setError(e instanceof Error ? e.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent pt-24 md:pt-28 pb-10">
      <Header />
      <div className="mx-auto max-w-xl px-4">
        {order ? (
          <OrderResult order={order} onReset={() => { setOrder(null); setOrderId(""); setPhone(""); }} />
        ) : (
          <>
            <div className="mb-8 text-center">
              <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border border-cream/10 bg-cream/[0.03]">
                <Package size={24} className="text-gold" />
              </div>
              <h1 className="text-3xl font-black text-cream">Track Your Order</h1>
              <p className="mt-2 text-sm text-cream/50">
                Enter your order ID and phone number to check the status of your order.
              </p>
            </div>

            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="premium-card p-6 space-y-4">
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-cream/40">
                  Order ID
                </label>
                <input
                  type="text"
                  value={orderId}
                  onChange={(e) => setOrderId(e.target.value)}
                  required
                  placeholder="e.g. a1b2c3d4-e5f6-..."
                  className="w-full rounded-xl border border-cream/10 bg-cream/[0.03] px-3 py-2.5 text-sm text-cream outline-none focus:border-gold/50"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-black uppercase tracking-wider text-cream/40">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  minLength={8}
                  maxLength={40}
                  placeholder="+880 1XXX XXXXXX"
                  className="w-full rounded-xl border border-cream/10 bg-cream/[0.03] px-3 py-2.5 text-sm text-cream outline-none focus:border-gold/50"
                />
              </div>
              <button
                type="submit"
                disabled={loading || !orderId.trim() || !phone.trim()}
                className="btn-primary flex w-full items-center justify-center gap-2 py-3 disabled:opacity-50"
              >
                <Search size={16} />
                {loading ? "Searching..." : "Track Order"}
              </button>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

function OrderResult({ order, onReset }: { order: Order; onReset: () => void }) {
  const dateStr = order.created_at
    ? new Date(order.created_at).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "N/A";

  return (
    <div>
      <div className="mb-6 text-center">
        <h1 className="text-2xl font-black text-cream">Order Status</h1>
      </div>

      <div className="premium-card overflow-hidden">
        {/* Order Top Bar */}
        <div className="border-b border-cream/10 bg-cream/[0.02] px-6 py-4 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-cream/40">Order ID</p>
              <p className="font-mono text-sm font-bold text-cream">#{order.id.slice(0, 8).toUpperCase()}</p>
            </div>
            <div className="h-8 w-px bg-cream/10 hidden sm:block" />
            <div>
              <p className="text-[10px] font-black uppercase tracking-wider text-cream/40">Date Placed</p>
              <p className="text-sm font-extrabold text-cream">{dateStr}</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-wider text-cream/40">Total Amount</p>
              <p className="text-lg font-black text-gold">{Number(order.total).toLocaleString()}</p>
            </div>
            <span
              className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${
                statusColors[order.status] || "bg-cream/10 text-cream/60 border-cream/20"
              }`}
            >
              {order.status}
            </span>
          </div>
        </div>

        {/* Order Items */}
        <div className="divide-y divide-cream/10 px-6 py-2">
          {order.items.map((item, idx) => {
            const imgUrl = productImage({ image_url: item.product_image_url || null });
            const hasSlug = !!item.product_slug;

            const Content = (
              <div className="flex items-center gap-4 py-4">
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-xl border border-cream/10 bg-cream/[0.02]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={imgUrl}
                    alt={item.product_name || "Product"}
                    className="h-full w-full object-cover"
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="text-sm font-extrabold text-cream group-hover:text-gold transition truncate">
                    {item.product_name || `Product (${item.product_id.slice(0, 8)})`}
                  </h4>
                  <p className="mt-1 text-xs text-cream/50">
                    Unit Price: {Number(item.unit_price).toLocaleString()}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-black text-cream">{item.quantity}</p>
                  <p className="mt-0.5 text-xs text-cream/40">
                    {(Number(item.unit_price) * item.quantity).toLocaleString()}
                  </p>
                </div>
              </div>
            );

            return hasSlug ? (
              <Link
                key={idx}
                href={`/products/${item.product_slug}`}
                className="group block transition hover:bg-cream/[0.01]"
              >
                {Content}
              </Link>
            ) : (
              <div key={idx}>{Content}</div>
            );
          })}
        </div>

        {/* Order Footer */}
        <div className="border-t border-cream/10 bg-cream/[0.01] px-6 py-4 flex flex-wrap items-center justify-between gap-4 text-xs text-cream/60">
          <div className="flex flex-wrap gap-x-6 gap-y-2">
            <div className="flex items-center gap-2">
              <span className="text-cream/30 uppercase text-[9px] font-black tracking-wider">Payment:</span>
              <span className="font-extrabold text-cream">{order.payment_method.toUpperCase()}</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-cream/30 uppercase text-[9px] font-black tracking-wider">Phone:</span>
              <span className="font-extrabold text-cream">{order.phone}</span>
            </div>
          </div>
          <div className="flex items-center gap-2 max-w-sm">
            <span className="text-cream/30 uppercase text-[9px] font-black tracking-wider shrink-0">Address:</span>
            <span className="truncate text-cream/70" title={order.address}>{order.address}</span>
          </div>
        </div>
      </div>

      <button
        onClick={onReset}
        className="mt-6 w-full rounded-xl border border-cream/10 bg-cream/[0.03] py-3 text-sm font-bold text-cream/70 transition hover:border-gold/30 hover:text-cream"
      >
        Track Another Order
      </button>
    </div>
  );
}
