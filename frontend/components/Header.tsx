"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  ShoppingBag,
  LogIn,
  LogOut,
  User as UserIcon,
  Menu,
  X,
  Package,
  ChevronDown,
  Dumbbell,
  Pill,
  CookingPot,
  UtensilsCrossed,
  AlignLeft
} from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";
import { fetchCategories, type Category, warmProductCache } from "@/lib/products";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const categoryIcons: Record<string, any> = {
  "Gym Supplements": Dumbbell,
  "Vitamins & Supplements": Pill,
  "Protein Oats": CookingPot,
  "Peanut Butter": UtensilsCrossed,
};

const SKIP_HOME_LOADER_KEY = "nutrition-hub-skip-home-loader";

function UserAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    const src = photoUrl.startsWith("http") ? photoUrl : `${API}${photoUrl}`;
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img
        src={src}
        alt={name}
        referrerPolicy="no-referrer"
        className="h-9 w-9 rounded-full object-cover ring-2 ring-gold/50"
      />
    );
  }

  const initial = name.charAt(0).toUpperCase();
  return (
    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-gradient-to-br from-gold to-champagne text-sm font-black text-ink ring-2 ring-gold/50">
      {initial}
    </div>
  );
}

export function Header() {
  const { user, loading, logout } = useAuth();
  const { totalCount } = useCart();
  const router = useRouter();
  const pathname = usePathname();
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [categories, setCategories] = useState<Category[]>([]);
  const [mobileCategoriesOpen, setMobileCategoriesOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchCategories().then(setCategories);
  }, []);

  const DEFAULT_CATEGORIES: Category[] = [
    { id: "1", name: "Gym Supplements", slug: "gym-supplements" },
    { id: "2", name: "Vitamins & Supplements", slug: "vitamins-supplements" },
    { id: "3", name: "Protein Oats", slug: "protein-oats" },
    { id: "4", name: "Peanut Butter", slug: "peanut-butter" },
  ];
  const displayCategories = categories.length > 0 ? categories : DEFAULT_CATEGORIES;

  // Close mobile menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  useEffect(() => {
    const warmRoutes = () => {
      router.prefetch("/");
      router.prefetch("/products");
      router.prefetch("/cart");
      router.prefetch(user ? "/dashboard" : "/login");
      warmProductCache();
    };

    if ("requestIdleCallback" in window) {
      const id = window.requestIdleCallback(warmRoutes, { timeout: 1500 });
      return () => window.cancelIdleCallback(id);
    }

    const timer = setTimeout(warmRoutes, 300);
    return () => clearTimeout(timer);
  }, [router, user]);

  function prefetchCartTarget() {
    router.prefetch("/cart");
  }

  function handleCartClick() {
    router.push("/cart");
  }

  function handleLogoClick() {
    if (pathname !== "/" && typeof window !== "undefined") {
      window.sessionStorage.setItem(SKIP_HOME_LOADER_KEY, "1");
    }
  }

  return (
    <header className="fixed inset-x-0 top-0 z-50 pt-2 sm:pt-4">
      <nav className="shell flex min-h-[58px] items-center justify-between gap-2 rounded-lg border border-cream/10 bg-ink/95 px-3 text-cream sm:min-h-[72px] sm:gap-6 sm:px-5 sm:bg-ink/75 sm:backdrop-blur-xl">
        <Link href="/" onClick={handleLogoClick} className="flex min-w-0 items-center gap-2 sm:gap-3">
          <Image
            src="/images/logo.png"
            alt="Nutrition Hub Bangladesh"
            width={44}
            height={44}
            className="h-9 w-9 shrink-0 rounded-lg object-contain sm:h-11 sm:w-11"
          />
          <span className="min-w-0">
            <strong className="block truncate text-sm leading-tight sm:text-base">Nutrition Hub</strong>
            <small className="block truncate text-[11px] text-cream/60 sm:text-xs">Bangladesh</small>
          </span>
        </Link>

        <div className="hidden items-center gap-7 text-sm font-bold text-cream/70 md:flex">
          {/* Categories Dropdown Menu */}
          <div className="relative group py-2">
            <button className="flex items-center gap-1.5 transition hover:text-champagne">
              Categories
              <ChevronDown size={14} className="transition-transform duration-200 group-hover:rotate-180" />
            </button>
            <div className="absolute left-1/2 top-full hidden group-hover:block w-64 -translate-x-1/2 pt-2">
              <div className="rounded-xl border border-cream/10 bg-ink/95 p-1.5 shadow-2xl backdrop-blur-xl">
                <Link
                  href="/products"
                  className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-cream/70 transition hover:bg-cream/5 hover:text-cream border-b border-white/[0.05] mb-1 pb-3"
                >
                  <AlignLeft size={16} className="text-gold" />
                  All Products
                </Link>
                {displayCategories.map((cat) => {
                  const Icon = categoryIcons[cat.name] || Dumbbell;
                  return (
                    <Link
                      key={cat.id}
                      href={`/products?category=${encodeURIComponent(cat.name)}`}
                      className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-cream/70 transition hover:bg-cream/5 hover:text-cream"
                    >
                      <Icon size={16} className="text-gold" />
                      {cat.name}
                    </Link>
                  );
                })}
              </div>
            </div>
          </div>

          <Link className="transition hover:text-champagne" href="/#authenticity">
            Authenticity
          </Link>
        </div>

        <div className="flex shrink-0 items-center gap-2 sm:gap-3">
          <button
            onClick={handleCartClick}
            onFocus={prefetchCartTarget}
            onMouseEnter={prefetchCartTarget}
            aria-label={user ? `Cart with ${totalCount} ${totalCount === 1 ? "item" : "items"}` : "Cart"}
            className="relative inline-flex min-h-10 w-10 items-center justify-center gap-1.5 rounded-lg text-cream transition hover:text-champagne sm:min-h-11 sm:w-auto sm:gap-2 sm:bg-cream sm:px-4 sm:text-base sm:font-black sm:text-ink sm:hover:text-ink"
          >
            <ShoppingBag size={18} />
            <span className="hidden sm:inline">Cart</span>
            {totalCount > 0 && (
              <span
                className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full px-1 text-[10px] font-black ring-2 ring-ink bg-gold text-ink"
              >
                {totalCount}
              </span>
            )}
          </button>

          {!loading && (
            <>
              {user ? (
                <div className="relative" ref={dropdownRef}>
                  <button
                    onClick={() => setDropdownOpen(!dropdownOpen)}
                    className="flex items-center transition hover:opacity-80"
                  >
                    <UserAvatar name={user.name} photoUrl={user.photo_url} />
                  </button>

                  {dropdownOpen && (
                    <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-cream/10 bg-ink/95 shadow-2xl sm:backdrop-blur-xl">
                      <div className="border-b border-cream/10 px-4 py-3">
                        <p className="text-sm font-bold text-cream">{user.name}</p>
                        <p className="text-xs text-cream/50">{user.email}</p>
                      </div>
                      <div className="py-1">
                        <Link
                          href="/dashboard"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream/70 transition hover:bg-cream/5 hover:text-cream"
                        >
                          <UserIcon size={16} />
                          My Profile
                        </Link>
                        <Link
                          href="/dashboard?tab=orders"
                          onClick={() => setDropdownOpen(false)}
                          className="flex items-center gap-3 px-4 py-2.5 text-sm text-cream/70 transition hover:bg-cream/5 hover:text-cream"
                        >
                          <Package size={16} />
                          My Orders
                        </Link>
                        <button
                          onClick={() => {
                            logout();
                            setDropdownOpen(false);
                          }}
                          className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-cream/70 transition hover:bg-cream/5 hover:text-red-400"
                        >
                          <LogOut size={16} />
                          Sign out
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <Link
                  href="/login"
                  className="inline-flex min-h-10 w-10 items-center justify-center gap-2 rounded-lg font-bold text-cream transition hover:text-champagne sm:min-h-11 sm:w-auto sm:border sm:border-cream/15 sm:bg-cream/[0.04] sm:px-4 sm:hover:border-gold/50"
                >
                  <LogIn size={18} />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              )}
            </>
          )}

          {/* Mobile hamburger menu button */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="inline-flex min-h-10 w-10 items-center justify-center rounded-lg border border-cream/15 bg-cream/[0.04] text-cream transition hover:border-gold/50 hover:text-champagne sm:min-h-11 sm:w-11 md:hidden"
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </nav>

      {/* Mobile Drawer Overlay */}
      {menuOpen && (
        <div className="fixed inset-x-3 top-[74px] z-40 overflow-hidden rounded-xl border border-cream/10 bg-ink/95 shadow-2xl sm:inset-x-4 sm:top-[92px] md:hidden">
          <nav className="flex flex-col gap-1 p-3">
            {/* Mobile Categories Accordion */}
            <div>
              <button
                onClick={() => setMobileCategoriesOpen(!mobileCategoriesOpen)}
                className="flex w-full items-center justify-between rounded-lg px-4 py-3 text-base font-bold text-cream/80 transition hover:bg-cream/5 hover:text-cream"
              >
                Categories
                <ChevronDown
                  size={16}
                  className={`transition-transform duration-200 text-cream/50 ${mobileCategoriesOpen ? "rotate-180" : ""}`}
                />
              </button>
              {mobileCategoriesOpen && (
                <div className="mt-1 pl-4 flex flex-col gap-1 border-l border-white/10 ml-6 pb-2">
                  <Link
                    href="/products"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-cream/70 transition hover:bg-cream/5 hover:text-cream"
                  >
                    <AlignLeft size={14} className="text-gold" />
                    All Products
                  </Link>
                  {displayCategories.map((cat) => {
                    const Icon = categoryIcons[cat.name] || Dumbbell;
                    return (
                      <Link
                        key={cat.id}
                        href={`/products?category=${encodeURIComponent(cat.name)}`}
                        onClick={() => setMenuOpen(false)}
                        className="flex items-center gap-3 rounded-lg px-4 py-2.5 text-sm text-cream/70 transition hover:bg-cream/5 hover:text-cream"
                      >
                        <Icon size={14} className="text-gold" />
                        {cat.name}
                      </Link>
                    );
                  })}
                </div>
              )}
            </div>

            <Link
              href="/#authenticity"
              onClick={() => setMenuOpen(false)}
              className="flex items-center gap-3 rounded-lg px-4 py-3 text-base font-bold text-cream/80 transition hover:bg-cream/5 hover:text-cream"
            >
              Authenticity
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
