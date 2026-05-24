"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { Star, ShieldCheck, ShoppingBag } from "lucide-react";
import { formatTaka, productImage, type Product } from "@/lib/products";

export function ProductCard({ product, priority = false }: { product: Product; priority?: boolean }) {
  const [hovered, setHovered] = useState(false);

  const specs = (product.detail || "")
    .split(/·|\|/)
    .map((s) => s.trim())
    .filter(Boolean);
  const accent = product.accent || "#F59E0B";

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex h-full min-w-0 flex-col overflow-hidden rounded-xl border border-white/[0.08] bg-ink transition-all duration-500 hover:border-white/20 sm:rounded-2xl"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        boxShadow: hovered
          ? `0 30px 60px -15px ${accent}20`
          : "0 10px 30px rgba(0,0,0,0.3)"
      }}
    >
      {/* Authentic badge */}
      <div className="absolute left-2 top-2 z-20 inline-flex items-center gap-1 rounded-full border border-white/10 bg-ink/90 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-mint sm:backdrop-blur-md sm:left-3 sm:top-3 sm:px-2.5 sm:text-[9px]">
        <ShieldCheck size={10} className="shrink-0 text-mint" />
        <span className="hidden xs:inline sm:inline">Authentic</span>
      </div>

      {/* Sold-out overlay */}
      {product.stock === 0 && (
        <div className="absolute right-2 top-2 z-20 inline-flex items-center gap-1 rounded-full border border-red-500/20 bg-red-500/10 px-2 py-1 text-[8px] font-black uppercase tracking-wider text-red-400 sm:backdrop-blur-md sm:right-3 sm:top-3 sm:px-2.5 sm:text-[9px]">
          Sold Out
        </div>
      )}

      {/* Image */}
      <div className="relative aspect-square w-full overflow-hidden border-b border-white/[0.05] bg-ink">
        <div
          className={`absolute inset-0 transition-transform duration-700 ease-out ${
            hovered ? "scale-105" : "scale-100"
          }`}
        >
          <Image
            src={productImage(product)}
            alt={product.name}
            fill
            className="h-full w-full object-cover"
            sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            quality={72}
            priority={priority}
          />
        </div>
      </div>

      {/* Info */}
      <div className="flex min-w-0 flex-1 flex-col bg-forest/50 p-3 sm:backdrop-blur-md sm:p-5">
        {/* Category + rating */}
        <div className="mb-1.5 flex min-w-0 items-center justify-between gap-2 sm:mb-2">
          <span className="min-w-0 truncate text-[9px] font-black uppercase tracking-[0.12em] text-cream/40 sm:text-[10px]">
            {product.category?.name || ""}
          </span>
          <div className="flex shrink-0 items-center gap-0.5 text-[10px] font-black text-gold sm:text-[11px]">
            <Star size={10} className="fill-gold" />
            4.9
          </div>
        </div>

        {/* Title */}
        <h3 className="line-clamp-2 break-words text-[13px] font-bold leading-snug text-cream transition-colors duration-300 group-hover:text-gold sm:text-base lg:text-lg">
          {product.name}
        </h3>

        {/* Description — sm+ only */}
        <p className="mt-2 line-clamp-2 hidden text-xs leading-relaxed text-cream/50 sm:block">
          {product.description}
        </p>

        {/* Spec pills — sm+ only */}
        {specs.length > 0 && (
          <div className="mt-3 hidden flex-wrap gap-1.5 sm:flex">
            {specs.slice(0, 3).map((spec, index) => (
              <span
                key={index}
                className="rounded-md border border-white/5 bg-white/[0.02] px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-cream/70"
              >
                {spec}
              </span>
            ))}
          </div>
        )}

        {/* Price + CTA */}
        <div className="mt-auto flex min-w-0 items-end justify-between gap-2 border-t border-white/[0.06] pt-2.5 sm:pt-4">
          <div className="flex min-w-0 flex-col">
            <span className="text-[8px] font-bold uppercase tracking-widest text-cream/30 sm:text-[9px]">
              BD Price
            </span>
            <strong className="truncate text-[15px] font-black leading-tight text-cream sm:text-xl">
              {formatTaka(product.price)}
            </strong>
          </div>

          {product.stock > 0 ? (
            <span className="group/btn flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg border border-white/10 bg-white/5 text-cream transition-all duration-300 hover:border-gold/50 hover:bg-gold hover:text-ink sm:h-10 sm:w-auto sm:gap-1.5 sm:rounded-xl sm:px-3.5">
              <ShoppingBag size={14} className="transition-transform duration-300 group-hover/btn:scale-110" />
              <span className="hidden text-xs font-black sm:inline">Buy</span>
            </span>
          ) : (
            <span className="flex h-9 w-9 shrink-0 cursor-not-allowed items-center justify-center rounded-lg border border-white/5 bg-white/[0.02] text-[9px] font-black text-cream/35 sm:h-10 sm:w-auto sm:rounded-xl sm:px-3.5 sm:text-xs">
              <span className="sm:hidden">—</span>
              <span className="hidden sm:inline">Sold</span>
            </span>
          )}
        </div>
      </div>
    </Link>
  );
}
