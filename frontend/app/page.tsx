import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  BadgeCheck,
  Banknote,
  CheckCircle2,
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
  { icon: Truck, title: "Dhaka priority", text: "Same-day or next-day delivery target for available stock." },
  { icon: MapPin, title: "Nationwide courier", text: "Coverage for major cities and district-level delivery." },
  { icon: Banknote, title: "Cash on delivery", text: "Pay after product arrival for zero purchase friction." }
];

export default async function HomePage() {
  const [allProducts, heroSettings] = await Promise.all([fetchProducts(), fetchHeroSettings()]);
  const featured = allProducts.filter((p) => FEATURED_SLUGS.has(p.slug));
  return (
    <main className="min-h-screen bg-ink text-cream antialiased">
      <Header />
      <Hero initialProducts={allProducts} settings={heroSettings} />

      {/* Trust Strip */}
      <section id="trust" className="relative z-10 -mt-1 bg-ink">
        <div className="shell">
          <div className="grid gap-px overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.06] md:grid-cols-3">
            {[
              { num: "01", title: "Authenticity first", text: "Visible batch, expiry, importer, and sealed-stock checks before dispatch.", icon: ShieldCheck },
              { num: "02", title: "Bangladesh checkout", text: "Cash on Delivery (COD) nationwide, with phone-first order confirmation.", icon: CheckCircle2 },
              { num: "03", title: "Fast delivery", text: "Dhaka priority delivery with nationwide courier support for supplement orders.", icon: Truck }
            ].map(({ num, title, text, icon: Icon }) => (
              <article className="bg-[#0c1324] p-7 backdrop-blur-md" key={title}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-lg bg-gold/15">
                    <Icon size={18} className="text-gold" />
                  </span>
                  <span className="text-xs font-black text-gold">{num}</span>
                </div>
                <h2 className="text-lg font-black text-cream">{title}</h2>
                <p className="mt-2 text-sm leading-relaxed text-cream/55">{text}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* Spacer line */}
      <div className="h-[1px] bg-white/[0.05]" />

      {/* Shop by Goal */}
      <section className="relative overflow-hidden bg-ink py-16 sm:py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_15%_10%,rgba(96,165,250,0.13),transparent_32%),radial-gradient(circle_at_85%_15%,rgba(16,185,129,0.08),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
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
                  className="group relative flex h-full min-h-[210px] overflow-hidden rounded-2xl border border-white/[0.07] bg-[#0c1324]/30 p-5 shadow-[0_18px_55px_rgba(0,0,0,0.2)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-[#0c1324]/40 sm:min-h-[250px] sm:p-6 lg:min-h-[300px]"
                >
                  {/* Photo background with dark gradients for maximum typography contrast */}
                  {image && (
                    <div className="absolute inset-0 z-0 overflow-hidden">
                      <Image
                        src={image}
                        alt={title}
                        fill
                        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                        className="object-cover opacity-[0.88] transition-all duration-700 ease-out group-hover:scale-105 group-hover:opacity-[0.98]"
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-[#070b14] via-[#070b14]/75 to-transparent" />
                    </div>
                  )}
                  <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${accent} opacity-50 z-0`} />
                  <div className="relative z-10 flex min-h-full w-full flex-col">
                    <div className="flex items-center justify-between">
                      <span className="grid h-11 w-11 place-items-center rounded-xl border border-white/10 bg-white/[0.06] text-gold shadow-inner">
                        <Icon size={21} />
                      </span>
                      <span className="font-mono text-xs font-bold text-cream/28">
                        0{index + 1}
                      </span>
                    </div>
                    <div className="mt-auto pt-8">
                      <h3 className="text-lg font-black leading-tight text-cream transition-colors duration-300 group-hover:text-gold sm:text-xl">
                        {title}
                      </h3>
                      <p className="mt-3 line-clamp-3 text-sm leading-6 text-cream/58">{text}</p>
                      <div className="mt-5 inline-flex items-center gap-2 text-xs font-black uppercase tracking-[0.16em] text-cream/36 transition group-hover:text-gold">
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
      <div className="h-[1px] bg-white/[0.05]" />

      {/* Best Sellers (Catalog) */}
      <section id="catalog" className="relative overflow-hidden bg-[#080d18] py-14 text-cream sm:py-20 lg:py-28">
        <div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.035),transparent_22%),radial-gradient(circle_at_85%_0%,rgba(245,158,11,0.12),transparent_30%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-px bg-white/[0.06]" />
        <div className="shell">
          <Reveal>
            <div className="mb-7 sm:mb-12">
              {/* Eyebrow + inline "View all" link */}
              <div className="flex items-center justify-between gap-4">
                <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gold sm:text-xs">
                  Best sellers
                </p>
                <Link
                  href="/products"
                  className="group inline-flex items-center gap-1.5 text-[10px] font-black uppercase tracking-[0.18em] text-cream/55 transition hover:text-gold sm:text-xs"
                >
                  View all
                  <ArrowRight size={13} className="transition-transform group-hover:translate-x-0.5" />
                </Link>
              </div>

              <h2 className="mt-3 max-w-2xl text-[clamp(1.75rem,7vw,4rem)] font-black leading-[1.05] tracking-tight text-cream sm:mt-4 sm:leading-[0.98]">
                Popular picks at Nutrition Hub.
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-6 text-cream/55 sm:mt-4 sm:text-base sm:leading-7">
                Curated products for gym-goers, coaches, students, professionals, and
                anyone building a cleaner daily nutrition routine.
              </p>
            </div>
          </Reveal>

          <div className="grid grid-cols-2 gap-3 sm:gap-5 lg:grid-cols-3">
            {featured.map((product, index) => (
              <Reveal delay={index * 0.05} key={product.id}>
                <ProductCard product={product} />
              </Reveal>
            ))}
          </div>

          <div className="mt-8 sm:mt-14 sm:text-center">
            <Link
              href="/products"
              className="group flex w-full items-center justify-center gap-2.5 border border-white/10 bg-white/[0.03] px-5 py-3.5 text-xs font-black uppercase tracking-[0.18em] text-cream/75 transition hover:border-gold hover:bg-gold hover:text-ink sm:inline-flex sm:w-auto sm:rounded-full sm:px-8 sm:py-4 sm:text-sm"
            >
              View All Products
              <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </Link>
          </div>
        </div>
      </section>

      {/* Authenticity Process */}
      <section id="authenticity" className="bg-ink py-28">
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
                  <article className="group flex gap-5 rounded-2xl border border-white/[0.06] bg-[#0c1324]/40 p-6 transition-all duration-300 hover:border-gold/30 hover:bg-[#0c1324]/75">
                    <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-gold/10 text-gold border border-white/5">
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
                  <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
                    <Image
                      src="/images/products/creatine/brand-banner.jpg"
                      alt="Wellcore certified by Euromonitor International"
                      width={600}
                      height={600}
                      className="h-full w-full object-cover opacity-85 transition-opacity hover:opacity-100 duration-300"
                    />
                  </div>
                  <div className="overflow-hidden rounded-2xl border border-white/[0.08]">
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
      <div className="h-[1px] bg-white/[0.05]" />

      {/* Delivery & Payment */}
      <section id="delivery" className="bg-[#0b101c]/40 py-28 border-y border-white/[0.05]">
        <div className="shell">
          <Reveal>
            <div className="text-center max-w-2xl mx-auto mb-14">
              <p className="eyebrow text-gold">Delivery & payment</p>
              <h2 className="heading-lg text-cream">Built for how Bangladesh orders.</h2>
              <p className="mt-4 text-lg text-cream/60">
                Fast ordering, phone confirmation, courier-friendly addresses, and payment
                options customers already trust.
              </p>
            </div>
          </Reveal>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {deliveryOptions.map(({ icon: Icon, title, text }, index) => (
              <Reveal delay={index * 0.05} key={title}>
                <article className="rounded-2xl border border-white/[0.06] bg-[#0c1324]/40 p-7 text-center transition-all duration-300 hover:-translate-y-1 hover:border-gold/30 hover:bg-[#0c1324]/75">
                  <div className="mx-auto mb-5 grid h-14 w-14 place-items-center rounded-xl bg-gold/10 text-gold border border-white/5">
                    <Icon size={26} />
                  </div>
                  <h3 className="font-bold text-cream">{title}</h3>
                  <p className="mt-2 text-sm leading-relaxed text-cream/60">{text}</p>
                </article>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="bg-ink py-28">
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
                <article className="flex flex-col rounded-2xl border border-white/[0.06] bg-[#0c1324]/40 p-7 transition-all duration-300 hover:border-gold/30 hover:bg-[#0c1324]/75">
                  <div className="mb-5 flex gap-1">
                    {Array.from({ length: item.rating }).map((_, i) => (
                      <Star key={i} size={16} className="fill-gold text-gold" />
                    ))}
                  </div>
                  <p className="flex-1 text-lg leading-relaxed font-medium text-cream/90">
                    &ldquo;{item.quote}&rdquo;
                  </p>
                  <div className="mt-8 flex items-center gap-4 border-t border-white/[0.06] pt-6">
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
      <section className="bg-[#0b101c]/60 py-28 text-cream border-t border-white/[0.05]">
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
              <a className="btn-secondary text-base min-h-[48px] border-white/10 bg-white/5" href="#authenticity">
                Learn About Verification
              </a>
            </div>
          </Reveal>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/[0.05] bg-[#0c1324] pb-8 pt-12 text-cream sm:pt-14 md:pt-16">
        <div className="shell">
          {/* Brand block — centered on mobile/sm, left-aligned on md+ */}
          <div className="text-center md:text-left">
            <span className="inline-flex items-center gap-3 text-left">
              <Image
                src="/images/logo.png"
                alt="Nutrition Hub Bangladesh Logo"
                width={44}
                height={44}
                className="h-10 w-10 shrink-0 rounded-lg border border-white/5 object-contain shadow-md sm:h-11 sm:w-11"
              />
              <strong className="text-base font-black leading-tight text-cream sm:text-xl">
                Nutrition Hub
                <span className="mt-0.5 block text-[10px] font-bold uppercase tracking-wider text-cream/40 sm:text-xs">
                  Bangladesh
                </span>
              </strong>
            </span>
            <p className="mx-auto mt-5 max-w-md text-[13px] leading-relaxed text-cream/55 sm:text-sm md:mx-0">
              Premium supplement storefront for authentic sports nutrition, wellness,
              and goal-based product guidance in Bangladesh.
            </p>
          </div>

          {/* Divider — visible only on mobile/sm to separate brand from links */}
          <div className="mx-auto my-9 h-px w-24 bg-white/[0.08] sm:my-10 md:hidden" />

          {/* Link columns — 2-col on mobile (Categories | Quick Links) with Trust Metrics centered below; 3-col from sm+ */}
          <div className="grid grid-cols-2 gap-x-6 gap-y-9 text-center sm:grid-cols-3 sm:gap-x-6 sm:gap-y-10 md:mt-12 md:gap-x-12 md:text-left">
            <nav className="min-w-0">
              <strong className="text-[11px] font-black uppercase tracking-[0.18em] text-cream/45 sm:text-xs">
                Store Categories
              </strong>
              <ul className="mt-4 space-y-2.5 text-[13px] text-cream/60 sm:space-y-3 sm:text-sm">
                <li>
                  <Link href="/products?category=Gym Supplements" className="inline-block transition hover:text-cream">
                    Gym Supplements
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=Vitamins & Supplements" className="inline-block transition hover:text-cream">
                    Vitamins &amp; Supplements
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=Protein Oats" className="inline-block transition hover:text-cream">
                    Protein Oats
                  </Link>
                </li>
                <li>
                  <Link href="/products?category=Peanut Butter" className="inline-block transition hover:text-cream">
                    Peanut Butter
                  </Link>
                </li>
              </ul>
            </nav>

            <nav className="min-w-0">
              <strong className="text-[11px] font-black uppercase tracking-[0.18em] text-cream/45 sm:text-xs">
                Quick Links
              </strong>
              <ul className="mt-4 space-y-2.5 text-[13px] text-cream/60 sm:space-y-3 sm:text-sm">
                <li>
                  <Link href="/products" className="inline-block transition hover:text-cream">
                    All products
                  </Link>
                </li>
                <li>
                  <Link href="/#authenticity" className="inline-block transition hover:text-cream">
                    Authenticity
                  </Link>
                </li>
                <li>
                  <Link href="/#delivery" className="inline-block transition hover:text-cream">
                    Delivery &amp; payment
                  </Link>
                </li>
                <li>
                  <Link href="/login" className="inline-block transition hover:text-cream">
                    Sign in
                  </Link>
                </li>
              </ul>
            </nav>

            <div className="col-span-2 min-w-0 sm:col-span-1">
              <strong className="text-[11px] font-black uppercase tracking-[0.18em] text-cream/45 sm:text-xs">
                Trust Metrics
              </strong>
              <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2.5 text-[13px] text-cream/60 sm:mt-4 sm:flex-col sm:items-center sm:gap-x-0 sm:space-y-3 sm:text-sm md:items-start">
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
                  <span>Bangladesh delivery</span>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom strip */}
          <div className="mt-10 flex flex-col items-center gap-2 border-t border-white/[0.05] pt-6 text-center text-[11px] text-cream/35 sm:mt-14 sm:flex-row sm:justify-between sm:gap-4 sm:pt-7 sm:text-xs">
            <span>© {new Date().getFullYear()} Nutrition Hub Bangladesh. All rights reserved.</span>
            <span>
              Built by{" "}
              <a
                href="https://mindrona.com"
                target="_blank"
                rel="noopener noreferrer"
                className="mindrona-link"
              >
                Mindrona
              </a>
            </span>
          </div>
        </div>
      </footer>
    </main>
  );
}
