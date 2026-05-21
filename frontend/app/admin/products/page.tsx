"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
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
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  Users,
  X,
} from "lucide-react";
import { useAuth } from "@/lib/auth";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ProductStatus = "draft" | "published" | "archived";
type StatusFilter = ProductStatus | "all";
type AdminTab = "products" | "orders" | "analytics" | "audit" | "users";
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
}

interface Order {
  id: string;
  customer_name: string;
  phone: string;
  address: string;
  payment_method: string;
  status: OrderStatus;
  total: string;
  items: OrderItem[];
  created_at: string | null;
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

type FormState = Omit<Product, "id" | "category"> & { id?: string };

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
  badge: null,
  detail: null,
  accent: "#F59E0B",
  subcategory: null,
  status: "draft",
  category_id: "",
};

const statusStyles: Record<ProductStatus, string> = {
  draft: "border-amber-500/25 bg-amber-500/10 text-amber-700",
  published: "border-emerald-600/25 bg-emerald-600/10 text-emerald-700",
  archived: "border-slate-500/25 bg-slate-500/10 text-slate-600",
};

async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    ...init,
    headers: { "Content-Type": "application/json", ...init.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

async function uploadApi<T>(path: string, formData: FormData): Promise<T> {
  const res = await fetch(`${API}${path}`, {
    method: "POST",
    credentials: "include",
    body: formData,
  });
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
  const { user } = useAuth();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [adminStats, setAdminStats] = useState<AdminStats | null>(null);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
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
      const [p, c, s, o, a, u] = await Promise.all([
        api<Product[]>("/api/products/admin"),
        api<Category[]>("/api/categories"),
        api<AdminStats>("/api/admin/stats"),
        api<Order[]>("/api/orders/admin"),
        api<AuditLog[]>("/api/admin/audit-logs"),
        user?.role === "owner" ? api<AdminUser[]>("/api/admin/users") : Promise.resolve([]),
      ]);
      setProducts(p);
      setCategories(c);
      setAdminStats(s);
      setOrders(o);
      setAuditLogs(a);
      setAdminUsers(u);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load CMS data");
    } finally {
      setLoading(false);
    }
  }, [user?.role]);

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

  return (
    <main className="min-h-screen bg-[#eef0e8] text-ink">
      <section className="mx-auto w-[min(1440px,calc(100%-32px))] py-8">
        <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <Link className="mb-4 inline-flex items-center gap-2 text-sm font-black text-ink/55 hover:text-ink" href="/">
              <ArrowLeft size={16} />
              Storefront
            </Link>
            <h1 className="text-3xl font-black tracking-tight md:text-4xl">CMS Panel</h1>
            <p className="mt-1 text-sm text-ink/55">
              Manage catalog data, inventory, publishing status, and storefront product metadata.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setShowCategoryForm(true)}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-ink/15 bg-white px-4 text-sm font-black shadow-sm hover:border-ink/30"
            >
              <Plus size={16} />
              New category
            </button>
            <button
              onClick={startNewProduct}
              disabled={categories.length === 0}
              className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-ink px-4 text-sm font-black text-cream shadow-sm disabled:cursor-not-allowed disabled:opacity-45"
            >
              <Plus size={17} />
              Add product
            </button>
          </div>
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

        <div className="mb-6 flex flex-wrap gap-2">
          {([
            ["products", Boxes, "Products"],
            ["orders", ClipboardList, "Orders"],
            ["analytics", BarChart3, "Analytics"],
            ["audit", History, "Audit log"],
            ...(user?.role === "owner" ? ([["users", Users, "Users"]] as const) : []),
          ] as const).map(([tab, Icon, label]) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`inline-flex min-h-10 items-center gap-2 rounded-lg border px-4 text-sm font-black ${
                activeTab === tab ? "border-ink bg-ink text-cream" : "border-ink/12 bg-white text-ink/65 hover:text-ink"
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="mb-6 grid gap-3 md:grid-cols-4">
          <StatCard icon={Boxes} label="Total products" value={stats.total} />
          <StatCard icon={PackageCheck} label="Published" value={stats.published} />
          <StatCard icon={AlertTriangle} label="Low stock" value={stats.lowStock} />
          <StatCard icon={ShieldCheck} label="Out of stock" value={stats.outOfStock} />
        </div>

        {activeTab === "products" && <ProductsSection
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
        />}

        {activeTab === "orders" && <OrdersSection orders={orders} saving={saving} onStatusChange={handleOrderStatus} />}
        {activeTab === "analytics" && <AnalyticsSection stats={adminStats} products={products} orders={orders} />}
        {activeTab === "audit" && <AuditSection logs={auditLogs} />}
        {activeTab === "users" && <UsersSection users={adminUsers} saving={saving} onRoleChange={handleUserRole} />}
      </section>

      {editing && (
        <ProductModal
          categories={categories}
          editing={editing}
          saving={saving}
          uploading={uploading}
          setEditing={setEditing}
          onImageUpload={handleImageUpload}
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

      {deleteTarget && (
        <Modal title="Delete product" onClose={() => setDeleteTarget(null)} maxWidth="max-w-md">
          <div className="rounded-lg border border-red-500/20 bg-red-50 p-4 text-sm text-red-800">
            This permanently deletes <strong>{deleteTarget.name}</strong>. Orders that reference this product may lose catalog context.
          </div>
          <div className="mt-5 flex gap-3">
            <button
              onClick={handleDelete}
              disabled={saving}
              className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-red-600 px-4 text-sm font-black text-white disabled:opacity-50"
            >
              Delete product
            </button>
            <button
              onClick={() => setDeleteTarget(null)}
              className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ink/15 px-4 text-sm font-black"
            >
              Cancel
            </button>
          </div>
        </Modal>
      )}
    </main>
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
    <div className="rounded-xl border border-ink/10 bg-white shadow-sm">
          <div className="border-b border-ink/10 p-4">
            <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
              <div>
                <h2 className="text-xl font-black">Product catalog</h2>
                <p className="text-sm text-ink/50">
                  {loading ? "Loading products..." : `${filteredProducts.length} of ${products.length} products shown`}
                </p>
              </div>
              <div className="grid gap-2 md:grid-cols-[minmax(260px,1fr)_180px_220px]">
                <label className="relative block">
                  <Search size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search name, SKU, slug"
                    className="h-11 w-full rounded-lg border border-ink/12 bg-[#f8f8f4] pl-10 pr-3 text-sm font-semibold outline-none focus:border-ink/35"
                  />
                </label>
                <Select value={statusFilter} onChange={(value) => setStatusFilter(value as StatusFilter)} icon={Filter}>
                  <option value="all">All statuses</option>
                  <option value="published">Published</option>
                  <option value="draft">Draft</option>
                  <option value="archived">Archived</option>
                </Select>
                <Select value={categoryFilter} onChange={setCategoryFilter} icon={Filter}>
                  <option value="all">All categories</option>
                  {categories.map((category) => (
                    <option value={category.id} key={category.id}>
                      {category.name}
                    </option>
                  ))}
                </Select>
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[1040px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/10 bg-[#f8f8f4] text-[11px] uppercase tracking-[0.14em] text-ink/45">
                  <th className="px-4 py-3">Product</th>
                  <th>Category</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="pr-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr className="border-b border-ink/[0.06] align-middle hover:bg-[#f8f8f4]" key={product.id}>
                    <td className="px-4 py-4">
                      <div className="flex items-center gap-3">
                        <ProductThumb product={product} />
                        <div className="min-w-0">
                          <strong className="block max-w-[360px] truncate text-sm">{product.name}</strong>
                          <span className="block max-w-[420px] truncate text-xs text-ink/48">{product.description}</span>
                          <span className="mt-1 block text-[11px] font-bold text-ink/35">/{product.slug}</span>
                        </div>
                      </div>
                    </td>
                    <td className="text-sm font-bold text-ink/65">{product.category?.name || "Unassigned"}</td>
                    <td className="text-xs font-black text-ink/55">{product.sku}</td>
                    <td>
                      <div className="font-black">Tk {Number(product.price).toLocaleString("en-BD")}</div>
                      {product.compare_at_price && (
                        <div className="text-xs text-ink/40 line-through">
                          Tk {Number(product.compare_at_price).toLocaleString("en-BD")}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`font-black ${product.stock === 0 ? "text-red-600" : product.stock < 10 ? "text-amber-700" : "text-ink"}`}>
                        {product.stock}
                      </span>
                    </td>
                    <td>
                      <span className={`inline-flex items-center rounded-full border px-2.5 py-1 text-xs font-black capitalize ${statusStyles[product.status]}`}>
                        {product.status}
                      </span>
                    </td>
                    <td className="pr-4">
                      <div className="flex justify-end gap-2">
                        <Link
                          href={`/products/${product.slug}`}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-ink/10 text-ink/55 hover:border-ink/25 hover:text-ink"
                          title="Preview"
                        >
                          <Eye size={15} />
                        </Link>
                        <button
                          onClick={() => setEditing(productToForm(product))}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-ink text-cream"
                          title="Edit"
                        >
                          <Edit3 size={15} />
                        </button>
                        <button
                          onClick={() => setDeleteTarget(product)}
                          className="inline-flex h-9 w-9 items-center justify-center rounded-lg border border-red-500/25 text-red-600 hover:bg-red-50"
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
                    <td colSpan={7} className="px-4 py-14 text-center text-sm font-semibold text-ink/45">
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
  return form;
}

function OrdersSection({ orders, saving, onStatusChange }: { orders: Order[]; saving: boolean; onStatusChange: (id: string, status: OrderStatus) => void }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/10 p-4">
        <h2 className="text-xl font-black">Order management</h2>
        <p className="text-sm text-ink/50">{orders.length} order(s)</p>
      </div>
      <div className="overflow-x-auto">
        <table className="w-full min-w-[980px] text-left">
          <thead>
            <tr className="border-b border-ink/10 bg-[#f8f8f4] text-[11px] uppercase tracking-[0.14em] text-ink/45">
              <th className="px-4 py-3">Order</th>
              <th>Customer</th>
              <th>Items</th>
              <th>Total</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {orders.map((order) => (
              <tr key={order.id} className="border-b border-ink/[0.06]">
                <td className="px-4 py-4">
                  <strong className="block text-sm">#{order.id.slice(0, 8)}</strong>
                  <span className="text-xs text-ink/45">{order.payment_method.toUpperCase()}</span>
                </td>
                <td>
                  <strong className="block text-sm">{order.customer_name}</strong>
                  <span className="block text-xs text-ink/50">{order.phone}</span>
                  <span className="block max-w-[260px] truncate text-xs text-ink/35">{order.address}</span>
                </td>
                <td className="text-sm font-semibold">{order.items.reduce((sum, item) => sum + item.quantity, 0)}</td>
                <td className="font-black">Tk {Number(order.total).toLocaleString("en-BD")}</td>
                <td>
                  <select
                    value={order.status}
                    disabled={saving}
                    onChange={(e) => onStatusChange(order.id, e.target.value as OrderStatus)}
                    className="h-9 rounded-lg border border-ink/12 bg-white px-2 text-xs font-black capitalize"
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="shipped">Shipped</option>
                    <option value="delivered">Delivered</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </td>
                <td className="text-xs font-semibold text-ink/45">
                  {order.created_at ? new Date(order.created_at).toLocaleString() : "Unknown"}
                </td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-12 text-center text-sm font-semibold text-ink/45">No orders yet.</td>
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
    <div className="grid gap-4 lg:grid-cols-2">
      <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Business snapshot</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
          <Metric label="Revenue" value={`Tk ${Number(stats?.revenue || 0).toLocaleString("en-BD")}`} />
          <Metric label="Orders" value={String(stats?.orders || 0)} />
          <Metric label="Pending orders" value={String(stats?.pending_orders || 0)} />
          <Metric label="Average order" value={`Tk ${Math.round(avgOrder).toLocaleString("en-BD")}`} />
        </div>
      </div>
      <div className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
        <h2 className="text-xl font-black">Inventory health</h2>
        <div className="mt-5 grid gap-3 sm:grid-cols-2">
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
    <div className="rounded-xl border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/10 p-4">
        <h2 className="text-xl font-black">Audit log</h2>
        <p className="text-sm text-ink/50">Recent CMS-sensitive actions</p>
      </div>
      <div className="divide-y divide-ink/[0.06]">
        {logs.map((log) => (
          <div key={log.id} className="grid gap-2 p-4 md:grid-cols-[180px_1fr_220px]">
            <span className="text-xs font-black uppercase tracking-wider text-ink/45">{log.action}</span>
            <div>
              <p className="text-sm font-bold">{log.summary}</p>
              <p className="text-xs text-ink/45">{log.actor_email || "System"} · {log.entity_type}</p>
            </div>
            <span className="text-xs font-semibold text-ink/45 md:text-right">{new Date(log.created_at).toLocaleString()}</span>
          </div>
        ))}
        {logs.length === 0 && <div className="p-12 text-center text-sm font-semibold text-ink/45">No audit events yet.</div>}
      </div>
    </div>
  );
}

function UsersSection({ users, saving, onRoleChange }: { users: AdminUser[]; saving: boolean; onRoleChange: (id: string, role: string) => void }) {
  return (
    <div className="rounded-xl border border-ink/10 bg-white shadow-sm">
      <div className="border-b border-ink/10 p-4">
        <h2 className="text-xl font-black">Admin users</h2>
        <p className="text-sm text-ink/50">Owner-only role management</p>
      </div>
      <div className="divide-y divide-ink/[0.06]">
        {users.map((adminUser) => (
          <div key={adminUser.id} className="grid items-center gap-3 p-4 md:grid-cols-[1fr_220px_180px]">
            <div>
              <strong className="block text-sm">{adminUser.name}</strong>
              <span className="text-xs text-ink/45">{adminUser.email}</span>
            </div>
            <span className="text-xs font-black uppercase tracking-wider text-ink/45">{adminUser.is_admin ? "CMS access" : "Customer"}</span>
            <select
              value={adminUser.role}
              disabled={saving}
              onChange={(e) => onRoleChange(adminUser.id, e.target.value)}
              className="h-10 rounded-lg border border-ink/12 bg-white px-3 text-sm font-black"
            >
              <option value="customer">Customer</option>
              <option value="editor">Editor</option>
              <option value="admin">Admin</option>
              <option value="owner">Owner</option>
            </select>
          </div>
        ))}
        {users.length === 0 && <div className="p-12 text-center text-sm font-semibold text-ink/45">Only owners can view users.</div>}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-ink/10 bg-[#f8f8f4] p-4">
      <strong className="block text-2xl font-black">{value}</strong>
      <span className="text-xs font-bold uppercase tracking-wider text-ink/45">{label}</span>
    </div>
  );
}

function ProductThumb({ product }: { product: Product }) {
  if (!product.image_url) {
    return (
      <div className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-ink/5 text-ink/35">
        <ImageIcon size={20} />
      </div>
    );
  }

  const src = product.image_url.startsWith("http") ? product.image_url : product.image_url;
  return (
    <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-ink/5">
      <Image src={src} alt={product.name} fill className="object-cover" sizes="56px" />
    </div>
  );
}

function ProductModal({
  categories,
  editing,
  saving,
  uploading,
  setEditing,
  onImageUpload,
  onSubmit,
  onClose,
}: {
  categories: Category[];
  editing: FormState;
  saving: boolean;
  uploading: boolean;
  setEditing: (value: FormState) => void;
  onImageUpload: (file: File) => void;
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
          <label className="mb-1 block text-xs font-black uppercase tracking-wider text-ink/45">Description</label>
          <textarea
            value={editing.description}
            onChange={(e) => setEditing({ ...editing, description: e.target.value })}
            className="min-h-[110px] w-full rounded-lg border border-ink/12 bg-white px-3 py-2 text-sm outline-none focus:border-ink/35"
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
            <label className="mt-2 inline-flex min-h-10 cursor-pointer items-center gap-2 rounded-lg border border-ink/12 bg-white px-3 text-xs font-black hover:border-ink/30">
              <Upload size={14} />
              {uploading ? "Uploading..." : "Upload image"}
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

        <div>
          <label className="mb-1 block text-xs font-black uppercase tracking-wider text-ink/45">Detail chips</label>
          <input
            value={editing.detail || ""}
            onChange={(e) => setEditing({ ...editing, detail: e.target.value })}
            placeholder="Example: 83 servings · 307g"
            className="w-full rounded-lg border border-ink/12 bg-white px-3 py-2 text-sm outline-none focus:border-ink/35"
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
      ? "border-red-500/25 bg-red-50 text-red-800"
      : "border-emerald-600/25 bg-emerald-50 text-emerald-800";
  return (
    <div className={`mb-4 flex items-center justify-between gap-3 rounded-lg border px-4 py-3 text-sm font-semibold ${classes}`}>
      <span>{children}</span>
      <button onClick={onClose} className="shrink-0 opacity-60 hover:opacity-100">
        <X size={16} />
      </button>
    </div>
  );
}

function StatCard({ icon: Icon, label, value }: { icon: typeof Boxes; label: string; value: number }) {
  return (
    <article className="rounded-xl border border-ink/10 bg-white p-5 shadow-sm">
      <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-cream">
        <Icon size={18} />
      </div>
      <strong className="block text-3xl font-black">{value}</strong>
      <span className="text-sm font-semibold text-ink/50">{label}</span>
    </article>
  );
}

function Select({ children, value, onChange, icon: Icon }: { children: React.ReactNode; value: string; onChange: (value: string) => void; icon: typeof Filter }) {
  return (
    <label className="relative block">
      <Icon size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-ink/35" />
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-11 w-full appearance-none rounded-lg border border-ink/12 bg-[#f8f8f4] pl-10 pr-3 text-sm font-black outline-none focus:border-ink/35"
      >
        {children}
      </select>
    </label>
  );
}

function SelectField({ label, children, value, onChange }: { label: string; children: React.ReactNode; value: string; onChange: (value: string) => void }) {
  return (
    <div>
      <label className="mb-1 block text-xs font-black uppercase tracking-wider text-ink/45">{label}</label>
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-ink/12 bg-white px-3 text-sm font-semibold outline-none focus:border-ink/35"
        required
      >
        {children}
      </select>
    </div>
  );
}

function Modal({ title, children, onClose, maxWidth = "max-w-lg" }: { title: string; children: React.ReactNode; onClose: () => void; maxWidth?: string }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/55 p-4 backdrop-blur-sm">
      <div className={`max-h-[90vh] w-full ${maxWidth} overflow-y-auto rounded-xl bg-[#f4f3ed] p-6 shadow-2xl`}>
        <div className="mb-5 flex items-center justify-between gap-4">
          <h3 className="text-xl font-black">{title}</h3>
          <button onClick={onClose} className="inline-flex h-9 w-9 items-center justify-center rounded-lg text-ink/50 hover:bg-ink/5 hover:text-ink">
            <X size={19} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function ModalActions({ saving, submitLabel, onCancel }: { saving: boolean; submitLabel: string; onCancel: () => void }) {
  return (
    <div className="flex gap-3 pt-2">
      <button
        type="submit"
        disabled={saving}
        className="inline-flex min-h-11 flex-1 items-center justify-center rounded-lg bg-ink px-4 text-sm font-black text-cream disabled:opacity-50"
      >
        {saving ? "Saving..." : submitLabel}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="inline-flex min-h-11 items-center justify-center rounded-lg border border-ink/15 px-4 text-sm font-black"
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
      <label className="mb-1 block text-xs font-black uppercase tracking-wider text-ink/45">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-10 w-full rounded-lg border border-ink/12 bg-white px-3 text-sm font-semibold outline-none focus:border-ink/35"
        required={required}
      />
    </div>
  );
}
