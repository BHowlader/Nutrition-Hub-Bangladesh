"use client";

import { useState } from "react";
import Image from "next/image";
import { Star, ShieldCheck, ShoppingBag } from "lucide-react";
import { formatTaka, type Product } from "@/lib/products";

export function ProductCard({ product }: { product: Product }) {
  const [hovered, setHovered] = useState(false);
  const isLightBg = product.id.includes("creatine") || product.id === "daily-multivitamin";

  // Split details into visual pill tags
  const specs = product.detail.split(/·|\|/).map(s => s.trim()).filter(Boolean);

  return (
    <article 
      className="group relative flex flex-col overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#090d16] transition-all duration-500 hover:border-white/20"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        boxShadow: hovered ? `0 30px 60px -15px ${product.accent}20` : "0 10px 30px rgba(0,0,0,0.3)"
      }}
    >
      {/* 100% Authentic Shield Badge */}
      <div className="absolute left-4 top-4 z-20 inline-flex items-center gap-1 rounded-full border border-white/10 bg-[#050811]/90 px-3 py-1 text-[9px] font-black uppercase tracking-wider text-mint backdrop-blur-md">
        <ShieldCheck size={10} className="text-mint" /> Authentic
      </div>

      {/* Image Container with matching background blend */}
      <div className={`relative h-[250px] w-full overflow-hidden p-6 border-b border-white/[0.05] transition-colors duration-500 ${isLightBg ? 'bg-white' : 'bg-[#050811]'}`}>
        {isLightBg ? (
          <div className="absolute inset-0 bg-gradient-to-b from-black/[0.02] to-transparent pointer-events-none" />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-b from-white/[0.02] to-transparent pointer-events-none" />
        )}

        <div className={`relative h-full w-full drop-shadow-[0_20px_40px_rgba(0,0,0,0.15)] transition-transform duration-700 ease-out ${hovered ? 'scale-110 -translate-y-1' : 'scale-100'}`}>
          <Image
            src={product.image || "/images/logo.png"}
            alt={product.name}
            fill
            className="object-contain"
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            priority
          />
        </div>
      </div>

      {/* Info Content Section */}
      <div className="flex flex-1 flex-col p-6 bg-[#0c1324]/50 backdrop-blur-md">
        {/* Category & Verified Rating */}
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[10px] font-black uppercase tracking-[0.15em] text-cream/40">
            {product.category}
          </span>
          <div className="flex items-center gap-1 text-[11px] font-black text-gold">
            <Star size={11} className="fill-gold" /> 4.9
          </div>
        </div>

        {/* Title */}
        <h3 className="text-lg font-bold leading-snug text-cream transition-colors duration-300 group-hover:text-gold">
          {product.name}
        </h3>

        {/* Description */}
        <p className="mt-2 line-clamp-2 text-xs leading-relaxed text-cream/50 min-h-[32px]">
          {product.description}
        </p>

        {/* Dynamic Spec Pills */}
        <div className="mt-4 flex flex-wrap gap-1.5 min-h-[22px]">
          {specs.map((spec, index) => (
            <span 
              key={index}
              className="rounded-lg border border-white/5 bg-white/[0.02] px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cream/70"
            >
              {spec}
            </span>
          ))}
        </div>

        {/* Price & Action Drawer */}
        <div className="mt-6 border-t border-white/[0.06] pt-5 flex items-center justify-between">
          <div className="flex flex-col">
            <span className="text-[9px] font-bold uppercase tracking-widest text-cream/30">BD Price</span>
            <strong className="text-xl font-black text-cream">{formatTaka(product.price)}</strong>
          </div>

          <button 
            className="group/btn relative flex h-10 w-24 items-center justify-center overflow-hidden rounded-xl border border-white/10 bg-white/5 text-cream transition-all duration-300 hover:border-gold/50 hover:bg-gold hover:text-ink"
          >
            <ShoppingBag size={14} className="mr-1.5 transition-transform duration-300 group-hover/btn:scale-110" />
            <span className="text-xs font-black">Buy</span>
          </button>
        </div>
      </div>
    </article>
  );
}
