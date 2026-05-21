const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface Category {
  id: string;
  name: string;
  slug: string;
}

export interface Product {
  id: string;
  slug: string;
  sku: string;
  name: string;
  description: string;
  price: string;
  compare_at_price: string | null;
  stock: number;
  badge: string | null;
  detail: string | null;
  accent: string | null;
  subcategory: string | null;
  image_url: string | null;
  status: string;
  category_id: string;
  category: Category | null;
}

export function formatTaka(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return `Tk ${new Intl.NumberFormat("en-BD").format(n)}`;
}

export function productImage(p: Product): string {
  if (!p.image_url) return "/images/logo.png";
  return p.image_url.startsWith("http") ? p.image_url : p.image_url;
}

export async function fetchProducts(opts: { category?: string } = {}): Promise<Product[]> {
  const params = new URLSearchParams();
  if (opts.category) params.set("category", opts.category);
  const res = await fetch(`${API}/api/products?${params.toString()}`, { cache: "no-store" });
  if (!res.ok) return [];
  return res.json();
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const res = await fetch(`${API}/api/products/by-slug/${encodeURIComponent(slug)}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}
