export const revalidate = 3600;

import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  MapPin,
  Pill,
  ShieldCheck,
  Sparkles,
  Star,
  Truck,
  PackageCheck
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { Header } from "@/components/Header";
import { Hero } from "@/components/Hero";
import { ProductCard } from "@/components/ProductCard";
import { Reveal } from "@/components/Reveal";
import { fetchHeroSettings, fetchProducts } from "@/lib/products";

const FEATURED_SLUGS = new Set([
  "creatine-tropical-tango",
  "creatine-kiwi-kick",
  "mb-omega3-gold",
  "mb-vite-multivitamin",
  "pintola-protein-oats",
  "kapiva-shilajit-gold",
]);

const categories = [
  {
    title: "Gym Supplements",
    text: "Wellcore Creatines and MuscleBlaze Liquid L-Carnitine for explosive power, muscle growth, and endurance.",
    icon: Pill,
    image: "/images/categories/cat_gym_supplements.png",
    accent: "from-gold/20 to-gold/5"
  },
  {
    title: "Vitamins & Supplements",
    text: "MuscleBlaze Omega-3s, Multivitamins, Kapiva Ashwagandha Gold, and Shilajit Gold Resin.",
    icon: ShieldCheck,
    image: "/images/categories/cat_vitamins_supplements.png",
    accent: "from-champagne/20 to-champagne/5"
  },
  {
    title: "Protein Oats",
    text: "PINTOLA premium dark chocolate and masala high-protein oats and muesli for power breakfasts.",
    icon: Sparkles,
    image: "/images/categories/cat_protein_oats.png",
    accent: "from-mint/20 to-mint/5"
  },
  {
    title: "Peanut Butter",
    text: "PINTOLA high protein chocolate peanut butters in crunchy, creamy, and dark chocolate crispy variants.",
    icon: Sparkles,
    image: "/images/categories/cat_peanut_butter.png",
    accent: "from-gold/20 to-gold/5"
  }
];

const verificationSteps = [
  { step: "Source Review", text: "Importer and supplier source reviewed before listing" },
  { step: "Batch Check", text: "Batch number and expiry date checked before dispatch" },
  { step: "Seal Verification", text: "Seal condition photographed during packing when requested" },
  { step: "Pre-Purchase Support", text: "Customer support available before buying a stack" }
];

const testimonials = [
  {
    name: "Sakib Rahman",
    role: "Gym owner, Mirpur",
    quote: "The ordering flow feels premium and the trust details are exactly what supplement buyers ask for.",
    rating: 5
  },
  {
    name: "Nusrat Jahan",
    role: "Fitness coach, Dhanmondi",
    quote: "Clear categories, COD, and product verification make it easier to recommend products to clients.",
    rating: 5
  },
  {
    name: "Tanvir Hossain",
    role: "Bodybuilding enthusiast",
    quote: "The product cards are easy to scan and the site feels much more reliable than a generic template.",
    rating: 5
  }
];

const deliveryOptions: { icon: LucideIcon; title: string; text: string }[] = [
  { icon: Truck, title: "Powered by Pathao", text: "All orders are fulfilled via Pathao Courier for fast, trackable nationwide delivery." },
  { icon: MapPin, title: "Nationwide coverage", text: "Dhaka same-day priority with district-level reach across Bangladesh." },
  { icon: Banknote, title: "Cash on delivery", text: "Pay after product arrival for zero purchase friction." }
];

