"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Eye, EyeOff, Lock, Shield, AlertCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PageLoading } from "@/components/PageLoading";

export default function AdminLoginPage() {
  const { login, logout, user, loading } = useAuth();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already logged in as admin
  useEffect(() => {
    if (!loading && user) {
      const isAdmin = user.is_admin || ["admin", "owner", "editor"].includes(user.role);
      if (isAdmin) {
        router.replace("/admin/products");
      }
    }
  }, [loading, user, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      // First attempt to log in using standard authentication
      await login(email, password);
      
      // Fetch /api/auth/me directly to verify role immediately before redirecting
      const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
      if (!res.ok) {
        throw new Error("Failed to verify user credentials");
      }
      const loggedUser = await res.json();
      const isAdmin = loggedUser.is_admin || ["admin", "owner", "editor"].includes(loggedUser.role);
      
      if (!isAdmin) {
        // Log out immediately to clear cookie/session
        await logout();
        setError("Access Denied: Administrative privileges required.");
      } else {
        router.replace("/admin/products");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Authentication failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return <PageLoading label="Verifying session" />;

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-ink px-4 py-12 relative overflow-hidden select-none">
      {/* Decorative radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-champagne/5 blur-[100px] pointer-events-none" />

      <div
        className={`w-full max-w-[420px] rounded-2xl border border-cream/10 bg-cream/[0.02] backdrop-blur-xl p-8 shadow-2xl transition-[transform,opacity] duration-500 ease-out-expo ${
          !mounted ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="mb-4">
            <Image
              src="/images/logo.png"
              alt="Nutrition Hub"
              width={56}
              height={56}
              className="rounded-xl border border-cream/5 shadow-lg"
              priority
            />
          </Link>
          <div className="flex items-center gap-2 rounded-full bg-gold/10 border border-gold/25 px-2.5 py-0.5 mb-2.5">
            <Shield size={12} className="text-gold" />
            <span className="text-[10px] font-black uppercase tracking-wider text-gold">CMS Security Portal</span>
          </div>
          <h1 className="text-2xl font-black text-cream tracking-tight">Administrative Sign In</h1>
          <p className="text-xs text-cream/40 mt-1">Authorized personnel only</p>
        </div>

        {error && (
          <div className="mb-5 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="leading-normal">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cream/40">Admin Email</label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-cream/10 bg-cream/[0.03] px-4 py-2.5 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
              placeholder="admin@example.com"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cream/40">Secure Password</label>
            <div className="relative">
              <input
                type={showPw ? "text" : "password"}
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full rounded-xl border border-cream/10 bg-cream/[0.03] px-4 py-2.5 pr-11 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                placeholder="Enter admin password"
              />
              <button
                type="button"
                onClick={() => setShowPw(!showPw)}
                className="absolute right-3.5 top-1/2 -translate-y-1/2 text-cream/40 transition hover:text-cream"
              >
                {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full min-h-[46px] rounded-xl bg-gold hover:bg-gold-light hover:shadow-lg hover:shadow-gold/15 text-ink text-sm font-black flex items-center justify-center gap-2 transition duration-200 disabled:opacity-50"
          >
            <Lock size={16} />
            {submitting ? "Verifying Credentials..." : "Authenticate Portal"}
          </button>
        </form>

        {/* Development Tooltip */}
        {process.env.NODE_ENV === "development" && (
          <div className="mt-6 rounded-xl border border-gold/20 bg-gold/5 p-4 text-[11px] text-cream/70 leading-normal">
            <div className="flex items-center gap-1.5 text-gold font-extrabold mb-1">
              <Shield size={12} />
              <span>Local Dev Helper</span>
            </div>
            <p className="mb-2">To access the Admin Panel, sign up or log in using one of the configured admin emails:</p>
            <div className="space-y-1.5 font-mono text-[10px] text-gold select-all">
              <code className="block bg-ink/50 p-1.5 rounded border border-cream/5 text-center select-all">
                bibekhowlader8@gmail.com
              </code>
              <code className="block bg-ink/50 p-1.5 rounded border border-cream/5 text-center select-all">
                ritrahalder021@gmail.com
              </code>
            </div>
          </div>
        )}

        <div className="mt-6 border-t border-cream/10 pt-4 text-center">
          <Link
            href="/"
            className="text-xs text-cream/40 hover:text-cream transition-colors duration-200"
          >
            ← Return to public storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
