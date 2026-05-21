"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Header } from "@/components/Header";
import { ProductCard } from "@/components/ProductCard";
import { formatTaka, type Product } from "@/lib/products";
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
  Clock
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

  // Force scroll to top on mount
  useEffect(() => {
    if (typeof window !== "undefined") {
      window.scrollTo(0, 0);
    }
  }, []);

  const specs = product.detail.split(/·|\|/).map((s) => s.trim()).filter(Boolean);

  return (
    <div className="min-h-screen bg-[#04060d] text-cream selection:bg-gold selection:text-ink">
      <Header />

      <main className="relative pt-[5.5rem] pb-20 md:pt-[6.5rem]">
        <div className="shell">

          <div className="grid gap-12 lg:grid-cols-2 lg:items-start">
            
            {/* Left Column - Image Showcase */}
            <div className="relative w-full">
              <Reveal>
                <div 
                  className="relative aspect-square w-full overflow-hidden rounded-[32px] border border-white/10 bg-[#0c1324]/40 p-8 backdrop-blur-md shadow-2xl flex items-center justify-center"
                  onMouseEnter={() => setHoveredImage(true)}
                  onMouseLeave={() => setHoveredImage(false)}
                >
                  <div className="absolute inset-0 rounded-[32px] border border-white/5 pointer-events-none" />
                  
                  {/* Subtle decorative backing glow matching product accent */}
                  <div 
                    className="absolute inset-0 opacity-20 blur-3xl transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at center, ${product.accent} 0%, transparent 70%)`
                    }}
                  />

                  <div className={`relative w-full h-full transition-transform duration-700 ease-out ${hoveredImage ? 'scale-105' : 'scale-100'}`}>
                    <Image
                      src={product.image || "/images/logo.png"}
                      alt={product.name}
                      fill
                      className="object-contain"
                      sizes="(max-width: 1024px) 100vw, 550px"
                      priority
                      quality={85}
                    />
                  </div>
                </div>
              </Reveal>

              {/* Quick Trust Checks under image */}
              {/* Quick Trust Checks under image */}
              <div className="mt-6 grid grid-cols-2 gap-4">
                <div className="rounded-2xl border border-white/[0.05] bg-[#0c1324]/20 p-5 md:p-6 flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold border border-white/5">
                    <ShieldCheck size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-bold text-cream">Importer Sealed</h4>
                    <p className="text-xs text-cream/45 mt-1">Original hologram seals intact</p>
                  </div>
                </div>

                <div className="rounded-2xl border border-white/[0.05] bg-[#0c1324]/20 p-5 md:p-6 flex items-center gap-4">
                  <div className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/15 text-gold border border-white/5">
                    <Clock size={24} />
                  </div>
                  <div>
                    <h4 className="text-sm md:text-base font-bold text-cream">Fresh Expiry</h4>
                    <p className="text-xs text-cream/45 mt-1">Long shelf-life guarantee</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column - Product Info */}
            <div className="flex flex-col">
              <Reveal>
                <div className="flex items-center gap-3">
                  <span className="text-xs font-black uppercase tracking-[0.18em] text-gold">
                    {product.category}
                  </span>
                  <span className="h-1.5 w-1.5 rounded-full bg-white/20" />
                  <div className="flex items-center gap-1 text-xs font-black text-gold">
                    <Star size={12} className="fill-gold" /> 4.9 (Verified)
                  </div>
                </div>

                <h1 className="mt-3 text-3xl md:text-4xl font-black leading-tight text-cream">
                  {product.name}
                </h1>

                {/* Spec Tag Pills */}
                <div className="mt-4 flex flex-wrap gap-2">
                  {specs.map((spec, index) => (
                    <span 
                      key={index}
                      className="rounded-lg border border-white/10 bg-white/[0.04] px-3 py-1 text-xs font-bold uppercase tracking-wider text-cream/80"
                    >
                      {spec}
                    </span>
                  ))}
                </div>

                <p className="mt-6 text-base md:text-lg leading-relaxed text-cream/60">
                  {product.description}
                </p>
              </Reveal>

              {/* Checkout details Card */}
              <Reveal delay={0.05}>
                <div className="mt-8 rounded-3xl border border-white/[0.08] bg-[#0c1324]/60 p-6 md:p-8 backdrop-blur-md relative overflow-hidden">
                  <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.01)_0%,rgba(0,0,0,0)_100%)] pointer-events-none" />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-6">
                    <div className="flex flex-col">
                      <span className="text-xs font-bold uppercase tracking-widest text-cream/40">Guaranteed BD Price</span>
                      <strong className="text-3xl md:text-4xl font-black text-cream mt-1">{formatTaka(product.price)}</strong>
                      <span className="text-[10px] text-mint font-semibold mt-1">Inclusive of VAT & Delivery checks</span>
                    </div>

                    <div className="flex flex-col items-start sm:items-end">
                      <span className="text-xs font-bold uppercase tracking-widest text-cream/40">Stock Status</span>
                      {product.stock > 0 ? (
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-mint mt-1">
                          <span className="h-2 w-2 rounded-full bg-mint" /> In Stock ({product.stock} items)
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-red-400 mt-1">
                          <span className="h-2 w-2 rounded-full bg-red-500" /> Sold Out
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="mt-8 border-t border-white/[0.06] pt-6">
                    {product.stock > 0 ? (
                      <button
                        onClick={async () => {
                          if (!user) {
                            router.push(`/login?redirect=/products/${product.id}`);
                            return;
                          }
                          setAdding(true);
                          setAddMsg("");
                          try {
                            await setQuantity(product.id, inCart + 1);
                            setAddMsg(`Added to cart (${inCart + 1})`);
                          } catch (e) {
                            setAddMsg(e instanceof Error ? e.message : "Failed to add");
                          } finally {
                            setAdding(false);
                          }
                        }}
                        disabled={adding}
                        className="flex w-full min-h-[56px] items-center justify-center gap-2 rounded-xl bg-gold text-ink text-base font-black uppercase tracking-wider transition-all duration-300 hover:bg-champagne shadow-[0_10px_30px_rgba(245,158,11,0.2)] disabled:opacity-50"
                      >
                        <ShoppingBag size={18} />
                        {adding ? "Adding…" : inCart > 0 ? `Add another (${inCart} in cart)` : "Add to cart"}
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex w-full min-h-[56px] items-center justify-center rounded-xl border border-white/5 bg-white/[0.02] text-cream/35 cursor-not-allowed text-base font-black uppercase tracking-wider"
                      >
                        Sold Out
                      </button>
                    )}
                    {addMsg && (
                      <p className="mt-3 text-center text-xs text-cream/60">{addMsg}</p>
                    )}
                  </div>

                  <div className="mt-5 text-center">
                    <p className="text-xs text-cream/40">
                      Orders are verified via phone-call within 12 hours. Nationwide COD shipping.
                    </p>
                  </div>
                </div>
              </Reveal>

              {/* Product trust strip details */}
              <Reveal delay={0.1}>
                <div className="mt-8 rounded-2xl border border-white/[0.05] bg-[#0c1324]/20 p-8 space-y-6">
                  <div className="flex items-start gap-4">
                    <BadgeCheck size={26} className="text-gold shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-base font-bold text-cream md:text-lg">100% Genuine Importer Seal</h4>
                      <p className="text-sm text-cream/55 mt-1.5 leading-relaxed">We source directly from officially recognized brand representatives. Batch certificates available upon request.</p>
                    </div>
                  </div>

                  <div className="flex items-start gap-4">
                    <Truck size={26} className="text-gold shrink-0 mt-0.5" />
                    <div>
                      <h4 className="text-base font-bold text-cream md:text-lg">COD & Nationwide Delivery</h4>
                      <p className="text-sm text-cream/55 mt-1.5 leading-relaxed">Pay after product arrival in Dhaka and nationwide. Check package contents at delivery door.</p>
                    </div>
                  </div>
                </div>
              </Reveal>

            </div>

          </div>

          {/* Related Products Section */}
          {relatedProducts.length > 0 && (
            <section className="mt-24 border-t border-white/[0.06] pt-16">
              <Reveal>
                <div className="mb-10">
                  <p className="eyebrow text-gold">Recommendations</p>
                  <h2 className="heading-md text-cream mt-1">Related Products</h2>
                </div>
              </Reveal>

              <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {relatedProducts.map((p, index) => (
                  <Reveal delay={index * 0.05} key={p.id}>
                    <ProductCard product={p} />
                  </Reveal>
                ))}
              </div>
            </section>
          )}

        </div>
      </main>

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