export default async function HomePage() {
  const [allProducts, heroSettings] = await Promise.all([fetchProducts(), fetchHeroSettings()]);
  const featured = allProducts.filter((p) => FEATURED_SLUGS.has(p.slug));
  return (
    <main className="min-h-screen overflow-x-hidden bg-transparent text-cream antialiased">
      <Header />
      <Hero initialProducts={allProducts} settings={heroSettings} />

      {/* Spacer line */}
      <div className="h-[1px] bg-cream/[0.05]" />

      {/* Shop by Goal */}
      <section className="relative bg-transparent py-16 sm:py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgb(var(--color-gold)/0.10),transparent_32%),radial-gradient(circle_at_85%_15%,rgb(var(--color-mint)/0.07),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cream/[0.06]" />
        <div className="shell">
          <Reveal>
            <div className="relative mb-9 grid gap-5 sm:mb-12 lg:grid-cols-[0.92fr_1.08fr] lg:items-end">
              <div>
                <p className="eyebrow text-gold">Shop by goal</p>
                <h2 className="max-w-xl text-[clamp(2rem,5vw,4rem)] font-black leading-[0.98] tracking-tight text-cream">
                  Choose the stack that matches your routine.
                </h2>
              </div>
              <p className="max-w-xl text-sm leading-7 text-cream/58 sm:text-base lg:justify-self-end">
                Fast routes into the store for strength training, daily wellness, protein breakfast,
                and healthy snacking. Each goal opens the matching product category.
              </p>
            </div>
          </Reveal>

          <div className="relative grid auto-rows-fr gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {categories.map(({ title, text, icon: Icon, image, accent }, index) => (
              <Reveal className="h-full" delay={index * 0.06} key={title}>
                <Link
                  href={`/products?category=${encodeURIComponent(title)}`}
                  className="group relative flex h-full min-h-[210px] overflow-hidden rounded-2xl border border-white/10 bg-black p-5 shadow-[0_18px_55px_rgba(0,0,0,0.25)] transition-all duration-300 hover:-translate-y-1 hover:border-white/20 sm:min-h-[250px] sm:p-6 lg:min-h-[300px]"
                >
                  {/* Photo background with always-dark overlay for legibility in both themes */}
                  {image && (
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <Image
                        src={image}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover opacity-[0.88] transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-[0.98]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/60 to-black/20" />
                    </div>
                  )}
                  <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${accent} opacity-30 z-0`} />
                  <div className="relative z-10 flex min-h-full w-full flex-col">
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/15 bg-white/10 text-gold shadow-inner backdrop-blur-sm">
                        <Icon size={21} />
                      </span>
                      <span className="font-mono text-xs font-bold text-white/30">
                        0{index + 1}
                      </span>
                    </div>
                    <div className="mt-auto pt-8">
                      <h3 className="text-lg font-black leading-tight text-white transition-colors duration-300 group-hover:text-gold sm:text-xl">
                        {title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-white/60">{text}</p>
                      <div className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-white/40 transition group-hover:text-gold">
                        Browse <ArrowRight size={14} className="transition group-hover:translate-x-1" />
                      </div>
                    </div>
                  </div>
                </Link>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Spacer line */}
      <div className="h-[1px] bg-cream/[0.05]" />

      {/* Best Sellers (Catalog) */}
      <section id="catalog" className="relative bg-transparent py-14 text-cream sm:py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgb(var(--color-cream)/0.035),transparent_22%),radial-gradient(circle_at_85%_0%,rgb(var(--color-gold)/0.10),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-cream/[0.06]" />
        <div className="shell">
          <Reveal>
            <div className="mb-7 sm:mb-12">
              <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gold sm:text-xs">
                Best sellers
              </p>

              <h2 className="mt-3 max-w-2xl text-[clamp(1.75rem,7vw,4rem)] font-black leading-[1.05] tracking-tight text-cream sm:mt-4 sm:leading-[0.98] lg:max-w-[980px] xl:max-w-[1080px]">
                Popular picks at Nutrition Hub.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-cream/55 sm:mt-4 sm:text-base sm:leading-7 lg:max-w-[820px] xl:max-w-[920px]">
                Curated products for gym-goers, coaches, students, professionals, and
                anyone building a cleaner daily nutrition routine.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {featured.map((product, index) => (
              <Reveal delay={index * 0.05} key={product.id}>
                <ProductCard product={product} priority={index < 2} />
              </Reveal>
            ))}
          </div>

          <div className="mt-8 sm:mt-14 sm:text-center">
            <Link
              href="/products"
              className="group flex w-full items-center justify-center gap-2.5 rounded-full border border-cream/10 bg-cream/[0.03] px-5 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-cream/75 transition hover:border-gold hover:bg-gold hover:text-ink sm:inline-flex sm:w-auto sm:px-8 sm:py-4 sm:text-sm"
            >
              View All Products
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Authenticity Process */}
      <section id="authenticity" className="bg-transparent py-28">
        <div className="shell">
          <div className="grid gap-16 lg:grid-cols-2 lg:items-center">
            <Reveal>
              <div>
                <p className="eyebrow text-gold">Authenticity process</p>
                <h2 className="heading-lg text-cream">No vague promises. Clear verification.</h2>
                <p className="mt-5 text-lg leading-relaxed text-cream/60">
                  Supplement buyers in Bangladesh care about fake products, expired stock, broken
                  seals, and unclear import sources. We make those concerns part of the
                  purchase flow — not hidden after checkout.
                </p>
                <Link href="/products" className="mt-8 inline-flex items-center gap-2 font-bold text-gold transition hover:text-mint">
                  Shop verified products <ArrowRight size={18} />
                </Link>
              </div>
            </Reveal>

            <div className="grid gap-4">
              {verificationSteps.map(({ step, text }, index) => (
                <Reveal delay={index * 0.06} key={step}>
                  <article className="group flex gap-5 rounded-2xl border border-cream/[0.06] bg-card p-6 transition-all duration-300 hover:border-gold/30 hover:bg-card/85">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold border border-cream/5">
                      <BadgeCheck size={22} />
                    </span>
                    <div>
                      <strong className="text-base font-bold text-cream group-hover:text-gold transition-colors duration-300">
                        Step {index + 1}: {step}
                      </strong>
                      <p className="mt-1.5 text-sm leading-relaxed text-cream/60">{text}</p>
                    </div>
                  </article>
                </Reveal>
              ))}

              <Reveal delay={0.3}>
                <div className="mt-4 grid grid-cols-2 gap-4">
                  <div className="overflow-hidden rounded-2xl border border-cream/[0.08]">
                    <Image
                      src="/images/products/creatine/brand-banner.jpg"
                      alt="Wellcore certified by Euromonitor International"
                      width={600}
                      height={600}
                      className="h-full w-full object-cover opacity-85 transition-opacity hover:opacity-100 duration-300"
                    />
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-cream/[0.08]">
                    <Image
                      src="/images/products/creatine/back-label.jpg"
                      alt="Product back label showing batch number, FSSAI certification, and authentication steps"
                      width={600}
                      height={600}
                      className="h-full w-full object-cover opacity-85 transition-opacity hover:opacity-100 duration-300"
                    />
                  </div>
                </div>
              </Reveal>
            </div>
          </div>
        </div>
      </section>

      {/* Spacer line */}
      <div className="h-[1px] bg-cream/[0.05]" />

      {/* Delivery & Payment */}
      <section id="delivery" className="bg-transparent py-14 border-y border-cream/[0.05] sm:py-20 lg:py-28">
        <div className="shell">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-8 sm:mb-12 lg:mb-14">
              <p className="eyebrow text-gold">Delivery & payment</p>
              <h2 className="heading-lg text-cream">Built for how Bangladesh orders.</h2>
              <p className="mt-3 text-sm leading-relaxed text-cream/60 sm:mt-4 sm:text-lg">
                Fast ordering, phone confirmation, courier-friendly addresses, and payment
                options customers already trust.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-3 sm:grid-cols-2 sm:gap-5 lg:grid-cols-3">
            {deliveryOptions.map(({ icon: Icon, title, text }, index) => (
              <Reveal delay={index * 0.05} key={title}>
                <article className="flex items-start gap-4 rounded-2xl border border-cream/[0.06] bg-card p-4 transition-all duration-300 hover:border-gold/30 hover:bg-card/85 sm:block sm:p-7 sm:text-center sm:hover:-translate-y-1">
                  <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl border border-cream/5 bg-gold/10 text-gold sm:mx-auto sm:mb-5 sm:h-14 sm:w-14">
                    <Icon size={22} className="sm:hidden" />
                    <Icon size={26} className="hidden sm:block" />
                  </div>
                  <div className="min-w-0 flex-1 sm:flex-none">
                    <h3 className="font-bold text-cream">{title}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-cream/60 sm:mt-2">{text}</p>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-transparent py-28">
        <div className="shell">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="eyebrow text-gold">Customer confidence</p>
              <h2 className="heading-lg text-cream">Trusted by fitness enthusiasts.</h2>
            </div>
          </Reveal>

          <div className="grid gap-5 lg:grid-cols-3">
            {testimonials.map((item, index) => (
              <Reveal delay={index * 0.06} key={item.name}>
                <article className="flex flex-col rounded-2xl border border-cream/[0.06] bg-card p-7 transition-all duration-300 hover:border-gold/30 hover:bg-card/85">
                  <div className="mb-5 flex gap-1">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} size={16} className="fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="flex-1 text-lg leading-relaxed font-medium text-cream/90">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div className="mt-8 flex items-center gap-4 border-t border-cream/[0.06] pt-6">
                    <div className="grid h-11 w-11 place-items-center rounded-full bg-gold/15 text-sm font-black text-gold">
                      {item.name.split(" ").map(n => n[0]).join("")}
                    </div>
                    <div>
                      <strong className="block text-sm text-cream">{item.name}</strong>
                      <span className="text-xs text-cream/50">{item.role}</span>
                    </div>
                  </div>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="bg-transparent py-28 text-cream border-t border-cream/[0.05]">
        <div className="shell text-center">
          <Reveal>
            <p className="eyebrow text-gold mx-auto">Need supplement guidance?</p>
            <h2 className="mx-auto max-w-4xl font-display text-[clamp(2.2rem,5vw,4.5rem)] font-black leading-[0.95] tracking-[-0.04em]">
              Ask before you stack.{" "}
              <span className="bg-gradient-to-r from-gold to-mint bg-clip-text text-transparent">
                Buy only what fits your goal.
              </span>
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg text-cream/50">
              Get WhatsApp or Messenger support for pre-purchase guidance, order
              confirmation, and authenticity questions.
            </p>
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <a className="btn-primary text-base min-h-[48px]" href="#catalog">
                Start Shopping <ArrowRight size={18} />
              </a>
              <a className="btn-secondary text-base min-h-[48px]" href="#authenticity">
                Learn About Verification
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 dark:border-cream/10 bg-gradient-to-b from-amber-50 to-orange-50/50 pb-8 pt-12 text-slate-800 dark:from-[#060d1a] dark:to-[#0a1528] dark:text-cream sm:pt-14 md:pt-16">
        <div className="shell">
          {/* Brand block + Social icons row */}
          <div className="flex flex-col items-center gap-5 text-center md:flex-row md:items-center md:justify-between md:text-left">
            <div>
              <span className="inline-flex items-center gap-3 text-left">
                <Image
                  src="/images/logo.png"
                  alt="Nutrition Hub Bangladesh Logo"
                  width={44}
                  height={44}
                  className="h-10 w-10 shrink-0 rounded-lg border border-slate-200 dark:border-cream/5 object-contain shadow-md sm:h-11 sm:w-11"
                />
                <strong className="text-base font-black leading-tight text-slate-900 dark:text-cream sm:text-xl">
                  Nutrition Hub
                  <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-cream/40 sm:text-xs">
                    Bangladesh
                  </span>
                </strong>
              </span>
              <p className="mx-auto mt-5 max-w-md text-[13px] leading-relaxed text-slate-500 dark:text-cream/55 sm:text-sm md:mx-0">
                Premium supplement storefront for authentic sports nutrition, wellness,
                and goal-based product guidance in Bangladesh.
              </p>
            </div>
            <div className="flex items-center gap-3 shrink-0">
              <a href="https://www.facebook.com/share/18WRSVF1Ch/" target="_blank" rel="noopener noreferrer" aria-label="Facebook" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-cream/10 bg-slate-100 dark:bg-cream/[0.04] text-slate-500 dark:text-cream/50 transition-all hover:border-[#1877F2]/40 hover:bg-[#1877F2]/10 hover:text-[#1877F2]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M9.198 21.5h4v-8.01h3.604l.396-3.98h-4V7.5a1 1 0 0 1 1-1h3v-4h-3a5 5 0 0 0-5 5v2.01h-2l-.396 3.98h2.396v8.01Z" /></svg>
              </a>
              <a href="https://www.instagram.com/nutrition.hub.bd?igsh=amVvaHlpcnI1dDY4" target="_blank" rel="noopener noreferrer" aria-label="Instagram" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-cream/10 bg-slate-100 dark:bg-cream/[0.04] text-slate-500 dark:text-cream/50 transition-all hover:border-[#E4405F]/40 hover:bg-[#E4405F]/10 hover:text-[#E4405F]">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M12 2.982c2.937 0 3.285.011 4.445.064a6.087 6.087 0 0 1 2.042.379 3.408 3.408 0 0 1 1.265.823 3.408 3.408 0 0 1 .823 1.265 6.087 6.087 0 0 1 .379 2.042c.053 1.16.064 1.508.064 4.445s-.011 3.285-.064 4.445a6.087 6.087 0 0 1-.379 2.042 3.643 3.643 0 0 1-2.088 2.088 6.087 6.087 0 0 1-2.042.379c-1.16.053-1.508.064-4.445.064s-3.285-.011-4.445-.064a6.087 6.087 0 0 1-2.042-.379 3.408 3.408 0 0 1-1.265-.823 3.408 3.408 0 0 1-.823-1.265 6.087 6.087 0 0 1-.379-2.042c-.053-1.16-.064-1.508-.064-4.445s.011-3.285.064-4.445a6.087 6.087 0 0 1 .379-2.042 3.408 3.408 0 0 1 .823-1.265 3.408 3.408 0 0 1 1.265-.823 6.087 6.087 0 0 1 2.042-.379c1.16-.053 1.508-.064 4.445-.064M12 1c-2.987 0-3.362.013-4.535.066a8.074 8.074 0 0 0-2.67.511 5.392 5.392 0 0 0-1.949 1.27 5.392 5.392 0 0 0-1.269 1.948 8.074 8.074 0 0 0-.51 2.67C1.012 8.639 1 9.014 1 12s.013 3.362.066 4.535a8.074 8.074 0 0 0 .511 2.67 5.392 5.392 0 0 0 1.27 1.949 5.392 5.392 0 0 0 1.948 1.269 8.074 8.074 0 0 0 2.67.51C8.639 22.988 9.014 23 12 23s3.362-.013 4.535-.066a8.074 8.074 0 0 0 2.67-.511 5.625 5.625 0 0 0 3.218-3.218 8.074 8.074 0 0 0 .51-2.67C22.988 15.361 23 14.986 23 12s-.013-3.362-.066-4.535a8.074 8.074 0 0 0-.511-2.67 5.392 5.392 0 0 0-1.27-1.949 5.392 5.392 0 0 0-1.948-1.269 8.074 8.074 0 0 0-2.67-.51C15.361 1.012 14.986 1 12 1Zm0 5.351A5.649 5.649 0 1 0 17.649 12 5.649 5.649 0 0 0 12 6.351Zm0 9.316A3.667 3.667 0 1 1 15.667 12 3.667 3.667 0 0 1 12 15.667Zm5.872-10.859a1.32 1.32 0 1 0 1.32 1.32 1.32 1.32 0 0 0-1.32-1.32Z" /></svg>
              </a>
              <a href="https://www.tiktok.com/@nutrition.hub.bd?_r=1&_t=ZS-96a0cD5XcDX" target="_blank" rel="noopener noreferrer" aria-label="TikTok" className="flex h-9 w-9 items-center justify-center rounded-full border border-slate-200 dark:border-cream/10 bg-slate-100 dark:bg-cream/[0.04] text-slate-500 dark:text-cream/50 transition-all hover:border-slate-400 dark:hover:border-cream/40 hover:bg-slate-200 dark:hover:bg-cream/10 hover:text-slate-800 dark:hover:text-cream">
                <svg viewBox="0 0 24 24" fill="currentColor" className="h-4 w-4"><path d="M19.59 6.69a4.83 4.83 0 0 1-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 0 1-2.88 2.5 2.89 2.89 0 0 1 0-5.78 2.86 2.86 0 0 1 .87.13V9.01a6.32 6.32 0 0 0-1-.05 6.34 6.34 0 0 0-6.34 6.34 6.34 6.34 0 0 0 6.34 6.34 6.34 6.34 0 0 0 6.34-6.34V9.48a8.27 8.27 0 0 0 3.89.96V7h-.02c0-.1.02-.2.02-.31Z" /></svg>
              </a>
            </div>
          </div>

          {/* Divider — visible only on mobile/sm to separate brand from links */}
          <div className="mx-auto my-9 h-px w-24 bg-slate-200 dark:bg-cream/[0.08] sm:my-10 md:hidden" />

          {/* Link columns — 2-col on mobile (Categories | Quick Links) with Trust Metrics centered below; 3-col from sm+ */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-9 text-center sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 md:mt-12 md:gap-x-12 md:text-left">
            <nav className="min-w-0">
              <strong className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-cream/45 sm:text-xs">
                Store Categories
              </strong>
              <ul className="mt-4 space-y-2.5 text-[13px] text-slate-600 dark:text-cream/60 sm:space-y-3 sm:text-sm">
                <li>
                  <Link href="/products?category=Gym Supplements" className="inline-block transition hover:text-slate-900 dark:hover:text-cream">
                    Gym Supplements
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=Vitamins & Supplements" className="inline-block transition hover:text-slate-900 dark:hover:text-cream">
                    Vitamins &amp; Supplements
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=Protein Oats" className="inline-block transition hover:text-slate-900 dark:hover:text-cream">
                    Protein Oats
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=Peanut Butter" className="inline-block transition hover:text-slate-900 dark:hover:text-cream">
                    Peanut Butter
                  </Link>
                </li>
              </ul>
            </nav>

            <nav className="min-w-0">
              <strong className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-cream/45 sm:text-xs">
                Quick Links
              </strong>
              <ul className="mt-4 space-y-2.5 text-[13px] text-slate-600 dark:text-cream/60 sm:space-y-3 sm:text-sm">
                <li>
                  <Link href="/products" className="inline-block transition hover:text-slate-900 dark:hover:text-cream">
                    All products
                  </Link>
                </li>
                <li>
                  <Link href="/#authenticity" className="inline-block transition hover:text-slate-900 dark:hover:text-cream">
                    Authenticity
                  </Link>
                </li>
                <li>
                  <Link href="/#delivery" className="inline-block transition hover:text-slate-900 dark:hover:text-cream">
                    Delivery &amp; payment
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="inline-block transition hover:text-slate-900 dark:hover:text-cream">
                    Sign in
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="col-span-2 min-w-0 sm:col-span-1">
              <strong className="text-[11px] font-black uppercase tracking-[0.18em] text-slate-400 dark:text-cream/45 sm:text-xs">
                Trust Metrics
              </strong>
              <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-[13px] text-slate-600 dark:text-cream/60 sm:mt-4 sm:flex-col sm:items-center sm:gap-x-0 sm:space-y-3 sm:text-sm md:items-start">
                <li className="flex items-center justify-center gap-2 md:justify-start">
                  <ShieldCheck size={13} className="shrink-0 text-gold" />
                  <span>Authenticity checks</span>
                </li>
                <li className="flex items-center justify-center gap-2 md:justify-start">
                  <PackageCheck size={13} className="shrink-0 text-gold" />
                  <span>Sealed stock</span>
                </li>
                <li className="flex items-center justify-center gap-2 md:justify-start">
                  <Truck size={13} className="shrink-0 text-gold" />
                  <span>Pathao delivery</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="mt-10 flex flex-col items-center gap-4 border-t border-slate-200 dark:border-cream/[0.05] pt-6 sm:mt-14 sm:pt-7">
            <div className="flex flex-col items-center gap-3 sm:flex-row sm:justify-between sm:w-full">
              <span className="text-[11px] text-slate-400 dark:text-cream/35 sm:text-xs">
                © {new Date().getFullYear()} Nutrition Hub Bangladesh. All rights reserved.
              </span>
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
        </div>
      </footer>
    </main>
  );
}
