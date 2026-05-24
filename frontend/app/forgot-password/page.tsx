"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Mail } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Something went wrong. Please try again.");
      }
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-ink px-6 py-12">
      <div className="w-full max-w-md">
        <div className="flex flex-col items-center text-center mb-6">
          <Link href="/" className="mb-3">
            <Image src="/images/logo.png" alt="Nutrition Hub" width={56} height={56} className="rounded-xl shadow-lg border border-cream/5" />
          </Link>
          <h1 className="text-2xl font-black text-cream tracking-tight">Reset Password</h1>
          <p className="text-sm text-cream/50 mt-1">
            {submitted
              ? "Check your email for a reset link"
              : "Enter your email and we'll send you a reset link"}
          </p>
        </div>

        {submitted ? (
          <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6 text-center">
            <Mail size={32} className="mx-auto mb-3 text-green-400" />
            <p className="text-sm text-cream/70 mb-1">
              If an account exists for <strong className="text-cream">{email}</strong>, you&apos;ll receive a password reset link shortly.
            </p>
            <p className="text-xs text-cream/40 mt-3">
              Don&apos;t see it? Check your spam folder.
            </p>
            <Link
              href="/login"
              className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-gold hover:text-champagne transition"
            >
              <ArrowLeft size={16} /> Back to Sign In
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
                  Email Address
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-2.5 text-sm text-cream outline-none transition focus:border-gold/50 focus:ring-1 focus:ring-gold/30"
                  placeholder="you@example.com"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="btn-primary w-full disabled:opacity-50 min-h-[48px]"
              >
                <Mail size={20} />
                {submitting ? "Sending..." : "Send Reset Link"}
              </button>
            </form>

            <p className="mt-5 text-center text-sm text-cream/50">
              Remember your password?{" "}
              <Link href="/login" className="font-bold text-gold hover:text-champagne transition">
                Sign in
              </Link>
            </p>
          </>
        )}
      </div>
    </div>
  );
}
