const BACKEND_URL = (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000").trim().replace(/\/$/, "");
const API = BACKEND_URL;
const PRODUCT_CACHE_TTL = 60_000;
const PRODUCT_REVALIDATE_SECONDS = 60;
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

export interface VariantOption {
  label: string;
  // The option's own price. null means "sell at the product price".
  price: string | null;
  // Replaces the product description while this option is selected.
  description: string | null;
  // Photo for this option; joins the gallery and is slid into view on selection.
  image_url: string | null;
}

export interface VariantGroup {
  name: string;
  options: VariantOption[];
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
  rating: string;
  badge: string | null;
  detail: string | null;
  accent: string | null;
  subcategory: string | null;
  image_url: string | null;
  gallery: string[] | null;
  variants: VariantGroup[] | null;
  is_featured?: boolean;
  status: string;
  category_id: string;
  category: Category | null;
}

// A customer's choice is one string: the chosen labels joined in group order,
// e.g. "1kg / Strawberry". Keep this in sync with backend/app/core/variants.py.
export const VARIANT_SEPARATOR = " / ";

export function variantKey(labels: string[]): string {
  return labels.join(VARIANT_SEPARATOR);
}

function chosenOptions(
  product: { variants?: VariantGroup[] | null },
  labels: string[]
): VariantOption[] {
  return (product.variants || [])
    .map((group, i) => group.options.find((o) => o.label === labels[i]))
    .filter((o): o is VariantOption => Boolean(o));
}

// Option prices are absolute, not adjustments. When several chosen options carry
// a price the last group wins — mirror of resolve_variant() in the backend.
export function variantPrice(product: { price: string; variants?: VariantGroup[] | null }, labels: string[]): number {
  return chosenOptions(product, labels).reduce(
    (price, option) => (option.price == null || option.price === "" ? price : Number(option.price)),
    Number(product.price)
  );
}

// Same last-wins rule for the copy shown under the title.
export function variantDescription(
  product: { description: string; variants?: VariantGroup[] | null },
  labels: string[]
): string {
  return chosenOptions(product, labels).reduce(
    (text, option) => option.description?.trim() || text,
    product.description
  );
}

// …and for the photo the gallery slides to. null when no chosen option has one.
export function variantImage(
  product: { variants?: VariantGroup[] | null },
  labels: string[]
): string | null {
  return chosenOptions(product, labels).reduce<string | null>(
    (url, option) => (option.image_url ? resolveImageUrl(option.image_url) : url),
    null
  );
}

function variantImages(p?: Product | null): string[] {
  return (p?.variants || []).flatMap((group) =>
    group.options.map((option) => option.image_url).filter(Boolean).map((url) => resolveImageUrl(url as string))
  );
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

// New orders use short, readable IDs (e.g. NHB-7F3K9Q) which are shown in full.
// Legacy UUID orders are abbreviated so the UI stays compact.
export function formatOrderId(id: string): string {
  return id.startsWith("NHB-") ? id : `#${id.slice(0, 8).toUpperCase()}`;
}

export function productImage(p?: { image_url: string | null } | null): string {
  if (!p || !p.image_url) return "/images/logo.png";
  if (p.image_url.startsWith("http")) return p.image_url;
  if (p.image_url.startsWith("/static")) return `${BACKEND_URL}${p.image_url}`;
  return p.image_url;
}

function resolveImageUrl(url: string): string {
  if (url.startsWith("http")) return url;
  if (url.startsWith("/static")) return `${BACKEND_URL}${url}`;
  return url;
}

// Hero, then the extra gallery shots, then one frame per variant photo — so
// selecting an option can slide to a slot the swipe/thumbnail UI already knows.
export function productGallery(p?: Product | null): string[] {
  const hero = productImage(p);
  const extras = [...(p?.gallery || []).map(resolveImageUrl), ...variantImages(p)];
  return [hero, ...Array.from(new Set(extras)).filter((u) => u !== hero)];
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

export interface CategoryImages {
  category_image_1: string | null;
  category_image_2: string | null;
  category_image_3: string | null;
  category_image_4: string | null;
}

export async function fetchCategoryImages(): Promise<CategoryImages | null> {
  try {
    const init: RequestInit & { next?: { revalidate: number; tags: string[] } } =
      typeof window === "undefined"
        ? { signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS), next: { revalidate: 60, tags: ["category-images"] } }
        : {};
    const res = await fetch(`${API}/api/settings/category-images`, init);
    if (!res.ok) return null;
    return res.json();
  } catch {
    return null;
  }
}

export async function fetchCategories(): Promise<Category[]> {
  try {
    const init: RequestInit & { next?: { revalidate: number; tags: string[] } } =
      typeof window === "undefined"
        ? { signal: AbortSignal.timeout(SERVER_FETCH_TIMEOUT_MS), next: { revalidate: PRODUCT_REVALIDATE_SECONDS, tags: ["categories"] } }
        : {};
    const res = await fetch(`${API}/api/categories`, init);
    if (!res.ok) return [];
    return res.json();
  } catch {
    return [];
  }
}

export function warmProductCache() {
  if (typeof window === "undefined") return;
  void fetchProducts();
}
