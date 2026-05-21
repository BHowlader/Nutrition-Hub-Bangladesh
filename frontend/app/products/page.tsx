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
  Package,
  PackageCheck,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  UtensilsCrossed,
  Wallet
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
      <section className="relative overflow-hidden border-b border-white/[0.06] pb-10 pt-20 sm:pb-14 sm:pt-28 md:pb-20 md:pt-32">
        {/* Background layers */}
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/images/gym-bg.png"
            alt=""
            fill
            className="object-cover opacity-[0.16]"
            sizes="100vw"
            quality={55}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-[#04060d] via-[#04060d]/85 to-[#04060d]/55" />
          <div className="absolute inset-0 bg-gradient-to-b from-[#04060d] via-transparent to-[#04060d]" />
          {/* Radial accent glow */}
          <div className="absolute -left-24 top-1/3 h-72 w-72 rounded-full bg-gold/20 blur-[120px] sm:h-96 sm:w-96" />
          <div className="absolute right-0 top-0 h-72 w-72 rounded-full bg-mint/10 blur-[100px] sm:h-96 sm:w-96" />
          {/* Subtle grid pattern */}
          <div
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(rgba(255,255,255,0.6) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.6) 1px, transparent 1px)",
              backgroundSize: "44px 44px"
            }}
          />
        </div>

        <div className="shell relative z-10 grid items-center gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.85fr)] lg:gap-12">
          {/* LEFT — copy */}
          <div className="min-w-0">
            {/* Live status chip */}
            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-[#0c1324]/65 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-cream/70 backdrop-blur-md sm:text-[11px]">
              <span className="relative flex h-1.5 w-1.5">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint/70 opacity-75" />
                <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-mint" />
              </span>
              Live · {products.length || "—"} SKUs restocked weekly
            </div>

            <p className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.22em] text-gold sm:text-xs">
              <Sparkles size={12} className="text-gold" /> Premium Catalog
            </p>

            <h1 className="mt-2 break-words text-[2.1rem] font-black leading-[1.04] tracking-tight text-cream sm:mt-3 sm:text-5xl md:text-6xl lg:text-[4.4rem] lg:leading-[1]">
              Verified{" "}
              <span className="bg-gradient-to-r from-gold via-champagne to-mint bg-clip-text text-transparent">
                supplements
              </span>
              ,<br className="hidden sm:block" /> organized for{" "}
              <span className="relative inline-block">
                <span className="relative z-10">serious buyers.</span>
                <span className="absolute inset-x-0 bottom-1 -z-0 h-2 bg-gold/25 sm:h-3" />
              </span>
            </h1>

            <p className="mt-4 max-w-xl text-sm leading-relaxed text-cream/60 sm:mt-5 sm:text-base md:text-lg">
              Authentic <strong className="font-bold text-cream/80">sports nutrition</strong>,
              wellness essentials, breakfast staples, and herbal formulas with clear stock and pricing.
            </p>

            {/* Stat cards with icons */}
            <dl className="mt-6 grid grid-cols-3 gap-2 sm:mt-8 sm:max-w-xl sm:gap-3">
              {[
                { Icon: Package, label: "Products", value: String(products.length || "—"), tone: "from-gold/15 to-gold/0", iconColor: "text-gold" },
                { Icon: PackageCheck, label: "In stock", value: String(availableCount || "—"), tone: "from-mint/15 to-mint/0", iconColor: "text-mint" },
                { Icon: Wallet, label: "Payment", value: "COD", tone: "from-champagne/15 to-champagne/0", iconColor: "text-champagne" }
              ].map(({ Icon, label, value, tone, iconColor }) => (
                <div
                  key={label}
                  className="group relative overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c1324]/70 p-2.5 backdrop-blur-md transition hover:border-white/15 sm:p-4"
                >
                  <div className={`pointer-events-none absolute inset-0 bg-gradient-to-br ${tone} opacity-60`} />
                  <div className="relative flex items-center gap-2 sm:gap-2.5">
                    <div className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-white/[0.06] ${iconColor} sm:h-9 sm:w-9`}>
                      <Icon size={14} className="sm:hidden" />
                      <Icon size={18} className="hidden sm:block" />
                    </div>
                    <div className="min-w-0">
                      <dd className="text-base font-black leading-none text-cream sm:text-2xl">{value}</dd>
                      <dt className="mt-1 text-[8px] font-bold uppercase tracking-wider text-cream/45 sm:mt-1.5 sm:text-[10px]">
                        {label}
                      </dt>
                    </div>
                  </div>
                </div>
              ))}
            </dl>

            {/* CTAs */}
            <div className="mt-6 flex flex-wrap items-center gap-3 sm:mt-8">
              <button
                type="button"
                onClick={() => catalogRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })}
                className="group inline-flex h-12 items-center gap-2 rounded-xl bg-gradient-to-r from-gold to-champagne px-5 text-sm font-black text-ink shadow-[0_18px_40px_-12px_rgba(96,165,250,0.55)] transition hover:shadow-[0_24px_50px_-12px_rgba(96,165,250,0.7)] active:scale-[0.98] sm:px-6"
              >
                Browse catalog
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-0.5" />
              </button>
              <div className="hidden items-center gap-2 text-xs font-bold text-cream/55 sm:flex">
                <ShieldCheck size={14} className="text-mint" /> 100% authentic, sealed packaging
              </div>
            </div>
          </div>

          {/* RIGHT — Featured spotlight (lg+) */}
          {featuredProduct && (
            <div className="relative hidden lg:block">
              {/* Decorative orbits */}
              <div className="pointer-events-none absolute inset-0 -z-10">
                <div className="absolute left-1/2 top-1/2 h-[420px] w-[420px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.06]" />
                <div className="absolute left-1/2 top-1/2 h-[320px] w-[320px] -translate-x-1/2 -translate-y-1/2 rounded-full border border-white/[0.04]" />
                <div className="absolute left-1/2 top-1/2 h-[220px] w-[220px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/15 blur-3xl" />
              </div>

              <div className="relative mx-auto w-full max-w-[420px]">
                {/* Floating badge top */}
                <div className="absolute -left-4 top-6 z-20 flex items-center gap-1.5 rounded-full border border-white/10 bg-[#0c1324]/85 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-mint backdrop-blur-md">
                  <Sparkles size={11} className="text-mint" /> Spotlight
                </div>
                {/* Floating badge right */}
                <div className="absolute -right-2 top-20 z-20 flex items-center gap-1.5 rounded-full border border-gold/30 bg-gold/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-gold backdrop-blur-md">
                  <Star size={11} className="fill-gold" /> 4.9
                </div>

                <Link
                  href={`/products/${featuredProduct.slug}`}
                  className="group relative block overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c1324]/70 backdrop-blur-md transition hover:border-gold/35"
                >
                  <div className="relative aspect-[4/5] w-full overflow-hidden bg-[#050811]">
                    <Image
                      src={featuredProduct.image_url || "/images/logo.png"}
                      alt={featuredProduct.name}
                      fill
                      className="object-cover transition duration-700 group-hover:scale-105"
                      sizes="420px"
                      quality={72}
                      priority
                    />
                    <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-[#0c1324] via-[#0c1324]/70 to-transparent" />
                  </div>

                  <div className="absolute inset-x-0 bottom-0 p-5">
                    <span className="text-[10px] font-black uppercase tracking-[0.18em] text-cream/50">
                      {featuredProduct.category?.name || "Featured"}
                    </span>
                    <h3 className="mt-1 line-clamp-2 text-xl font-black leading-tight text-cream">
                      {featuredProduct.name}
                    </h3>
                    <div className="mt-3 flex items-end justify-between gap-3">
                      <div>
                        <span className="text-[9px] font-bold uppercase tracking-widest text-cream/35">
                          From
                        </span>
                        <strong className="block text-2xl font-black leading-tight text-cream">
                          {formatTaka(featuredProduct.price)}
                        </strong>
                      </div>
                      <span className="inline-flex h-10 items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.06] px-3.5 text-xs font-black text-cream transition group-hover:border-gold/50 group-hover:bg-gold group-hover:text-ink">
                        View
                        <ArrowRight size={14} />
                      </span>
                    </div>
                  </div>
                </Link>
              </div>
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
