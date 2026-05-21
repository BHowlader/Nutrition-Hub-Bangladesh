"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, Edit3, Plus, Trash2, X } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

type ProductStatus = "draft" | "published" | "archived";

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
  status: ProductStatus;
  category_id: string;
}

interface Category {
  id: string;
  name: string;
  slug: string;
}

type FormState = Omit<Product, "id"> & { id?: string };

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
  status: "draft",
  category_id: "",
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

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editing, setEditing] = useState<FormState | null>(null);
  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: "", slug: "" });

  const load = useCallback(async () => {
    setError("");
    try {
      const [p, c] = await Promise.all([
        api<Product[]>("/api/products/admin"),
        api<Category[]>("/api/categories"),
      ]);
      setProducts(p);
      setCategories(c);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!editing) return;
    setError("");
    try {
      if (editing.id) {
        await api(`/api/products/${editing.id}`, {
          method: "PATCH",
          body: JSON.stringify({
            name: editing.name,
            description: editing.description,
            price: editing.price,
            stock: editing.stock,
            status: editing.status,
          }),
        });
      } else {
        await api("/api/products", {
          method: "POST",
          body: JSON.stringify(editing),
        });
      }
      setEditing(null);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this product? This cannot be undone.")) return;
    setError("");
    try {
      await api(`/api/products/${id}`, { method: "DELETE" });
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Delete failed");
    }
  }

  async function handleCreateCategory(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    try {
      await api("/api/categories", {
        method: "POST",
        body: JSON.stringify(newCategory),
      });
      setNewCategory({ name: "", slug: "" });
      setShowCategoryForm(false);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to create category");
    }
  }

  const stockTotal = products.reduce((t, p) => t + p.stock, 0);
  const lowStock = products.filter((p) => p.stock < 35).length;

  return (
    <main className="min-h-screen bg-[#eef0e8] text-ink">
      <section className="shell py-10">
        <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <Link className="inline-flex items-center gap-2 font-black text-moss" href="/">
            <ArrowLeft size={18} />
            Storefront
          </Link>
          <div className="flex gap-3">
            <button
              onClick={() => setShowCategoryForm(true)}
              className="inline-flex items-center gap-2 rounded-lg border border-ink/20 px-4 py-2 font-bold"
            >
              <Plus size={16} />
              New category
            </button>
            <button
              onClick={() => setEditing({ ...EMPTY_FORM, category_id: categories[0]?.id || "" })}
              disabled={categories.length === 0}
              className="btn-primary disabled:opacity-50"
            >
              <Plus size={18} />
              Add product
            </button>
          </div>
        </div>

        {error && (
          <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        )}

        <div className="mb-8 grid gap-4 sm:grid-cols-3">
          {([
            ["Products", products.length],
            ["Units in stock", stockTotal],
            ["Low stock (<35)", lowStock],
          ] as const).map(([label, value]) => (
            <article className="rounded-lg border border-ink/10 bg-cream p-5 shadow-premium" key={label}>
              <strong className="block text-3xl font-black">{value}</strong>
              <span className="text-sm text-ink/60">{label}</span>
            </article>
          ))}
        </div>

        {categories.length === 0 && !loading && (
          <div className="mb-6 rounded-lg border border-amber-500/40 bg-amber-50 px-4 py-3 text-sm text-amber-800">
            No categories yet. Create one before adding products.
          </div>
        )}

        <div className="rounded-lg border border-ink/10 bg-cream p-5 shadow-premium">
          <div className="mb-5">
            <h2 className="text-2xl font-black">Products</h2>
            <p className="text-sm text-ink/60">
              {loading ? "Loading…" : `${products.length} product(s)`}
            </p>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] border-collapse text-left">
              <thead>
                <tr className="border-b border-ink/10 text-xs uppercase tracking-[0.14em] text-ink/50">
                  <th className="py-3">Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {products.map((product) => (
                  <tr className="border-b border-ink/8" key={product.id}>
                    <td className="py-4">
                      <strong className="block">{product.name}</strong>
                      <span className="text-sm text-ink/58 line-clamp-1">{product.description}</span>
                    </td>
                    <td className="text-sm">{product.sku}</td>
                    <td className="font-black">৳{product.price}</td>
                    <td>{product.stock}</td>
                    <td>
                      <span className="inline-flex items-center gap-1 rounded-lg bg-moss/10 px-2 py-1 text-xs font-black text-moss capitalize">
                        {product.status}
                      </span>
                    </td>
                    <td>
                      <div className="flex gap-2">
                        <button
                          onClick={() => setEditing(product)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-ink text-cream"
                          title="Edit"
                        >
                          <Edit3 size={16} />
                        </button>
                        <button
                          onClick={() => handleDelete(product.id)}
                          className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-red-500/40 text-red-600 hover:bg-red-50"
                          title="Delete"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {!loading && products.length === 0 && (
                  <tr>
                    <td colSpan={6} className="py-10 text-center text-ink/50">
                      No products yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {editing && (
        <Modal title={editing.id ? "Edit product" : "New product"} onClose={() => setEditing(null)}>
          <form onSubmit={handleSave} className="space-y-3">
            <Field label="Name" value={editing.name} onChange={(v) => setEditing({ ...editing, name: v })} />
            {!editing.id && (
              <>
                <Field label="Slug" value={editing.slug} onChange={(v) => setEditing({ ...editing, slug: v })} />
                <Field label="SKU" value={editing.sku} onChange={(v) => setEditing({ ...editing, sku: v })} />
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink/50">Category</label>
                  <select
                    value={editing.category_id}
                    onChange={(e) => setEditing({ ...editing, category_id: e.target.value })}
                    className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2"
                    required
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
              </>
            )}
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink/50">Description</label>
              <textarea
                value={editing.description}
                onChange={(e) => setEditing({ ...editing, description: e.target.value })}
                className="min-h-[80px] w-full rounded-lg border border-ink/15 bg-white px-3 py-2"
                required
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field
                label="Price (৳)"
                value={editing.price}
                onChange={(v) => setEditing({ ...editing, price: v })}
                type="number"
                step="0.01"
              />
              <Field
                label="Stock"
                value={String(editing.stock)}
                onChange={(v) => setEditing({ ...editing, stock: parseInt(v) || 0 })}
                type="number"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink/50">Status</label>
              <select
                value={editing.status}
                onChange={(e) => setEditing({ ...editing, status: e.target.value as ProductStatus })}
                className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2"
              >
                <option value="draft">Draft</option>
                <option value="published">Published</option>
                <option value="archived">Archived</option>
              </select>
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">
                {editing.id ? "Save changes" : "Create product"}
              </button>
              <button
                type="button"
                onClick={() => setEditing(null)}
                className="rounded-lg border border-ink/20 px-4 py-2 font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}

      {showCategoryForm && (
        <Modal title="New category" onClose={() => setShowCategoryForm(false)}>
          <form onSubmit={handleCreateCategory} className="space-y-3">
            <Field
              label="Name"
              value={newCategory.name}
              onChange={(v) => setNewCategory({ ...newCategory, name: v })}
            />
            <Field
              label="Slug"
              value={newCategory.slug}
              onChange={(v) => setNewCategory({ ...newCategory, slug: v })}
            />
            <div className="flex gap-3 pt-2">
              <button type="submit" className="btn-primary flex-1">Create</button>
              <button
                type="button"
                onClick={() => setShowCategoryForm(false)}
                className="rounded-lg border border-ink/20 px-4 py-2 font-bold"
              >
                Cancel
              </button>
            </div>
          </form>
        </Modal>
      )}
    </main>
  );
}

function Modal({ title, children, onClose }: { title: string; children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/50 p-4">
      <div className="max-h-[90vh] w-full max-w-lg overflow-y-auto rounded-xl bg-cream p-6 shadow-premium">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-xl font-black">{title}</h3>
          <button onClick={onClose} className="text-ink/50 hover:text-ink">
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  step,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  step?: string;
}) {
  return (
    <div>
      <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-ink/50">{label}</label>
      <input
        type={type}
        step={step}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-lg border border-ink/15 bg-white px-3 py-2"
        required
      />
    </div>
  );
}
