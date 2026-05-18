import Link from "next/link";
import Image from "next/image";
import { ShoppingBag } from "lucide-react";

const navItems = [
  ["Catalog", "#catalog"],
  ["Authenticity", "#authenticity"],
  ["Delivery", "#delivery"],
  ["Trust", "#trust"],
  ["CMS", "/admin/products"]
];

export function Header() {
  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-4">
      <nav className="shell flex min-h-[72px] items-center justify-between gap-6 rounded-lg border border-cream/10 bg-ink/75 px-5 text-cream backdrop-blur-xl">
        <Link href="/" className="flex items-center gap-3">
          <Image
            src="/images/logo.png"
            alt="Nutrition Hub Bangladesh"
            width={44}
            height={44}
            className="rounded-lg object-contain"
            priority
          />
          <span>
            <strong className="block leading-tight">Nutrition Hub</strong>
            <small className="block text-xs text-cream/60">Bangladesh</small>
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-bold text-cream/70 md:flex">
          {navItems.map(([label, href]) => (
            <Link className="transition hover:text-champagne" href={href} key={href}>
              {label}
            </Link>
          ))}
        </div>

        <button className="inline-flex min-h-11 items-center gap-2 rounded-lg bg-cream px-4 font-black text-ink">
          <ShoppingBag size={18} />
          Cart
        </button>
      </nav>
    </header>
  );
}
