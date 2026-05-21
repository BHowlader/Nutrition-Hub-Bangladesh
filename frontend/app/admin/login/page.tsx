"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { Shield, AlertCircle, Lock, ShieldCheck } from "lucide-react";
import { useAuth } from "@/lib/auth";
import { PageLoading } from "@/components/PageLoading";
import { activateAdminSession, clearAdminSession, isAdminSessionActive } from "@/lib/adminSession";

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

  const handleGoogleSignIn = useCallback(
    async (credential: string) => {
      setError("");
      setAuthenticating(true);
      try {
        await googleLogin(credential);

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
            "Access Denied: Your Google account is not registered as an administrator. Please contact the system owner."
          );
        } else if (loggedUser.auth_provider !== "google") {
          await logout();
          clearAdminSession();
          setError("Security Policy: Admin accounts must authenticate using Google OAuth.");
        } else {
          // Explicitly activate the session-gate flag on successful login interaction
          activateAdminSession();
          router.replace("/admin/products");
        }
      } catch (err) {
        clearAdminSession();
        setError(
          err instanceof Error
            ? err.message
            : "Google authentication failed. Please check your credentials and try again."
        );
      } finally {
        setAuthenticating(false);
      }
    },
    [googleLogin, logout, router]
  );

  // Force mounted state on load & parse hash from URL redirects (Google OAuth Implicit Flow)
  useEffect(() => {
    setMounted(true);

    if (typeof window === "undefined") return;

    // Check URL hash for id_token / credential from Google Auth redirect
    const handleHashChange = () => {
      const hash = window.location.hash;
      if (hash) {
        const params = new URLSearchParams(hash.substring(1)); // remove '#'
        const idToken = params.get("id_token") || params.get("credential");
        if (idToken) {
          // Clear URL hash & replace state so it doesn't linger in browser history
          window.location.hash = "";
          window.history.replaceState(null, "", window.location.pathname);
          handleGoogleSignIn(idToken);
        }
      }
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);
    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, [handleGoogleSignIn]);

  // Session verification and redirection logic
  useEffect(() => {
    if (loading || authenticating) return;

    // If returning from Google OAuth (hash has id_token/credential), let that flow complete
    const hasHashToken = typeof window !== "undefined" && 
      (window.location.hash.includes("id_token") || window.location.hash.includes("credential"));
    if (hasHashToken) return;

    if (user) {
      const isAdmin = user.is_admin || ["editor", "admin", "owner"].includes(user.role);
      const isGoogle = user.auth_provider === "google";
      const isSessionActive = isAdminSessionActive();

      if (isAdmin && isGoogle && isSessionActive) {
        // Fully authorized admin with active session -> redirect to dashboard
        router.replace("/admin/products");
      } else if (!isAdmin) {
        // Logged in user is not an admin -> clear session and log out storefront session
        clearAdminSession();
        logout();
      } else if (!isGoogle) {
        // Admin user but signed in with incorrect provider -> clear session and log out
        clearAdminSession();
        logout();
        setError("Security Policy: Admin accounts must authenticate using Google OAuth.");
      } else {
        // Admin user but session is not active -> clear session state (already inactive, but reset cleanly)
        clearAdminSession();
      }
    } else {
      // Guest user -> clear session state cleanly
      clearAdminSession();
    }
  }, [user, loading, authenticating, router, logout]);

  const handleCustomGoogleLogin = () => {
    setError("");
    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google Client ID is missing. Please configure NEXT_PUBLIC_GOOGLE_CLIENT_ID in your environment variables.");
      return;
    }

    const redirectUri = window.location.origin + "/admin/login";
    const nonce = Math.random().toString(36).substring(2) + Date.now().toString(36);
    sessionStorage.setItem("google_oauth_nonce", nonce);

    const googleAuthUrl = `https://accounts.google.com/o/oauth2/v2/auth?` +
      `client_id=${encodeURIComponent(clientId)}` +
      `&redirect_uri=${encodeURIComponent(redirectUri)}` +
      `&response_type=id_token` +
      `&scope=${encodeURIComponent("openid profile email")}` +
      `&nonce=${encodeURIComponent(nonce)}`;

    window.location.href = googleAuthUrl;
  };

  if (loading) return <PageLoading label="Verifying session" />;

  return (
    <div className="flex min-h-screen w-screen items-center justify-center bg-gradient-to-br from-ink via-forest to-ink px-4 py-12 relative overflow-hidden select-none">
      {/* Premium Glow Effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-gold/10 blur-[150px] pointer-events-none animate-pulse" style={{ animationDuration: '8s' }} />
      <div className="absolute bottom-1/4 left-1/3 w-[400px] h-[400px] rounded-full bg-mint/5 blur-[120px] pointer-events-none" />

      <div
        className={`w-full max-w-[420px] rounded-3xl border border-cream/10 bg-cream/[0.02] backdrop-blur-2xl p-8 md:p-10 shadow-premium transition-all duration-700 ease-out ${
          !mounted ? "translate-y-6 opacity-0" : "translate-y-0 opacity-100"
        }`}
      >
        {/* Header / Brand */}
        <div className="flex flex-col items-center text-center mb-8">
          <Link href="/" className="mb-5 transition-transform hover:scale-105 duration-300">
            <Image
              src="/images/logo.png"
              alt="Nutrition Hub"
              width={64}
              height={64}
              className="rounded-2xl border border-cream/10 shadow-premium"
              style={{ width: "64px", height: "auto" }}
              priority
            />
          </Link>
          <div className="flex items-center gap-1.5 rounded-full bg-gold/10 border border-gold/30 px-3 py-1 mb-4 shadow-[0_0_15px_rgba(96,165,250,0.15)]">
            <Shield size={12} className="text-gold animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-widest text-gold">
              Secure Admin Console
            </span>
          </div>
          <h1 className="text-2xl font-black text-cream tracking-tight font-display">
            Administrative Access
          </h1>
          <p className="text-xs text-cream/40 mt-2 font-medium">
            Authorized personnel only • Google OAuth required
          </p>
        </div>

        {/* Error Notification */}
        {error && (
          <div className="mb-6 flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 px-4 py-3.5 text-xs text-red-400 animate-in fade-in duration-300">
            <AlertCircle size={16} className="shrink-0 mt-0.5" />
            <p className="leading-relaxed">{error}</p>
          </div>
        )}

        {/* Google Authentication Container */}
        <div className="mb-6">
          {!authenticating ? (
            <button
              onClick={handleCustomGoogleLogin}
              className="group relative flex w-full max-w-[320px] mx-auto items-center justify-center gap-3 rounded-full border border-cream/10 bg-cream/[0.03] hover:bg-cream/[0.08] active:bg-cream/[0.1] px-6 py-3.5 text-sm font-bold text-cream transition-all duration-300 hover:border-gold/30 hover:shadow-[0_0_20px_rgba(212,163,89,0.15)] active:scale-[0.98]"
            >
              <svg className="h-5 w-5 shrink-0 transition-transform duration-300 group-hover:scale-110" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              <span>Continue with Google</span>
            </button>
          ) : (
            <div className="h-[49px] w-full max-w-[320px] mx-auto rounded-full border border-gold/20 bg-gold/5 flex items-center justify-center gap-3 font-semibold text-xs text-gold animate-pulse">
              <div className="h-4.5 w-4.5 rounded-full border-2 border-gold/25 border-t-gold animate-spin" />
              <span>Validating with Google...</span>
            </div>
          )}
        </div>

        {/* Security Badges */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          <div className="flex items-center gap-2 rounded-2xl border border-cream/5 bg-cream/[0.01] px-3.5 py-2.5">
            <ShieldCheck size={14} className="text-emerald-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-wider text-cream/30">Protocol</span>
              <span className="text-[10px] font-bold text-cream/70">OAuth 2.0</span>
            </div>
          </div>
          <div className="flex items-center gap-2 rounded-2xl border border-cream/5 bg-cream/[0.01] px-3.5 py-2.5">
            <Lock size={14} className="text-sky-400" />
            <div className="flex flex-col">
              <span className="text-[9px] font-black uppercase tracking-wider text-cream/30">Encryption</span>
              <span className="text-[10px] font-bold text-cream/70">SSL / TLS</span>
            </div>
          </div>
        </div>

        {/* Policy Checklist */}
        <div className="rounded-2xl border border-cream/5 bg-cream/[0.01] p-4 text-[10px] text-cream/35 leading-relaxed">
          <div className="flex items-center gap-1.5 text-cream/50 font-black uppercase tracking-wider mb-2">
            <Lock size={11} className="text-gold/80" />
            <span>Security Directives</span>
          </div>
          <ul className="space-y-1.5 list-disc list-inside">
            <li>Google OAuth is strictly mandated for console access</li>
            <li>Plain email / password access paths are inactive</li>
            <li>All administrative session changes are recorded</li>
          </ul>
        </div>

        {/* Footer Navigation */}
        <div className="mt-8 border-t border-cream/15 pt-5 text-center">
          <Link
            href="/"
            className="text-xs text-cream/40 hover:text-cream transition-colors duration-300 font-medium"
          >
            ← Return to public storefront
          </Link>
        </div>
      </div>
    </div>
  );
}
