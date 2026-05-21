"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { ShoppingBag, LogIn, LogOut, User as UserIcon } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { useCart } from "@/lib/cart";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

const navItems = [
  ["Products", "/products"],
  ["Authenticity", "/#authenticity"],
];

function UserAvatar({ name, photoUrl }: { name: string; photoUrl: string | null }) {
  if (photoUrl) {
    const src = photoUrl.startsWith("http") ? photoUrl : `${API}${photoUrl}`;
    return (
      <img
        src={src}
        alt={name}
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
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  function handleCartClick() {
    if (!user) {
      router.push("/login?redirect=/cart");
      return;
    }
    router.push("/cart");
  }

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

        <div className="flex items-center gap-3">
          <button
            onClick={handleCartClick}
            className="relative inline-flex min-h-11 items-center gap-2 rounded-lg bg-cream px-4 font-black text-ink"
          >
            <ShoppingBag size={18} />
            Cart
            {totalCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-5 min-w-[20px] items-center justify-center rounded-full bg-gold px-1 text-[10px] font-black text-ink ring-2 ring-ink">
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
                    <div className="absolute right-0 top-full mt-2 w-56 overflow-hidden rounded-xl border border-cream/10 bg-ink/95 shadow-2xl backdrop-blur-xl">
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
                  className="inline-flex min-h-11 items-center gap-2 rounded-lg border border-cream/15 bg-cream/[0.04] px-4 font-bold text-cream transition hover:border-gold/50 hover:text-champagne"
                >
                  <LogIn size={18} />
                  <span className="hidden sm:inline">Login</span>
                </Link>
              )}
            </>
          )}
        </div>
      </nav>
    </header>
  );
}
