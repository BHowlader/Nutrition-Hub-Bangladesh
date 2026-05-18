"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Camera,
  Package,
  Save,
  ShoppingBag,
  User as UserIcon,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: number;
}

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  payment_method: string;
  status: string;
  total: number;
  items: OrderItem[];
}

type Tab = "orders" | "profile";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

export default function DashboardPage() {
  const { user, token, loading, updateProfile, uploadPhoto, refreshUser } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveMsg, setSaveMsg] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);

  // Redirect if not logged in
  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/dashboard");
  }, [loading, user, router]);

  // Populate form when user loads
  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  // Fetch orders
  const fetchOrders = useCallback(async () => {
    if (!token) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API}/api/orders/my`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) setOrders(await res.json());
    } finally {
      setOrdersLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (tab === "orders" && token) fetchOrders();
  }, [tab, token, fetchOrders]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setSaveMsg("");
    try {
      await updateProfile({ name, phone, address });
      setSaveMsg("Profile updated!");
      setTimeout(() => setSaveMsg(""), 3000);
    } catch {
      setSaveMsg("Failed to update");
    } finally {
      setSaving(false);
    }
  }

  async function handlePhotoUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      await uploadPhoto(file);
      await refreshUser();
    } catch {
      alert("Photo upload failed");
    }
  }

  if (loading || !user) return null;

  const photoSrc = user.photo_url
    ? user.photo_url.startsWith("http")
      ? user.photo_url
      : `${API}${user.photo_url}`
    : null;

  return (
    <div className="min-h-screen bg-ink px-4 pb-16 pt-28">
      <div className="mx-auto max-w-3xl">
        {/* Back link */}
        <Link
          href="/"
          className="mb-8 inline-flex items-center gap-2 text-sm font-bold text-cream/50 transition hover:text-cream"
        >
          <ArrowLeft size={16} />
          Back to store
        </Link>

        <h1 className="mb-8 text-3xl font-black text-cream">My Dashboard</h1>

        {/* Tabs */}
        <div className="mb-8 flex gap-1 rounded-xl border border-cream/10 bg-cream/[0.03] p-1">
          {[
            { key: "profile" as Tab, label: "Profile", icon: UserIcon },
            { key: "orders" as Tab, label: "Orders", icon: Package },
          ].map(({ key, label, icon: Icon }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={`flex flex-1 items-center justify-center gap-2 rounded-lg py-3 text-sm font-bold transition ${
                tab === key
                  ? "bg-gold/20 text-gold"
                  : "text-cream/50 hover:text-cream"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        {/* Profile Tab */}
        {tab === "profile" && (
          <div className="premium-card p-8">
            {/* Avatar with upload */}
            <div className="mb-8 flex flex-col items-center">
              <div className="group relative">
                {photoSrc ? (
                  <img
                    src={photoSrc}
                    alt={user.name}
                    className="h-24 w-24 rounded-full object-cover ring-4 ring-gold/30"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-full bg-gradient-to-br from-gold to-champagne text-3xl font-black text-ink ring-4 ring-gold/30">
                    {user.name.charAt(0).toUpperCase()}
                  </div>
                )}
                <button
                  onClick={() => fileRef.current?.click()}
                  className="absolute -bottom-1 -right-1 flex h-8 w-8 items-center justify-center rounded-full border-2 border-ink bg-gold text-ink transition hover:bg-champagne"
                >
                  <Camera size={14} />
                </button>
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handlePhotoUpload}
                />
              </div>
              <p className="mt-3 text-lg font-bold text-cream">{user.name}</p>
              <p className="text-sm text-cream/50">{user.email}</p>
            </div>

            <form onSubmit={handleSaveProfile} className="space-y-5">
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cream/40">
                  Full Name
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-3 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cream/40">
                  Phone Number
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-3 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                  placeholder="+880 1XXX XXXXXX"
                />
              </div>

              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cream/40">
                  Delivery Address
                </label>
                <textarea
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  rows={3}
                  className="w-full resize-none rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-3 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                  placeholder="Your delivery address in Bangladesh"
                />
              </div>

              <div className="flex items-center gap-4">
                <button
                  type="submit"
                  disabled={saving}
                  className="btn-primary disabled:opacity-50"
                >
                  <Save size={16} />
                  {saving ? "Saving..." : "Save Changes"}
                </button>
                {saveMsg && (
                  <span className={`text-sm font-bold ${saveMsg.includes("!") ? "text-green-400" : "text-red-400"}`}>
                    {saveMsg}
                  </span>
                )}
              </div>
            </form>
          </div>
        )}

        {/* Orders Tab */}
        {tab === "orders" && (
          <div className="space-y-4">
            {ordersLoading ? (
              <div className="premium-card flex items-center justify-center p-12">
                <p className="text-sm text-cream/50">Loading orders...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="premium-card flex flex-col items-center justify-center p-12">
                <ShoppingBag size={48} className="mb-4 text-cream/20" />
                <p className="text-lg font-bold text-cream/50">No orders yet</p>
                <p className="mt-1 text-sm text-cream/30">
                  Your order history will appear here
                </p>
                <Link href="/" className="btn-primary mt-6">
                  Browse Products
                </Link>
              </div>
            ) : (
              orders.map((order) => (
                <div key={order.id} className="premium-card p-6">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div>
                      <p className="text-xs font-bold text-cream/40">
                        Order #{order.id.slice(0, 8)}
                      </p>
                      <p className="mt-0.5 text-lg font-black text-cream">
                        ৳{Number(order.total).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`rounded-full border px-3 py-1 text-xs font-black uppercase tracking-wider ${
                        statusColors[order.status] || "bg-cream/10 text-cream/60 border-cream/20"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>

                  <div className="space-y-2 border-t border-cream/10 pt-3">
                    {order.items.map((item, idx) => (
                      <div
                        key={idx}
                        className="flex items-center justify-between text-sm text-cream/70"
                      >
                        <span>
                          Product {item.product_id.slice(0, 8)}... x{item.quantity}
                        </span>
                        <span className="font-bold">
                          ৳{(item.unit_price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-3 flex gap-4 text-xs text-cream/40">
                    <span>Payment: {order.payment_method.toUpperCase()}</span>
                    <span>Phone: {order.phone}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </div>
    </div>
  );
}
