const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const PRODUCT_CACHE_TTL = 60_000;
const PRODUCT_REVALIDATE_SECONDS = 300;
const SERVER_FETCH_TIMEOUT_MS = 4_000;

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

export interface ProductPage {
  items: Product[];
  total: number;
  limit: number;
  offset: number;
  hasMore: boolean;
}

type FetchProductsOptions = {
  category?: string;
  limit?: number;
  offset?: number;
};

export function formatTaka(value: number | string) {
  const n = typeof value === "string" ? Number(value) : value;
  return `Tk ${new Intl.NumberFormat("en-BD").format(n)}`;
}

export function productImage(p?: { image_url: string | null } | null, width = 600): string {
  if (!p || !p.image_url) return "/images/logo.png";
  if (p.image_url.startsWith("https://res.cloudinary.com")) {
    // Inject Cloudinary transformation: resize + auto quality + WebP
    return p.image_url.replace(
      "/image/upload/",
      `/image/upload/w_${width},q_auto,f_auto/`
    );
  }
  if (p.image_url.startsWith("http")) return p.image_url;
  if (p.image_url.startsWith("/static")) return `${API}${p.image_url}`;
  return p.image_url;
}

function productCacheKey(opts: FetchProductsOptions) {
  return [
    opts.category ? `category:${opts.category}` : "all",
    `limit:${opts.limit ?? 100}`,
    `offset:${opts.offset ?? 0}`,
  ].join(":");
}

function publicProductFetchInit(): RequestInit & { next?: { revalidate: number; tags: string[] } } {
  if (typeof window !== "undefined") return {};
  return {
    signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS),
    next: { revalidate: PRODUCT_REVALIDATE_SECONDS, tags: ["products"] },
  };
}

export async function fetchProductPage(opts: FetchProductsOptions = {}): Promise<ProductPage> {
  const key = productCacheKey(opts);
  if (typeof window !== "undefined") {
    const cached = productListCache.get(key);
    if (cached && cached.expiresAt > Date.now()) {
      const items = await cached.promise;
      return {
        items,
        total: items.length,
        limit: opts.limit ?? 100,
        offset: opts.offset ?? 0,
        hasMore: false,
      };
    }
  }

  const params = new URLSearchParams();
  if (opts.category) params.set("category", opts.category);
  if (opts.limit) params.set("limit", String(opts.limit));
  if (opts.offset) params.set("offset", String(opts.offset));

  const promise = fetch(`${API}/api/products?${params.toString()}`, publicProductFetchInit())
    .then(async (res) => {
      if (!res.ok) {
        return {
          items: [],
          total: 0,
          limit: opts.limit ?? 100,
          offset: opts.offset ?? 0,
          hasMore: false,
        };
      }
      const items = (await res.json()) as Product[];
      const limit = Number(res.headers.get("X-Limit") || opts.limit || 100);
      const offset = Number(res.headers.get("X-Offset") || opts.offset || 0);
      const total = Number(res.headers.get("X-Total-Count") || items.length);
      return {
        items,
        total,
        limit,
        offset,
        hasMore: offset + items.length < total,
      };
    })
    .catch(() => ({
      items: [],
      total: 0,
      limit: opts.limit ?? 100,
      offset: opts.offset ?? 0,
      hasMore: false,
    }));

  const itemsPromise = promise.then((page) => page.items);
  if (typeof window !== "undefined") {
    productListCache.set(key, {
      expiresAt: Date.now() + PRODUCT_CACHE_TTL,
      promise: itemsPromise,
    });
  }

  return promise;
}

export async function fetchProducts(opts: FetchProductsOptions = {}): Promise<Product[]> {
  const key = productCacheKey(opts);
  if (typeof window !== "undefined") {
    const cached = productListCache.get(key);
    if (cached && cached.expiresAt > Date.now()) return cached.promise;
  }

  const promise = fetchProductPage(opts)
    .then((page) => page.items)
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
  try {
    const res = await fetch(
      `${API}/api/products/by-slug/${encodeURIComponent(slug)}`,
      publicProductFetchInit()
    );
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export interface HeroSettings {
  hero_description: string;
  hero_product_slug_1: string | null;
  hero_product_slug_2: string | null;
  hero_product_slug_3: string | null;
}

export async function fetchHeroSettings(): Promise<HeroSettings | null> {
  try {
    const init: RequestInit & { next?: { revalidate: number; tags: string[] } } =
      typeof window === "undefined"
        ? { signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS), next: { revalidate: 60, tags: ["hero-settings"] } }
        : {};
    const res = await fetch(`${API}/api/settings/hero`, init);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export function warmProductCache() {
  if (typeof window === "undefined") return;
  void fetchProducts();
}
