"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, LogIn } from "lucide-react";
import { useAuth } from "@/lib/auth";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (config: Record<string, unknown>) => void;
          renderButton: (el: HTMLElement, config: Record<string, unknown>) => void;
        };
      };
    };
  }
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginContent />
    </Suspense>
  );
}

function LoginContent() {
  const { login, googleLogin, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);

  // Redirect if already logged in
  useEffect(() => {
    if (!loading && user) router.replace(redirect);
  }, [loading, user, router, redirect]);

  // Load Google Identity Services
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          try {
            await googleLogin(response.credential);
            router.replace(redirect);
          } catch {
            setError("Google sign-in failed");
          }
        },
      });
      if (googleBtnRef.current) {
        window.google?.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          width: "100%",
          text: "signin_with",
          shape: "pill",
        });
      }
      setGsiReady(true);
    };
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [googleLogin, router, redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(email, password);
      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="flex h-screen items-center justify-center bg-ink px-4 overflow-hidden">
      <div className="w-full max-w-md my-auto">
        {/* Logo */}
        <Link href="/" className="mb-5 md:mb-6 flex items-center justify-center gap-3">
          <Image src="/images/logo.png" alt="Nutrition Hub" width={40} height={40} className="rounded-lg" />
          <span>
            <strong className="block text-lg leading-tight text-cream">Nutrition Hub</strong>
            <small className="block text-xs text-cream/60">Bangladesh</small>
          </span>
        </Link>

        <div className="premium-card p-5 md:p-6">
          <h1 className="mb-0.5 text-2xl font-black text-cream">Welcome back</h1>
          <p className="mb-5 md:mb-6 text-sm text-cream/50">Sign in to your account</p>

          {error && (
            <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-3.5 md:space-y-4">
            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-cream/40">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-2 md:py-2.5 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-cream/40">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-2 md:py-2.5 pr-11 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                  placeholder="Enter your password"
                />
                <button
                  type="button"
                  onClick={() => setShowPw(!showPw)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 transition hover:text-cream"
                >
                  {showPw ? <EyeOff size={18} /> : <Eye size={18} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-primary w-full disabled:opacity-50 min-h-[40px] md:min-h-[44px] mt-1"
            >
              <LogIn size={18} />
              {submitting ? "Signing in..." : "Sign In"}
            </button>
          </form>

          {/* Divider */}
          <div className="my-4 md:my-5 flex items-center gap-4">
            <div className="h-px flex-1 bg-cream/10" />
            <span className="text-xs font-bold text-cream/30">OR</span>
            <div className="h-px flex-1 bg-cream/10" />
          </div>

          {/* Google Sign-In — GSI renders here when client ID is configured */}
          <div ref={googleBtnRef} className={gsiReady ? "flex justify-center" : "hidden"} />

          {/* Fallback styled button when GSI not loaded */}
          {!gsiReady && (
            <button
              type="button"
              onClick={() => setError("Google Sign-In is not configured yet. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID.")}
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-2 md:py-2.5 font-bold text-cream transition hover:border-cream/20 hover:bg-cream/[0.08]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4"/>
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/>
                <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/>
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/>
              </svg>
              Continue with Google
            </button>
          )}

          <p className="mt-5 md:mt-6 text-center text-sm text-cream/50">
            Don&apos;t have an account?{" "}
            <Link
              href={`/signup${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="font-bold text-gold transition hover:text-champagne"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
