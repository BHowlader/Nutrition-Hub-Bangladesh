"use client";

import { Suspense, useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Camera,
  Package,
  Save,
  ShoppingBag,
  User as UserIcon,
  Mail,
  Phone,
  MapPin,
  Shield,
  Lock,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  LogOut,
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { Header } from "@/components/Header";
import { PageLoading } from "@/components/PageLoading";

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

type Section = "profile" | "address" | "orders" | "security";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

const NAV_ITEMS: { key: Section; label: string; icon: typeof UserIcon; desc: string }[] = [
  { key: "profile", label: "Profile", icon: UserIcon, desc: "Name, photo & contact" },
  { key: "address", label: "Address", icon: MapPin, desc: "Delivery details" },
  { key: "security", label: "Security", icon: Lock, desc: "Account & sign-in" },
];

function DashboardContent() {
  const { user, loading, updateProfile, uploadPhoto, refreshUser, logout } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [section, setSection] = useState<Section>("profile");
  const [orders, setOrders] = useState<Order[]>([]);
  const [ordersLoading, setOrdersLoading] = useState(false);

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null);

  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (toast) {
      const t = setTimeout(() => setToast(null), 3500);
      return () => clearTimeout(t);
    }
  }, [toast]);

  useEffect(() => {
    if (!loading && !user) router.replace("/login?redirect=/dashboard");
  }, [loading, user, router]);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setPhone(user.phone || "");
      setAddress(user.address || "");
    }
  }, [user]);

  const tabParam = searchParams.get("tab") || searchParams.get("section");

  useEffect(() => {
    if (tabParam === "orders" || tabParam === "profile" || tabParam === "address" || tabParam === "security") {
      setSection(tabParam as Section);
    }
  }, [tabParam]);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    setOrdersLoading(true);
    try {
      const res = await fetch(`${API}/api/orders/my`, { credentials: "include" });
      if (res.ok) setOrders(await res.json());
    } finally {
      setOrdersLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user) fetchOrders();
  }, [user, fetchOrders]);

  async function handleSaveProfile(e: React.FormEvent, fields: { name?: string; phone?: string; address?: string }) {
    e.preventDefault();
    setSaving(true);
    try {
      await updateProfile(fields);
      setToast({ message: "Saved successfully", type: "success" });
    } catch {
      setToast({ message: "Failed to save", type: "error" });
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
      setToast({ message: "Profile picture updated", type: "success" });
    } catch {
      setToast({ message: "Photo upload failed", type: "error" });
    }
  }

  if (loading || !user) return <PageLoading label="Loading account" />;

  const photoSrc = user.photo_url
    ? user.photo_url.startsWith("http")
      ? user.photo_url
      : `${API}${user.photo_url}`
    : null;

  const totalSpent = orders.reduce((sum, o) => sum + Number(o.total || 0), 0);

  return (
    <div className="min-h-screen bg-ink pt-24 md:pt-28 pb-10">
      <Header />
      <div className="mx-auto max-w-6xl px-4">
        <div className="mb-6 md:mb-8">
          <h1 className="text-3xl font-black text-cream">Account</h1>
          <p className="mt-1 text-sm text-cream/50">Manage your profile, orders, and security settings</p>
        </div>

        <div className="grid gap-6 md:grid-cols-[280px_1fr]">
          {/* Mobile Sidebar/Header (visible only on mobile) */}
          <div className="space-y-4 md:hidden">
            {/* Mobile User Header */}
            <div className="premium-card p-4 flex items-center justify-between gap-4">
              <div className="flex items-center gap-3 min-w-0">
                <div className="relative shrink-0 cursor-pointer group/avatar" onClick={() => fileRef.current?.click()}>
                  {photoSrc ? (
                    <img
                      src={photoSrc}
                      alt={user.name}
                      className="h-10 w-10 rounded-full object-cover ring-2 ring-gold/30"
                    />
                  ) : (
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-gold to-champagne text-sm font-black text-ink ring-2 ring-gold/30">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-cream">{user.name}</p>
                  <p className="truncate text-[10px] text-cream/50">{user.email}</p>
                </div>
              </div>
              <button
                onClick={() => logout().then(() => router.push("/"))}
                className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 text-xs font-bold text-cream/60 transition hover:text-red-400"
              >
                Sign out
              </button>
            </div>

            {/* Mobile Nav Tabs Slider */}
            <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {NAV_ITEMS.map(({ key, label, icon: Icon }) => {
                const active = section === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSection(key)}
                    className={`flex shrink-0 items-center gap-2 rounded-full border px-4 py-2.5 text-xs font-bold transition ${
                      active
                        ? "border-gold/55 bg-gold/10 text-cream"
                        : "border-white/[0.06] bg-white/[0.02] text-cream/60 hover:border-white/12 hover:bg-white/[0.04]"
                    }`}
                  >
                    <Icon size={14} className={active ? "text-gold" : "text-cream/40"} />
                    <span>{label}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Desktop Sidebar (hidden on mobile) */}
          <aside className="hidden md:block space-y-4">
            <div className="premium-card p-5">
              <div className="flex items-center gap-3">
                <div className="relative shrink-0 cursor-pointer group/avatar" onClick={() => fileRef.current?.click()}>
                  {photoSrc ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={photoSrc}
                      alt={user.name}
                      className="h-14 w-14 rounded-full object-cover ring-2 ring-gold/30"
                    />
                  ) : (
                    <div className="flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-gold to-champagne text-xl font-black text-ink ring-2 ring-gold/30">
                      {user.name.charAt(0).toUpperCase()}
                    </div>
                  )}
                  <div className="absolute inset-0 flex items-center justify-center rounded-full bg-ink/70 opacity-0 transition group-hover/avatar:opacity-100">
                    <Camera size={16} className="text-gold" />
                  </div>
                  <input
                    ref={fileRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handlePhotoUpload}
                  />
                </div>
                <div className="min-w-0">
                  <p className="truncate text-sm font-extrabold text-cream">{user.name}</p>
                  <p className="truncate text-xs text-cream/50">{user.email}</p>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-1.5">
                {user.is_admin && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-red-400">
                    <Shield size={8} /> Admin
                  </span>
                )}
                <span className="inline-flex items-center gap-1 rounded-full bg-gold/10 border border-gold/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-gold">
                  {user.auth_provider === "google" ? "Google" : "Email"}
                </span>
              </div>
            </div>

            {/* Nav */}
            <nav className="premium-card p-2">
              {NAV_ITEMS.map(({ key, label, icon: Icon, desc }) => {
                const active = section === key;
                return (
                  <button
                    key={key}
                    onClick={() => setSection(key)}
                    className={`group flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left transition ${active ? "bg-gold/15 text-gold" : "text-cream/70 hover:bg-cream/[0.04] hover:text-cream"
                      }`}
                  >
                    <Icon size={18} className={active ? "text-gold" : "text-cream/40"} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold leading-tight">{label}</p>
                      <p className="text-[10px] text-cream/40 leading-tight mt-0.5">{desc}</p>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 ${active ? "text-gold" : "text-cream/20"}`} />
                  </button>
                );
              })}
            </nav>

            <button
              onClick={() => logout().then(() => router.push("/"))}
              className="premium-card flex w-full items-center justify-center gap-2 p-3 text-sm font-bold text-cream/60 transition hover:text-red-400"
            >
              <LogOut size={16} />
              Sign out
            </button>
          </aside>

          {/* Content */}
          <section className="premium-card p-6 md:p-8 min-h-[500px]">
            {section === "profile" && (
              <ProfileSection
                name={name}
                phone={phone}
                onChangeName={setName}
                onChangePhone={setPhone}
                onSubmit={(e) => handleSaveProfile(e, { name, phone })}
                saving={saving}
                user={user}
                orders={orders}
                totalSpent={totalSpent}
              />
            )}

            {section === "address" && (
              <AddressSection
                address={address}
                onChange={setAddress}
                onSubmit={(e) => handleSaveProfile(e, { address })}
                saving={saving}
              />
            )}

            {section === "orders" && (
              <OrdersSection orders={orders} loading={ordersLoading} />
            )}

            {section === "security" && (
              <SecuritySection user={user} />
            )}
          </section>
        </div>
      </div>

      {toast && (
        <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-xl border border-cream/10 bg-ink/95 p-4 shadow-2xl backdrop-blur-xl min-w-[280px]">
          <div className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full ${toast.type === "success"
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

export default function DashboardPage() {
  return (
    <Suspense fallback={<PageLoading label="Loading account" />}>
      <DashboardContent />
    </Suspense>
  );
}

function SectionHeader({ title, desc }: { title: string; desc: string }) {
  return (
    <div className="mb-6 border-b border-cream/10 pb-4">
      <h2 className="text-xl font-extrabold text-cream">{title}</h2>
      <p className="mt-1 text-sm text-cream/50">{desc}</p>
    </div>
  );
}

function InputField({
  label,
  icon: Icon,
  value,
  onChange,
  type = "text",
  placeholder,
  required,
}: {
  label: string;
  icon: typeof UserIcon;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-cream/40">{label}</label>
      <div className="relative">
        <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/30">
          <Icon size={16} />
        </div>
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          required={required}
          className="w-full rounded-xl border border-cream/10 bg-cream/[0.03] pl-10 pr-4 py-3 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
        />
      </div>
    </div>
  );
}

function SaveButton({ saving, label = "Save changes" }: { saving: boolean; label?: string }) {
  return (
    <button
      type="submit"
      disabled={saving}
      className="btn-primary inline-flex items-center gap-2 disabled:opacity-50"
    >
      <Save size={16} />
      {saving ? "Saving…" : label}
    </button>
  );
}

function ProfileSection({
  name,
  phone,
  onChangeName,
  onChangePhone,
  onSubmit,
  saving,
  user,
  orders,
  totalSpent,
}: {
  name: string;
  phone: string;
  onChangeName: (v: string) => void;
  onChangePhone: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
  user: { email: string };
  orders: Order[];
  totalSpent: number;
}) {
  return (
    <>
      <SectionHeader title="Profile" desc="Update your personal information and contact details." />

      <div className="mb-6 grid grid-cols-2 gap-3 md:grid-cols-3">
        <StatCard label="Orders" value={String(orders.length)} icon={ShoppingBag} accent="text-gold" />
        <StatCard label="Spent" value={`৳${totalSpent.toLocaleString()}`} icon={Package} accent="text-green-400" />
        <StatCard
          label="Last order"
          value={orders[0] ? `#${orders[0].id.slice(0, 6)}` : "—"}
          icon={Package}
          accent="text-champagne"
        />
      </div>

      <form onSubmit={onSubmit} className="space-y-4">
        <InputField label="Full name" icon={UserIcon} value={name} onChange={onChangeName} required />
        <InputField label="Phone" icon={Phone} value={phone} onChange={onChangePhone} type="tel" placeholder="+880 1XXX XXXXXX" />
        <div>
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-cream/40">Email</label>
          <div className="flex items-center gap-2 rounded-xl border border-cream/10 bg-cream/[0.02] px-4 py-3 text-sm text-cream/60">
            <Mail size={16} className="text-cream/30" />
            {user.email}
            <span className="ml-auto text-[10px] uppercase tracking-wider text-cream/30">read-only</span>
          </div>
        </div>
        <div className="pt-2">
          <SaveButton saving={saving} />
        </div>
      </form>
    </>
  );
}

function AddressSection({
  address,
  onChange,
  onSubmit,
  saving,
}: {
  address: string;
  onChange: (v: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  saving: boolean;
}) {
  return (
    <>
      <SectionHeader title="Delivery address" desc="Where should we send your orders?" />
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label className="mb-1.5 block text-xs font-black uppercase tracking-wider text-cream/40">Full address</label>
          <div className="relative">
            <div className="absolute left-3.5 top-3.5 text-cream/30">
              <MapPin size={16} />
            </div>
            <textarea
              value={address}
              onChange={(e) => onChange(e.target.value)}
              rows={5}
              placeholder="House, road, area, city, postal code"
              className="w-full resize-none rounded-xl border border-cream/10 bg-cream/[0.03] pl-10 pr-4 py-3 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-2 focus:ring-gold/20"
            />
          </div>
        </div>
        <SaveButton saving={saving} label="Save address" />
      </form>
    </>
  );
}

function OrdersSection({ orders, loading }: { orders: Order[]; loading: boolean }) {
  return (
    <>
      <SectionHeader title="Orders" desc={`${orders.length} order${orders.length === 1 ? "" : "s"} placed`} />
      {loading ? (
        <p className="py-12 text-center text-sm text-cream/40">Loading orders…</p>
      ) : orders.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 text-center">
          <ShoppingBag size={40} className="mb-4 text-cream/20" />
          <p className="text-base font-bold text-cream/60">No orders yet</p>
          <p className="mt-1 text-sm text-cream/40">Your purchases will show up here</p>
          <Link href="/" className="btn-primary mt-6">Browse products</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {orders.map((order) => (
            <div key={order.id} className="rounded-xl border border-cream/10 bg-cream/[0.02] p-4">
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-cream/40">
                    #{order.id.slice(0, 8)}
                  </p>
                  <p className="text-lg font-black text-cream">৳{Number(order.total).toLocaleString()}</p>
                </div>
                <span
                  className={`rounded-full border px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${statusColors[order.status] || "bg-cream/10 text-cream/60 border-cream/20"
                    }`}
                >
                  {order.status}
                </span>
              </div>
              <div className="space-y-1 border-t border-cream/10 pt-3 text-xs text-cream/70">
                {order.items.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span>Product {item.product_id.slice(0, 8)}… × {item.quantity}</span>
                    <span className="font-bold">৳{(item.unit_price * item.quantity).toLocaleString()}</span>
                  </div>
                ))}
              </div>
              <div className="mt-3 flex flex-wrap gap-3 text-[10px] uppercase tracking-wider text-cream/40">
                <span>Payment: {order.payment_method.toUpperCase()}</span>
                <span>Phone: {order.phone}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

function SecuritySection({ user }: { user: { email: string; auth_provider: string; is_admin: boolean } }) {
  const [showForm, setShowForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  async function handleChangePassword(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSuccess("");

    if (newPassword.length < 8) {
      setError("New password must be at least 8 characters.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New passwords do not match.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch(`${API}/api/auth/me/change-password`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ current_password: currentPassword, new_password: newPassword }),
      });
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        throw new Error(body.detail || "Failed to change password");
      }
      setSuccess("Password changed successfully. Other sessions have been signed out.");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setShowForm(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSaving(false);
    }
  }

  return (
    <>
      <SectionHeader title="Security" desc="Sign-in method and account information." />
      <div className="space-y-4">
        <Row label="Email" value={user.email} />
        <Row label="Sign-in method" value={user.auth_provider === "google" ? "Google" : "Email & password"} />
        <Row label="Role" value={user.is_admin ? "Administrator" : "Customer"} />

        {success && (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-500/20 bg-emerald-500/10 px-4 py-3 text-xs font-bold text-emerald-400">
            <CheckCircle2 size={14} /> {success}
          </div>
        )}

        {user.auth_provider !== "google" && (
          <div className="rounded-xl border border-cream/10 bg-cream/[0.02] p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-bold text-cream">Password</p>
                <p className="mt-0.5 text-xs text-cream/50">Change your account password</p>
              </div>
              {!showForm && (
                <button
                  onClick={() => { setShowForm(true); setError(""); setSuccess(""); }}
                  className="rounded-lg border border-cream/10 bg-cream/[0.04] px-3 py-1.5 text-xs font-bold text-cream/70 transition hover:border-gold/30 hover:text-cream"
                >
                  Change
                </button>
              )}
            </div>

            {showForm && (
              <form onSubmit={handleChangePassword} className="mt-4 space-y-3">
                {error && (
                  <div className="flex items-center gap-2 rounded-lg border border-red-500/20 bg-red-500/10 px-3 py-2 text-xs text-red-400">
                    <AlertCircle size={13} /> {error}
                  </div>
                )}
                <input
                  type="password"
                  placeholder="Current password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className="h-10 w-full rounded-lg border border-cream/10 bg-cream/[0.04] px-3 text-sm text-cream outline-none placeholder:text-cream/30 focus:border-gold/40"
                />
                <input
                  type="password"
                  placeholder="New password (min 8 chars)"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className="h-10 w-full rounded-lg border border-cream/10 bg-cream/[0.04] px-3 text-sm text-cream outline-none placeholder:text-cream/30 focus:border-gold/40"
                />
                <input
                  type="password"
                  placeholder="Confirm new password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className="h-10 w-full rounded-lg border border-cream/10 bg-cream/[0.04] px-3 text-sm text-cream outline-none placeholder:text-cream/30 focus:border-gold/40"
                />
                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={saving}
                    className="btn-primary min-h-[40px] flex-1 text-xs disabled:opacity-50"
                  >
                    {saving ? "Saving..." : "Update password"}
                  </button>
                  <button
                    type="button"
                    onClick={() => { setShowForm(false); setError(""); }}
                    className="rounded-lg border border-cream/10 bg-cream/[0.04] px-4 text-xs font-bold text-cream/60 transition hover:text-cream"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}
      </div>
    </>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-cream/10 py-3">
      <span className="text-xs font-black uppercase tracking-wider text-cream/40">{label}</span>
      <span className="text-sm text-cream">{value}</span>
    </div>
  );
}

function StatCard({ label, value, icon: Icon, accent }: { label: string; value: string; icon: typeof UserIcon; accent: string }) {
  return (
    <div className="rounded-xl border border-cream/10 bg-cream/[0.02] p-3">
      <Icon size={16} className={accent} />
      <p className="mt-2 text-lg font-black text-cream truncate">{value}</p>
      <p className="text-[10px] font-bold uppercase tracking-wider text-cream/40">{label}</p>
    </div>
  );
}
