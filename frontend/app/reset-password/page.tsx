"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft, CheckCircle, Eye, EyeOff, Lock } from "lucide-react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function ResetPasswordPage() {
  return (
    <Suspense>
      <ResetPasswordContent />
    </Suspense>
  );
}

function ResetPasswordContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (password !== confirm) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch(`${API}/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ token, new_password: password }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Failed to reset password");
      }
      setSuccess(true);
      // Auto-redirect after 3 seconds (user is now logged in via cookie)
      setTimeout(() => router.replace("/"), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="flex flex-col items-center mb-6">
            <Link href="/" className="mb-3">
              <Image src="/images/logo.png" alt="Nutrition Hub" width={56} height={56} className="rounded-xl shadow-lg border border-cream/5" />
            </Link>
            <h1 className="text-2xl font-black text-cream">Invalid Reset Link</h1>
            <p className="text-sm text-cream/50 mt-2">This password reset link is invalid or has expired.</p>
          </div>
          <Link
            href="/forgot-password"
            className="inline-flex items-center gap-2 text-sm font-bold text-gold hover:text-champagne transition"
          >
            Request a new reset link
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="mb-3">
            <Image src="/images/logo.png" alt="Nutrition Hub" width={56} height={56} className="rounded-xl shadow-lg border border-cream/5" />
          </Link>
          <h1 className="text-2xl font-black text-cream tracking-tight">Set New Password</h1>
          <p className="text-sm text-cream/50 mt-1">Choose a strong password for your account</p>
        </div>

        {success ? (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 text-center">
            <CheckCircle size={32} className="mx-auto mb-3 text-green-400" />
            <p className="text-sm text-cream/70 font-semibold">Password reset successful!</p>
            <p className="text-xs text-cream/40 mt-2">Redirecting you to the homepage...</p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-gold hover:text-champagne transition"
            >
              <ArrowLeft size={16} /> Go now
            </Link>
          </div>
        ) : (
          <>
            {error && (
              <div className="mb-4 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 text-sm text-red-400">
                {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-cream/40">
                  New Password
                </label>
                <div className="relative">
                  <input
                    type={showPw ? "text" : "password"}
                    required
                    minLength={8}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-2.5 pr-11 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                    placeholder="Minimum 8 characters"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-cream/40 transition hover:text-cream"
                  >
                    {showPw ? <EyeOff size={20} /> : <Eye size={20} />}
                  </button>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-cream/40">
                  Confirm Password
                </label>
                <input
                  type={showPw ? "text" : "password"}
                  required
                  minLength={8}
                  value={confirm}
                  onChange={(e) => setConfirm(e.target.value)}
                  className="w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-2.5 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                  placeholder="Re-enter your password"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-50 min-h-[48px]"
              >
                <Lock size={20} />
                {submitting ? "Resetting..." : "Reset Password"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-cream/50">
              <Link href="/login" className="inline-flex items-center gap-1 font-bold text-gold hover:text-champagne transition">
                <ArrowLeft size={14} /> Back to Sign In
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
