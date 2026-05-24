"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import { CheckCircle, Loader2, XCircle } from "lucide-react";
import { useAuth } from "@/lib/auth";

export default function VerifyEmailPage() {
  return (
    <Suspense>
      <VerifyEmailContent />
    </Suspense>
  );
}

function VerifyEmailContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const { refreshUser } = useAuth();

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  const verify = useCallback(async () => {
    if (!token) {
      setStatus("error");
      setError("No verification token found. Please check your email link.");
      return;
    }

    try {
      const res = await fetch(`/api/auth/verify-email?token=${encodeURIComponent(token)}`, {
        method: "POST",
        credentials: "include",
      });
      if (!res.ok) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.detail || "Verification failed");
      }
      await refreshUser();
      setStatus("success");
      // Auto-redirect after 3 seconds (user is now logged in via cookie)
      setTimeout(() => router.replace("/"), 3000);
    } catch (err) {
      setStatus("error");
      setError(err instanceof Error ? err.message : "Verification failed");
    }
  }, [token, router, refreshUser]);

  useEffect(() => {
    verify();
  }, [verify]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-transparent px-6 py-12">
      <div className="w-full max-w-md rounded-2xl border border-cream/10 bg-card p-6 sm:p-8 shadow-2xl relative z-10 text-center">
        <Link href="/" className="mb-6 inline-block">
          <Image src="/images/logo.png" alt="Nutrition Hub" width={56} height={56} className="rounded-xl shadow-lg border border-cream/5" />
        </Link>

        {status === "loading" && (
          <div className="mt-6">
            <Loader2 size={40} className="mx-auto mb-4 text-gold animate-spin" />
            <h1 className="text-2xl font-black text-cream">Verifying your email...</h1>
            <p className="text-sm text-cream/50 mt-2">Please wait a moment</p>
          </div>
        )}

        {status === "success" && (
          <div className="mt-6">
            <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-6">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-400" />
              <h1 className="text-2xl font-black text-cream mb-2">Email Verified!</h1>
              <p className="text-sm text-cream/70">Your account is now active. Redirecting you to the homepage...</p>
              <Link
                href="/"
                className="mt-4 inline-flex items-center gap-2 text-sm font-bold text-gold hover:text-champagne transition"
              >
                Go now
              </Link>
            </div>
          </div>
        )}

        {status === "error" && (
          <div className="mt-6">
            <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-6">
              <XCircle size={40} className="mx-auto mb-3 text-red-400" />
              <h1 className="text-2xl font-black text-cream mb-2">Verification Failed</h1>
              <p className="text-sm text-cream/70">{error}</p>
              <div className="mt-5 flex flex-col items-center gap-3">
                <Link
                  href="/signup"
                  className="text-sm font-bold text-gold hover:text-champagne transition"
                >
                  Try signing up again
                </Link>
                <Link
                  href="/login"
                  className="text-sm text-cream/40 hover:text-cream transition"
                >
                  Go to Sign In
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
