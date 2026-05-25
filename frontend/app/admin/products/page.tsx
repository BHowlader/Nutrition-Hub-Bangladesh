"use client";

import { useCallback, useEffect, useMemo, useState, Fragment } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  Boxes,
  ClipboardList,
  Edit3,
  Eye,
  Filter,
  History,
  ImageIcon,
  Mail,
  PackageCheck,
  Phone,
  Plus,
  Percent,
  Search,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Trash2,
  Upload,
  UserRound,
  Users,
  X,
  LogOut,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { csrfHeader } from "@/lib/auth";
import { useAdminAuth } from "@/lib/adminAuth";
import { productImage } from "@/lib/products";

const BACKEND_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function resolveMediaUrl(url: string | null) {
  if (!url) return null;
  return url.startsWith("http") ? url : `${BACKEND_URL}${url}`;
}

type ProductStatus = "draft" | "published" | "archived";
type StatusFilter = ProductStatus | "all";
type AdminTab = "products" | "orders" | "customers" | "analytics" | "audit" | "users" | "hero" | "coupons";

interface Customer {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  photo_url: string | null;
  auth_provider: string;
  created_at: string;
  order_count: number;
  total_spent: string;
  pending_count: number;
  delivered_count: number;
  cancelled_count: number;
  last_order_at: string | null;
  orders: Order[];
}

interface HeroSettings {
  hero_description: string;
  hero_product_slug_1: string | null;
  hero_product_slug_2: string | null;
  hero_product_slug_3: string | null;
}
type OrderStatus = "pending" | "confirmed" | "shipped" | "delivered" | "cancelled";

interface Category {
  id: string;
  name: string;
  slug: string;
}

interface Product {
  id: string;
  name: string;
  slug: string;
  sku: string;
  description: string;
  price: string;
  compare_at_price: string | null;
  stock: number;
  batch_no: string | null;
  expiry_date: string | null;
  image_url: string | null;
  badge: string | null;
  detail: string | null;
  accent: string | null;
  subcategory: string | null;
  status: ProductStatus;
  category_id: string;
  category?: Category | null;
}

interface OrderItem {
  product_id: string;
  quantity: number;
  unit_price: string;
  product_name?: string | null;
  product_image_url?: string | null;
  product_slug?: string | null;
}

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  payment_method: string;
  status: OrderStatus;
  subtotal: string;
  discount_amount: string;
  coupon_code: string | null;
  total: string;
  items: OrderItem[];
  created_at: string | null;
  user_id?: string | null;
}

interface AdminStats {
  orders: number;
  pending_orders: number;
  revenue: string;
  products: number;
  published_products: number;
  low_stock_products: number;
}

interface AuditLog {
  id: string;
  actor_email: string | null;
  action: string;
  entity_type: string;
  entity_id: string | null;
  summary: string;
  created_at: string;
}

interface AdminUser {
  id: string;
  name: string;
  email: string;
  is_admin: boolean;
  role: string;
  created_at: string;
}

interface Coupon {
  id: string;
  code: string;
  description: string | null;
  discount_type: "percent" | "fixed";
  value: string;
  min_order_amount: string;
  max_discount_amount: string | null;
  active: boolean;
  starts_at: string | null;
  ends_at: string | null;
  usage_limit: number | null;
  usage_count: number;
  created_at: string;
}

type CouponForm = Omit<Coupon, "id" | "usage_count" | "created_at"> & { id?: string };

type FormState = Omit<Product, "id" | "category"> & { id?: string; gallery: string[] | null };

const EMPTY_FORM: FormState = {
  name: "",
  slug: "",
  sku: "",
  description: "",
  price: "0",
  compare_at_price: null,
  stock: 0,
  batch_no: null,
  expiry_date: null,
  image_url: null,
  gallery: null,
  badge: null,
  detail: null,
  accent: "#F59E0B",
  subcategory: null,
  status: "draft",
  category_id: "",
};

const EMPTY_COUPON: CouponForm = {
  code: "",
  description: null,
  discount_type: "percent",
  value: "10",
  min_order_amount: "0",
  max_discount_amount: null,
  active: true,
  starts_at: null,
  ends_at: null,
  usage_limit: null,
};

const statusStyles: Record<ProductStatus, string> = {
  draft: "border-amber-500/20 bg-amber-500/10 text-amber-400",
  published: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
  archived: "border-slate-500/20 bg-slate-500/10 text-slate-400",
};

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const method = (init.method || "GET").toUpperCase();
  const res = await fetch(path, {
    credentials: "include",
    ...init,
    headers: {
      "Content-Type": "application/json",
      ...csrfHeader(method),
      ...init.headers,
    },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nhb-admin-authed");
      window.location.replace("/admin/login");
    }
    throw new Error("Admin session required");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function uploadApi<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(path, {
    method: "POST",
    credentials: "include",
    headers: csrfHeader("POST"),
    body: formData,
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem("nhb-admin-authed");
      window.location.replace("/admin/login");
    }
    throw new Error("Admin session required");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

function slugify(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)+/g, "");
}

function cleanProductPayload(form: FormState) {
  return {
    ...form,
    compare_at_price: form.compare_at_price || null,
    batch_no: form.batch_no || null,
    expiry_date: form.expiry_date || null,
    image_url: form.image_url || null,
    badge: form.badge || null,
    detail: form.detail || null,
    accent: form.accent || null,
    subcategory: form.subcategory || null,
    price: String(form.price || "0"),
    stock: Number(form.stock || 0),
  };
}

