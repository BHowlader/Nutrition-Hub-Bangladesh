"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { Eye, EyeOff, UserPlus } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function SignupPage() {
  return (
    <Suspense>
      <SignupContent />
    </Suspense>
  );
}

function SignupContent() {
  const { register, googleLogin, user, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const redirect = searchParams.get("redirect") || "/";

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!loading && user) router.replace(redirect);
  }, [loading, user, router, redirect]);

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
            setError("Google sign-up failed");
          }
        },
      });
      if (googleBtnRef.current) {
        window.google?.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          width: "100%",
          text: "signup_with",
          shape: "pill",
        });
      }
    };
    document.head.appendChild(script);
    return () => { script.remove(); };
  }, [googleLogin, router, redirect]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    if (password.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }
    setSubmitting(true);
    try {
      await register(name, email, password);
      router.replace(redirect);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) return null;

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-4">
      <div className="w-full max-w-md">
        <Link href="/" className="mb-10 flex items-center justify-center gap-3">
          <Image src="/images/logo.png" alt="Nutrition Hub" width={48} height={48} className="rounded-lg" />
          <span>
            <strong className="block text-lg leading-tight text-cream">Nutrition Hub</strong>
            <small className="block text-xs text-cream/60">Bangladesh</small>
          </span>
        </Link>

        <div className="premium-card p-8">
          <h1 className="mb-2 text-2xl font-black text-cream">Create account</h1>
          <p className="mb-8 text-sm text-cream/50">Join Nutrition Hub Bangladesh</p>

          {error && (
            <div className="mb-6 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cream/40">Full Name</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-3 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                placeholder="Your full name"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cream/40">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-3 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                placeholder="you@example.com"
              />
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-cream/40">Password</label>
              <div className="relative">
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={6}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-3 pr-11 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                  placeholder="Min 6 characters"
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
              className="btn-primary w-full disabled:opacity-50"
            >
              <UserPlus size={18} />
              {submitting ? "Creating account..." : "Create Account"}
            </button>
          </form>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-cream/10" />
            <span className="text-xs font-bold text-cream/30">OR</span>
            <div className="h-px flex-1 bg-cream/10" />
          </div>

          <div ref={googleBtnRef} className="flex justify-center" />

          <p className="mt-8 text-center text-sm text-cream/50">
            Already have an account?{" "}
            <Link
              href={`/login${redirect !== "/" ? `?redirect=${encodeURIComponent(redirect)}` : ""}`}
              className="font-bold text-gold transition hover:text-champagne"
            >
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
