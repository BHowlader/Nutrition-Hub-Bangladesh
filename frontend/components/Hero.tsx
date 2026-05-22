"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, ShieldCheck, Zap } from "lucide-react";
import { fetchProducts, formatTaka, type Product } from "@/lib/products";

const SKIP_HOME_LOADER_KEY = "nutrition-hub-skip-home-loader";

function shouldSkipHomeLoader() {
  return (
    typeof window !== "undefined" &&
    window.sessionStorage.getItem(SKIP_HOME_LOADER_KEY) === "1"
  );
}

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
    if (skipLoader) {
      window.sessionStorage.removeItem(SKIP_HOME_LOADER_KEY);
      setLoading(false);
      setProgress(100);
    }

    // Disable browser scroll restoration and force scroll to top on reload
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }

    if (skipLoader) return;

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
        className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#04060d] pb-7 pt-[5.25rem] sm:pb-10 sm:pt-[7.25rem] md:pt-[7.75rem] lg:pb-12 lg:pt-[7.75rem]"
      >
        {/* Cinematic Loader Shutter Panels */}
        {loading && (
          <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center pointer-events-none">
            {/* Layered vertical panels sliding away using clean, hardware-accelerated CSS transitions */}
            <div
              className={`absolute inset-0 bg-[#070b14] z-0 transition-transform duration-500 ease-in-out origin-top ${animatingOut ? "scale-y-0" : "scale-y-100"
                }`}
              style={{ transitionDelay: "150ms" }}
            />
            <div
              className={`absolute inset-0 bg-[#04060d] z-0 transition-transform duration-500 ease-in-out origin-top ${animatingOut ? "scale-y-0" : "scale-y-100"
                }`}
            />

            <div
              className={`loader-content relative z-10 flex flex-col items-center max-w-md px-6 text-center transition-all duration-300 ease-out ${animatingOut ? "opacity-0 -translate-y-12" : "opacity-100 translate-y-0"
                }`}
            >
              {/* Glowing Brand Icon */}
              <div className="relative mb-6 flex h-20 w-20 items-center justify-center rounded-2xl border border-gold/30 bg-gold/5 shadow-[0_0_50px_rgba(96,165,250,0.15)]">
                <Zap size={40} className="text-gold animate-pulse" />
                <div className="absolute inset-0 rounded-2xl border border-mint/20 animate-ping opacity-25" />
              </div>

              {/* Brand Name */}
              <h2 className="text-3xl font-black tracking-tight text-cream uppercase">
                Nutrition <span className="bg-gradient-to-r from-gold to-mint bg-clip-text text-transparent">Hub</span>
              </h2>
              <p className="mt-2 text-sm font-semibold tracking-[0.2em] text-cream/40 uppercase">Bangladesh</p>

              {/* Progress Bar Container */}
              <div className="relative mt-8 h-[2px] w-64 overflow-hidden rounded-full bg-white/10">
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

        {/* Gymnasium Background Image with Soft Cinematic Blending */}
        <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
          <Image
            src="/images/gym-bg.png"
            alt="Luxury Gymnasium Studio"
            fill
            className="object-cover opacity-[0.28] -scale-x-100 scale-105"
            priority
          />
          {/* Soft vertical vignette to keep header and grid travel smooth */}
          <div className="absolute inset-0 bg-gradient-to-b from-[#04060d] via-transparent to-[#04060d]" />
          {/* Left-side soft reading scrim to guarantee absolute text readability */}
          <div className="absolute inset-y-0 left-0 w-full lg:w-[55%] bg-gradient-to-r from-[#04060d] via-[#04060d]/75 to-transparent" />
        </div>

        {/* Living Aurora Borealis / Cinematic Nebula Backdrop */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
          <div className="animate-aurora-1 absolute -left-20 -top-20 h-[360px] w-[360px] rounded-full bg-mint/10 blur-[110px] mix-blend-screen sm:h-[650px] sm:w-[650px] sm:blur-[130px]" />
          <div className="animate-aurora-2 absolute -right-20 -bottom-20 h-[420px] w-[420px] rounded-full bg-gold/10 blur-[120px] mix-blend-screen sm:h-[750px] sm:w-[750px] sm:blur-[150px]" />
          <div className="animate-aurora-3 absolute left-1/3 top-1/4 h-[320px] w-[320px] rounded-full bg-indigo-500/8 blur-[100px] mix-blend-screen sm:h-[550px] sm:w-[550px] sm:blur-[120px]" />
          <div className="animate-aurora-4 absolute right-1/4 top-10 h-[340px] w-[340px] rounded-full bg-cyan-400/8 blur-[105px] mix-blend-screen sm:h-[600px] sm:w-[600px] sm:blur-[130px]" />
        </div>

        {/* Dynamic Background Noise */}
        <div className="absolute inset-0 opacity-[0.12] mix-blend-overlay pointer-events-none z-0" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }} />

        {/* Perspective 3D Grid Flooring at the bottom */}
        <div className="absolute inset-x-0 bottom-0 h-[450px] overflow-hidden pointer-events-none z-0 opacity-[0.15]">
          <div
            className="animate-grid-travel w-[200%] h-[900px] absolute left-[-50%] top-[-250px]"
            style={{
              backgroundImage: 'linear-gradient(to right, rgba(96,165,250,0.15) 1px, transparent 1px), linear-gradient(to bottom, rgba(96,165,250,0.15) 1px, transparent 1px)',
              backgroundSize: '4rem 4rem',
              transformOrigin: 'top center',
            }}
          />
          {/* Shading overlay to mask 3D grid at edges */}
          <div className="absolute inset-0 bg-gradient-to-t from-[#04060d] via-[#04060d]/80 to-transparent" />
        </div>

        {/* Laser scans running down vertical grid lines */}
        <div className="absolute inset-0 pointer-events-none z-0 hidden sm:block">
          <div className="absolute left-[15%] top-0 h-full w-[1px] bg-white/[0.01]">
            <div className="animate-laser absolute h-[250px] w-full bg-gradient-to-b from-transparent via-gold/30 to-transparent" style={{ animationDuration: '7s' }} />
          </div>
          <div className="absolute left-[35%] top-0 h-full w-[1px] bg-white/[0.01]">
            <div className="animate-laser absolute h-[250px] w-full bg-gradient-to-b from-transparent via-mint/20 to-transparent" style={{ animationDuration: '9s', animationDelay: '2s' }} />
          </div>
          <div className="absolute left-[65%] top-0 h-full w-[1px] bg-white/[0.01]">
            <div className="animate-laser absolute h-[250px] w-full bg-gradient-to-b from-transparent via-champagne/30 to-transparent" style={{ animationDuration: '8s', animationDelay: '4s' }} />
          </div>
          <div className="absolute left-[85%] top-0 h-full w-[1px] bg-white/[0.01]">
            <div className="animate-laser absolute h-[250px] w-full bg-gradient-to-b from-transparent via-gold/20 to-transparent" style={{ animationDuration: '11s', animationDelay: '1s' }} />
          </div>
        </div>

        {/* Floating Cinematic Dust Particles */}
        <div className="absolute inset-0 pointer-events-none z-0 overflow-hidden">
          {mounted && Array.from({ length: 18 }).map((_, i) => (
            <div
              key={i}
              className="animate-particle absolute rounded-full bg-gold/15 blur-[6px]"
              style={{
                width: `${Math.random() * 8 + 4}px`,
                height: `${Math.random() * 8 + 4}px`,
                left: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 10}s`,
                animationDuration: `${Math.random() * 12 + 10}s`
              }}
            />
          ))}
        </div>

        <div className="shell relative z-10 mx-auto grid items-start gap-6 py-2 sm:items-center sm:gap-10 sm:py-6 lg:grid-cols-[1.1fr_0.9fr] lg:gap-8 lg:py-0 xl:grid-cols-[minmax(680px,0.95fr)_minmax(0,1.05fr)]">

          {/* Left Column - Content */}
          <div className="flex max-w-3xl flex-col items-center text-center lg:items-start lg:text-left">
            <div className="hero-badge mb-3.5 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3 py-1.5 shadow-[0_0_24px_rgba(96,165,250,0.08)] backdrop-blur-md sm:mb-5 sm:px-4 sm:py-2">
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
              <span className="block bg-gradient-to-r from-gold via-champagne to-mint bg-clip-text text-transparent drop-shadow-[0_0_28px_rgba(96,165,250,0.18)] sm:inline">
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
                className="group hero-btn btn-secondary min-h-[44px] w-full justify-center whitespace-nowrap border-white/10 bg-white/5 px-5 text-sm backdrop-blur-md sm:min-h-[52px] sm:w-auto sm:max-w-none sm:px-6 sm:text-base"
              >
                <ShieldCheck size={18} className="mr-2 text-mint transition-transform group-hover:scale-110" />
                Verify Authenticity
              </a>
            </div>

            {visualProducts.length > 0 && (
              <div className="relative mx-auto mt-4 h-[clamp(210px,72vw,340px)] w-full max-w-[430px] overflow-hidden px-1 sm:mt-6 sm:h-[clamp(300px,48vw,380px)] sm:max-w-[560px] lg:hidden">
                {/* Symmetric edge fade so the side product cards blend out gracefully */}
                <div className="pointer-events-none absolute inset-y-0 left-0 z-40 w-10 bg-gradient-to-r from-[#04060d] via-[#04060d]/70 to-transparent" />
                <div className="pointer-events-none absolute inset-y-0 right-0 z-40 w-10 bg-gradient-to-l from-[#04060d] via-[#04060d]/70 to-transparent" />
                <div className="absolute left-1/2 top-4 z-30 w-[clamp(150px,54vw,250px)] -translate-x-1/2 sm:top-5 sm:w-[clamp(230px,36vw,290px)]">
                  <div
                    className="animate-float-1 overflow-hidden rounded-[1.35rem] sm:rounded-3xl"
                    style={{ boxShadow: `0 28px 70px -18px ${visualProducts[0].accent || "#60A5FA"}55` }}
                  >
                    <div className="relative aspect-square">
                      <Image
                        src={visualProducts[0].image_url || "/images/logo.png"}
                        alt={visualProducts[0].name}
                        fill
                        sizes="(max-width: 640px) 54vw, 290px"
                        className="object-cover"
                        priority
                      />
                    </div>
                  </div>
                </div>

                {visualProducts.slice(1, 3).map((product, index) => (
                  <div
                    key={product.id}
                    className={`absolute bottom-2 w-[clamp(118px,42vw,205px)] sm:bottom-0 sm:w-[clamp(190px,30vw,245px)] ${index === 0
                        ? "left-0 z-20 -rotate-6 sm:left-3"
                        : "right-0 z-10 rotate-6 sm:right-3"
                      }`}
                  >
                    <div
                      className={`overflow-hidden rounded-[1.25rem] sm:rounded-3xl ${index === 0 ? "animate-float-2" : "animate-float-3"
                        }`}
                      style={{ boxShadow: `0 22px 55px -18px ${product.accent || "#F59E0B"}50` }}
                    >
                      <div className="relative aspect-square">
                        <Image
                          src={product.image_url || "/images/logo.png"}
                          alt={product.name}
                          fill
                          sizes="(max-width: 640px) 42vw, 245px"
                          className="object-cover"
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Right Column - Visual Showcase */}
          <div className="relative hidden w-full items-center justify-center lg:flex lg:h-[min(49vw,560px)] lg:min-h-[470px]" style={{ perspective: "1200px" }}>
            <div className="absolute inset-0 rounded-full border border-white/5 pointer-events-none" />

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
                <div
                  className={`hero-visual-card animate-float-${i + 1} w-[260px] overflow-hidden rounded-3xl border border-white/[0.08] bg-[#0c1324] shadow-[0_30px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/20`}
                  style={{
                    boxShadow: `0 30px 60px -10px ${product.accent || "#F59E0B"}15`
                  }}
                >
                  <div className="relative aspect-square w-full overflow-hidden bg-[#050811] border-b border-white/[0.04]">
                    <div className="absolute inset-0">
                      <Image
                        src={product.image_url || "/images/logo.png"}
                        alt={product.name}
                        fill
                        className="object-cover w-full h-full"
                        priority
                      />
                    </div>
                  </div>
                  <div className="p-4">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-cream/50 mb-1">{product.category?.name || ""}</div>
                    <h3 className="text-base font-bold text-cream truncate">{product.name}</h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-black text-gold">{formatTaka(product.price)}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-cream/70 backdrop-blur-md">
                        {product.badge || ""}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}

            {/* Decorative floating elements */}
            <div className="animate-float-1 absolute -right-4 top-32 h-20 w-20 rounded-2xl border border-white/10 bg-gradient-to-tr from-mint/20 to-transparent backdrop-blur-xl" style={{ transform: 'translateZ(-50px) rotate(15deg)' }}></div>
            <div className="animate-float-3 absolute bottom-24 -left-8 h-24 w-24 rounded-full border border-white/10 bg-gradient-to-br from-gold/20 to-transparent backdrop-blur-xl" style={{ transform: 'translateZ(-20px)' }}></div>
          </div>
        </div>
      </section>

      {/* Feature Row - Sits naturally below the 100svh viewport fold */}
      <div className="relative z-20 bg-gradient-to-b from-[#04060d] to-ink py-6">
        <div className="shell">
          <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-[11px] font-semibold text-cream/40 uppercase tracking-widest sm:gap-8 sm:text-xs">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-gold" /> Guaranteed Authentic
            </div>
            <div className="hidden h-4 w-[1px] bg-white/10 sm:block" />
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-mint" /> Fast Delivery
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
