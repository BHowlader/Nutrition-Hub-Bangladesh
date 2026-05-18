"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { products } from "@/lib/products";
import { ArrowRight, ShieldCheck, PackageCheck, Truck, Sparkles, Pill, HeartPulse } from "lucide-react";

const filterCategories = [
  { id: "all", label: "All Products" },
  { id: "Vitamins and minerals", label: "Vitamins & Minerals" },
  { id: "Breakfast Cereal and peanut butter", label: "Breakfast & Peanut Butter" },
  { id: "Herbal Supplements", label: "Herbal Supplements" }
];

export default function ProductsPage() {
  const [activeCategory, setActiveCategory] = useState("all");

  // Force scroll to top on mount for page transition
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  const filteredProducts = activeCategory === "all"
    ? products
    : products.filter(p => p.category === activeCategory);

  return (
    <div className="min-h-screen bg-[#04060d] text-cream selection:bg-gold selection:text-ink">
      <Header />

      {/* Hero Banner Section */}
      <section className="relative overflow-hidden pt-32 pb-16 md:pt-40 md:pb-24 border-b border-white/[0.05]">
        {/* Soft blur backdrops */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="absolute -left-20 -top-20 h-[500px] w-[500px] rounded-full bg-gold/5 blur-[120px] mix-blend-screen" />
          <div className="absolute -right-20 -bottom-20 h-[600px] w-[600px] rounded-full bg-mint/5 blur-[130px] mix-blend-screen" />
        </div>

        <div className="shell relative z-10">
          <Reveal>
            <div className="text-center max-w-3xl mx-auto">
              <p className="eyebrow text-gold">Premium Catalog</p>
              <h1 className="text-[clamp(2.5rem,5vw,4.5rem)] font-black leading-[1.05] tracking-tight uppercase">
                Explore Our{" "}
                <span className="bg-gradient-to-r from-gold via-champagne to-mint bg-clip-text text-transparent">
                  Verified Store
                </span>
              </h1>
              <p className="mt-4 text-base md:text-lg leading-relaxed text-cream/60">
                100% genuine batch-tested sports nutrition, vitamins, breakfast cereals, and high-potency herbal stack formulations in Bangladesh.
              </p>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Main Catalog Showcase */}
      <main className="py-16 md:py-24">
        <div className="shell">
          
          {/* Filtering Header Bar */}
          <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between mb-12 border-b border-white/[0.05] pb-8">
            {/* Filter Tabs */}
            <div className="flex flex-wrap gap-2">
              {filterCategories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`rounded-full px-5 py-2.5 text-xs font-black uppercase tracking-wider transition-all duration-300 ${
                    activeCategory === cat.id
                      ? "bg-gold text-ink border border-gold shadow-[0_0_20px_rgba(245,158,11,0.2)]"
                      : "bg-[#0c1324]/40 text-cream/60 border border-white/[0.06] hover:border-gold/30 hover:text-cream hover:bg-[#0c1324]/80"
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>

            {/* Dynamic Counter */}
            <div className="text-xs font-bold uppercase tracking-[0.2em] text-cream/40">
              Showing <span className="text-gold font-black">{filteredProducts.length}</span> out of {products.length} Products
            </div>
          </div>

          {/* Product Cards Grid */}
          {filteredProducts.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {filteredProducts.map((product, index) => (
                <Reveal key={product.id} delay={index * 0.04}>
                  <ProductCard product={product} />
                </Reveal>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 border border-dashed border-white/[0.08] rounded-3xl bg-[#0c1324]/20">
              <p className="text-cream/50 text-lg">No products found in this category.</p>
            </div>
          )}
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
