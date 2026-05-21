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
  Mail,
  Phone,
  MapPin,
  Calendar,
  Shield,
  CheckCircle2,
  AlertCircle,
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
  const { user, loading, updateProfile, uploadPhoto, refreshUser } = useAuth();
  const router = useRouter();

  const [tab, setTab] = useState<Tab>("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  // Profile form
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  // Auto-dismiss toast
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(timer);
    }
  }, [toast]);

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
    if (!user) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API}/api/orders/my`, {
        credentials: "include",
      });
      if (res.ok) setOrders(await res.json());
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user, fetchOrders]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile({ name, phone, address });
      setToast({ message: "Profile updated successfully!", type: "success" });
    } catch {
      setToast({ message: "Failed to update profile", type: "error" });
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
      setToast({ message: "Profile picture updated successfully!", type: "success" });
    } catch {
      setToast({ message: "Photo upload failed", type: "error" });
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
      <div className="mx-auto max-w-6xl">
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
          <div className="grid grid-cols-1 gap-8 md:grid-cols-3">
            {/* Left Column: User Summary & Stats (1/3 width on desktop) */}
            <div className="space-y-6 md:col-span-1">
              {/* Profile Card */}
              <div className="premium-card p-6 flex flex-col items-center relative overflow-hidden group">
                {/* Decorative background glow */}
                <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gold/10 blur-2xl transition-all duration-500 group-hover:bg-gold/15" />
                <div className="absolute -left-10 -bottom-10 h-32 w-32 rounded-full bg-champagne/10 blur-2xl transition-all duration-500 group-hover:bg-champagne/15" />

                {/* Avatar with upload hover overlay */}
                <div className="relative group/avatar cursor-pointer" onClick={() => fileRef.current?.click()}>
                  {photoSrc ? (
                    <img
                      src={photoSrc}
                      alt={user.name}
                      className="h-28 w-28 rounded-full object-cover ring-4 ring-gold/20 transition-all duration-300 group-hover/avatar:ring-gold/40 group-hover/avatar:scale-105"
                    />
                  ) : (
                    <div className="flex h-28 w-28 items-center justify-center rounded-full bg-gradient-to-br from-gold to-champagne text-4xl font-black text-ink ring-4 ring-gold/20 transition-all duration-300 group-hover/avatar:ring-gold/40 group-hover/avatar:scale-105">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  {/* Camera Hover Overlay */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center rounded-full bg-ink/70 opacity-0 transition-opacity duration-300 group-hover/avatar:opacity-100">
                    <Camera size={24} className="text-gold animate-pulse" />
                    <span className="mt-1 text-[10px] font-bold uppercase tracking-wider text-cream">Upload</span>
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>

                <div className="mt-5 text-center z-10">
                  <h3 className="text-xl font-extrabold text-cream leading-tight">{user.name}</h3>
                  <p className="mt-1 text-xs text-cream/40 flex items-center justify-center gap-1.5 font-medium">
                    <Mail size={12} className="text-gold/60" />
                    {user.email}
                  </p>
                  
                  {/* User Badging */}
                  <div className="mt-4 flex flex-wrap justify-center gap-2">
                    {user.is_admin ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-red-400">
                        <Shield size={10} />
                        Administrator
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-gold/15 border border-gold/20 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-gold">
                        <Shield size={10} />
                        Verified Member
                      </span>
                    )}
                    <span className="inline-flex items-center gap-1 rounded-full bg-cream/5 border border-cream/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider text-cream/50">
                      <Calendar size={10} />
                      {user.auth_provider === "google" ? "Google Account" : "Credentials"}
                    </span>
                  </div>
                </div>
              </div>

              {/* Stats Panel */}
              <div className="premium-card p-6 space-y-4">
                <h4 className="text-xs font-black uppercase tracking-widest text-cream/40 border-b border-cream/10 pb-2">
                  My Activity Stats
                </h4>
                
                {ordersLoading ? (
                  <div className="py-4 text-center">
                    <span className="text-xs text-cream/40 animate-pulse">Calculating stats...</span>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-3">
                    {/* Stat item 1 */}
                    <div className="flex items-center gap-4 rounded-xl border border-cream/5 bg-cream/[0.02] p-3 transition duration-300 hover:bg-cream/[0.04]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-gold/10 text-gold border border-gold/20">
                        <ShoppingBag size={18} />
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-cream/40">Total Orders</span>
                        <span className="text-lg font-black text-cream">{orders.length}</span>
                      </div>
                    </div>

                    {/* Stat item 2 */}
                    <div className="flex items-center gap-4 rounded-xl border border-cream/5 bg-cream/[0.02] p-3 transition duration-300 hover:bg-cream/[0.04]">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-green-500/10 text-green-400 border border-green-500/20">
                        <span className="text-lg font-bold">৳</span>
                      </div>
                      <div>
                        <span className="block text-[10px] font-bold uppercase tracking-wider text-cream/40">Total Invested</span>
                        <span className="text-lg font-black text-cream">
                          ৳{orders.reduce((sum, o) => sum + Number(o.total || 0), 0).toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Stat item 3 */}
                    {orders.length > 0 && (
                      <div className="flex items-center gap-4 rounded-xl border border-cream/5 bg-cream/[0.02] p-3 transition duration-300 hover:bg-cream/[0.04]">
                        <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-champagne/10 text-champagne border border-champagne/20">
                          <Package size={18} />
                        </div>
                        <div className="min-w-0 flex-1">
                          <span className="block text-[10px] font-bold uppercase tracking-wider text-cream/40">Latest Order</span>
                          <div className="flex items-center gap-2 mt-0.5">
                            <span className="truncate text-xs font-bold text-cream">
                              #{orders[0].id.slice(0, 8)}
                            </span>
                            <span className={`rounded-full border px-2 py-0.5 text-[9px] font-black uppercase tracking-wider scale-90 ${
                              statusColors[orders[0].status] || "bg-cream/10 text-cream/60 border-cream/20"
                            }`}>
                              {orders[0].status}
                            </span>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Right Column: Personal Details Form (2/3 width on desktop) */}
            <div className="premium-card p-8 md:col-span-2 relative overflow-hidden group">
              {/* Decorative subtle background circle */}
              <div className="absolute -left-20 -top-20 h-48 w-48 rounded-full bg-gold/[0.02] blur-3xl" />
              
              <h2 className="mb-6 text-xl font-extrabold text-cream flex items-center gap-2">
                <UserIcon className="text-gold" size={20} />
                Edit Profile Details
              </h2>

              <form onSubmit={handleSaveProfile} className="space-y-6 relative z-10">
                {/* Full Name field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-cream/40">
                    Full Name
                  </label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30 group-focus-within/input:text-gold transition-colors duration-300">
                      <UserIcon size={16} />
                    </div>
                    <input
                      type="text"
                      required
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      className="w-full rounded-xl border border-cream/10 bg-cream/[0.03] pl-11 pr-4 py-3.5 text-sm text-cream outline-none transition-all duration-300 focus:border-gold/50 focus:ring-4 focus:ring-gold/10 hover:border-cream/20"
                      placeholder="Your full name"
                    />
                  </div>
                </div>

                {/* Phone Number field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-cream/40">
                    Phone Number
                  </label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-1/2 -translate-y-1/2 text-cream/30 group-focus-within/input:text-gold transition-colors duration-300">
                      <Phone size={16} />
                    </div>
                    <input
                      type="tel"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full rounded-xl border border-cream/10 bg-cream/[0.03] pl-11 pr-4 py-3.5 text-sm text-cream outline-none transition-all duration-300 focus:border-gold/50 focus:ring-4 focus:ring-gold/10 hover:border-cream/20"
                      placeholder="+880 1XXX XXXXXX"
                    />
                  </div>
                </div>

                {/* Delivery Address field */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-black uppercase tracking-wider text-cream/40">
                    Delivery Address
                  </label>
                  <div className="relative group/input">
                    <div className="absolute left-4 top-4 text-cream/30 group-focus-within/input:text-gold transition-colors duration-300">
                      <MapPin size={16} />
                    </div>
                    <textarea
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                      rows={4}
                      className="w-full resize-none rounded-xl border border-cream/10 bg-cream/[0.03] pl-11 pr-4 py-3.5 text-sm text-cream outline-none transition-all duration-300 focus:border-gold/50 focus:ring-4 focus:ring-gold/10 hover:border-cream/20"
                      placeholder="Enter your complete delivery address in Bangladesh"
                    />
                  </div>
                </div>

                {/* Action button */}
                <div className="pt-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary w-full md:w-auto min-w-[160px] relative overflow-hidden group/btn disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    <Save size={16} className="transition-transform duration-300 group-hover/btn:scale-110" />
                    <span>{saving ? "Saving Changes..." : "Save Changes"}</span>
                  </button>
                </div>
              </form>
            </div>
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

      {/* Toast Notification */}
      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-cream/10 bg-ink/95 p-4 shadow-2xl backdrop-blur-xl animate-slide-right min-w-[280px]">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${
            toast.type === "success" 
              ? "bg-green-500/20 text-green-400 border border-green-500/30" 
              : "bg-red-500/20 text-red-400 border border-red-500/30"
          }`}>
            {toast.type === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}
          </div>
          <div className="flex-1">
            <p className="text-sm font-extrabold text-cream leading-tight">
              {toast.type === "success" ? "Success" : "Error"}
            </p>
            <p className="text-xs text-cream/60">{toast.message}</p>
          </div>
          <button 
            onClick={() => setToast(null)}
            className="text-cream/30 transition hover:text-cream/60 text-xs font-black px-1.5 py-0.5 rounded hover:bg-cream/5"
          >
            ✕
          </button>
        </div>
      )}
    </div>
  );
}
