"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { ArrowRight, ArrowDown, ShieldCheck, Zap } from "lucide-react";
import { formatTaka, products } from "@/lib/products";
import gsap from "gsap";

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [animatingOut, setAnimatingOut] = useState(false);
  const [mounted, setMounted] = useState(false);
  const hasAnimated = useRef(false);

  useEffect(() => {
    setMounted(true);
    
    // Disable browser scroll restoration and force scroll to top on reload
    if (typeof window !== "undefined") {
      if ("scrollRestoration" in window.history) {
        window.history.scrollRestoration = "manual";
      }
      window.scrollTo(0, 0);
    }

    // Smooth progress bar simulation
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          return 100;
        }
        return prev + 5;
      });
    }, 35);

    return () => clearInterval(interval);
  }, []);

  // Monitor progress to trigger exit sequence cleanly without GSAP race conditions
  useEffect(() => {
    if (progress === 100) {
      setAnimatingOut(true);
      const timer = setTimeout(() => {
        setLoading(false);
      }, 1300); // Matches the panel slide out CSS transition duration
      return () => clearTimeout(timer);
    }
  }, [progress]);

  // Entrance animations for Hero content after loading finishes
  useEffect(() => {
    if (loading || hasAnimated.current) return;
    hasAnimated.current = true;

    const ctx = gsap.context(() => {
      // Background glows only - content renders instantly static
      const tl = gsap.timeline({ defaults: { ease: "expo.out" } });

      // Ambient background glow animations
      gsap.to(".hero-glow-1", {
        x: 100,
        y: -50,
        scale: 1.2,
        duration: 8,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
      gsap.to(".hero-glow-2", {
        x: -100,
        y: 50,
        scale: 1.1,
        duration: 10,
        repeat: -1,
        yoyo: true,
        ease: "sine.inOut",
      });
    }, rootRef);

    return () => ctx.revert();
  }, [loading]);

  // Use a subset of products for the visual right side
  const visualProducts = products.filter(p => p.image).slice(0, 3);

  return (
    <>
      <section
        ref={rootRef}
        className="relative flex min-h-[100svh] items-center overflow-hidden bg-[#04060d] pt-28 md:pt-32 pb-12 md:pb-16"
      >
        {/* Cinematic Loader Shutter Panels */}
        {loading && (
          <div className="fixed inset-0 z-[999] flex flex-col items-center justify-center pointer-events-none">
            {/* Layered vertical panels sliding away using clean, hardware-accelerated CSS transitions */}
            <div 
              className={`absolute inset-0 bg-[#070b14] z-0 transition-transform duration-1000 ease-in-out origin-top ${
                animatingOut ? "scale-y-0" : "scale-y-100"
              }`} 
              style={{ transitionDelay: "150ms" }}
            />
            <div 
              className={`absolute inset-0 bg-[#04060d] z-0 transition-transform duration-1000 ease-in-out origin-top ${
                animatingOut ? "scale-y-0" : "scale-y-100"
              }`}
            />

            <div 
              className={`loader-content relative z-10 flex flex-col items-center max-w-md px-6 text-center transition-all duration-500 ease-out ${
                animatingOut ? "opacity-0 -translate-y-12" : "opacity-100 translate-y-0"
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
          <div className="animate-aurora-1 absolute -left-20 -top-20 h-[650px] w-[650px] rounded-full bg-mint/10 blur-[130px] mix-blend-screen" />
          <div className="animate-aurora-2 absolute -right-20 -bottom-20 h-[750px] w-[750px] rounded-full bg-gold/10 blur-[150px] mix-blend-screen" />
          <div className="animate-aurora-3 absolute left-1/3 top-1/4 h-[550px] w-[550px] rounded-full bg-indigo-500/8 blur-[120px] mix-blend-screen" />
          <div className="animate-aurora-4 absolute right-1/4 top-10 h-[600px] w-[600px] rounded-full bg-cyan-400/8 blur-[130px] mix-blend-screen" />
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
        <div className="absolute inset-0 pointer-events-none z-0">
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

        <div className="shell relative z-10 mx-auto grid lg:grid-cols-2 gap-12 items-center">
          
          {/* Left Column - Content */}
          <div className="flex flex-col items-start pt-10 lg:pt-0 lg:-translate-y-10">
            <div className="hero-badge mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 backdrop-blur-md">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-mint opacity-75"></span>
                <span className="relative inline-flex h-2 w-2 rounded-full bg-mint"></span>
              </span>
              <span className="text-xs font-bold tracking-wide text-cream/90 uppercase">
                Premium Supplements Bangladesh
              </span>
            </div>

            <h1 className="flex flex-col text-[clamp(3rem,6vw,5.5rem)] font-black leading-[0.95] tracking-tight text-cream" style={{ perspective: "1000px" }}>
              <span className="hero-title-line block">Power Your</span>
              <span className="hero-title-line block mt-2">
                <span className="bg-gradient-to-r from-gold via-champagne to-mint bg-clip-text text-transparent">
                  Performance.
                </span>
              </span>
              <span className="hero-title-line block mt-2 text-[clamp(2.5rem,4vw,4rem)] text-cream/80">
                Without Compromise.
              </span>
            </h1>

            <p className="hero-desc mt-8 max-w-xl text-lg leading-relaxed text-cream/60">
              Elevate your training with 100% verified authentic supplements. Batch-checked, sealed, and delivered nationwide with uncompromising trust.
            </p>

            <div className="mt-10 flex flex-wrap items-center gap-4">
              <a href="#catalog" className="hero-btn btn-primary min-h-[56px] text-lg px-8">
                Explore Products <ArrowRight size={20} className="ml-1" />
              </a>
              <a href="#authenticity" className="hero-btn btn-secondary min-h-[56px] border-white/10 text-lg px-8 bg-white/5 backdrop-blur-md">
                <ShieldCheck size={20} className="mr-2 text-mint" />
                Verify Authenticity
              </a>
            </div>
          </div>

          {/* Right Column - Visual Showcase */}
          <div className="relative hidden lg:flex h-[600px] w-full items-center justify-center lg:-translate-y-12" style={{ perspective: "1200px" }}>
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
                  className={`hero-visual-card animate-float-${i + 1} w-[260px] rounded-3xl border border-white/[0.08] bg-[#0c1324] p-4 shadow-[0_30px_60px_rgba(0,0,0,0.4)] backdrop-blur-2xl transition-all duration-300 hover:border-white/20`}
                  style={{
                    boxShadow: `0 30px 60px -10px ${product.accent}15`
                  }}
                >
                  {/* Seamless dark container for image blending */}
                  <div className="relative h-[220px] w-full overflow-hidden rounded-2xl bg-[#050811] border border-white/[0.04] p-4 flex items-center justify-center">
                    <Image
                      src={product.image!}
                      alt={product.name}
                      width={200}
                      height={200}
                      className="object-contain drop-shadow-2xl"
                    />
                  </div>
                  <div className="mt-4 px-2">
                    <div className="text-[10px] font-bold uppercase tracking-widest text-cream/50 mb-1">{product.category}</div>
                    <h3 className="text-base font-bold text-cream truncate">{product.name}</h3>
                    <div className="mt-3 flex items-center justify-between">
                      <span className="font-black text-gold">{formatTaka(product.price)}</span>
                      <span className="rounded-full bg-white/10 px-2 py-0.5 text-[10px] font-bold text-cream/70 backdrop-blur-md">
                        {product.badge}
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
      <div className="relative z-20 bg-[#04060d] py-6 border-b border-white/[0.05]">
        <div className="shell">
          <div className="flex items-center justify-center gap-8 text-xs font-semibold text-cream/40 uppercase tracking-widest">
            <div className="flex items-center gap-2">
              <ShieldCheck size={16} className="text-gold" /> Guaranteed Authentic
            </div>
            <div className="h-4 w-[1px] bg-white/10" />
            <div className="flex items-center gap-2">
              <Zap size={16} className="text-mint" /> Fast Delivery
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
