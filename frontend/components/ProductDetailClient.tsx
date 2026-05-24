"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { formatTaka, productImage, type Product } from "@/lib/products";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { Reveal } from "@/components/Reveal";
import {
  ArrowLeft,
  ShieldCheck,
  Star,
  ShoppingBag,
  BadgeCheck,
  PackageCheck,
  Truck,
  Clock,
  Check
} from "lucide-react";

export function ProductDetailClient({
  product,
  relatedProducts
}: {
  product: Product;
  relatedProducts: Product[];
}) {
  const { user } = useAuth();
  const { setQuantity, items } = useCart();
  const router = useRouter();
  const [hoveredImage, setHoveredImage] = useState(false);
  const [adding, setAdding] = useState(false);
  const [addMsg, setAddMsg] = useState("");

  const inCart = items.find((it) => it.product_id === product.id)?.quantity || 0;

  useEffect(() => {
    if (typeof window !== "undefined") window.scrollTo(0, 0);
  }, []);

  const specs = (product.detail || "").split(/·|\|/).map((s) => s.trim()).filter(Boolean);
  const accent = product.accent || "#B45309";

  async function handleAddToCart() {
    setAdding(true);
    setAddMsg("");
    try {
      await setQuantity(product.id, inCart + 1, product);
      setAddMsg(`Added to cart (${inCart + 1})`);
    } catch (e) {
      setAddMsg(e instanceof Error ? e.message : "Failed to add");
    } finally {
      setAdding(false);
    }
  }

  return (
    <div className="min-h-screen bg-transparent text-cream selection:bg-gold selection:text-ink">
      <Header />

      <main className="relative pb-28 pt-[5.5rem] md:pb-20 md:pt-[6.5rem]">
        <div className="shell">

          {/* Back link */}
          <Reveal>
            <button
              onClick={() => router.back()}
              className="mb-4 inline-flex items-center gap-1.5 text-xs font-bold text-cream/50 transition hover:text-cream md:mb-6"
            >
              <ArrowLeft size={14} /> Back
            </button>
          </Reveal>

          <div className="grid gap-6 md:gap-10 lg:grid-cols-[1fr_1fr] lg:items-start xl:grid-cols-[1.1fr_0.9fr]">

            {/* Left — Image */}
            <Reveal>
              <div
                className="relative aspect-square w-full overflow-hidden rounded-2xl border border-cream/[0.08] bg-card md:rounded-3xl"
                onMouseEnter={() => setHoveredImage(true)}
                onMouseLeave={() => setHoveredImage(false)}
              >
                {/* Accent glow */}
                <div
                  className="pointer-events-none absolute inset-0 opacity-15 blur-3xl"
                  style={{ background: `radial-gradient(circle at center, ${accent} 0%, transparent 70%)` }}
                />
                <div className={`relative h-full w-full transition-transform duration-700 ease-out ${hoveredImage ? "scale-105" : "scale-100"}`}>
                  <Image
                    src={productImage(product)}
                    alt={product.name}
                    fill
                    className="object-cover"
                    sizes="(max-width: 1024px) 100vw, 550px"
                    priority
                    quality={85}
                  />
                </div>

                {/* Authentic badge */}
                <div className="absolute left-3 top-3 z-10 inline-flex items-center gap-1.5 rounded-full border border-cream/10 bg-ink/80 px-2.5 py-1 text-[9px] font-black uppercase tracking-wider text-mint backdrop-blur-md sm:left-4 sm:top-4 sm:px-3 sm:text-[10px]">
                  <ShieldCheck size={12} className="text-mint" />
                  Authentic
                </div>
              </div>
            </Reveal>

            {/* Right — Info */}
            <div className="flex flex-col">
              <Reveal>
                {/* Category + Rating */}
                <div className="flex items-center gap-3">
                  <span className="text-[10px] font-black uppercase tracking-[0.16em] text-gold sm:text-xs">
                    {product.category?.name || ""}
                  </span>
                  <span className="h-1 w-1 rounded-full bg-cream/20" />
                  <div className="flex items-center gap-1 text-[10px] font-black text-gold sm:text-xs">
                    <Star size={11} className="fill-gold" /> 4.9
                  </div>
                </div>

                {/* Title */}
                <h1 className="mt-2 text-xl font-black leading-tight text-cream sm:mt-3 sm:text-2xl md:text-3xl lg:text-4xl">
                  {product.name}
                </h1>

                {/* Price — prominent on mobile */}
                <div className="mt-3 flex items-baseline gap-3 sm:mt-4">
                  <strong className="text-2xl font-black text-cream sm:text-3xl">{formatTaka(product.price)}</strong>
                  {product.stock > 0 ? (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-mint">
                      <span className="h-1.5 w-1.5 rounded-full bg-mint" /> In Stock
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-xs font-bold text-red-400">
                      <span className="h-1.5 w-1.5 rounded-full bg-red-500" /> Sold Out
                    </span>
                  )}
                </div>

                {/* Spec pills */}
                {specs.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-1.5 sm:mt-4">
                    {specs.map((spec, i) => (
                      <span
                        key={i}
                        className="rounded-md border border-cream/[0.08] bg-cream/[0.03] px-2.5 py-1 text-[9px] font-bold uppercase tracking-wider text-cream/70 sm:text-[10px]"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                )}

                {/* Description */}
                <p className="mt-4 text-sm leading-relaxed text-cream/55 sm:text-base sm:leading-7">
                  {product.description}
                </p>
              </Reveal>

              {/* Desktop Add-to-Cart (hidden on mobile — sticky bar used instead) */}
              <Reveal delay={0.05}>
                <div className="mt-6 hidden md:block">
                  {product.stock > 0 ? (
                    <button
                      onClick={handleAddToCart}
                      disabled={adding}
                      className="flex w-full min-h-[52px] items-center justify-center gap-2 rounded-xl bg-gold text-ink text-sm font-black uppercase tracking-wider transition-all duration-300 hover:bg-champagne shadow-[0_10px_30px_rgb(var(--color-gold)/0.2)] disabled:opacity-50"
                    >
                      <ShoppingBag size={18} />
                      {adding ? "Adding…" : inCart > 0 ? `Add another (${inCart} in cart)` : "Add to cart"}
                    </button>
                  ) : (
                    <button
                      disabled
                      className="flex w-full min-h-[52px] cursor-not-allowed items-center justify-center rounded-xl border border-cream/5 bg-cream/[0.02] text-sm font-black uppercase tracking-wider text-cream/35"
                    >
                      Sold Out
                    </button>
                  )}
                  {addMsg && <p className="mt-2 text-center text-xs text-cream/60">{addMsg}</p>}
                </div>
              </Reveal>

              {/* Trust strip */}
              <Reveal delay={0.1}>
                <div className="mt-6 grid grid-cols-2 gap-2.5 sm:gap-3">
                  {[
                    { icon: ShieldCheck, label: "Importer Sealed", sub: "Original hologram intact" },
                    { icon: Clock, label: "Fresh Expiry", sub: "Long shelf-life guarantee" },
                    { icon: Truck, label: "Pathao Delivery", sub: "COD nationwide" },
                    { icon: BadgeCheck, label: "Batch Verified", sub: "Certificate on request" },
                  ].map(({ icon: Icon, label, sub }) => (
                    <div key={label} className="flex items-start gap-2.5 rounded-xl border border-cream/[0.06] bg-card p-3 sm:gap-3 sm:p-4">
                      <div className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-gold/10 text-gold sm:h-10 sm:w-10">
                        <Icon size={16} className="sm:hidden" />
                        <Icon size={18} className="hidden sm:block" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-cream sm:text-sm">{label}</p>
                        <p className="mt-0.5 text-[10px] text-cream/40 sm:text-xs">{sub}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </Reveal>

              {/* Order info note */}
              <Reveal delay={0.15}>
                <p className="mt-4 text-center text-[11px] text-cream/35 sm:text-xs">
                  Orders verified via phone within 12 hours. Shipped via Pathao Courier (COD).
                </p>
              </Reveal>
            </div>
          </div>

          {/* Related Products */}
          {relatedProducts.length > 0 && (
            <section className="mt-16 border-t border-cream/[0.06] pt-10 sm:mt-20 sm:pt-14">
              <Reveal>
                <div className="mb-6 sm:mb-10">
                  <p className="eyebrow text-gold">You may also like</p>
                  <h2 className="heading-lg text-cream">Related Products</h2>
                </div>
              </Reveal>
              <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
                {relatedProducts.map((p, i) => (
                  <Reveal delay={i * 0.05} key={p.id}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>

      {/* Mobile Sticky Add-to-Cart Bar */}
      <div className="fixed inset-x-0 bottom-0 z-40 border-t border-cream/10 bg-card/95 backdrop-blur-xl px-4 py-3 md:hidden">
        <div className="flex items-center gap-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs font-bold text-cream/70">{product.name}</p>
            <strong className="text-base font-black text-cream">{formatTaka(product.price)}</strong>
          </div>
          {product.stock > 0 ? (
            <button
              onClick={handleAddToCart}
              disabled={adding}
              className="flex h-11 shrink-0 items-center gap-2 rounded-xl bg-gold px-5 text-sm font-black text-ink transition-all duration-300 hover:bg-champagne active:scale-[0.97] disabled:opacity-50"
            >
              {adding ? (
                "Adding…"
              ) : inCart > 0 ? (
                <>
                  <Check size={16} /> In Cart ({inCart})
                </>
              ) : (
                <>
                  <ShoppingBag size={16} /> Add to Cart
                </>
              )}
            </button>
          ) : (
            <span className="flex h-11 shrink-0 items-center rounded-xl border border-cream/5 bg-cream/[0.02] px-5 text-sm font-black text-cream/35">
              Sold Out
            </span>
          )}
        </div>
        {addMsg && <p className="mt-1 text-center text-[10px] text-cream/50">{addMsg}</p>}
      </div>

      {/* Footer */}
      <footer className="border-t border-cream/10 bg-card pb-8 pt-14 text-cream">
        <div className="shell">
          <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div className="flex items-center gap-3">
              <Image
                src="/images/logo.png"
                alt="Nutrition Hub Bangladesh Logo"
                width={40}
                height={40}
                className="rounded-lg border border-cream/5 object-contain shadow-md"
              />
              <strong className="text-xl font-black leading-tight text-cream">
                Nutrition Hub
                <span className="mt-0.5 block text-xs font-bold uppercase tracking-wider text-cream/40">Bangladesh</span>
              </strong>
            </div>
            <div className="flex shrink-0 items-center gap-3">
              <a href="https://www.facebook.com/share/18WRSVF1Ch/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/10 bg-cream/[0.04] text-cream/50 transition-all hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 hover:text-[#1877F2]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" /></svg>
              </a>
              <a href="https://www.instagram.com/nutrition.hub.bd?igsh=amVvaHlpcnI1dDY4" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/10 bg-cream/[0.04] text-cream/50 transition-all hover:border-[#E4405F]/40 hover:bg-[#E4405F]/10 hover:text-[#E4405F]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.982c2.937 0 3.285.011 4.445.064a6.087 6.087 0 0 1 2.042.379 3.408 3.408 0 0 1 1.265.823 3.408 3.408 0 0 1 .823 1.265 6.087 6.087 0 0 1 .379 2.042c.053 1.16.064 1.508.064 4.445s-.011 3.285-.064 4.445a6.087 6.087 0 0 1-.379 2.042 3.643 3.643 0 0 1-2.088 2.088 6.087 6.087 0 0 1-2.042.379c-1.16.053-1.508.064-4.445.064s-3.285-.011-4.445-.064a6.087 6.087 0 0 1-2.042-.379 3.408 3.408 0 0 1-1.265-.823 3.408 3.408 0 0 1-.823-1.265 6.087 6.087 0 0 1-.379-2.042c-.053-1.16-.064-1.508-.064-4.445s.011-3.285.064-4.445a6.087 6.087 0 0 1 .379-2.042 3.408 3.408 0 0 1 .823-1.265 3.408 3.408 0 0 1 1.265-.823 6.087 6.087 0 0 1 2.042-.379c1.16-.053 1.508-.064 4.445-.064M12 1c-2.987 0-3.362.013-4.535.066a8.074 8.074 0 0 0-2.67.511 5.392 5.392 0 0 0-1.949 1.27 5.392 5.392 0 0 0-1.269 1.948 8.074 8.074 0 0 0-.51 2.67C1.012 8.639 1 9.014 1 12s.013 3.362.066 4.535a8.074 8.074 0 0 0 .511 2.67 5.392 5.392 0 0 0 1.27 1.949 5.392 5.392 0 0 0 1.948 1.269 8.074 8.074 0 0 0 2.67.51C8.639 22.988 9.014 23 12 23s3.362-.013 4.535-.066a8.074 8.074 0 0 0 2.67-.511 5.625 5.625 0 0 0 3.218-3.218 8.074 8.074 0 0 0 .51-2.67C22.988 15.361 23 14.986 23 12s-.013-3.362-.066-4.535a8.074 8.074 0 0 0-.511-2.67 5.392 5.392 0 0 0-1.27-1.949 5.392 5.392 0 0 0-1.948-1.269 8.074 8.074 0 0 0-2.67-.51C15.361 1.012 14.986 1 12 1Zm0 5.351A5.649 5.649 0 1 0 17.649 12 5.649 5.649 0 0 0 12 6.351Zm0 9.316A3.667 3.667 0 1 1 15.667 12 3.667 3.667 0 0 1 12 15.667Zm5.872-10.859a1.32 1.32 0 1 0 1.32 1.32 1.32 1.32 0 0 0-1.32-1.32Z" /></svg>
              </a>
              <a href="https://www.tiktok.com/@nutrition.hub.bd?_r=1&_t=ZS-96a0cD5XcDX" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="flex h-9 w-9 items-center justify-center rounded-full border border-cream/10 bg-cream/[0.04] text-cream/50 transition-all hover:border-cream/40 hover:bg-cream/10 hover:text-cream">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.86 2.86 0 0 1 .87.13V9.01a6.32 6.32 0 0 0-1-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.48a8.27 8.27 0 0 0 3.89.96V7h-.02c0-.1.02-.2.02-.31Z" /></svg>
              </a>
            </div>
          </div>
          <div className="mt-8 grid gap-10 md:grid-cols-3">
            <div>
              <strong className="text-sm font-black uppercase tracking-[0.12em] text-cream/40">Store Categories</strong>
              <ul className="mt-4 space-y-3 text-sm text-cream/60">
                <li><Link href="/products?category=Gym Supplements" className="transition hover:text-cream">Gym Supplements</Link></li>
                <li><Link href="/products?category=Vitamins & Supplements" className="transition hover:text-cream">Vitamins & Supplements</Link></li>
                <li><Link href="/products?category=Protein Oats" className="transition hover:text-cream">Protein Oats</Link></li>
                <li><Link href="/products?category=Peanut Butter" className="transition hover:text-cream">Peanut Butter</Link></li>
              </ul>
            </div>
            <div>
              <strong className="text-sm font-black uppercase tracking-[0.12em] text-cream/40">Trust Metrics</strong>
              <ul className="mt-4 space-y-3 text-sm text-cream/60">
                <li className="flex items-center gap-2"><ShieldCheck size={14} className="text-gold" /> Authenticity checks</li>
                <li className="flex items-center gap-2"><PackageCheck size={14} className="text-gold" /> Sealed stock</li>
                <li className="flex items-center gap-2"><Truck size={14} className="text-gold" /> Pathao delivery</li>
              </ul>
            </div>
          </div>
          <div className="mt-12 flex flex-col items-center gap-4 border-t border-cream/[0.05] pt-8 sm:flex-row sm:justify-between">
            <span className="text-[11px] text-cream/35 sm:text-xs">Nutrition Hub Bangladesh. All rights reserved.</span>
            <a
              href="https://mindrona.com"
              target="_blank"
              rel="noopener noreferrer"
              className="mindrona-badge group"
            >
              <span className="mindrona-badge-inner">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="shrink-0 mindrona-icon">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-[0.14em] opacity-60 sm:text-[11px]">Crafted by</span>
                <span className="text-xs font-black tracking-wide sm:text-[13px]">Mindrona</span>
              </span>
            </a>
          </div>
        </div>
      </footer>
    </div>
  );
}
