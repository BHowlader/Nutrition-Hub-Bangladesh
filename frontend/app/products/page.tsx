"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts, formatTaka, productImage, type Product } from "@/lib/products";
import {
  ArrowRight,
  CookingPot,
  Dumbbell,
  PackageCheck,
  Pill,
  Search,
  ShieldCheck,
  Truck,
  UtensilsCrossed
} from "lucide-react";

const filterCategories = [
  { id: "all", label: "All Products", icon: Dumbbell },
  { id: "Gym Supplements", label: "Gym Supplements", icon: Dumbbell },
  { id: "Vitamins & Supplements", label: "Vitamins", icon: Pill },
  { id: "Protein Oats", label: "Protein Oats", icon: CookingPot },
  { id: "Peanut Butter", label: "Peanut Butter", icon: UtensilsCrossed }
];

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");
  const [products, setProducts] = useState<Product[]>([]);
  const catalogRef = useRef<HTMLDivElement>(null);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat && filterCategories.some((c) => c.id === cat)) {
        setActiveCategory(cat);
      }
    }
    fetchProducts().then((p) => { setProducts(p); setLoading(false); });
  }, []);

  const categoryProducts = activeCategory === "all"
    ? products
    : products.filter((product) => product.category?.name === activeCategory);

  const filteredProducts = categoryProducts.filter((product) => {
    const searchText = `${product.name} ${product.category?.name || ""} ${product.description} ${product.detail || ""}`.toLowerCase();
    return searchText.includes(query.trim().toLowerCase());
  });

  const handleCategoryChange = (categoryId: string) => {
    setActiveCategory(categoryId);
    catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  const categoryCounts = filterCategories.reduce<Record<string, number>>((acc, category) => {
    acc[category.id] = category.id === "all"
      ? products.length
      : products.filter((product) => product.category?.name === category.id).length;
    return acc;
  }, {});

  const availableCount = products.filter((product) => product.stock > 0).length;
  const featuredProduct = products.find((product) => product.stock > 0) ?? products[0];
  const activeCategoryLabel = activeCategory === "all"
    ? "All products"
    : filterCategories.find((category) => category.id === activeCategory)?.label;

  return (
    <div className="min-h-screen overflow-x-clip bg-[#04060d] text-cream selection:bg-gold selection:text-ink">
      <Header />

      {/* HERO */}
      <section className="relative overflow-hidden border-b border-white/[0.06] pb-12 pt-24 sm:pb-16 sm:pt-32 md:pb-24 md:pt-36">
        {/* Background */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/images/gym-bg.png"
            alt=""
            fill
            className="object-cover opacity-[0.12]"
            sizes="100vw"
            quality={55}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#04060d] via-[#04060d]/90 to-[#04060d]/60" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#04060d] via-transparent to-[#04060d]" />
          <div className="absolute left-[10%] top-1/3 h-[420px] w-[420px] rounded-full bg-gold/[0.07] blur-[140px]" />
        </div>

        <div className="shell relative z-10 grid items-center gap-12 lg:grid-cols-[minmax(0,1.1fr)_minmax(340px,0.9fr)] lg:gap-16">
          {/* LEFT — editorial copy */}
          <div className="min-w-0">
            {/* Meta rule */}
            <div className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-cream/40 sm:text-[11px]">
              <span className="tabular-nums">01</span>
              <span className="h-px w-10 bg-gold/50 sm:w-14" />
              <span>Premium Catalog</span>
            </div>

            {/* Editorial headline */}
            <h1 className="mt-6 font-display text-[2.4rem] font-black leading-[1.02] tracking-[-0.035em] text-cream sm:mt-7 sm:text-[3.4rem] md:text-[4.2rem] lg:text-[4.8rem]">
              Verified supplements,
              <br className="hidden sm:block" />{" "}
              <span className="italic font-light text-cream/70">for those who</span>
              <br className="hidden sm:block" />{" "}
              train with intent.
            </h1>

            {/* Lede */}
            <p className="mt-6 max-w-md text-[15px] leading-[1.7] text-cream/55 sm:mt-7 sm:text-base lg:text-lg">
              Authentic sports nutrition, wellness essentials, breakfast staples, and herbal
              formulas — curated for Bangladesh, dispatched in sealed condition.
            </p>

            {/* Figures with hairline rules */}
            <dl className="mt-9 grid grid-cols-3 border-y border-white/[0.08] sm:mt-12">
              <div className="border-r border-white/[0.06] py-5 pr-4 sm:py-6">
                <dd className="font-display text-3xl font-black leading-none tracking-tight text-cream tabular-nums sm:text-5xl">
                  {String(products.length || 0).padStart(2, "0")}
                </dd>
                <dt className="mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-cream/40 sm:mt-4 sm:text-[10px]">
                  Products
                </dt>
              </div>
              <div className="border-r border-white/[0.06] px-4 py-5 sm:px-5 sm:py-6">
                <dd className="font-display text-3xl font-black leading-none tracking-tight text-cream tabular-nums sm:text-5xl">
                  {String(availableCount || 0).padStart(2, "0")}
                </dd>
                <dt className="mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-cream/40 sm:mt-4 sm:text-[10px]">
                  In stock
                </dt>
              </div>
              <div className="py-5 pl-4 sm:py-6 sm:pl-5">
                <dd className="font-display text-3xl font-black leading-none tracking-tight text-cream sm:text-5xl">
                  COD
                </dd>
                <dt className="mt-3 text-[9px] font-bold uppercase tracking-[0.2em] text-cream/40 sm:mt-4 sm:text-[10px]">
                  Payment
                </dt>
              </div>
            </dl>

            {/* CTA row */}
            <div className="mt-8 flex flex-col gap-4 sm:mt-10 sm:flex-row sm:items-center">
              <button
                type="button"
                onClick={() => catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="group inline-flex h-12 w-full items-center justify-center gap-3 rounded-none border border-cream bg-cream px-6 text-[11px] font-black uppercase tracking-[0.22em] text-ink transition hover:bg-transparent hover:text-cream sm:w-auto sm:px-8"
              >
                Explore catalog
                <ArrowRight size={14} className="transition-transform group-hover:translate-x-1" />
              </button>
              <div className="flex items-center gap-2.5 text-[10px] font-bold uppercase tracking-[0.18em] text-cream/45 sm:text-[11px]">
                <ShieldCheck size={13} className="text-gold" />
                100% Authentic · Sealed packaging
              </div>
            </div>
          </div>

          {/* RIGHT — quiet product portrait (lg+) */}
          {featuredProduct && (
            <div className="relative hidden lg:block">
              <Link
                href={`/products/${featuredProduct.slug}`}
                className="group relative block"
              >
                {/* Vertical label */}
                <div className="absolute -left-12 top-0 z-10 flex h-full items-start pt-2">
                  <span className="rotate-180 text-[10px] font-bold uppercase tracking-[0.4em] text-cream/35 [writing-mode:vertical-rl]">
                    Featured · {featuredProduct.category?.name || "In stock"}
                  </span>
                </div>

                {/* Thin gold corner accents */}
                <div className="pointer-events-none absolute -left-2 -top-2 h-10 w-10 border-l border-t border-gold/60" />
                <div className="pointer-events-none absolute -bottom-2 -right-2 h-10 w-10 border-b border-r border-gold/60" />

                <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#050811]">
                  <Image
                    src={productImage(featuredProduct)}
                    alt={featuredProduct.name}
                    fill
                    className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    sizes="420px"
                    quality={72}
                    priority
                  />
                  {/* Subtle vignette */}
                  <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_55%,rgba(4,6,13,0.55)_100%)]" />
                </div>

                {/* Meta strip */}
                <div className="mt-5 flex items-end justify-between gap-4 border-t border-white/[0.1] pt-5">
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-cream/40">
                      Now showing
                    </span>
                    <h3 className="mt-1.5 truncate font-display text-lg font-black leading-tight tracking-tight text-cream">
                      {featuredProduct.name}
                    </h3>
                  </div>
                  <div className="shrink-0 text-right">
                    <span className="text-[10px] font-bold uppercase tracking-[0.22em] text-cream/40">
                      From
                    </span>
                    <strong className="mt-1.5 block font-display text-xl font-black leading-none tracking-tight text-gold tabular-nums">
                      {formatTaka(featuredProduct.price)}
                    </strong>
                  </div>
                </div>
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* CATALOG */}
      <main
        ref={catalogRef}
        className="relative scroll-mt-[66px] py-8 md:scroll-mt-28 md:py-16"
      >
        <div className="shell">
          {/* Catalog header — title + search */}
          <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between md:gap-6">
            <div className="min-w-0">
              <p className="flex items-center gap-3 text-[10px] font-bold uppercase tracking-[0.28em] text-cream/40 sm:text-[11px]">
                <span className="tabular-nums">02</span>
                <span className="h-px w-10 bg-gold/50 sm:w-14" />
                <span>Storefront</span>
              </p>
              <h2 className="mt-3 font-display text-2xl font-black tracking-tight text-cream sm:mt-4 sm:text-4xl lg:text-5xl">
                {activeCategoryLabel}
              </h2>
              <p className="mt-2 text-xs uppercase tracking-[0.2em] text-cream/45 sm:text-[11px]">
                <span className="tabular-nums">{String(filteredProducts.length).padStart(2, "0")}</span>
                <span className="mx-2 text-cream/25">/</span>
                <span className="tabular-nums">{String(products.length).padStart(2, "0")}</span>
                <span className="ml-2">items</span>
              </p>
            </div>

            <label className="relative block w-full md:w-[320px] lg:w-[360px]">
              <Search
                size={15}
                className="pointer-events-none absolute left-0 top-1/2 -translate-y-1/2 text-cream/40"
              />
              <input
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search the catalog"
                className="h-11 w-full border-0 border-b border-white/15 bg-transparent pl-6 pr-2 text-sm font-semibold text-cream outline-none transition placeholder:text-cream/30 focus:border-gold sm:h-12"
              />
            </label>
          </div>

          {/* Category tab nav — full-width hairline, scrolls horizontally at every breakpoint */}
          <nav className="relative mt-6 sm:mt-8">
            <div className="-mx-3 overflow-x-auto sm:-mx-5 lg:mx-0 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              <ul className="flex min-w-max items-end gap-7 border-b border-white/[0.08] px-3 sm:gap-9 sm:px-5 lg:px-0">
                {filterCategories.map((category) => {
                  const active = activeCategory === category.id;
                  return (
                    <li key={category.id}>
                      <button
                        onClick={() => handleCategoryChange(category.id)}
                        className={`group relative -mb-px flex shrink-0 items-baseline gap-2 border-b-2 pb-3 pt-1 text-[11px] font-bold uppercase tracking-[0.2em] transition sm:text-xs ${
                          active
                            ? "border-gold text-cream"
                            : "border-transparent text-cream/45 hover:text-cream/80"
                        }`}
                      >
                        <span className="whitespace-nowrap">{category.label}</span>
                        <span
                          className={`text-[9px] tabular-nums transition ${
                            active ? "text-gold" : "text-cream/30 group-hover:text-cream/45"
                          }`}
                        >
                          {String(categoryCounts[category.id] ?? 0).padStart(2, "0")}
                        </span>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>
            {/* Edge fades to telegraph scrollability */}
            <span className="pointer-events-none absolute inset-y-0 left-0 w-6 bg-gradient-to-r from-[#04060d] to-transparent lg:hidden" />
            <span className="pointer-events-none absolute inset-y-0 right-0 w-6 bg-gradient-to-l from-[#04060d] to-transparent lg:hidden" />
          </nav>

          {/* Product grid */}
          <div className="mt-8 sm:mt-10">
            {loading ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="animate-pulse rounded-2xl border border-white/[0.06] bg-white/[0.02] overflow-hidden">
                    <div className="aspect-square bg-white/[0.04]" />
                    <div className="p-3 sm:p-4 space-y-2.5">
                      <div className="h-3 w-3/4 rounded bg-white/[0.06]" />
                      <div className="h-2.5 w-1/2 rounded bg-white/[0.04]" />
                      <div className="h-4 w-1/3 rounded bg-white/[0.06]" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
            ) : (
              <div className="border border-dashed border-white/[0.1] px-5 py-14 text-center sm:py-24">
                <p className="font-display text-lg font-black tracking-tight text-cream/70 sm:text-2xl">
                  No products match.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory("all");
                    setQuery("");
                  }}
                  className="mt-5 inline-flex h-11 items-center gap-2 border border-cream px-5 text-[11px] font-black uppercase tracking-[0.22em] text-cream transition hover:bg-cream hover:text-ink"
                >
                  Reset catalog <ArrowRight size={14} />
                </button>
              </div>
            )}
          </div>
        </div>
      </main>

      {/* TRUST */}
      <section className="border-t border-white/[0.05] bg-[#0b101c]/40 py-10 sm:py-16">
        <div className="shell">
          <ul className="grid grid-cols-1 gap-6 text-center sm:grid-cols-3 sm:gap-8">
            {[
              { Icon: ShieldCheck, title: "100% Authentic Stock", text: "Direct importer seals with verified batch codes." },
              { Icon: PackageCheck, title: "Sealed Packaging", text: "Dispatched in pristine tamper-evident condition." },
              { Icon: Truck, title: "Pathao Delivery", text: "Fast, trackable delivery via Pathao Courier nationwide." }
            ].map(({ Icon, title, text }) => (
              <li key={title} className="flex flex-col items-center">
                <div className="mb-3 flex h-11 w-11 items-center justify-center rounded-full bg-gold/10 text-gold sm:mb-4 sm:h-12 sm:w-12">
                  <Icon size={22} />
                </div>
                <h4 className="text-sm font-bold text-cream sm:text-base">{title}</h4>
                <p className="mt-1.5 max-w-[28ch] text-xs text-cream/50 sm:mt-2">{text}</p>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="border-t border-white/[0.05] bg-[#0c1324] pb-8 pt-12 text-cream md:pt-14">
        <div className="shell">
          <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Nutrition Hub Bangladesh Logo"
                width={40}
                height={40}
                className="rounded-lg border border-white/5 object-contain shadow-md"
              />
              <strong className="text-lg font-black leading-tight text-cream sm:text-xl">
                Nutrition Hub
                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-cream/40 sm:text-xs">
                  Bangladesh
                </span>
              </strong>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a href="https://www.facebook.com/share/18WRSVF1Ch/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cream/50 transition-all hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 hover:text-[#1877F2]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" /></svg>
              </a>
              <a href="https://www.instagram.com/nutrition.hub.bd?igsh=amVvaHlpcnI1dDY4" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cream/50 transition-all hover:border-[#E4405F]/40 hover:bg-[#E4405F]/10 hover:text-[#E4405F]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.982c2.937 0 3.285.011 4.445.064a6.087 6.087 0 0 1 2.042.379 3.408 3.408 0 0 1 1.265.823 3.408 3.408 0 0 1 .823 1.265 6.087 6.087 0 0 1 .379 2.042c.053 1.16.064 1.508.064 4.445s-.011 3.285-.064 4.445a6.087 6.087 0 0 1-.379 2.042 3.643 3.643 0 0 1-2.088 2.088 6.087 6.087 0 0 1-2.042.379c-1.16.053-1.508.064-4.445.064s-3.285-.011-4.445-.064a6.087 6.087 0 0 1-2.042-.379 3.408 3.408 0 0 1-1.265-.823 3.408 3.408 0 0 1-.823-1.265 6.087 6.087 0 0 1-.379-2.042c-.053-1.16-.064-1.508-.064-4.445s.011-3.285.064-4.445a6.087 6.087 0 0 1 .379-2.042 3.408 3.408 0 0 1 .823-1.265 3.408 3.408 0 0 1 1.265-.823 6.087 6.087 0 0 1 2.042-.379c1.16-.053 1.508-.064 4.445-.064M12 1c-2.987 0-3.362.013-4.535.066a8.074 8.074 0 0 0-2.67.511 5.392 5.392 0 0 0-1.949 1.27 5.392 5.392 0 0 0-1.269 1.948 8.074 8.074 0 0 0-.51 2.67C1.012 8.639 1 9.014 1 12s.013 3.362.066 4.535a8.074 8.074 0 0 0 .511 2.67 5.392 5.392 0 0 0 1.27 1.949 5.392 5.392 0 0 0 1.948 1.269 8.074 8.074 0 0 0 2.67.51C8.639 22.988 9.014 23 12 23s3.362-.013 4.535-.066a8.074 8.074 0 0 0 2.67-.511 5.625 5.625 0 0 0 3.218-3.218 8.074 8.074 0 0 0 .51-2.67C22.988 15.361 23 14.986 23 12s-.013-3.362-.066-4.535a8.074 8.074 0 0 0-.511-2.67 5.392 5.392 0 0 0-1.27-1.949 5.392 5.392 0 0 0-1.948-1.269 8.074 8.074 0 0 0-2.67-.51C15.361 1.012 14.986 1 12 1Zm0 5.351A5.649 5.649 0 1 0 17.649 12 5.649 5.649 0 0 0 12 6.351Zm0 9.316A3.667 3.667 0 1 1 15.667 12 3.667 3.667 0 0 1 12 15.667Zm5.872-10.859a1.32 1.32 0 1 0 1.32 1.32 1.32 1.32 0 0 0-1.32-1.32Z" /></svg>
              </a>
              <a href="https://www.tiktok.com/@nutrition.hub.bd?_r=1&_t=ZS-96a0cD5XcDX" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="flex h-9 w-9 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-cream/50 transition-all hover:border-cream/40 hover:bg-cream/10 hover:text-cream">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.86 2.86 0 0 1 .87.13V9.01a6.32 6.32 0 0 0-1-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.48a8.27 8.27 0 0 0 3.89.96V7h-.02c0-.1.02-.2.02-.31Z" /></svg>
              </a>
            </div>
          </div>
          <div className="mt-8 grid gap-8 sm:grid-cols-2 md:grid-cols-3 md:gap-10">
            <div>
              <strong className="text-[11px] font-black uppercase tracking-[0.12em] text-cream/40 sm:text-sm">
                Store Categories
              </strong>
              <ul className="mt-3 space-y-2.5 text-sm text-cream/60 sm:mt-4">
                <li
                  className="cursor-pointer transition hover:text-cream"
                  onClick={() => handleCategoryChange("Gym Supplements")}
                >
                  Gym Supplements
                </li>
                <li
                  className="cursor-pointer transition hover:text-cream"
                  onClick={() => handleCategoryChange("Vitamins & Supplements")}
                >
                  Vitamins &amp; Supplements
                </li>
                <li
                  className="cursor-pointer transition hover:text-cream"
                  onClick={() => handleCategoryChange("Protein Oats")}
                >
                  Protein Oats
                </li>
                <li
                  className="cursor-pointer transition hover:text-cream"
                  onClick={() => handleCategoryChange("Peanut Butter")}
                >
                  Peanut Butter
                </li>
              </ul>
            </div>
            <div>
              <strong className="text-[11px] font-black uppercase tracking-[0.12em] text-cream/40 sm:text-sm">
                Trust Metrics
              </strong>
              <ul className="mt-3 space-y-2.5 text-sm text-cream/60 sm:mt-4">
                <li className="flex items-center gap-2">
                  <ShieldCheck size={14} className="shrink-0 text-gold" /> Authenticity checks
                </li>
                <li className="flex items-center gap-2">
                  <PackageCheck size={14} className="shrink-0 text-gold" /> Sealed stock
                </li>
                <li className="flex items-center gap-2">
                  <Truck size={14} className="shrink-0 text-gold" /> Pathao delivery
                </li>
              </ul>
            </div>
          </div>
          <div className="mt-10 flex flex-col items-center justify-between gap-3 border-t border-white/[0.05] pt-6 text-center text-xs text-cream/30 sm:mt-12 sm:flex-row sm:gap-4 sm:pt-8">
            <span>Nutrition Hub Bangladesh. All rights reserved.</span>
            <span>
              Built by{" "}
              <a
                href="https://mindrona.com"
                target="_blank"
                rel="noreferrer"
                className="font-bold text-gold transition hover:text-champagne"
              >
                Mindrona
              </a>
            </span>
          </div>
        </div>
      </footer>
    </div>
  );
}
