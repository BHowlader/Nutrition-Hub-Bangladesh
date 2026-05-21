"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Shield, AlertCircle, Lock, ShieldCheck, Fingerprint, LogOut } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PageLoading } from "@/components/PageLoading";
import { activateAdminSession, clearAdminSession } from "../layout";

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

export default function AdminLoginPage() {
  const { googleLogin, logout, user, loading } = useAuth();
  const router = useRouter();

  const [error, setError] = useState("");
  const [authenticating, setAuthenticating] = useState(false);
  const [mounted, setMounted] = useState(false);

  const googleBtnRef = useRef<HTMLDivElement>(null);
  const [gsiReady, setGsiReady] = useState(false);

  useEffect(() => {
    setMounted(true);
    // Always clear admin session when visiting the login page
    // This forces a fresh Google sign-in
    clearAdminSession();
  }, []);

  // Load Google Identity Services SDK
  useEffect(() => {
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) return;

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client?hl=en";
    script.async = true;
    script.onload = () => {
      window.google?.accounts.id.initialize({
        client_id: clientId,
        callback: async (response: { credential: string }) => {
          setError("");
          setAuthenticating(true);
          try {
            // If already logged in with a different account, logout first
            if (user) {
              await logout();
            }

            await googleLogin(response.credential);

            // Verify admin role immediately via /api/auth/me
            const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
            const res = await fetch(`${API}/api/auth/me`, { credentials: "include" });
            if (!res.ok) throw new Error("Failed to verify credentials");

            const loggedUser = await res.json();
            const isAdmin =
              loggedUser.is_admin || ["admin", "owner", "editor"].includes(loggedUser.role);

            if (!isAdmin) {
              await logout();
              clearAdminSession();
              setError(
                "Access Denied — Your Google account does not have administrative privileges. Contact the site owner."
              );
            } else if (loggedUser.auth_provider !== "google") {
              await logout();
              clearAdminSession();
              setError(
                "Security Policy — Admin accounts must authenticate with Google. Email/password login is not permitted."
              );
            } else {
              // Success! Activate admin session gate and redirect
              activateAdminSession();
              router.replace("/admin/products");
            }
          } catch (err) {
            clearAdminSession();
            setError(
              err instanceof Error ? err.message : "Google authentication failed. Please try again."
            );
          } finally {
            setAuthenticating(false);
          }
        },
      });
      if (googleBtnRef.current) {
        window.google?.accounts.id.renderButton(googleBtnRef.current, {
          theme: "filled_black",
          size: "large",
          width: 360,
          text: "signin_with",
          shape: "pill",
          locale: "en",
        });
      }
      setGsiReady(true);
    };
    document.head.appendChild(script);
    return () => {
      script.remove();
    };
  }, [googleLogin, logout, user, router]);

  if (loading) return <PageLoading label="Verifying session" />;

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-ink px-4 py-12 relative overflow-hidden select-none">
      {/* Decorative radial gradients */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gold/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-1/4 left-1/3 w-[300px] h-[300px] rounded-full bg-champagne/5 blur-[100px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[250px] h-[250px] rounded-full bg-gold/3 blur-[90px] pointer-events-none" />

      <div
        className={`w-full max-w-[440px] rounded-2xl border border-cream/10 bg-cream/[0.02] backdrop-blur-xl p-8 md:p-10 shadow-2xl transition-[transform,opacity] duration-500 ease-out-expo ${
          !mounted ? "translate-y-4 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {/* Header */}
        <div className="flex flex-col items-center text-center mb-8">
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
          <div className="flex items-center gap-2 rounded-full bg-gold/10 border border-gold/25 px-2.5 py-0.5 mb-3">
            <Shield size={12} className="text-gold" />
            <span className="text-[10px] font-black uppercase tracking-wider text-gold">
              Secure Admin Portal
            </span>
          </div>
          <h1 className="text-2xl font-black text-cream tracking-tight">Administrative Access</h1>
          <p className="text-xs text-cream/40 mt-1.5">
            Authorized personnel only • Google authentication required
          </p>
        </div>

        {/* If user has existing session, show who they are and prompt re-auth */}
        {user && !authenticating && (
          <div className="mb-6 rounded-xl border border-cream/10 bg-cream/[0.03] p-4">
            <div className="flex items-center gap-3">
              {user.photo_url ? (
                <Image
                  src={user.photo_url}
                  alt={user.name}
                  width={40}
                  height={40}
                  className="rounded-full border border-cream/10"
                />
              ) : (
                <div className="h-10 w-10 rounded-full bg-gold/20 border border-gold/30 flex items-center justify-center text-sm font-black text-gold">
                  {user.name.charAt(0).toUpperCase()}
                </div>
              )}
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-cream truncate">{user.name}</p>
                <p className="text-[11px] text-cream/40 truncate">{user.email}</p>
              </div>
              <button
                onClick={async () => {
                  await logout();
                  clearAdminSession();
                }}
                className="shrink-0 p-2 rounded-lg text-cream/30 hover:text-red-400 hover:bg-red-500/10 transition"
                title="Sign out"
              >
                <LogOut size={16} />
              </button>
            </div>
            <p className="text-[11px] text-cream/40 mt-3 leading-relaxed">
              You have an existing session. Please sign in with Google below to access the admin portal.
            </p>
          </div>
        )}

        {/* Security badges */}
        <div className="grid grid-cols-3 gap-2 mb-6">
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-cream/5 bg-cream/[0.02] p-3">
            <ShieldCheck size={16} className="text-emerald-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-cream/35">
              OAuth 2.0
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-cream/5 bg-cream/[0.02] p-3">
            <Lock size={16} className="text-sky-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-cream/35">
              Encrypted
            </span>
          </div>
          <div className="flex flex-col items-center gap-1.5 rounded-xl border border-cream/5 bg-cream/[0.02] p-3">
            <Fingerprint size={16} className="text-violet-400" />
            <span className="text-[9px] font-bold uppercase tracking-wider text-cream/35">
              Verified ID
            </span>
          </div>
        </div>

        {/* Error display */}
        {error && (
          <div className="mb-6 flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-xs text-red-400">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="leading-normal">{error}</p>
          </div>
        )}

        {/* Authenticating state */}
        {authenticating && (
          <div className="mb-6 flex items-center justify-center gap-3 rounded-xl border border-gold/20 bg-gold/5 px-4 py-4">
            <div className="h-4 w-4 rounded-full border-2 border-gold/40 border-t-gold animate-spin" />
            <span className="text-sm font-bold text-gold">Verifying admin privileges…</span>
          </div>
        )}

        {/* Google Sign-In Button */}
        <div className="space-y-4">
          {/* GSI rendered button */}
          <div
            ref={googleBtnRef}
            className={gsiReady && !authenticating ? "flex justify-center" : "hidden"}
          />

          {/* Fallback styled button when GSI not loaded */}
          {!gsiReady && !authenticating && (
            <button
              type="button"
              onClick={() =>
                setError(
                  "Google Sign-In is not configured. Please set NEXT_PUBLIC_GOOGLE_CLIENT_ID in environment variables."
                )
              }
              className="flex w-full items-center justify-center gap-3 rounded-xl border border-cream/10 bg-cream/[0.04] px-4 py-3 font-bold text-sm text-cream transition hover:border-cream/20 hover:bg-cream/[0.08]"
            >
              <svg className="h-5 w-5" viewBox="0 0 24 24">
                <path
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                  fill="#4285F4"
                />
                <path
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                  fill="#34A853"
                />
                <path
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                  fill="#FBBC05"
                />
                <path
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                  fill="#EA4335"
                />
              </svg>
              Sign in with Google
            </button>
          )}
        </div>

        {/* Security notice */}
        <div className="mt-6 rounded-xl border border-cream/5 bg-cream/[0.02] p-4 text-[11px] text-cream/30 leading-relaxed">
          <div className="flex items-center gap-1.5 text-cream/50 font-extrabold mb-1.5">
            <Lock size={10} />
            <span>Security Policy</span>
          </div>
          <ul className="space-y-1 list-disc list-inside">
            <li>Admin access requires Google authentication only</li>
            <li>Email/password login is not permitted for admin accounts</li>
            <li>Only pre-authorized Google accounts may access this portal</li>
            <li>All administrative actions are logged and audited</li>
          </ul>
        </div>

        {/* Return link */}
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
