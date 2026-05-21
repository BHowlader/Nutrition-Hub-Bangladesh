const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PRODUCT_CACHE_TTL = 60_000;

type ProductCacheEntry = {
  expiresAt: number;
  promise: Promise<Product[]>;
};

const productListCache = new Map<string, ProductCacheEntry>();

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

function productCacheKey(opts: { category?: string }) {
  return opts.category ? `category:${opts.category}` : "all";
}

export async function fetchProducts(opts: { category?: string } = {}): Promise<Product[]> {
  const key = productCacheKey(opts);
  if (typeof window !== "undefined") {
    const cached = productListCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.promise;
  }

  const params = new URLSearchParams();
  if (opts.category) params.set("category", opts.category);
  const promise = fetch(`${API}/api/products?${params.toString()}`)
    .then((res) => (res.ok ? res.json() : []))
    .catch(() => []);

  if (typeof window !== "undefined") {
    productListCache.set(key, {
      expiresAt: Date.now() + PRODUCT_CACHE_TTL,
      promise,
    });
  }

  return promise;
}

export async function fetchProductBySlug(slug: string): Promise<Product | null> {
  const res = await fetch(`${API}/api/products/by-slug/${encodeURIComponent(slug)}`);
  if (!res.ok) return null;
  return res.json();
}

export function warmProductCache() {
  if (typeof window === "undefined") return;
  void fetchProducts();
}
