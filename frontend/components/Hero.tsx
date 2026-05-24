"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { fetchProducts, formatTaka, productImage, type Product } from "@/lib/products";
import { useTheme } from "@/lib/theme";

const SKIP_HOME_LOADER_KEY = "nutrition-hub-skip-home-loader";

function shouldSkipHomeLoader() {
  return (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(SKIP_HOME_LOADER_KEY) === "1"
  );
}

const DUST_PARTICLES = [
  { w: 5.1, h: 5.3, x: 52.2, delay: 3.5, dur: 12.1 },
  { w: 6.8, h: 7.5, x: 11.8, delay: 5.2, dur: 20.0 },
  { w: 7.4, h: 8.2, x: 81.0, delay: 6.3, dur: 16.4 },
  { w: 7.4, h: 7.4, x: 0.9, delay: 1.8, dur: 10.7 },
  { w: 9.0, h: 7.6, x: 95.0, delay: 8.5, dur: 12.4 },
  { w: 5.0, h: 6.7, x: 23.5, delay: 8.9, dur: 14.0 },
  { w: 7.9, h: 9.5, x: 20.0, delay: 0.6, dur: 16.6 },
  { w: 4.7, h: 7.0, x: 97.2, delay: 1.9, dur: 14.2 },
  { w: 6.9, h: 6.1, x: 28.2, delay: 1.6, dur: 11.7 },
  { w: 12.0, h: 10.0, x: 12.4, delay: 5.8, dur: 15.6 },
  { w: 8.6, h: 5.7, x: 2.7, delay: 0.1, dur: 18.8 },
  { w: 6.8, h: 7.1, x: 4.8, delay: 4.0, dur: 12.2 },
  { w: 5.5, h: 11.0, x: 23.5, delay: 4.9, dur: 15.1 },
  { w: 11.3, h: 10.8, x: 54.7, delay: 2.4, dur: 14.1 },
  { w: 9.5, h: 11.0, x: 90.1, delay: 3.0, dur: 13.7 },
  { w: 9.8, h: 7.0, x: 14.0, delay: 9.7, dur: 19.9 },
  { w: 4.3, h: 10.4, x: 0.6, delay: 7.7, dur: 10.7 },
  { w: 11.6, h: 6.0, x: 72.3, delay: 9.9, dur: 21.6 }
];

export interface HeroSettings {
  hero_description: string;
  hero_product_slug_1: string | null;
  hero_product_slug_2: string | null;
  hero_product_slug_3: string | null;
}

const DEFAULT_HERO_DESCRIPTION =
  "Elevate your training with 100% verified authentic supplements. Batch-checked, sealed, and delivered nationwide with uncompromising trust.";
const DEFAULT_HERO_SLUGS = [
  "creatine-tropical-tango",
  "pintola-protein-oats",
  "kapiva-shilajit-gold",
] as const;

