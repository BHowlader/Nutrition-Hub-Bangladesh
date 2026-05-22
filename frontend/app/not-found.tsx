import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home, ShoppingBag } from "lucide-react";

export default function NotFound() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-ink px-4 text-center">
      {/* Background glow */}
      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute left-1/2 top-1/3 h-[500px] w-[500px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-gold/5 blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-md">
        <Link href="/" className="mb-8 inline-block">
          <Image
            src="/images/logo.png"
            alt="Nutrition Hub Bangladesh"
            width={56}
            height={56}
            className="rounded-xl border border-white/10 shadow-lg"
          />
        </Link>

        <h1 className="text-[clamp(5rem,20vw,8rem)] font-black leading-none tracking-tighter text-cream/10">
          404
        </h1>

        <h2 className="mt-2 text-2xl font-black text-cream sm:text-3xl">
          Page not found
        </h2>
        <p className="mx-auto mt-3 max-w-sm text-sm leading-relaxed text-cream/50">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
          Let&apos;s get you back on track.
        </p>

        <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row sm:justify-center">
          <Link
            href="/"
            className="btn-primary inline-flex min-h-[44px] w-full items-center justify-center gap-2 px-6 text-sm sm:w-auto"
          >
            <Home size={16} />
            Back to home
          </Link>
          <Link
            href="/products"
            className="inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-6 text-sm font-bold text-cream/70 transition hover:border-gold/30 hover:text-cream sm:w-auto"
          >
            <ShoppingBag size={16} />
            Browse products
          </Link>
        </div>
      </div>
    </div>
  );
}
