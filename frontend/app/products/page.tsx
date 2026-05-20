"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { formatTaka, products } from "@/lib/products";
import {
  ArrowRight,
  BadgeCheck,
  Dumbbell,
  PackageCheck,
  Pill,
  Search,
  ShieldCheck,
  Sparkles,
  Truck
} from "lucide-react";

const filterCategories = [
  { id: "all", label: "All Products", icon: Dumbbell },
  { id: "Vitamins and minerals", label: "Vitamins & Minerals", icon: Pill },
  { id: "Breakfast Cereal and peanut butter", label: "Breakfast & Peanut Butter", icon: Sparkles },
  { id: "Herbal Supplements", label: "Herbal Supplements", icon: ShieldCheck }
];

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [query, setQuery] = useState("");

  // Force scroll to top on mount for page transition
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  const categoryProducts = activeCategory === "all"
    ? products
    : products.filter((product) => product.category === activeCategory);

  const filteredProducts = categoryProducts.filter((product) => {
    const searchText = `${product.name} ${product.category} ${product.description} ${product.detail}`.toLowerCase();
    return searchText.includes(query.trim().toLowerCase());
  });

  const categoryCounts = filterCategories.reduce<Record<string, number>>((acc, category) => {
    acc[category.id] = category.id === "all"
      ? products.length
      : products.filter((product) => product.category === category.id).length;
    return acc;
  }, {});

  const availableCount = products.filter((product) => product.stock > 0).length;
  const featuredProducts = products.filter((product) => product.stock > 0).slice(0, 3);
  const activeCategoryLabel = activeCategory === "all"
    ? "All products"
    : filterCategories.find((category) => category.id === activeCategory)?.label;

  return (
    <div className="min-h-screen bg-[#04060d] text-cream selection:bg-gold selection:text-ink">
      <Header />

      <section className="relative overflow-hidden border-b border-white/[0.06] pb-12 pt-[7.25rem] md:pb-16 md:pt-[8.75rem]">
        <div className="absolute inset-0 z-0 pointer-events-none">
          <Image
            src="/images/gym-bg.png"
            alt=""
            fill
            className="object-cover opacity-[0.18]"
            sizes="100vw"
            quality={55}
          />
          <div className="absolute inset-0 bg-[linear-gradient(90deg,#04060d_0%,rgba(4,6,13,0.88)_42%,rgba(4,6,13,0.58)_100%)]" />
          <div className="absolute inset-0 bg-[linear-gradient(180deg,#04060d_0%,rgba(4,6,13,0.2)_45%,#04060d_100%)]" />
        </div>

        <div className="shell relative z-10 grid items-end gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(360px,0.65fr)]">
          <div className="max-w-3xl">
            <p className="eyebrow text-gold">Premium Catalog</p>
            <h1 className="text-[clamp(2.8rem,6vw,5.8rem)] font-black leading-[0.92] tracking-tight">
              Verified supplements, organized for serious buyers.
            </h1>
            <p className="mt-6 max-w-2xl text-base leading-relaxed text-cream/60 md:text-lg">
              Browse authentic sports nutrition, wellness essentials, breakfast staples, and herbal formulas with clear stock, serving size, and pricing details.
            </p>

            <div className="mt-8 grid max-w-2xl grid-cols-3 overflow-hidden rounded-xl border border-white/[0.08] bg-[#0c1324]/60 backdrop-blur-md">
              <div className="p-4">
                <strong className="block text-2xl font-black text-cream">{products.length}</strong>
                <span className="text-xs font-bold uppercase tracking-wider text-cream/40">Products</span>
              </div>
              <div className="border-x border-white/[0.06] p-4">
                <strong className="block text-2xl font-black text-cream">{availableCount}</strong>
                <span className="text-xs font-bold uppercase tracking-wider text-cream/40">In stock</span>
              </div>
              <div className="p-4">
                <strong className="block text-2xl font-black text-cream">COD</strong>
                <span className="text-xs font-bold uppercase tracking-wider text-cream/40">Available</span>
              </div>
            </div>
          </div>

          <div className="hidden lg:block">
            <div className="mb-4 flex items-center justify-between">
              <span className="text-xs font-black uppercase tracking-[0.18em] text-cream/45">Featured stock</span>
              <BadgeCheck size={18} className="text-gold" />
            </div>
            <div className="space-y-3">
              {featuredProducts.map((product) => (
                <article key={product.id} className="group flex items-center gap-4 rounded-xl border border-white/[0.08] bg-[#0c1324]/72 p-3 backdrop-blur-md transition hover:border-gold/35">
                  <div className="relative h-20 w-20 shrink-0 overflow-hidden rounded-lg bg-[#050811]">
                    <Image
                      src={product.image || "/images/logo.png"}
                      alt={product.name}
                      fill
                      className="object-cover transition duration-500 group-hover:scale-105"
                      sizes="80px"
                      quality={60}
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-black text-cream">{product.name}</p>
                    <p className="mt-1 text-xs font-semibold text-cream/45">{product.badge}</p>
                  </div>
                  <strong className="whitespace-nowrap text-sm font-black text-gold">{formatTaka(product.price)}</strong>
                </article>
              ))}
            </div>
          </div>
        </div>
      </section>

      <main className="relative py-12 md:py-16">
        <div className="shell grid items-start gap-8 lg:grid-cols-[280px_minmax(0,1fr)]">
          <aside className="lg:sticky lg:top-[7.5rem] lg:max-h-[calc(100svh-8.5rem)] lg:self-start">
            <div className="rounded-xl border border-white/[0.08] bg-[#0c1324]/55 p-4 backdrop-blur-md lg:max-h-[calc(100svh-8.5rem)] lg:overflow-y-auto">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-black uppercase tracking-[0.14em] text-cream/55">Categories</h2>
                <span className="rounded-full bg-white/[0.06] px-2.5 py-1 text-[10px] font-black text-cream/45">
                  {filteredProducts.length}
                </span>
              </div>

              <div className="space-y-2">
                {filterCategories.map((category) => {
                  const Icon = category.icon;
                  const active = activeCategory === category.id;

                  return (
                    <button
                      key={category.id}
                      onClick={() => setActiveCategory(category.id)}
                      className={`flex w-full items-center justify-between gap-3 rounded-lg border px-3 py-3 text-left transition ${
                        active
                          ? "border-gold/55 bg-gold/10 text-cream"
                          : "border-white/[0.06] bg-white/[0.02] text-cream/60 hover:border-white/15 hover:bg-white/[0.05] hover:text-cream"
                      }`}
                    >
                      <span className="flex min-w-0 items-center gap-3">
                        <Icon size={17} className={active ? "text-gold" : "text-cream/40"} />
                        <span className="truncate text-sm font-bold">{category.label}</span>
                      </span>
                      <span className="text-xs font-black text-cream/40">{categoryCounts[category.id]}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </aside>

          <section>
            <div className="mb-8 flex flex-col gap-4 border-b border-white/[0.06] pb-6 md:flex-row md:items-end md:justify-between">
              <div>
                <p className="text-xs font-black uppercase tracking-[0.18em] text-gold">Storefront</p>
                <h2 className="mt-2 text-3xl font-black tracking-tight text-cream md:text-4xl">
                  {activeCategoryLabel}
                </h2>
                <p className="mt-2 text-sm text-cream/50">
                  Showing {filteredProducts.length} of {products.length} items.
                </p>
              </div>

              <label className="relative block w-full md:w-[360px]">
                <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-cream/40" />
                <input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search products"
                  className="h-12 w-full rounded-xl border border-white/[0.08] bg-[#0c1324]/65 pl-11 pr-4 text-sm font-semibold text-cream outline-none transition placeholder:text-cream/30 focus:border-gold/50"
                />
              </label>
            </div>

            {filteredProducts.length > 0 ? (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
                {filteredProducts.map((product) => (
                  <ProductCard product={product} key={product.id} />
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-white/[0.1] bg-[#0c1324]/35 px-6 py-20 text-center">
                <p className="text-lg font-bold text-cream/65">No products found.</p>
                <button
                  onClick={() => {
                    setActiveCategory("all");
                    setQuery("");
                  }}
                  className="mt-5 inline-flex min-h-11 items-center gap-2 rounded-lg bg-gold px-5 text-sm font-black text-ink"
                >
                  Reset catalog <ArrowRight size={16} />
                </button>
              </div>
            )}
          </section>
        </div>
      </main>

      {/* Trust Badge row */}
      <section className="bg-[#0b101c]/40 py-16 border-t border-white/[0.05]">
        <div className="shell">
          <div className="grid gap-8 sm:grid-cols-3 text-center">
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
                <ShieldCheck size={24} />
              </div>
              <h4 className="text-base font-bold text-cream">100% Authentic Stock</h4>
              <p className="mt-2 text-xs text-cream/50">Direct importer seals with verified batch codes.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
                <PackageCheck size={24} />
              </div>
              <h4 className="text-base font-bold text-cream">Sealed Packaging</h4>
              <p className="mt-2 text-xs text-cream/50">Every item dispatched in pristine tamper-evident conditions.</p>
            </div>
            <div className="flex flex-col items-center">
              <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-gold/10 text-gold">
                <Truck size={24} />
              </div>
              <h4 className="text-base font-bold text-cream">Nationwide Delivery</h4>
              <p className="mt-2 text-xs text-cream/50">Super fast and reliable doorstep shipping across BD.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-[#0c1324] pt-14 pb-8 text-cream border-t border-white/[0.05]">
        <div className="shell">
          <div className="grid gap-10 md:grid-cols-[1.2fr_0.8fr_0.8fr]">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <Image
                  src="/images/logo.png"
                  alt="Nutrition Hub Bangladesh Logo"
                  width={40}
                  height={40}
                  className="rounded-lg object-contain border border-white/5 shadow-md"
                />
                <strong className="text-xl font-black leading-tight text-cream">
                  Nutrition Hub
                  <span className="block text-xs font-bold text-cream/40 tracking-wider uppercase mt-0.5">Bangladesh</span>
                </strong>
              </div>
              <p className="max-w-sm text-sm leading-relaxed text-cream/50">
                Premium supplement storefront for authentic sports nutrition, wellness, and goal-based product guidance in Bangladesh.
              </p>
            </div>
            <div>
              <strong className="text-sm font-black uppercase tracking-[0.12em] text-cream/40">Store Categories</strong>
              <ul className="mt-4 space-y-3 text-sm text-cream/60">
                <li className="transition hover:text-cream cursor-pointer" onClick={() => setActiveCategory("Vitamins and minerals")}>Vitamins & Minerals</li>
                <li className="transition hover:text-cream cursor-pointer" onClick={() => setActiveCategory("Breakfast Cereal and peanut butter")}>Breakfast & Peanut Butter</li>
                <li className="transition hover:text-cream cursor-pointer" onClick={() => setActiveCategory("Herbal Supplements")}>Herbal Supplements</li>
              </ul>
            </div>
            <div>
              <strong className="text-sm font-black uppercase tracking-[0.12em] text-cream/40">Trust Metrics</strong>
              <ul className="mt-4 space-y-3 text-sm text-cream/60">
                <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-gold" /> Authenticity checks</li>
                <li className="flex items-center gap-2"><PackageCheck size={14} className="text-gold" /> Sealed stock</li>
                <li className="flex items-center gap-2"><Truck size={14} className="text-gold" /> Bangladesh delivery</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 border-t border-white/[0.05] pt-8 text-center text-xs text-cream/30 flex flex-col sm:flex-row items-center justify-between gap-4">
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