export function Hero({
  initialProducts = [],
  settings,
}: {
  initialProducts?: Product[];
  settings?: HeroSettings | null;
}) {
  const { theme } = useTheme();
  const heroDescription = settings?.hero_description?.trim() || DEFAULT_HERO_DESCRIPTION;
  const heroSlugs = [
    settings?.hero_product_slug_1 || DEFAULT_HERO_SLUGS[0],
    settings?.hero_product_slug_2 || DEFAULT_HERO_SLUGS[1],
    settings?.hero_product_slug_3 || DEFAULT_HERO_SLUGS[2],
  ];
  const rootRef = useRef<HTMLElement>(null);
  const [loading, setLoading] = useState(() => !shouldSkipHomeLoader());
  const [progress, setProgress] = useState(() => (shouldSkipHomeLoader() ? 100 : 0));
  const [animatingOut, setAnimatingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [allProducts, setAllProducts] = useState<Product[]>(initialProducts);

  useEffect(() => {
    if (initialProducts.length === 0) fetchProducts().then(setAllProducts);
  }, [initialProducts.length]);

  useEffect(() => {
    setMounted(true);
    const skipLoader = shouldSkipHomeLoader();
    // Skip loader on mobile — prevents ~900ms content block
    const isMobile = window.innerWidth < 768;
    if (skipLoader || isMobile) {
      window.sessionStorage.removeItem(SKIP_HOME_LOADER_KEY);
      setLoading(false);
      setProgress(100);
    }

    // Disable browser scroll restoration and force scroll to top on reload
    if ("scrollRestoration" in window.history) {
      window.history.scrollRestoration = "manual";
    }
    window.scrollTo(0, 0);

    if (skipLoader || isMobile) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 10;
      });
    }, 25);

    return () => clearInterval(interval);
  }, []);

  // Monitor progress to trigger exit sequence cleanly without GSAP race conditions
  useEffect(() => {
    if (progress === 100 && loading) {
      setAnimatingOut(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 650);
      return () => clearTimeout(timer);
    }
  }, [loading, progress]);

  const visualProducts = heroSlugs
    .map((slug) => allProducts.find((p) => p.slug === slug))
    .filter((p): p is Product => Boolean(p));

  return (
    <>
      <section
        ref={rootRef}
        className="relative flex min-h-screen items-center justify-center bg-transparent pb-7 pt-[7.5rem] sm:pb-10 sm:pt-[7.25rem] md:pt-[7.75rem] lg:pb-12 lg:pt-[7.75rem]"
      >
        {/* Cinematic Loader Shutter Panels */}
        {loading && (
          <div className="fixed inset-0 z-[999] hidden sm:flex flex-col items-center justify-center pointer-events-none">
            {/* Layered vertical panels sliding away using clean, hardware-accelerated CSS transitions */}
            <div
              className={`absolute inset-0 bg-ink z-0 transition-transform duration-500 ease-in-out origin-top ${animatingOut ? "scale-y-0" : "scale-y-100"
                }`}
              style={{ transitionDelay: "150ms" }}
            />
            <div
              className={`absolute inset-0 bg-ink z-0 transition-transform duration-500 ease-in-out origin-top ${animatingOut ? "scale-y-0" : "scale-y-100"
                }`}
            />

            <div
              className={`loader-content relative z-10 flex flex-col items-center max-w-md px-6 text-center transition-all duration-300 ease-out ${animatingOut ? "opacity-0 -translate-y-12" : "opacity-100 translate-y-0"
                }`}
            >
              {/* Glowing Brand Icon */}
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/30 bg-gold/5 shadow-[0_0_50px_rgb(var(--color-gold)/0.15)]">
                <Zap size={40} className="text-gold animate-pulse" />
                <div className="absolute inset-0 rounded-2xl border border-mint/20 animate-ping opacity-25" />
              </div>

              {/* Brand Name */}
              <h2 className="text-3xl font-black tracking-tight text-cream uppercase">
                Nutrition <span className="bg-gradient-to-r from-gold to-mint bg-clip-text text-transparent">Hub</span>
              </h2>
              <p className="mt-2 text-sm font-semibold tracking-[0.2em] text-cream/40 uppercase">Bangladesh</p>

              {/* Progress Bar Container */}
              <div className="relative mt-8 h-[2px] w-64 overflow-hidden rounded-full bg-cream/10">
                <div
                  className="absolute top-0 left-0 h-full bg-gradient-to-r from-gold via-champagne to-mint transition-all duration-300 ease-out"
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Dynamic Loading Text */}
              <span className="mt-4 text-[10px] font-black uppercase tracking-[0.3em] text-gold animate-pulse">
                Authenticating Sealed Stock {progress}%
              </span>
            </div>
          </div>
        )}

        {/* Gymnasium Background Image with Soft Cinematic Blending — desktop only */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <div className="hidden sm:block absolute inset-0">
            <Image
              src={mounted && theme === "light" ? "/images/gym-bg-light.png" : "/images/gym-bg.png"}
              alt="Luxury Gymnasium Studio"
              fill
              sizes="100vw"
              className={`object-cover -scale-x-100 scale-105 object-center ${
                mounted && theme === "light" ? "opacity-[0.12] mix-blend-multiply" : "opacity-[0.28]"
              }`}
              priority
            />
          </div>
          {/* Soft vertical vignette to keep header and grid travel smooth */}
          <div className={`absolute inset-0 ${mounted && theme === "light" ? "bg-gradient-to-b from-[#FFFCF8]/60 via-transparent to-[#FFFCF8]" : "bg-gradient-to-b from-ink via-transparent to-ink"}`} />
          {/* Left-side soft reading scrim to guarantee absolute text readability */}
          <div className={`absolute inset-y-0 left-0 w-full lg:w-[55%] ${mounted && theme === "light" ? "bg-gradient-to-r from-[#FFFCF8]/85 via-[#FFFCF8]/50 to-transparent" : "bg-gradient-to-r from-ink via-ink/80 to-transparent"}`} />
        </div>

        {/* Dynamic Theme-Aware Visual Backdrop Elements */}
        <>
          {/* Living Aurora Borealis / Cinematic Nebula Backdrop — desktop only to prevent mobile scroll jank */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none z-0 hidden sm:block">
            <div className={`animate-aurora-1 absolute -left-20 -top-20 h-[650px] w-[650px] rounded-full blur-[130px] ${
              mounted && theme === "light"
                ? "bg-amber-300/35 mix-blend-multiply"
                : "bg-mint/10 mix-blend-multiply dark:mix-blend-screen"
            }`} />
            <div className={`animate-aurora-2 absolute -right-20 -bottom-20 h-[750px] w-[750px] rounded-full blur-[150px] ${
              mounted && theme === "light"
                ? "bg-orange-200/40 mix-blend-multiply"
                : "bg-gold/10 mix-blend-multiply dark:mix-blend-screen"
            }`} />
            <div className={`animate-aurora-3 absolute left-1/3 top-1/4 h-[550px] w-[550px] rounded-full blur-[120px] ${
              mounted && theme === "light"
                ? "bg-rose-200/30 mix-blend-multiply"
                : "bg-indigo-500/8 mix-blend-multiply dark:mix-blend-screen"
            }`} />
            <div className={`animate-aurora-4 absolute right-1/4 top-10 h-[600px] w-[600px] rounded-full blur-[130px] ${
              mounted && theme === "light"
                ? "bg-yellow-200/30 mix-blend-multiply"
                : "bg-cyan-400/8 mix-blend-multiply dark:mix-blend-screen"
            }`} />
          </div>

          {/* Mobile: static subtle glow instead of animated aurora */}
          <div className="absolute inset-0 pointer-events-none z-0 sm:hidden">
            <div className={`absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full blur-[100px] ${mounted && theme === "light" ? "bg-amber-300/35" : "bg-mint/8"}`} />
            <div className={`absolute -right-20 -bottom-20 h-[300px] w-[300px] rounded-full blur-[100px] ${mounted && theme === "light" ? "bg-orange-200/35" : "bg-gold/8"}`} />
          </div>

          {/* Dynamic Background Noise — desktop only */}
          <div
            className={`absolute inset-0 pointer-events-none z-0 hidden sm:block ${
              mounted && theme === "light"
                ? "opacity-[0.04] mix-blend-multiply"
                : "opacity-[0.12] mix-blend-multiply dark:mix-blend-overlay"
            }`}
            style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}
          />

          {/* Perspective 3D Grid Flooring — desktop only */}
          <div className={`absolute inset-x-0 bottom-0 h-[450px] overflow-hidden pointer-events-none z-0 hidden sm:block ${
            mounted && theme === "light" ? "opacity-40" : "opacity-[0.15]"
          }`}>
            <div
              className="animate-grid-travel w-[200%] h-[900px] absolute left-[-50%] top-[-250px]"
              style={{
                backgroundImage: mounted && theme === "light"
                  ? 'linear-gradient(to right, rgba(180,83,9,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(180,83,9,0.06) 1px, transparent 1px)'
                  : 'linear-gradient(to right, rgba(96,165,250,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(96,165,250,0.15) 1px, transparent 1px)',
                backgroundSize: '4rem 4rem',
                transformOrigin: 'top center',
              }}
            />
            <div className={`absolute inset-0 ${mounted && theme === "light" ? "bg-gradient-to-t from-[#FFFCF8] via-[#FFFCF8]/60 to-transparent" : "bg-gradient-to-t from-ink via-ink/80 to-transparent"}`} />
          </div>

          {/* Laser scans — desktop and dark mode only */}
          {!(mounted && theme === "light") && (
            <div className="absolute inset-0 pointer-events-none z-0 hidden sm:block">
              <div className="absolute left-[15%] top-0 h-full w-[1px] bg-cream/[0.01]">
                <div className="animate-laser absolute h-[250px] w-full bg-gradient-to-b from-transparent via-gold/30 to-transparent" style={{ animationDuration: '7s' }} />
              </div>
              <div className="absolute left-[35%] top-0 h-full w-[1px] bg-cream/[0.01]">
                <div className="animate-laser absolute h-[250px] w-full bg-gradient-to-b from-transparent via-mint/20 to-transparent" style={{ animationDuration: '9s', animationDelay: '2s' }} />
              </div>
              <div className="absolute left-[65%] top-0 h-full w-[1px] bg-cream/[0.01]">
                <div className="animate-laser absolute h-[250px] w-full bg-gradient-to-b from-transparent via-champagne/30 to-transparent" style={{ animationDuration: '8s', animationDelay: '4s' }} />
              </div>
              <div className="absolute left-[85%] top-0 h-full w-[1px] bg-cream/[0.01]">
                <div className="animate-laser absolute h-[250px] w-full bg-gradient-to-b from-transparent via-gold/20 to-transparent" style={{ animationDuration: '11s', animationDelay: '1s' }} />
              </div>
            </div>
          )}

          {/* Floating Dust Particles — desktop only */}
          <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden hidden sm:block">
            {DUST_PARTICLES.map((p, i) => (
              <div
                key={i}
                className={`animate-particle absolute rounded-full blur-[6px] ${
                  mounted && theme === "light"
                    ? (i % 2 === 0 ? "bg-amber-500/15" : "bg-orange-400/12")
                    : "bg-gold/15"
                }`}
                style={{
                  width: `${p.w}px`,
                  height: `${p.h}px`,
                  left: `${p.x}%`,
                  animationDelay: `${p.delay}s`,
                  animationDuration: `${p.dur}s`
                }}
              />
            ))}
          </div>
        </>

        <div className="shell relative z-10 mx-auto grid items-center gap-6 py-2 sm:gap-10 sm:py-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:py-0 xl:grid-cols-[minmax(680px,0.95fr)_minmax(0,1.05fr)]">

          {/* Left Column - Content */}
          <div className={`relative flex max-w-3xl flex-col items-center text-center lg:items-start lg:text-left sm:p-10 sm:rounded-3xl sm:backdrop-blur-md sm:border ${
            mounted && theme === "light"
              ? "sm:bg-white/60 sm:border-amber-900/10 sm:shadow-[0_20px_60px_rgba(180,83,9,0.06)]"
              : "sm:bg-card/40 sm:border-cream/[0.07] sm:shadow-[0_20px_60px_rgba(0,0,0,0.25)]"
          }`}>
            <div className="hero-badge mb-3.5 inline-flex max-w-full items-center gap-2 rounded-full border border-cream/10 bg-cream/[0.04] px-3 py-1.5 shadow-[0_0_24px_rgb(var(--color-gold)/0.08)] sm:backdrop-blur-md sm:mb-5 sm:px-4 sm:py-2">
              <span className="relative flex h-1.5 w-1.5 shrink-0 sm:h-2 sm:w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75"></span>
                <span className="relative inline-flex h-full w-full rounded-full bg-mint"></span>
              </span>
              <span className="truncate text-[9px] font-bold uppercase tracking-[0.18em] text-cream/90 min-[390px]:text-[10px] sm:text-xs sm:tracking-wide">
                Premium Supplements Bangladesh
              </span>
            </div>

            <h1 className="max-w-[11ch] text-[clamp(2.35rem,10.4vw,4.75rem)] font-extrabold leading-[0.94] tracking-[-0.025em] text-cream sm:max-w-none sm:leading-[1.08] sm:tracking-tight">
              <span className="block text-cream/95">Power Your</span>
              <span className="block bg-gradient-to-r from-gold via-champagne to-mint bg-clip-text text-transparent drop-shadow-[0_0_28px_rgb(var(--color-gold)/0.18)] sm:inline">
                Performance.
              </span>
              <span className="mt-2.5 flex max-w-[18ch] items-center justify-center gap-2.5 text-[clamp(1.12rem,5vw,3.2rem)] font-bold leading-[1.1] tracking-[-0.01em] text-cream/72 sm:mt-2 sm:max-w-none sm:tracking-tight sm:text-cream/78 lg:justify-start lg:gap-0">
                <span aria-hidden className="inline-block h-px w-6 shrink-0 rounded-full bg-gradient-to-r from-gold/70 via-champagne/40 to-transparent lg:hidden" />
                Without Compromise.
              </span>
            </h1>

            <p className="hero-desc mt-4 max-w-[34rem] text-[0.92rem] leading-[1.7] text-cream/80 sm:mt-6 sm:text-lg sm:leading-relaxed">
              {heroDescription}
            </p>

            <div className="mt-5 grid w-full grid-cols-1 gap-2.5 min-[430px]:grid-cols-2 sm:mt-7 sm:flex sm:w-auto sm:items-center sm:gap-3">
              <a
                href="#catalog"
                className="group hero-btn btn-primary min-h-[44px] w-full justify-center whitespace-nowrap px-5 text-sm sm:min-h-[52px] sm:w-auto sm:max-w-none sm:px-6 sm:text-base"
              >
                Explore Products
                <ArrowRight size={18} className="ml-1.5 transition-transform group-hover:translate-x-1" />
              </a>
              <a
                href="#authenticity"
                className="group hero-btn btn-secondary min-h-[44px] w-full justify-center whitespace-nowrap px-5 text-sm sm:backdrop-blur-md sm:min-h-[52px] sm:w-auto sm:max-w-none sm:px-6 sm:text-base"
              >
                <ShieldCheck size={18} className="mr-2 text-mint transition-transform group-hover:scale-110" />
                Verify Authenticity
              </a>
            </div>

            {visualProducts.length > 0 && (
              <Link
                href={`/products/${visualProducts[0].slug}`}
                className="relative mx-auto mt-4 block h-[clamp(200px,68vw,320px)] w-[clamp(150px,56vw,280px)] sm:mt-6 sm:h-[clamp(310px,50vw,400px)] sm:w-[clamp(230px,36vw,290px)] lg:hidden group"
              >
                {/* Bottom fade */}
                <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-16 bg-gradient-to-t from-ink via-ink/60 to-transparent" />
                <div
                  className="overflow-hidden rounded-[1.5rem] sm:rounded-3xl transition-transform duration-300 group-hover:scale-[1.02]"
                  style={{ boxShadow: `0 22px 48px -16px ${visualProducts[0].accent || "#B45309"}55` }}
                >
                  <div className="relative aspect-square">
                    <Image
                      src={productImage(visualProducts[0])}
                      alt={visualProducts[0].name}
                      fill
                      sizes="(max-width: 640px) 56vw, 290px"
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                      priority
                    />
                  </div>
                </div>
              </Link>
            )}
          </div>

          {/* Right Column - Visual Showcase */}
          <div className="relative hidden w-full items-center justify-center lg:flex lg:h-[min(49vw,560px)] lg:min-h-[470px]" style={{ perspective: "1200px" }}>
            <div className="absolute inset-0 rounded-full border border-cream/5 pointer-events-none" />

            {/* Ambient Card Showcase Backlight Glow */}
            <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[450px] h-[450px] rounded-full blur-[100px] pointer-events-none z-0 ${
              mounted && theme === "light"
                ? "bg-gradient-to-tr from-amber-400/35 via-orange-300/25 to-rose-300/30"
                : "bg-gradient-to-tr from-gold/15 via-champagne/15 to-mint/5"
            }`} />

            {visualProducts.map((product, i) => (
              <div
                key={product.id}
                className="hero-visual-card-wrapper absolute transition-all duration-700 ease-out"
                style={{
                  transform: `translateX(${i === 0 ? 0 : i === 1 ? -160 : 160}px) translateY(${i === 0 ? -40 : 30}px) rotate(${i === 0 ? 0 : i === 1 ? -8 : 8}deg) scale(${i === 0 ? 1.05 : 0.95})`,
                  zIndex: 30 - i * 10,
                  perspective: "1200px"
                }}
              >
                <Link
                  href={`/products/${product.slug}`}
                  className="block group"
                >
                  <div
                    className={`hero-visual-card animate-float-${i + 1} w-[260px] overflow-hidden rounded-3xl border border-cream/[0.08] bg-card/90 sm:backdrop-blur-2xl transition-all duration-300 group-hover:border-cream/20 group-hover:scale-[1.02] cursor-pointer`}
                    style={{
                      boxShadow: mounted && theme === "light"
                        ? `0 20px 50px rgba(180,83,9,0.10), 0 30px 60px -10px ${(product.accent || "#B45309")}14`
                        : `0 30px 60px rgba(0,0,0,0.4), 0 30px 60px -10px ${(product.accent || "#F59E0B")}18`
                    }}
                  >
                    <div className="relative aspect-square w-full overflow-hidden bg-transparent border-b border-cream/[0.08]">
                      <div className="absolute inset-0">
                        <Image
                          src={productImage(product)}
                          alt={product.name}
                          fill
                          sizes="260px"
                          className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-105"
                          priority
                        />
                      </div>
                    </div>
                    <div className="p-4">
                      <div className="text-[10px] font-bold uppercase tracking-widest text-cream/50 mb-1">{product.category?.name || ""}</div>
                      <h3 className="text-base font-bold text-cream truncate group-hover:text-gold transition-colors">{product.name}</h3>
                      <div className="mt-3 flex items-center justify-between">
                        <span className="font-black text-gold">{formatTaka(product.price)}</span>
                        <span className="rounded-full bg-cream/10 px-2 py-0.5 text-[10px] font-bold text-cream/70 sm:backdrop-blur-md">
                          {product.badge || ""}
                        </span>
                      </div>
                    </div>
                  </div>
                </Link>
              </div>
            ))}

            {/* Decorative floating elements */}
            <div className="animate-float-1 absolute -right-4 top-32 h-20 w-20 rounded-2xl border border-cream/10 bg-gradient-to-tr from-mint/20 to-transparent sm:backdrop-blur-xl" style={{ transform: 'translateZ(-50px) rotate(15deg)' }}></div>
            <div className="animate-float-3 absolute bottom-24 -left-8 h-24 w-24 rounded-full border border-cream/10 bg-gradient-to-br from-gold/20 to-transparent sm:backdrop-blur-xl" style={{ transform: 'translateZ(-20px)' }}></div>
          </div>
        </div>
      </section>

      {/* Feature Row - Sits naturally below the 100svh viewport fold */}
      <div className={`relative z-20 py-6 ${mounted && theme === "light" ? "bg-[#FFF7ED] border-t border-amber-900/[0.06]" : "bg-gradient-to-b from-ink to-ink"}`}>
        <div className="shell">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] font-semibold text-cream/40 uppercase tracking-widest sm:gap-8 sm:text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-gold" /> Guaranteed Authentic
            </div>
            <div className="hidden h-4 w-[1px] bg-cream/10 sm:block" />
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-mint" /> Delivered by Pathao
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