export default function AdminProductsPage() {
  const { adminUser, adminLogout } = useAdminAuth();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);

  const handleSignOut = async () => {
    try {
      await adminLogout();
      router.replace("/admin/login");
      window.setTimeout(() => {
        if (window.location.pathname !== "/admin/login") {
          window.location.replace("/admin/login");
        }
      }, 300);
    } catch (e) {
      console.error("Sign out failed", e);
      window.location.replace("/admin/login");
    }
  };
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [coupons, setCoupons] = useState<Coupon[]>([]);
  const [editingCoupon, setEditingCoupon] = useState<CouponForm | null>(null);
  const [heroSettings, setHeroSettings] = useState<HeroSettings | null>(null);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [activeTab, setActiveTab] = useState<AdminTab>("products");
  const [editing, setEditing] = useState<FormState | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [categoryFilter, setCategoryFilter] = useState("all");

  const load = useCallback(async () => {
    setError("");
    try {
      const [p, c, s, o, a, u, h, cust, couponsData] = await Promise.all([
        api<Product[]>("/api/products/admin"),
        api<Category[]>("/api/categories"),
        api<AdminStats>("/api/admin/stats"),
        api<Order[]>("/api/orders/admin"),
        api<AuditLog[]>("/api/admin/audit-logs"),
        adminUser?.role === "owner" ? api<AdminUser[]>("/api/admin/users") : Promise.resolve([]),
        api<HeroSettings>("/api/settings/hero"),
        api<Customer[]>("/api/admin/customers"),
        api<Coupon[]>("/api/admin/coupons"),
      ]);
      setProducts(p);
      setCategories(c);
      setAdminStats(s);
      setOrders(o);
      setAuditLogs(a);
      setAdminUsers(u);
      setHeroSettings(h);
      setCustomers(cust);
      setCoupons(couponsData);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load CMS data");
    } finally {
      setLoading(false);
    }
  }, [adminUser?.role]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (!notice) return;
    const timer = setTimeout(() => setNotice(""), 3000);
    return () => clearTimeout(timer);
  }, [notice]);

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();
    return products.filter((product) => {
      const matchesQuery =
        !q ||
        `${product.name} ${product.slug} ${product.sku} ${product.description} ${product.category?.name || ""}`
          .toLowerCase()
          .includes(q);
      const matchesStatus = statusFilter === "all" || product.status === statusFilter;
      const matchesCategory = categoryFilter === "all" || product.category_id === categoryFilter;
      return matchesQuery && matchesStatus && matchesCategory;
    });
  }, [categoryFilter, products, query, statusFilter]);

  const stats = useMemo(() => {
    const published = products.filter((p) => p.status === "published").length;
    const lowStock = products.filter((p) => p.stock > 0 && p.stock < 10).length;
    const outOfStock = products.filter((p) => p.stock === 0).length;
    return {
      total: products.length,
      published,
      lowStock,
      outOfStock,
    };
  }, [products]);

  function startNewProduct() {
    setEditing({
      ...EMPTY_FORM,
      category_id: categories[0]?.id || "",
      sku: `NHB-${Date.now().toString().slice(-6)}`,
    });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setSaving(true);
    setError("");
    try {
      const payload = cleanProductPayload(editing);
      if (editing.id) {
        await api(`/api/products/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/products", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setEditing(null);
      setNotice(editing.id ? "Product updated" : "Product created");
      await load();
      // Bust Next.js data cache so public pages reflect changes immediately
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: "products" }),
      }).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setSaving(true);
    setError("");
    try {
      await api(`/api/products/${deleteTarget.id}`, { method: "DELETE" });
      setNotice("Product deleted");
      setDeleteTarget(null);
      await load();
      fetch("/api/revalidate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tag: "products" }),
      }).catch(() => {});
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    } finally {
      setSaving(false);
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    try {
      await api("/api/categories", {
        method: "POST",
        body: JSON.stringify(newCategory),
      });
      setNewCategory({ name: "", slug: "" });
      setShowCategoryForm(false);
      setNotice("Category created");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create category");
    } finally {
      setSaving(false);
    }
  }

  async function handleOrderStatus(orderId: string, nextStatus: OrderStatus) {
    setSaving(true);
    setError("");
    try {
      await api(`/api/orders/admin/${orderId}/status`, {
        method: "PATCH",
        body: JSON.stringify({ status: nextStatus }),
      });
      setNotice("Order status updated");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update order");
    } finally {
      setSaving(false);
    }
  }

  async function handleUserRole(userId: string, role: string) {
    setSaving(true);
    setError("");
    try {
      await api(`/api/admin/users/${userId}/role`, {
        method: "PATCH",
        body: JSON.stringify({ role }),
      });
      setNotice("User role updated");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update role");
    } finally {
      setSaving(false);
    }
  }

  async function handleHeroSave(payload: HeroSettings) {
    setSaving(true);
    setError("");
    try {
      const updated = await api<HeroSettings>("/api/admin/hero", {
        method: "PUT",
        body: JSON.stringify(payload),
      });
      setHeroSettings(updated);
      setNotice("Hero section updated");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to update hero");
    } finally {
      setSaving(false);
    }
  }

  async function handleCouponSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editingCoupon) return;
    setSaving(true);
    setError("");
    try {
      const payload = {
        ...editingCoupon,
        code: editingCoupon.code.trim().toUpperCase(),
        description: editingCoupon.description || null,
        max_discount_amount: editingCoupon.max_discount_amount || null,
        starts_at: editingCoupon.starts_at || null,
        ends_at: editingCoupon.ends_at || null,
        usage_limit: editingCoupon.usage_limit || null,
      };
      if (editingCoupon.id) {
        await api(`/api/admin/coupons/${editingCoupon.id}`, {
          method: "PATCH",
          body: JSON.stringify(payload),
        });
      } else {
        await api("/api/admin/coupons", {
          method: "POST",
          body: JSON.stringify(payload),
        });
      }
      setEditingCoupon(null);
      setNotice(editingCoupon.id ? "Coupon updated" : "Coupon created");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to save coupon");
    } finally {
      setSaving(false);
    }
  }

  async function handleCouponDelete(couponId: string) {
    setSaving(true);
    setError("");
    try {
      await api(`/api/admin/coupons/${couponId}`, { method: "DELETE" });
      setNotice("Coupon deleted");
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to delete coupon");
    } finally {
      setSaving(false);
    }
  }

  async function handleImageUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await uploadApi<{ image_url: string }>("/api/products/admin/upload-image", formData);
      if (editing) setEditing({ ...editing, image_url: data.image_url });
      setNotice("Image uploaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Image upload failed");
    } finally {
      setUploading(false);
    }
  }

  async function handleGalleryUpload(file: File) {
    setUploading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const data = await uploadApi<{ image_url: string }>("/api/products/admin/upload-image", formData);
      if (editing) {
        const current = editing.gallery || [];
        setEditing({ ...editing, gallery: [...current, data.image_url] });
      }
      setNotice("Gallery image uploaded");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Gallery upload failed");
    } finally {
      setUploading(false);
    }
  }

  const pendingOrdersCount = orders.filter((o) => o.status === "pending").length;
  const newCustomersCount = customers.filter((c) => {
    return new Date().getTime() - new Date(c.created_at).getTime() < 24 * 60 * 60 * 1000;
  }).length;

  return (
    <div className="relative h-[100dvh] bg-ink text-cream font-sans overflow-hidden">
      {/* Background glow effects */}
      <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
        <div className="absolute -left-[10%] -top-[10%] h-[50vw] w-[50vw] rounded-full bg-gold/5 blur-[120px] animate-aurora-1" />
        <div className="absolute -right-[10%] -bottom-[10%] h-[50vw] w-[50vw] rounded-full bg-mint/5 blur-[120px] animate-aurora-2" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row h-full overflow-hidden">
        {/* Sidebar for Desktop */}
        <aside className="hidden lg:flex lg:flex-col lg:w-48 xl:w-56 shrink-0 border-r border-cream/[0.08] bg-forest/40 backdrop-blur-md p-5 h-full justify-between">
          <div>
            {/* Header/Branding */}
            <div className="mb-8 flex items-center gap-3">
              <div className="relative h-9 w-9 overflow-hidden rounded-xl bg-gold/10 flex items-center justify-center border border-gold/20">
                <Image src="/images/logo.png" alt="Logo" width={28} height={28} className="object-contain" style={{ width: "auto", height: "auto" }} />
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-black uppercase tracking-[0.15em] text-gold truncate">CMS Panel</span>
                <strong className="block text-sm font-black text-cream truncate">Nutrition Hub</strong>
              </div>
            </div>

            {/* Navigation Links */}
            <nav className="space-y-1.5">
              {([
                ["products", Boxes, "Products"],
                ["orders", ClipboardList, "Orders"],
                ["customers", UserRound, "Customers"],
                ["analytics", BarChart3, "Analytics"],
                ["coupons", Percent, "Coupons"],
                ["audit", History, "Audit Log"],
                ["hero", Sparkles, "Hero Section"],
                ...(adminUser?.role === "owner" ? ([["users", Users, "Users"]] as const) : []),
              ] as const).map(([tab, Icon, label]) => {
                const active = activeTab === tab;
                return (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`w-full flex items-center justify-between px-3.5 py-3 rounded-xl text-sm font-black transition-all duration-300 ${
                      active
                        ? "bg-gradient-to-r from-gold/15 to-champagne/5 text-gold border border-gold/20 shadow-[0_0_20px_rgba(96,165,250,0.08)]"
                        : "text-cream/60 border border-transparent hover:text-cream hover:bg-cream/[0.03]"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <Icon size={18} className={active ? "text-gold" : "text-cream/50"} />
                      <span className="truncate">{label}</span>
                    </div>
                    {tab === "orders" && pendingOrdersCount > 0 && (
                      <span className={`flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-black ${active ? "bg-gold text-ink" : "bg-gold/20 text-gold"}`}>
                        {pendingOrdersCount}
                      </span>
                    )}
                    {tab === "customers" && newCustomersCount > 0 && (
                      <span className={`flex h-5 items-center justify-center rounded-full px-2 text-[10px] font-black ${active ? "bg-gold text-ink" : "bg-gold/20 text-gold"}`}>
                        {newCustomersCount}
                      </span>
                    )}
                  </button>
                );
              })}
            </nav>
          </div>

          {/* Footer of Sidebar */}
          <div className="pt-4 border-t border-cream/[0.06]">
            <div className="flex items-center gap-3 mb-4">
              <div className="h-8 w-8 rounded-full bg-cream/[0.08] flex items-center justify-center text-xs font-bold text-cream shrink-0">
                {adminUser?.name?.slice(0, 1).toUpperCase() || "A"}
              </div>
              <div className="min-w-0">
                <span className="block text-xs font-bold text-cream truncate">{adminUser?.name || "Admin"}</span>
                <span className="block text-[10px] text-cream/40 uppercase font-black tracking-wider truncate">{adminUser?.role || "Editor"}</span>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-xl border border-cream/10 bg-cream/[0.02] text-xs font-black text-cream/60 hover:text-cream hover:border-cream/20 hover:bg-cream/[0.04] transition-all duration-300 cursor-pointer focus:outline-none"
            >
              <LogOut size={14} />
              Sign out
            </button>
          </div>
        </aside>

        {/* Top bar for Mobile */}
        <header className="lg:hidden border-b border-cream/[0.08] bg-forest/80 backdrop-blur-md sticky top-0 z-20 px-4 py-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative h-8 w-8 overflow-hidden rounded-lg bg-gold/10 flex items-center justify-center border border-gold/20">
                <Image src="/images/logo.png" alt="Logo" width={22} height={22} className="object-contain" style={{ width: "auto", height: "auto" }} />
              </div>
              <div>
                <span className="block text-[10px] font-black uppercase tracking-[0.12em] text-gold">CMS Panel</span>
                <strong className="block text-xs font-black text-cream">Nutrition Hub</strong>
              </div>
            </div>
            <button
              onClick={handleSignOut}
              className="inline-flex items-center gap-1.5 text-xs font-black text-cream/60 hover:text-cream cursor-pointer focus:outline-none"
            >
              <LogOut size={13} />
              Sign out
            </button>
          </div>
          {/* Horizontal Scrollable Tabs */}
          <div className="flex gap-2 overflow-x-auto overscroll-none scrollbar-thin pb-1">
            {([
              ["products", Boxes, "Products"],
              ["orders", ClipboardList, "Orders"],
              ["customers", UserRound, "Customers"],
              ["analytics", BarChart3, "Analytics"],
              ["coupons", Percent, "Coupons"],
              ["audit", History, "Audit"],
              ["hero", Sparkles, "Hero"],
              ...(adminUser?.role === "owner" ? ([["users", Users, "Users"]] as const) : []),
            ] as const).map(([tab, Icon, label]) => {
              const active = activeTab === tab;
              return (
                <button
                  key={tab}
                  onClick={() => setActiveTab(tab)}
                  className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-black shrink-0 transition-all ${
                    active
                      ? "bg-gold text-ink"
                      : "text-cream/60 bg-cream/[0.03] hover:text-cream"
                  }`}
                >
                  <Icon size={14} />
                  {label}
                  {tab === "orders" && pendingOrdersCount > 0 && (
                    <span className={`ml-1 flex h-4 items-center justify-center rounded-full px-1.5 text-[9px] font-black ${active ? "bg-ink text-gold" : "bg-gold/20 text-gold"}`}>
                      {pendingOrdersCount}
                    </span>
                  )}
                  {tab === "customers" && newCustomersCount > 0 && (
                    <span className={`ml-1 flex h-4 items-center justify-center rounded-full px-1.5 text-[9px] font-black ${active ? "bg-ink text-gold" : "bg-gold/20 text-gold"}`}>
                      {newCustomersCount}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 min-h-0 p-4 sm:p-6 lg:p-8 overflow-y-auto overscroll-none max-w-full z-10 scrollbar-thin">
          <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-cream">
                {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)} Dashboard
              </h1>
              <p className="mt-1 text-xs sm:text-sm text-cream/50">
                {activeTab === "products" && "Manage catalog data, inventory, publishing status, and storefront product metadata."}
                {activeTab === "orders" && "Track customer purchases, update fulfillment status, and inspect order details."}
                {activeTab === "customers" && "Browse registered customers, their order history, lifetime spend, and delivery status."}
                {activeTab === "analytics" && "Review sales, stock health, and performance snapshot metrics."}
                {activeTab === "coupons" && "Create discount codes, control limits, and track coupon usage."}
                {activeTab === "audit" && "Inspect security logs and administrative action history."}
                {activeTab === "users" && "Manage administration access levels and roles."}
                {activeTab === "hero" && "Edit the homepage hero description and the 3 floating product cards."}
              </p>
            </div>
            
            {activeTab === "products" && (
              <div className="flex flex-wrap gap-2.5 shrink-0">
                <button
                  onClick={() => setShowCategoryForm(true)}
                  className="btn-secondary min-h-10 text-xs sm:text-sm py-2 px-4 rounded-xl"
                >
                  <Plus size={15} />
                  New category
                </button>
                <button
                  onClick={startNewProduct}
                  disabled={categories.length === 0}
                  className="btn-primary min-h-10 text-xs sm:text-sm py-2 px-4 rounded-xl disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <Plus size={16} />
                  Add product
                </button>
              </div>
            )}
            {activeTab === "coupons" && (
              <button
                onClick={() => setEditingCoupon({ ...EMPTY_COUPON })}
                className="btn-primary min-h-10 text-xs sm:text-sm py-2 px-4 rounded-xl"
              >
                <Plus size={16} />
                New coupon
              </button>
            )}
          </div>

          {error && (
            <Alert tone="error" onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {notice && (
            <Alert tone="success" onClose={() => setNotice("")}>
              {notice}
            </Alert>
          )}

          {activeTab === "products" && (
            <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
              <StatCard icon={Boxes} label="Total products" value={stats.total} />
              <StatCard icon={PackageCheck} label="Published" value={stats.published} />
              <StatCard icon={AlertTriangle} label="Low stock" value={stats.lowStock} />
              <StatCard icon={ShieldCheck} label="Out of stock" value={stats.outOfStock} />
            </div>
          )}

          {activeTab === "products" && (
            <ProductsSection
              loading={loading}
              products={products}
              categories={categories}
              filteredProducts={filteredProducts}
              query={query}
              statusFilter={statusFilter}
              categoryFilter={categoryFilter}
              setQuery={setQuery}
              setStatusFilter={setStatusFilter}
              setCategoryFilter={setCategoryFilter}
              setEditing={setEditing}
              setDeleteTarget={setDeleteTarget}
            />
          )}

          {activeTab === "orders" && <OrdersSection orders={orders} saving={saving} onStatusChange={handleOrderStatus} />}
          {activeTab === "customers" && <CustomersSection customers={customers} loading={loading} />}
          {activeTab === "analytics" && <AnalyticsSection stats={adminStats} products={products} orders={orders} />}
          {activeTab === "coupons" && (
            <CouponsSection
              coupons={coupons}
              saving={saving}
              onEdit={(coupon) => setEditingCoupon(couponToForm(coupon))}
              onDelete={handleCouponDelete}
            />
          )}
          {activeTab === "audit" && <AuditSection logs={auditLogs} />}
          {activeTab === "users" && <UsersSection users={adminUsers} saving={saving} onRoleChange={handleUserRole} />}
          {activeTab === "hero" && (
            <HeroSection
              settings={heroSettings}
              products={products}
              saving={saving}
              onSave={handleHeroSave}
            />
          )}
        </main>
      </div>

      {editing && (
        <ProductModal
          categories={categories}
          editing={editing}
          saving={saving}
          uploading={uploading}
          setEditing={setEditing}
          onImageUpload={handleImageUpload}
          onGalleryUpload={handleGalleryUpload}
          onSubmit={handleSave}
          onClose={() => setEditing(null)}
        />
      )}

      {showCategoryForm && (
        <Modal title="New category" onClose={() => setShowCategoryForm(false)}>
          <form onSubmit={handleCreateCategory} className="space-y-4">
            <Field
              label="Name"
              value={newCategory.name}
              onChange={(value) => setNewCategory({ name: value, slug: slugify(value) })}
            />
            <Field
              label="Slug"
              value={newCategory.slug}
              onChange={(value) => setNewCategory({ ...newCategory, slug: slugify(value) })}
            />
            <ModalActions saving={saving} submitLabel="Create category" onCancel={() => setShowCategoryForm(false)} />
          </form>
        </Modal>
      )}

      {editingCoupon && (
        <CouponModal
          coupon={editingCoupon}
          saving={saving}
          setCoupon={setEditingCoupon}
          onSubmit={handleCouponSave}
          onClose={() => setEditingCoupon(null)}
        />
      )}

      {deleteTarget && (
        <Modal title="Delete product" onClose={() => setDeleteTarget(null)} maxWidth="max-w-md">
          <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-400">
            This permanently deletes <strong>{deleteTarget.name}</strong>. Orders that reference this product may lose catalog context.
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-xl bg-red-600 hover:bg-red-700 px-4 text-sm font-black text-white disabled:opacity-50 transition-colors"
            >
              Delete product
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              className="btn-secondary min-h-11 text-sm rounded-xl py-2 flex-1"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function ProductsSection({
  loading,
  products,
  categories,
  filteredProducts,
  query,
  statusFilter,
  categoryFilter,
  setQuery,
  setStatusFilter,
  setCategoryFilter,
  setEditing,
  setDeleteTarget,
}: {
  loading: boolean;
  products: Product[];
  categories: Category[];
  filteredProducts: Product[];
  query: string;
  statusFilter: StatusFilter;
  categoryFilter: string;
  setQuery: (value: string) => void;
  setStatusFilter: (value: StatusFilter) => void;
  setCategoryFilter: (value: string) => void;
  setEditing: (value: FormState) => void;
  setDeleteTarget: (value: Product) => void;
}) {
  return (
    <div className="premium-card overflow-hidden">
      <div className="border-b border-cream/[0.08] p-5">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
          <div>
            <h2 className="text-lg font-black text-cream">Product Catalog</h2>
            <p className="text-xs text-cream/40 mt-0.5">
              {loading ? "Loading products..." : `${filteredProducts.length} of ${products.length} products shown`}
            </p>
          </div>
          <div className="grid gap-2.5 md:grid-cols-[minmax(240px,1fr)_180px_220px]">
            <label className="relative block">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, SKU, slug..."
                className="h-11 w-full rounded-xl border border-cream/[0.12] bg-forest/60 pl-10 pr-4 text-xs font-semibold text-cream outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
              />
            </label>
            <Select value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)} icon={Filter}>
              <option value="all">All Statuses</option>
              <option value="published">Published</option>
              <option value="draft">Draft</option>
              <option value="archived">Archived</option>
            </Select>
            <Select value={categoryFilter} onChange={setCategoryFilter} icon={Filter}>
              <option value="all">All Categories</option>
              {categories.map((category) => (
                <option value={category.id} key={category.id}>
                  {category.name}
                </option>
              ))}
            </Select>
          </div>
        </div>
      </div>

      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-cream/[0.06]">
        {filteredProducts.map((product) => (
          <div key={product.id} className="flex items-start gap-3 p-4">
            <ProductThumb product={product} />
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2">
                <strong className="text-sm font-bold text-cream line-clamp-1">{product.name}</strong>
                <span className={`shrink-0 inline-flex items-center rounded-full border px-2 py-0.5 text-[9px] font-black capitalize tracking-wider ${statusStyles[product.status]}`}>
                  {product.status}
                </span>
              </div>
              <div className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cream/50">
                <span className="font-black text-cream">Tk {Number(product.price).toLocaleString("en-BD")}</span>
                <span>Stock: <span className={`font-black ${product.stock === 0 ? "text-red-400" : product.stock < 10 ? "text-amber-400" : "text-cream/70"}`}>{product.stock}</span></span>
                <span>{product.category?.name || "Unassigned"}</span>
              </div>
              <div className="mt-1.5 flex items-center gap-2">
                <span className="inline-block text-[8px] font-black tracking-wider text-gold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/15 font-mono">{product.sku}</span>
              </div>
              <div className="mt-2.5 flex gap-2">
                <Link
                  href={`/products/${product.slug}`}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cream/[0.12] bg-cream/[0.02] text-cream/60 transition-all"
                >
                  <Eye size={13} />
                </Link>
                <button
                  onClick={() => setEditing(productToForm(product))}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gold text-ink transition-all"
                >
                  <Edit3 size={13} />
                </button>
                <button
                  onClick={() => setDeleteTarget(product)}
                  className="inline-flex h-8 w-8 items-center justify-center rounded-lg border border-red-500/20 bg-red-500/5 text-red-400 transition-all"
                >
                  <Trash2 size={13} />
                </button>
              </div>
            </div>
          </div>
        ))}
        {!loading && filteredProducts.length === 0 && (
          <div className="px-5 py-16 text-center text-xs font-bold text-cream/30">
            No products match the current filters.
          </div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[880px] border-collapse text-left">
          <thead>
            <tr className="border-b border-cream/[0.08] bg-forest/40 text-[10px] uppercase tracking-wider font-black text-cream/40">
              <th className="w-[30%] pl-6 pr-4 py-3.5 text-left">Product</th>
              <th className="w-[15%] px-4 py-3.5">
                <div className="flex justify-center">Category</div>
              </th>
              <th className="w-[15%] px-4 py-3.5">
                <div className="flex justify-center">Price</div>
              </th>
              <th className="w-[12%] px-4 py-3.5">
                <div className="flex justify-center">Stock</div>
              </th>
              <th className="w-[13%] px-4 py-3.5">
                <div className="flex justify-center">Status</div>
              </th>
              <th className="w-[15%] pl-4 pr-6 py-3.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {filteredProducts.map((product) => (
              <tr className="border-b border-cream/[0.04] align-middle hover:bg-cream/[0.02] transition-colors duration-150" key={product.id}>
                <td className="pl-6 pr-4 py-4 !text-left">
                  <div className="flex items-center gap-3.5">
                    <ProductThumb product={product} />
                    <div className="min-w-0">
                      <strong className="block max-w-[340px] truncate text-sm text-cream font-bold">{product.name}</strong>
                      <span className="block max-w-[400px] truncate text-xs text-cream/40 mt-0.5">{product.description}</span>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="inline-block text-[9px] font-black tracking-wider text-gold bg-gold/10 px-1.5 py-0.5 rounded border border-gold/15 font-mono">{product.sku}</span>
                        <span className="text-[10px] font-black text-cream/30">/{product.slug}</span>
                      </div>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4 text-xs font-bold text-cream/70">
                  <div className="flex justify-center">
                    {product.category?.name || "Unassigned"}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex flex-col items-center justify-center">
                    <span className="text-sm font-black text-cream">Tk {Number(product.price).toLocaleString("en-BD")}</span>
                    {product.compare_at_price && (
                      <span className="text-xs text-cream/35 line-through mt-0.5">
                        Tk {Number(product.compare_at_price).toLocaleString("en-BD")}
                      </span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-center">
                    <span className={`text-xs font-black inline-block ${product.stock === 0 ? "text-red-400 bg-red-500/10 px-2 py-0.5 rounded-md" : product.stock < 10 ? "text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md animate-pulse" : "text-cream"}`}>
                      {product.stock}
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex justify-center">
                    <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black capitalize tracking-wider ${statusStyles[product.status]}`}>
                      {product.status}
                    </span>
                  </div>
                </td>
                <td className="pl-4 pr-6 py-4 text-right">
                  <div className="flex justify-end gap-2">
                    <Link
                      href={`/products/${product.slug}`}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cream/[0.12] bg-cream/[0.02] text-cream/60 hover:text-cream hover:border-cream/30 hover:bg-cream/[0.05] transition-all duration-200"
                      title="Preview"
                    >
                      <Eye size={15} />
                    </Link>
                    <button
                      onClick={() => setEditing(productToForm(product))}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-gold text-ink hover:opacity-90 shadow-[0_0_15px_rgba(96,165,250,0.2)] hover:scale-105 transition-all duration-200"
                      title="Edit"
                    >
                      <Edit3 size={15} />
                    </button>
                    <button
                      onClick={() => setDeleteTarget(product)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 text-red-400 hover:bg-red-500/10 hover:border-red-500/30 transition-all duration-200"
                      title="Delete"
                    >
                      <Trash2 size={15} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredProducts.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-xs font-bold text-cream/30">
                  No products match the current filters.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function productToForm(product: Product): FormState {
  const { category, ...form } = product;
  void category;
  return { ...form, gallery: (product as any).gallery ?? null };
}

function couponToForm(coupon: Coupon): CouponForm {
  const { id, usage_count, created_at, ...form } = coupon;
  void usage_count;
  void created_at;
  return { id, ...form };
}

function CouponsSection({
  coupons,
  saving,
  onEdit,
  onDelete,
}: {
  coupons: Coupon[];
  saving: boolean;
  onEdit: (coupon: Coupon) => void;
  onDelete: (couponId: string) => void;
}) {
  return (
    <div className="premium-card overflow-hidden">
      <div className="border-b border-cream/[0.08] p-5">
        <h2 className="text-lg font-black text-cream">Discount Coupons</h2>
        <p className="mt-0.5 text-xs text-cream/40">{coupons.length} coupon(s) configured</p>
      </div>
      <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
        {coupons.map((coupon) => {
          const value = coupon.discount_type === "percent" ? `${Number(coupon.value)}%` : `Tk ${Number(coupon.value).toLocaleString("en-BD")}`;
          return (
            <article key={coupon.id} className="rounded-2xl border border-cream/[0.08] bg-cream/[0.025] p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <strong className="block font-mono text-lg font-black tracking-wider text-gold">{coupon.code}</strong>
                  <p className="mt-1 line-clamp-2 text-xs text-cream/45">{coupon.description || "No description"}</p>
                </div>
                <span className={`rounded-full border px-2.5 py-1 text-[10px] font-black ${coupon.active ? "border-emerald-500/20 bg-emerald-500/10 text-emerald-400" : "border-slate-500/20 bg-slate-500/10 text-slate-400"}`}>
                  {coupon.active ? "Active" : "Inactive"}
                </span>
              </div>
              <div className="mt-5 grid grid-cols-3 gap-2 text-xs">
                <Metric label="Discount" value={value} />
                <Metric label="Min order" value={`Tk ${Number(coupon.min_order_amount).toLocaleString("en-BD")}`} />
                <Metric label="Used" value={`${coupon.usage_count}${coupon.usage_limit ? `/${coupon.usage_limit}` : ""}`} />
              </div>
              <div className="mt-5 flex gap-2 border-t border-cream/[0.06] pt-4">
                <button onClick={() => onEdit(coupon)} className="btn-secondary min-h-10 flex-1 rounded-xl py-2 text-xs">
                  <Edit3 size={14} />
                  Edit
                </button>
                <button
                  onClick={() => onDelete(coupon.id)}
                  disabled={saving}
                  className="inline-flex min-h-10 items-center justify-center rounded-xl border border-red-500/20 bg-red-500/5 px-4 text-xs font-black text-red-400 transition hover:bg-red-500/10 disabled:opacity-40"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            </article>
          );
        })}
        {coupons.length === 0 && (
          <div className="rounded-2xl border border-dashed border-cream/[0.1] p-12 text-center text-sm font-bold text-cream/35 md:col-span-2 xl:col-span-3">
            No coupons yet. Create one to start offering discounts.
          </div>
        )}
      </div>
    </div>
  );
}

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  confirmed: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  shipped: "bg-purple-500/20 text-purple-400 border-purple-500/30",
  delivered: "bg-green-500/20 text-green-400 border-green-500/30",
  cancelled: "bg-red-500/20 text-red-400 border-red-500/30",
};

function OrdersSection({ orders, saving, onStatusChange }: { orders: Order[]; saving: boolean; onStatusChange: (id: string, status: OrderStatus) => void }) {
  const [expandedOrders, setExpandedOrders] = useState<Record<string, boolean>>({});

  const toggleOrder = (orderId: string) => {
    setExpandedOrders((prev) => ({
      ...prev,
      [orderId]: !prev[orderId],
    }));
  };

  return (
    <div className="premium-card overflow-hidden">
      <div className="border-b border-cream/[0.08] p-5">
        <h2 className="text-lg font-black text-cream">Order Management</h2>
        <p className="text-xs text-cream/40 mt-0.5">{orders.length} order(s) logged</p>
      </div>
      
      {/* Mobile Card Layout */}
      <div className="md:hidden divide-y divide-cream/[0.06]">
        {orders.map((order) => {
          const isExpanded = !!expandedOrders[order.id];
          const statusClass = statusColors[order.status] || "border-cream/20 bg-cream/10 text-cream/60";

          return (
            <div
              key={order.id}
              className="p-4 space-y-3 cursor-pointer hover:bg-cream/[0.01] transition-colors"
              onClick={() => toggleOrder(order.id)}
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <span className="text-cream/45">
                    {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </span>
                  <div>
                    <strong className="text-sm font-bold text-cream">#{order.id.slice(0, 8).toUpperCase()}</strong>
                    <span className="ml-2 text-[10px] font-black tracking-wider text-cream/35">{order.payment_method.toUpperCase()}</span>
                  </div>
                </div>
                <span className="text-xs font-semibold text-cream/40">
                  {order.created_at ? new Date(order.created_at).toLocaleDateString() : "Unknown"}
                </span>
              </div>

              <div className="flex justify-between items-start gap-4">
                <div>
                  <div className="flex items-center gap-2">
                    <strong className="text-sm text-cream font-bold">{order.customer_name}</strong>
                    {!order.user_id && (
                      <span className="inline-flex items-center rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[8px] font-black tracking-wider uppercase text-amber-400">
                        Guest
                      </span>
                    )}
                  </div>
                  <span className="block text-xs text-cream/50 mt-0.5">{order.phone}</span>
                </div>
                <div className="relative inline-block" onClick={(e) => e.stopPropagation()}>
                  <select
                    value={order.status}
                    disabled={saving}
                    onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                    className={`h-8 appearance-none rounded-lg border pl-2.5 pr-7 text-[10px] font-black uppercase tracking-wider outline-none transition-all duration-300 disabled:opacity-50 cursor-pointer ${statusClass}`}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                  <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-cream/40">
                    <svg className="h-3 w-3 fill-current" viewBox="0 0 20 20">
                      <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="flex justify-between items-center text-xs border-t border-cream/[0.04] pt-2.5">
                <span className="text-cream/50">{order.items.reduce((sum, item) => sum + item.quantity, 0)} item(s)</span>
                <span className="font-black text-gold">Tk {Number(order.total).toLocaleString("en-BD")}</span>
              </div>

              {/* Collapsible Mobile Details */}
              {isExpanded && (
                <div className="mt-4 pt-4 border-t border-dashed border-cream/[0.08] space-y-4" onClick={(e) => e.stopPropagation()}>
                  {/* Products List */}
                  <div className="space-y-2">
                    <h5 className="text-[10px] font-black uppercase tracking-wider text-gold/80">Items</h5>
                    <div className="divide-y divide-cream/[0.06] border border-cream/[0.06] rounded-xl bg-cream/[0.01] overflow-hidden">
                      {order.items.map((item, idx) => {
                        const imgUrl = productImage({ image_url: item.product_image_url || null });
                        const hasSlug = !!item.product_slug;

                        const ItemContent = (
                          <div className="flex items-center gap-3 p-3">
                            <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg border border-cream/[0.08] bg-cream/[0.02]">
                              <img
                                src={imgUrl}
                                alt={item.product_name || "Product"}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-cream truncate">
                                {item.product_name || `Product (${item.product_id.slice(0, 8)})`}
                              </p>
                              <p className="text-[10px] text-cream/40 mt-0.5">
                                Tk {Number(item.unit_price).toLocaleString()} × {item.quantity}
                              </p>
                            </div>
                            <span className="text-xs font-extrabold text-gold shrink-0">
                              Tk {(Number(item.unit_price) * item.quantity).toLocaleString()}
                            </span>
                          </div>
                        );

                        return hasSlug ? (
                          <Link
                            key={idx}
                            href={`/products/${item.product_slug}`}
                            target="_blank"
                            className="block group"
                          >
                            {ItemContent}
                          </Link>
                        ) : (
                          <div key={idx}>{ItemContent}</div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Delivery address & financial breakdown for mobile */}
                  <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.01] p-3 text-[11px] space-y-2 text-cream/70">
                    <div>
                      <span className="text-[9px] font-black uppercase tracking-wider text-cream/30 block">Address</span>
                      <p className="text-cream/80 mt-0.5 leading-normal whitespace-pre-wrap">{order.address}</p>
                    </div>
                    <div className="h-px bg-cream/[0.06] my-1" />
                    <div className="flex justify-between text-cream/50">
                      <span>Subtotal</span>
                      <span className="text-cream">Tk {Number(order.subtotal || 0).toLocaleString()}</span>
                    </div>
                    {order.coupon_code && (
                      <div className="flex justify-between text-cream/50">
                        <span>Discount ({order.coupon_code})</span>
                        <span className="text-red-400">- Tk {Number(order.discount_amount || 0).toLocaleString()}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-black text-cream pt-1 border-t border-cream/[0.04]">
                      <span className="text-gold">Total</span>
                      <span className="text-gold">Tk {Number(order.total).toLocaleString()}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
        {orders.length === 0 && (
          <div className="px-5 py-16 text-center text-xs font-bold text-cream/30">No orders logged yet.</div>
        )}
      </div>

      {/* Desktop Table Layout */}
      <div className="hidden md:block overflow-x-auto scrollbar-thin">
        <table className="w-full min-w-[980px] border-collapse text-left">
          <thead>
            <tr className="border-b border-cream/[0.08] bg-forest/40 text-[10px] uppercase tracking-wider font-black text-cream/40">
              <th className="w-[18%] pl-6 pr-4 py-3.5 text-left">Order</th>
              <th className="w-[28%] px-4 py-3.5 text-left">Customer</th>
              <th className="w-[12%] px-4 py-3.5">
                <div className="flex justify-center">Items</div>
              </th>
              <th className="w-[15%] px-4 py-3.5">
                <div className="flex justify-center">Total</div>
              </th>
              <th className="w-[13%] px-4 py-3.5">
                <div className="flex justify-center">Status</div>
              </th>
              <th className="w-[14%] pl-4 pr-6 py-3.5 text-right">Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => {
              const isExpanded = !!expandedOrders[order.id];
              const statusClass = statusColors[order.status] || "border-cream/20 bg-cream/10 text-cream/60";

              return (
                <Fragment key={order.id}>
                  <tr
                    className="border-b border-cream/[0.04] align-middle hover:bg-cream/[0.02] transition-colors duration-150 cursor-pointer select-none"
                    onClick={() => toggleOrder(order.id)}
                  >
                    <td className="pl-6 pr-4 py-4 !text-left">
                      <div className="flex items-center gap-2.5">
                        <span className="text-cream/40">
                          {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
                        </span>
                        <div>
                          <strong className="block text-sm text-cream font-bold">#{order.id.slice(0, 8).toUpperCase()}</strong>
                          <span className="text-[10px] font-black tracking-wider text-cream/35 mt-0.5">{order.payment_method.toUpperCase()}</span>
                        </div>
                      </div>
                    </td>
                    <td className="px-4 py-4 !text-left">
                      <div className="flex items-center gap-2">
                        <strong className="block text-sm text-cream font-bold">{order.customer_name}</strong>
                        {!order.user_id && (
                          <span className="inline-flex items-center rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[8px] font-black tracking-wider uppercase text-amber-400">
                            Guest
                          </span>
                        )}
                      </div>
                      <span className="block text-xs text-cream/50 mt-0.5">{order.phone}</span>
                      <span className="block max-w-[260px] truncate text-xs text-cream/30 mt-0.5">{order.address}</span>
                    </td>
                    <td className="px-4 py-4 text-xs font-bold text-cream/70">
                      <div className="flex justify-center">
                        {order.items.reduce((sum, item) => sum + item.quantity, 0)}
                      </div>
                    </td>
                    <td className="px-4 py-4 text-sm font-black text-cream">
                      <div className="flex justify-center">
                        Tk {Number(order.total).toLocaleString("en-BD")}
                      </div>
                    </td>
                    <td className="px-4 py-4" onClick={(e) => e.stopPropagation()}>
                      <div className="flex justify-center">
                        <div className="relative inline-block text-left">
                          <select
                            value={order.status}
                            disabled={saving}
                            onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                            className={`h-9 appearance-none rounded-xl border pl-3 pr-8 text-xs font-black uppercase tracking-wider outline-none focus:ring-4 focus:ring-gold/10 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${statusClass}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="shipped">Shipped</option>
                            <option value="delivered">Delivered</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                          <div className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-cream/40">
                            <svg className="h-3.5 w-3.5 fill-current" viewBox="0 0 20 20">
                              <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                            </svg>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="pl-4 pr-6 py-4 text-xs font-semibold text-cream/40 text-right">
                      {order.created_at ? new Date(order.created_at).toLocaleString() : "Unknown"}
                    </td>
                  </tr>

                  {/* Desktop Expanded Details Drawer */}
                  {isExpanded && (
                    <tr className="bg-cream/[0.015] border-b border-cream/[0.06] transition-all duration-300">
                      <td colSpan={6} className="p-6">
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 text-left" onClick={(e) => e.stopPropagation()}>
                          {/* Order Items List */}
                          <div className="lg:col-span-2 space-y-4">
                            <h4 className="text-xs font-black uppercase tracking-wider text-gold/80 mb-2">Order Items</h4>
                            <div className="divide-y divide-cream/[0.06] border border-cream/[0.06] rounded-xl bg-cream/[0.01] overflow-hidden">
                              {order.items.map((item, idx) => {
                                const imgUrl = productImage({ image_url: item.product_image_url || null });
                                const hasSlug = !!item.product_slug;

                                const ItemContent = (
                                  <div className="flex items-center gap-4 p-4 hover:bg-cream/[0.02] transition duration-150">
                                    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg border border-cream/[0.08] bg-cream/[0.02]">
                                      <img
                                        src={imgUrl}
                                        alt={item.product_name || "Product"}
                                        className="h-full w-full object-cover"
                                      />
                                    </div>
                                    <div className="flex-1 min-w-0">
                                      <p className="text-sm font-extrabold text-cream truncate">
                                        {item.product_name || `Product (${item.product_id.slice(0, 8)})`}
                                      </p>
                                      <p className="mt-0.5 text-xs text-cream/40">
                                        SKU/ID: {item.product_id}
                                      </p>
                                    </div>
                                    <div className="text-right shrink-0">
                                      <p className="text-sm font-black text-cream">
                                        Tk {Number(item.unit_price).toLocaleString()} × {item.quantity}
                                      </p>
                                      <p className="mt-0.5 text-xs text-gold font-bold">
                                        Tk {(Number(item.unit_price) * item.quantity).toLocaleString()}
                                      </p>
                                    </div>
                                  </div>
                                );

                                return hasSlug ? (
                                  <Link
                                    key={idx}
                                    href={`/products/${item.product_slug}`}
                                    target="_blank"
                                    className="block group"
                                  >
                                    {ItemContent}
                                  </Link>
                                ) : (
                                  <div key={idx}>{ItemContent}</div>
                                );
                              })}
                            </div>
                          </div>

                          {/* Customer & Shipping Summary */}
                          <div className="space-y-6">
                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-gold/80 mb-2.5">Shipping Details</h4>
                              <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.01] p-4 text-xs space-y-2.5 text-cream/70">
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-cream/30 block mb-0.5">Recipient Name</span>
                                  <div className="flex items-center gap-2">
                                    <p className="text-sm font-extrabold text-cream">{order.customer_name}</p>
                                    {!order.user_id && (
                                      <span className="inline-flex items-center rounded bg-amber-500/10 border border-amber-500/20 px-1.5 py-0.5 text-[8px] font-black tracking-wider uppercase text-amber-400">
                                        Guest
                                      </span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-cream/30 block mb-0.5">Phone Number</span>
                                  <a
                                    href={`tel:${order.phone}`}
                                    className="text-sm font-extrabold text-gold hover:underline"
                                  >
                                    {order.phone}
                                  </a>
                                </div>
                                <div>
                                  <span className="text-[10px] font-black uppercase tracking-wider text-cream/30 block mb-0.5">Delivery Address</span>
                                  <p className="leading-relaxed text-cream/80 whitespace-pre-wrap">{order.address}</p>
                                </div>
                              </div>
                            </div>

                            <div>
                              <h4 className="text-xs font-black uppercase tracking-wider text-gold/80 mb-2.5">Payment Details</h4>
                              <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.01] p-4 text-xs space-y-2">
                                <div className="flex justify-between items-center text-cream/60">
                                  <span>Subtotal</span>
                                  <span className="font-bold text-cream">Tk {Number(order.subtotal || 0).toLocaleString()}</span>
                                </div>
                                {order.coupon_code && (
                                  <div className="flex justify-between items-center text-cream/60">
                                    <span>Coupon ({order.coupon_code})</span>
                                    <span className="font-bold text-red-400">- Tk {Number(order.discount_amount || 0).toLocaleString()}</span>
                                  </div>
                                )}
                                <div className="h-px bg-cream/[0.06] my-2" />
                                <div className="flex justify-between items-center">
                                  <span className="font-bold text-cream">Grand Total</span>
                                  <span className="text-sm font-black text-gold">Tk {Number(order.total).toLocaleString()}</span>
                                </div>
                                <div className="flex justify-between items-center text-cream/60 pt-1">
                                  <span>Payment Method</span>
                                  <span className="font-black text-cream uppercase text-[10px] tracking-wider bg-cream/[0.06] px-2 py-0.5 rounded">
                                    {order.payment_method}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      </td>
                    </tr>
                  )}
                </Fragment>
              );
            })}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-5 py-16 text-center text-xs font-bold text-cream/30">No orders logged yet.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function AnalyticsSection({ stats, products, orders }: { stats: AdminStats | null; products: Product[]; orders: Order[] }) {
  const avgOrder = orders.length ? orders.reduce((sum, order) => sum + Number(order.total), 0) / orders.length : 0;
  return (
    <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
      <div className="premium-card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-black text-cream">Business Snapshot</h2>
        <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4">
          <Metric label="Revenue" value={`Tk ${Number(stats?.revenue || 0).toLocaleString("en-BD")}`} />
          <Metric label="Orders" value={String(stats?.orders || 0)} />
          <Metric label="Pending orders" value={String(stats?.pending_orders || 0)} />
          <Metric label="Average order" value={`Tk ${Math.round(avgOrder).toLocaleString("en-BD")}`} />
        </div>
      </div>
      <div className="premium-card p-4 sm:p-6">
        <h2 className="text-base sm:text-lg font-black text-cream">Inventory Health</h2>
        <div className="mt-4 sm:mt-6 grid grid-cols-2 gap-3 sm:gap-4">
          <Metric label="Products" value={String(stats?.products || products.length)} />
          <Metric label="Published" value={String(stats?.published_products || 0)} />
          <Metric label="Low stock" value={String(stats?.low_stock_products || 0)} />
          <Metric label="Out of stock" value={String(products.filter((p) => p.stock === 0).length)} />
        </div>
      </div>
    </div>
  );
}

function AuditSection({ logs }: { logs: AuditLog[] }) {
  return (
    <div className="premium-card overflow-hidden">
      <div className="border-b border-cream/[0.08] p-5">
        <h2 className="text-lg font-black text-cream">Audit Log</h2>
        <p className="text-xs text-cream/40 mt-0.5">Recent CMS-sensitive actions</p>
      </div>
      <div className="divide-y divide-cream/[0.04]">
        {logs.map((log) => (
          <div key={log.id} className="grid gap-3 p-5 md:grid-cols-[180px_1fr_220px] hover:bg-cream/[0.01] transition-colors duration-150">
            <span className="text-xs font-black uppercase tracking-wider text-gold/80">{log.action}</span>
            <div>
              <p className="text-sm font-bold text-cream">{log.summary}</p>
              <p className="text-xs text-cream/40 mt-1">{log.actor_email || "System"} · {log.entity_type}</p>
            </div>
            <span className="text-xs font-semibold text-cream/35 md:text-right">{new Date(log.created_at).toLocaleString()}</span>
          </div>
        ))}
        {logs.length === 0 && <div className="p-16 text-center text-xs font-bold text-cream/30">No audit events logged yet.</div>}
      </div>
    </div>
  );
}

function UsersSection({ users, saving, onRoleChange }: { users: AdminUser[]; saving: boolean; onRoleChange: (id: string, role: string) => void }) {
  return (
    <div className="premium-card overflow-hidden">
      <div className="border-b border-cream/[0.08] p-5">
        <h2 className="text-lg font-black text-cream">Admin Users</h2>
        <p className="text-xs text-cream/40 mt-0.5">Owner-only role management</p>
      </div>
      <div className="divide-y divide-cream/[0.04]">
        {users.map((adminUser) => (
          <div key={adminUser.id} className="grid items-center gap-4 p-5 md:grid-cols-[1fr_220px_180px] hover:bg-cream/[0.01] transition-colors duration-150">
            <div>
              <strong className="block text-sm text-cream font-bold">{adminUser.name}</strong>
              <span className="text-xs text-cream/45 mt-0.5">{adminUser.email}</span>
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-gold">
              CMS access
            </span>
            <div className="relative">
              <select
                value={adminUser.role}
                disabled={saving}
                onChange={(e) => onRoleChange(adminUser.id, e.target.value)}
                className="h-10 w-full appearance-none rounded-xl border border-cream/[0.12] bg-forest/60 px-3.5 pr-8 text-xs font-bold text-cream outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/10 transition-all duration-300 cursor-pointer"
              >
                <option value="editor">Editor</option>
                <option value="admin">Admin</option>
                <option value="owner">Owner</option>
              </select>
              <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/40">
                <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                  <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                </svg>
              </div>
            </div>
          </div>
        ))}
        {users.length === 0 && <div className="p-16 text-center text-xs font-bold text-cream/30">No admin users found.</div>}
      </div>
    </div>
  );
}

function CustomersSection({
  customers,
  loading,
}: {
  customers: Customer[];
  loading: boolean;
}) {
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState<Customer | null>(null);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      `${c.name} ${c.email} ${c.phone || ""}`.toLowerCase().includes(q)
    );
  }, [customers, query]);

  const totals = useMemo(() => {
    return customers.reduce(
      (acc, c) => {
        acc.orders += c.order_count;
        acc.spent += Number(c.total_spent);
        acc.pending += c.pending_count;
        if (c.order_count > 0) acc.active += 1;
        return acc;
      },
      { orders: 0, spent: 0, pending: 0, active: 0 }
    );
  }, [customers]);

  return (
    <>
      <div className="mb-8 grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <StatCard icon={UserRound} label="Total customers" value={customers.length} />
        <StatCard icon={ShoppingBag} label="Customers w/ orders" value={totals.active} />
        <StatCard icon={ClipboardList} label="Total orders" value={totals.orders} />
        <StatCard icon={AlertTriangle} label="Pending orders" value={totals.pending} />
      </div>

      <div className="premium-card overflow-hidden">
        <div className="border-b border-cream/[0.08] p-5">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div>
              <h2 className="text-lg font-black text-cream">Customer Directory</h2>
              <p className="text-xs text-cream/40 mt-0.5">
                {loading
                  ? "Loading customers..."
                  : `${filtered.length} of ${customers.length} customer(s) shown`}
              </p>
            </div>
            <label className="relative block w-full max-w-xs">
              <Search size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/40" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, email, phone..."
                className="h-11 w-full rounded-xl border border-cream/[0.12] bg-forest/60 pl-10 pr-4 text-xs font-semibold text-cream outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
              />
            </label>
          </div>
        </div>

        {/* Mobile Card Layout */}
        <div className="md:hidden divide-y divide-cream/[0.06]">
          {filtered.map((c) => (
            <div key={c.id} className="flex items-start gap-3 p-4">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-cream/[0.06] border border-cream/[0.08]">
                {resolveMediaUrl(c.photo_url) ? (
                  <Image src={resolveMediaUrl(c.photo_url)!} alt={c.name} fill className="object-cover" sizes="40px" />
                ) : (
                  <span className="absolute inset-0 grid place-items-center text-[10px] font-black text-cream/60">
                    {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <strong className="text-sm font-bold text-cream truncate">{c.name}</strong>
                  <button
                    onClick={() => setSelected(c)}
                    className="shrink-0 inline-flex h-8 w-8 items-center justify-center rounded-lg border border-cream/[0.12] bg-cream/[0.02] text-cream/60 transition-all"
                  >
                    <Eye size={13} />
                  </button>
                </div>
                <span className="block text-xs text-cream/40 truncate">{c.email}</span>
                <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-cream/50">
                  <span>Orders: <span className="font-black text-cream">{c.order_count}</span></span>
                  <span>Spent: <span className="font-black text-gold">Tk {Number(c.total_spent).toLocaleString("en-BD")}</span></span>
                  {c.pending_count > 0 && (
                    <span className="font-black text-amber-400">Pending: {c.pending_count}</span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {!loading && filtered.length === 0 && (
            <div className="px-5 py-16 text-center text-xs font-bold text-cream/30">
              No customers match the current search.
            </div>
          )}
        </div>

        {/* Desktop Table Layout */}
        <div className="hidden md:block overflow-x-auto overscroll-none scrollbar-thin">
          <table className="w-full min-w-[920px] border-collapse text-left">
            <thead>
              <tr className="border-b border-cream/[0.08] bg-forest/40 text-[10px] uppercase tracking-wider font-black text-cream/40">
                <th className="w-[28%] pl-6 pr-4 py-3.5 text-left">Customer</th>
                <th className="w-[18%] px-4 py-3.5 text-left">Contact</th>
                <th className="w-[10%] px-4 py-3.5">
                  <div className="flex justify-center">Orders</div>
                </th>
                <th className="w-[14%] px-4 py-3.5">
                  <div className="flex justify-center">Total spent</div>
                </th>
                <th className="w-[12%] px-4 py-3.5">
                  <div className="flex justify-center">Pending</div>
                </th>
                <th className="w-[12%] px-4 py-3.5">
                  <div className="flex justify-center">Last order</div>
                </th>
                <th className="w-[6%] pl-4 pr-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => (
                <tr
                  key={c.id}
                  className="border-b border-cream/[0.04] align-middle hover:bg-cream/[0.02] transition-colors duration-150"
                >
                  <td className="pl-6 pr-4 py-4 !text-left">
                    <div className="flex items-center gap-3.5">
                      <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full bg-cream/[0.06] border border-cream/[0.08]">
                        {resolveMediaUrl(c.photo_url) ? (
                          <Image src={resolveMediaUrl(c.photo_url)!} alt={c.name} fill className="object-cover" sizes="44px" />
                        ) : (
                          <span className="absolute inset-0 grid place-items-center text-xs font-black text-cream/60">
                            {c.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0">
                        <strong className="block max-w-[280px] truncate text-sm text-cream font-bold">{c.name}</strong>
                        <span className="block max-w-[280px] truncate text-xs text-cream/40 mt-0.5">
                          via {c.auth_provider} · joined {new Date(c.created_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-4 !text-left">
                    <div className="flex items-center gap-1.5 text-xs text-cream/70">
                      <Mail size={12} className="text-cream/40 shrink-0" />
                      <span className="truncate max-w-[200px]">{c.email}</span>
                    </div>
                    {c.phone && (
                      <div className="flex items-center gap-1.5 text-xs text-cream/50 mt-1">
                        <Phone size={11} className="text-cream/30 shrink-0" />
                        <span>{c.phone}</span>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <span className="text-sm font-black text-cream">{c.order_count}</span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      <span className="text-sm font-black text-gold">
                        Tk {Number(c.total_spent).toLocaleString("en-BD")}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center">
                      {c.pending_count > 0 ? (
                        <span className="text-xs font-black text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md">
                          {c.pending_count}
                        </span>
                      ) : (
                        <span className="text-xs font-bold text-cream/30">—</span>
                      )}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex justify-center text-xs font-semibold text-cream/50">
                      {c.last_order_at ? new Date(c.last_order_at).toLocaleDateString() : "—"}
                    </div>
                  </td>
                  <td className="pl-4 pr-6 py-4 text-right">
                    <button
                      onClick={() => setSelected(c)}
                      className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-cream/[0.12] bg-cream/[0.02] text-cream/60 hover:text-cream hover:border-cream/30 hover:bg-cream/[0.05] transition-all duration-200"
                      title="View orders"
                    >
                      <Eye size={15} />
                    </button>
                  </td>
                </tr>
              ))}
              {!loading && filtered.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-5 py-16 text-center text-xs font-bold text-cream/30">
                    No customers match the current search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {selected && <CustomerDetailModal customer={selected} onClose={() => setSelected(null)} />}
    </>
  );
}

function CustomerDetailModal({ customer, onClose }: { customer: Customer; onClose: () => void }) {
  const statusTone: Record<string, string> = {
    pending: "border-amber-500/20 bg-amber-500/10 text-amber-400",
    confirmed: "border-sky-500/20 bg-sky-500/10 text-sky-400",
    shipped: "border-violet-500/20 bg-violet-500/10 text-violet-400",
    delivered: "border-emerald-500/20 bg-emerald-500/10 text-emerald-400",
    cancelled: "border-red-500/20 bg-red-500/10 text-red-400",
  };

  return (
    <Modal title={`Customer · ${customer.name}`} onClose={onClose} maxWidth="max-w-3xl">
      <div className="space-y-5">
        <div className="grid gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.02] p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-cream/40 mb-1">
              <Mail size={11} /> Email
            </div>
            <p className="text-xs font-bold text-cream break-all">{customer.email}</p>
          </div>
          <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.02] p-3.5">
            <div className="flex items-center gap-1.5 text-[10px] font-black uppercase tracking-wider text-cream/40 mb-1">
              <Phone size={11} /> Phone
            </div>
            <p className="text-xs font-bold text-cream">{customer.phone || "Not provided"}</p>
          </div>
          {customer.address && (
            <div className="sm:col-span-2 rounded-xl border border-cream/[0.06] bg-cream/[0.02] p-3.5">
              <div className="text-[10px] font-black uppercase tracking-wider text-cream/40 mb-1">Default address</div>
              <p className="text-xs font-bold text-cream/80 leading-relaxed">{customer.address}</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          <Metric label="Orders" value={String(customer.order_count)} />
          <Metric label="Total spent" value={`Tk ${Number(customer.total_spent).toLocaleString("en-BD")}`} />
          <Metric label="Pending" value={String(customer.pending_count)} />
          <Metric label="Delivered" value={String(customer.delivered_count)} />
        </div>

        <div>
          <h4 className="text-xs font-black uppercase tracking-wider text-cream/50 mb-3">Order history</h4>
          {customer.orders.length === 0 ? (
            <div className="rounded-xl border border-cream/[0.06] bg-cream/[0.02] p-8 text-center text-xs font-bold text-cream/30">
              This customer hasn&apos;t placed any orders yet.
            </div>
          ) : (
            <div className="space-y-2.5 max-h-[360px] overflow-y-auto overscroll-none scrollbar-thin pr-1">
              {customer.orders.map((order) => (
                <div
                  key={order.id}
                  className="rounded-xl border border-cream/[0.06] bg-cream/[0.02] p-4"
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                    <div>
                      <strong className="text-sm font-black text-cream">#{order.id.slice(0, 8)}</strong>
                      <span className="ml-2 text-[10px] font-black uppercase tracking-wider text-cream/40">
                        {order.payment_method}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black capitalize tracking-wider ${
                        statusTone[order.status] || "border-cream/10 bg-cream/[0.04] text-cream/60"
                      }`}
                    >
                      {order.status}
                    </span>
                  </div>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-cream/60">
                    <span>
                      {order.items.reduce((sum, it) => sum + it.quantity, 0)} item
                      {order.items.reduce((sum, it) => sum + it.quantity, 0) === 1 ? "" : "s"}
                    </span>
                    <span className="font-black text-gold">
                      Tk {Number(order.total).toLocaleString("en-BD")}
                    </span>
                    <span className="text-cream/35">
                      {order.created_at ? new Date(order.created_at).toLocaleString() : ""}
                    </span>
                  </div>
                  {order.address && (
                    <p className="mt-2 text-[11px] text-cream/40 leading-relaxed">
                      Ship to: {order.address}
                    </p>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}

function HeroSection({
  settings,
  products,
  saving,
  onSave,
}: {
  settings: HeroSettings | null;
  products: Product[];
  saving: boolean;
  onSave: (payload: HeroSettings) => void;
}) {
  const [description, setDescription] = useState(settings?.hero_description ?? "");
  const [slug1, setSlug1] = useState(settings?.hero_product_slug_1 ?? "");
  const [slug2, setSlug2] = useState(settings?.hero_product_slug_2 ?? "");
  const [slug3, setSlug3] = useState(settings?.hero_product_slug_3 ?? "");

  useEffect(() => {
    if (settings) {
      setDescription(settings.hero_description ?? "");
      setSlug1(settings.hero_product_slug_1 ?? "");
      setSlug2(settings.hero_product_slug_2 ?? "");
      setSlug3(settings.hero_product_slug_3 ?? "");
    }
  }, [settings]);

  const sortedProducts = useMemo(
    () => [...products].sort((a, b) => a.name.localeCompare(b.name)),
    [products]
  );

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    onSave({
      hero_description: description,
      hero_product_slug_1: slug1 || null,
      hero_product_slug_2: slug2 || null,
      hero_product_slug_3: slug3 || null,
    });
  }

  const productBySlug = (slug: string) => products.find((p) => p.slug === slug);

  return (
    <form onSubmit={handleSubmit} className="premium-card p-6 space-y-6">
      <div>
        <h2 className="text-lg font-black text-cream">Homepage Hero</h2>
        <p className="text-xs text-cream/40 mt-0.5">
          Changes appear immediately on the storefront homepage.
        </p>
      </div>

      <div>
        <label className="mb-1 block text-xs font-black uppercase tracking-[0.08em] text-cream/40">
          Description
        </label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          maxLength={1000}
          className="min-h-[110px] w-full rounded-xl border border-cream/[0.12] bg-forest/60 px-3.5 py-2.5 text-sm font-bold text-cream outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
          required
        />
        <p className="mt-1.5 text-[10px] font-bold text-cream/30">
          {description.length} / 1000 characters
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { label: "Floating product 1 (center)", value: slug1, setValue: setSlug1 },
          { label: "Floating product 2 (left)", value: slug2, setValue: setSlug2 },
          { label: "Floating product 3 (right)", value: slug3, setValue: setSlug3 },
        ].map(({ label, value, setValue }, idx) => {
          const preview = productBySlug(value);
          return (
            <div key={idx}>
              <label className="mb-1 block text-xs font-black uppercase tracking-[0.08em] text-cream/40">
                {label}
              </label>
              <div className="relative">
                <select
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="h-10 w-full appearance-none rounded-xl border border-cream/[0.12] bg-forest/60 px-3.5 pr-8 text-xs font-bold text-cream outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/10 transition-all duration-300 cursor-pointer"
                >
                  <option value="">— None —</option>
                  {sortedProducts.map((p) => (
                    <option key={p.id} value={p.slug}>
                      {p.name}
                    </option>
                  ))}
                </select>
                <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/40">
                  <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
                    <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
                  </svg>
                </div>
              </div>
              {preview && (
                <div className="mt-3 flex items-center gap-3 rounded-xl border border-cream/[0.06] bg-cream/[0.02] p-2.5">
                  <div className="relative h-12 w-12 shrink-0 overflow-hidden rounded-lg bg-cream/[0.04]">
                    {preview.image_url ? (
                      <Image src={productImage(preview)} alt={preview.name} fill className="object-cover" sizes="48px" />
                    ) : (
                      <div className="grid h-full w-full place-items-center text-cream/30">
                        <ImageIcon size={16} />
                      </div>
                    )}
                  </div>
                  <div className="min-w-0">
                    <strong className="block truncate text-xs text-cream font-bold">{preview.name}</strong>
                    <span className="block text-[10px] text-cream/40">Tk {Number(preview.price).toLocaleString("en-BD")}</span>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-cream/[0.06]">
        <button
          type="submit"
          disabled={saving}
          className="btn-primary min-h-11 text-sm rounded-xl py-2 px-6 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {saving ? "Saving..." : "Save changes"}
        </button>
      </div>
    </form>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-cream/[0.08] bg-cream/[0.02] p-4 hover:border-cream/20 hover:bg-cream/[0.04] transition-all duration-300">
      <strong className="block text-xl sm:text-2xl font-black text-cream">{value}</strong>
      <span className="text-[10px] font-black uppercase tracking-wider text-cream/40 mt-1 block">{label}</span>
    </div>
  );
}

function ProductThumb({ product }: { product: Product }) {
  if (!product.image_url) {
    return (
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-cream/[0.04] border border-cream/[0.08] text-cream/30">
        <ImageIcon size={20} />
      </div>
    );
  }

  const src = productImage(product);
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-cream/[0.02] border border-cream/[0.08]">
      <Image src={src} alt={product.name} fill className="object-cover" sizes="56px" />
    </div>
  );
}

function CouponModal({
  coupon,
  saving,
  setCoupon,
  onSubmit,
  onClose,
}: {
  coupon: CouponForm;
  saving: boolean;
  setCoupon: (coupon: CouponForm | null) => void;
  onSubmit: (event: React.FormEvent) => void;
  onClose: () => void;
}) {
  const update = (patch: Partial<CouponForm>) => setCoupon({ ...coupon, ...patch });
  return (
    <Modal title={coupon.id ? "Edit coupon" : "New coupon"} onClose={onClose} maxWidth="max-w-2xl">
      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid gap-4 sm:grid-cols-2">
          <Field label="Code" value={coupon.code} onChange={(value) => update({ code: value.toUpperCase() })} />
          <SelectField label="Discount type" value={coupon.discount_type} onChange={(value) => update({ discount_type: value as "percent" | "fixed" })}>
            <option value="percent">Percent</option>
            <option value="fixed">Fixed amount</option>
          </SelectField>
          <Field label={coupon.discount_type === "percent" ? "Discount percent" : "Discount amount"} type="number" step="0.01" value={String(coupon.value)} onChange={(value) => update({ value })} />
          <Field label="Minimum order" type="number" step="0.01" value={String(coupon.min_order_amount)} onChange={(value) => update({ min_order_amount: value })} />
          <Field label="Max discount" type="number" step="0.01" required={false} value={coupon.max_discount_amount || ""} onChange={(value) => update({ max_discount_amount: value || null })} />
          <Field label="Usage limit" type="number" required={false} value={coupon.usage_limit ? String(coupon.usage_limit) : ""} onChange={(value) => update({ usage_limit: value ? Number(value) : null })} />
          <Field label="Starts at" type="datetime-local" required={false} value={toDatetimeLocal(coupon.starts_at)} onChange={(value) => update({ starts_at: value ? new Date(value).toISOString() : null })} />
          <Field label="Ends at" type="datetime-local" required={false} value={toDatetimeLocal(coupon.ends_at)} onChange={(value) => update({ ends_at: value ? new Date(value).toISOString() : null })} />
        </div>
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-[0.08em] text-cream/40">Description</label>
          <textarea
            value={coupon.description || ""}
            onChange={(e) => update({ description: e.target.value || null })}
            className="min-h-[90px] w-full rounded-xl border border-cream/[0.12] bg-forest/60 px-3.5 py-2.5 text-xs font-bold text-cream outline-none transition-all duration-300 focus:border-gold/50 focus:ring-4 focus:ring-gold/10"
          />
        </div>
        <label className="inline-flex items-center gap-3 rounded-xl border border-cream/[0.08] bg-cream/[0.02] px-4 py-3 text-xs font-black text-cream/70">
          <input
            type="checkbox"
            checked={coupon.active}
            onChange={(e) => update({ active: e.target.checked })}
            className="h-4 w-4 accent-gold"
          />
          Active coupon
        </label>
        <ModalActions saving={saving} submitLabel={coupon.id ? "Update coupon" : "Create coupon"} onCancel={onClose} />
      </form>
    </Modal>
  );
}

function toDatetimeLocal(value: string | null) {
  if (!value) return "";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "";
  return date.toISOString().slice(0, 16);
}

function ProductModal({
  categories,
  editing,
  saving,
  uploading,
  setEditing,
  onImageUpload,
  onGalleryUpload,
  onSubmit,
  onClose,
}: {
  categories: Category[];
  editing: FormState;
  saving: boolean;
  uploading: boolean;
  setEditing: (value: FormState) => void;
  onImageUpload: (file: File) => void;
  onGalleryUpload: (file: File) => void;
  onSubmit: (e: React.FormEvent) => void;
  onClose: () => void;
}) {
  return (
    <Modal title={editing.id ? "Edit product" : "New product"} onClose={onClose} maxWidth="max-w-4xl">
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="grid gap-4 md:grid-cols-2">
          <Field
            label="Name"
            value={editing.name}
            onChange={(value) =>
              setEditing({
                ...editing,
                name: value,
                slug: editing.id ? editing.slug : slugify(value),
              })
            }
          />
          <Field label="Slug" value={editing.slug} onChange={(value) => setEditing({ ...editing, slug: slugify(value) })} />
          <Field label="SKU" value={editing.sku} onChange={(value) => setEditing({ ...editing, sku: value })} />
          <SelectField label="Category" value={editing.category_id} onChange={(value) => setEditing({ ...editing, category_id: value })}>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </SelectField>
          <Field label="Badge" value={editing.badge || ""} onChange={(value) => setEditing({ ...editing, badge: value })} required={false} />
          <Field label="Subcategory" value={editing.subcategory || ""} onChange={(value) => setEditing({ ...editing, subcategory: value })} required={false} />
        </div>

        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-[0.08em] text-cream/40">Description</label>
          <textarea
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            className="min-h-[110px] w-full rounded-xl border border-cream/[0.12] bg-forest/60 px-3.5 py-2.5 text-xs font-bold text-cream outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
            required
          />
        </div>

        <div className="grid gap-4 md:grid-cols-3">
          <Field label="Price" value={editing.price} onChange={(value) => setEditing({ ...editing, price: value })} type="number" step="0.01" />
          <Field
            label="Compare price"
            value={editing.compare_at_price || ""}
            onChange={(value) => setEditing({ ...editing, compare_at_price: value })}
            type="number"
            step="0.01"
            required={false}
          />
          <Field
            label="Stock"
            value={String(editing.stock)}
            onChange={(value) => setEditing({ ...editing, stock: Math.max(0, Number.parseInt(value || "0", 10)) })}
            type="number"
          />
          <Field label="Batch no." value={editing.batch_no || ""} onChange={(value) => setEditing({ ...editing, batch_no: value })} required={false} />
          <Field label="Expiry date" value={editing.expiry_date || ""} onChange={(value) => setEditing({ ...editing, expiry_date: value })} required={false} />
          <Field label="Accent color" value={editing.accent || ""} onChange={(value) => setEditing({ ...editing, accent: value })} required={false} />
        </div>

        <div className="grid gap-4 md:grid-cols-[1fr_220px]">
          <div>
            <Field
              label="Image URL"
              value={editing.image_url || ""}
              onChange={(value) => setEditing({ ...editing, image_url: value })}
              required={false}
            />
            <label className="mt-2.5 inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-cream/[0.12] bg-cream/[0.02] px-4 text-xs font-black text-cream/70 hover:text-cream hover:border-cream/20 hover:bg-cream/[0.04] transition-all duration-300 select-none">
              <Upload size={14} className="text-gold" />
              <span>{uploading ? "Uploading..." : "Upload image"}</span>
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={uploading}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) onImageUpload(file);
                  e.target.value = "";
                }}
              />
            </label>
          </div>
          <SelectField label="Status" value={editing.status} onChange={(value) => setEditing({ ...editing, status: value as ProductStatus })}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </SelectField>
        </div>

        {/* Gallery images */}
        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-[0.08em] text-cream/40">Gallery images</label>
          {editing.gallery && editing.gallery.length > 0 && (
            <div className="mb-2.5 flex flex-wrap gap-2">
              {editing.gallery.map((url, i) => (
                <div key={i} className="group relative h-16 w-16 overflow-hidden rounded-lg border border-cream/10">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={url} alt={`Gallery ${i + 1}`} className="h-full w-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      const updated = [...(editing.gallery || [])];
                      updated.splice(i, 1);
                      setEditing({ ...editing, gallery: updated.length > 0 ? updated : null });
                    }}
                    className="absolute inset-0 flex items-center justify-center bg-black/60 text-white opacity-0 transition group-hover:opacity-100"
                  >
                    <X size={14} />
                  </button>
                </div>
              ))}
            </div>
          )}
          <label className="inline-flex min-h-10 cursor-pointer items-center justify-center gap-2 rounded-xl border border-cream/[0.12] bg-cream/[0.02] px-4 text-xs font-black text-cream/70 hover:text-cream hover:border-cream/20 hover:bg-cream/[0.04] transition-all duration-300 select-none">
            <Upload size={14} className="text-gold" />
            <span>{uploading ? "Uploading..." : "Add gallery image"}</span>
            <input
              type="file"
              accept="image/jpeg,image/png,image/webp"
              className="hidden"
              disabled={uploading}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onGalleryUpload(file);
                e.target.value = "";
              }}
            />
          </label>
        </div>

        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-[0.08em] text-cream/40">Detail chips</label>
          <input
            value={editing.detail || ""}
            onChange={(e) => setEditing({ ...editing, detail: e.target.value })}
            placeholder="Example: 83 servings · 307g"
            className="w-full rounded-xl border border-cream/[0.12] bg-forest/60 px-3.5 py-2.5 text-xs font-bold text-cream outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
          />
        </div>

        <ModalActions saving={saving} submitLabel={editing.id ? "Save changes" : "Create product"} onCancel={onClose} />
      </form>
    </Modal>
  );
}

function Alert({ children, tone, onClose }: { children: React.ReactNode; tone: "error" | "success"; onClose: () => void }) {
  const classes =
    tone === "error"
      ? "border-red-500/20 bg-red-500/10 text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.05)]"
      : "border-emerald-500/20 bg-emerald-500/10 text-emerald-400 shadow-[0_0_15px_rgba(16,185,129,0.05)]";
  return (
    <div className={`mb-5 flex items-center justify-between gap-3.5 rounded-xl border px-4 py-3.5 text-sm font-bold backdrop-blur-md transition-all duration-300 ${classes}`}>
      <span>{children}</span>
      <button onClick={onClose} className="shrink-0 text-cream/50 hover:text-cream transition-colors duration-200">
        <X size={16} />
      </button>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Boxes; label: string; value: number }) {
  return (
    <article className="premium-card p-4 sm:p-6 group hover:border-cream/20 hover:shadow-[0_0_30px_rgba(96,165,250,0.04)] hover:-translate-y-0.5 transition-all duration-300">
      <div className="mb-2.5 sm:mb-4 flex h-8 w-8 sm:h-10 sm:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-gold/10 text-gold border border-gold/20 group-hover:scale-110 transition-transform duration-300">
        <Icon size={16} className="sm:hidden" />
        <Icon size={18} className="hidden sm:block" />
      </div>
      <strong className="block text-2xl sm:text-3xl font-black text-cream">{value}</strong>
      <span className="text-[10px] sm:text-xs font-bold uppercase tracking-wider text-cream/40 mt-0.5 sm:mt-1 block">{label}</span>
    </article>
  );
}

function Select({ children, value, onChange, icon: Icon }: { children: React.ReactNode; value: string; onChange: (value: string) => void; icon: typeof Filter }) {
  return (
    <label className="relative block">
      <Icon size={15} className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/45" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-xl border border-cream/[0.12] bg-forest/60 pl-10 pr-8 text-xs font-semibold text-cream outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/10 transition-all duration-300 cursor-pointer"
      >
        {children}
      </select>
      <div className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-cream/40">
        <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
          <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
        </svg>
      </div>
    </label>
  );
}

function SelectField({ label, children, value, onChange }: { label: string; children: React.ReactNode; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-black uppercase tracking-[0.08em] text-cream/40">{label}</label>
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-10 w-full appearance-none rounded-xl border border-cream/[0.12] bg-forest/60 px-3.5 pr-8 text-xs font-bold text-cream outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/10 transition-all duration-300 cursor-pointer"
          required
        >
          {children}
        </select>
        <div className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/40">
          <svg className="h-4 w-4 fill-current" viewBox="0 0 20 20">
            <path d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" />
          </svg>
        </div>
      </div>
    </div>
  );
}

function Modal({ title, children, onClose, maxWidth = "max-w-lg" }: { title: string; children: React.ReactNode; onClose: () => void; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4 backdrop-blur-md">
      <div className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-2xl border border-cream/[0.08] bg-forest/95 backdrop-blur-md p-6 shadow-[0_0_50px_rgba(0,0,0,0.5)] text-cream`}>
        <div className="mb-6 flex items-center justify-between gap-4 border-b border-cream/[0.06] pb-4">
          <h3 className="text-lg font-black text-cream">{title}</h3>
          <button onClick={onClose} className="inline-flex h-8 w-8 items-center justify-center rounded-xl border border-cream/10 bg-cream/[0.02] text-cream/60 hover:text-cream hover:border-cream/20 transition-all duration-200">
            <X size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ saving, submitLabel, onCancel }: { saving: boolean; submitLabel: string; onCancel: () => void }) {
  return (
    <div className="flex gap-3 pt-4 border-t border-cream/[0.06] mt-6">
      <button
        type="submit"
        disabled={saving}
        className="btn-primary min-h-11 flex-1 text-sm rounded-xl py-2 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {saving ? "Saving..." : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="btn-secondary min-h-11 text-sm rounded-xl py-2 flex-1"
      >
        Cancel
      </button>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
  step?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-black uppercase tracking-[0.08em] text-cream/40">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-xl border border-cream/[0.12] bg-forest/60 px-3.5 text-xs font-bold text-cream outline-none focus:border-gold/50 focus:ring-4 focus:ring-gold/10 transition-all duration-300"
        required={required}
      />
    </div>
  );
}
