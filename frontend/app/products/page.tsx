"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import Link from "next/link";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { fetchProducts, formatTaka, type Product } from "@/lib/products";
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

  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
      const params = new URLSearchParams(window.location.search);
      const cat = params.get("category");
      if (cat && filterCategories.some((c) => c.id === cat)) {
        setActiveCategory(cat);
      }
    }
    fetchProducts().then(setProducts);
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
    <div className="min-h-screen overflow-x-hidden bg-[#04060d] text-cream selection:bg-gold selection:text-ink">
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
                    src={featuredProduct.image_url || "/images/logo.png"}
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
        className="relative scroll-mt-[66px] py-6 md:scroll-mt-28 md:py-16"
      >
        <div className="shell md:grid md:grid-cols-[240px_minmax(0,1fr)] md:items-start md:gap-8 xl:grid-cols-[260px_minmax(0,1fr)]">
          {/* Desktop sidebar */}
          <aside className="hidden md:sticky md:top-28 md:block md:self-start">
            <div className="rounded-xl border border-white/[0.08] bg-[#0c1324]/55 p-4 backdrop-blur-md">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-xs font-black uppercase tracking-[0.14em] text-cream/55">
                  Categories
                </h2>
                <span className="rounded-full bg-white/[0.06] px-2 py-0.5 text-[10px] font-black text-cream/45">
                  {filteredProducts.length}
                </span>
              </div>
              <div className="space-y-1.5">
                {filterCategories.map((category) => {
                  const Icon = category.icon;
                  const active = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`flex w-full items-center justify-between gap-2 rounded-lg border px-3 py-2.5 text-left text-sm font-bold transition ${
                        active
                          ? "border-gold/55 bg-gold/10 text-cream"
                          : "border-white/[0.06] bg-white/[0.02] text-cream/60 hover:border-white/15 hover:bg-white/[0.05] hover:text-cream"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Icon size={16} className={`shrink-0 ${active ? "text-gold" : "text-cream/40"}`} />
                        <span className="truncate">{category.label}</span>
                      </span>
                      <span className="shrink-0 text-xs font-black text-cream/40">
                        {categoryCounts[category.id]}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          {/* Catalog list */}
          <section className="min-w-0">
            {/* Filter bar — sticky on mobile, static on desktop */}
            <div className="sticky top-[64px] z-30 -mx-3 mb-5 border-b border-white/[0.06] bg-[#04060d]/95 px-3 pb-3 pt-3 backdrop-blur-xl sm:-mx-5 sm:px-5 md:static md:top-auto md:mx-0 md:mb-8 md:border-b-0 md:bg-transparent md:px-0 md:py-0 md:backdrop-blur-none">
              <div className="flex flex-col gap-3 md:flex-row md:items-end md:justify-between md:gap-4 md:border-b md:border-white/[0.06] md:pb-6">
                <div className="min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-[0.18em] text-gold md:text-xs">
                    Storefront
                  </p>
                  <h2 className="mt-1 truncate text-xl font-black tracking-tight text-cream md:mt-2 md:text-3xl lg:text-4xl">
                    {activeCategoryLabel}
                  </h2>
                  <p className="mt-0.5 text-xs text-cream/50 md:mt-2 md:text-sm">
                    {filteredProducts.length} of {products.length} items
                  </p>
                </div>

                <label className="relative block w-full md:w-[300px] lg:w-[340px]">
                  <Search
                    size={16}
                    className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-cream/40"
                  />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Search products"
                    className="h-11 w-full rounded-xl border border-white/[0.08] bg-[#0c1324]/75 pl-10 pr-3 text-sm font-semibold text-cream outline-none transition placeholder:text-cream/30 focus:border-gold/50 md:h-12"
                  />
                </label>
              </div>

              {/* Mobile category chips */}
              <div className="-mx-3 mt-3 flex gap-2 overflow-x-auto px-3 pb-0.5 sm:-mx-5 sm:px-5 md:hidden [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                {filterCategories.map((category) => {
                  const Icon = category.icon;
                  const active = activeCategory === category.id;
                  return (
                    <button
                      key={category.id}
                      onClick={() => handleCategoryChange(category.id)}
                      className={`flex h-9 shrink-0 items-center gap-1.5 rounded-full border px-3.5 text-xs font-bold transition ${
                        active
                          ? "border-gold/55 bg-gold/10 text-cream"
                          : "border-white/[0.06] bg-white/[0.03] text-cream/60"
                      }`}
                    >
                      <Icon size={13} className={active ? "text-gold" : "text-cream/40"} />
                      <span className="whitespace-nowrap">{category.label}</span>
                      <span className="text-[10px] text-cream/30">
                        ({categoryCounts[category.id]})
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Product grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:gap-5 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/[0.1] bg-[#0c1324]/35 px-5 py-12 text-center sm:py-20">
                <p className="text-base font-bold text-cream/65 sm:text-lg">
                  No products found.
                </p>
                <button
                  onClick={() => {
                    setActiveCategory("all");
                    setQuery("");
                  }}
                  className="mt-4 inline-flex h-11 items-center gap-2 rounded-lg bg-gold px-5 text-sm font-black text-ink active:scale-[0.98]"
                >
                  Reset catalog <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* TRUST */}
      <section className="border-t border-white/[0.05] bg-[#0b101c]/40 py-10 sm:py-16">
        <div className="shell">
          <ul className="grid grid-cols-1 gap-6 text-center sm:grid-cols-3 sm:gap-8">
            {[
              { Icon: ShieldCheck, title: "100% Authentic Stock", text: "Direct importer seals with verified batch codes." },
              { Icon: PackageCheck, title: "Sealed Packaging", text: "Dispatched in pristine tamper-evident condition." },
              { Icon: Truck, title: "Nationwide Delivery", text: "Fast, reliable doorstep shipping across Bangladesh." }
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
          <div className="grid gap-8 sm:grid-cols-2 md:grid-cols-[1.2fr_0.8fr_0.8fr] md:gap-10">
            <div className="sm:col-span-2 md:col-span-1">
              <div className="mb-4 flex items-center gap-3">
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
              <p className="max-w-sm text-sm leading-relaxed text-cream/50">
                Premium supplement storefront for authentic sports nutrition, wellness, and goal-based product guidance in Bangladesh.
              </p>
            </div>
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
                  <Truck size={14} className="shrink-0 text-gold" /> Bangladesh delivery
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
