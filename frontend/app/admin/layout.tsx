"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageLoading } from "@/components/PageLoading";

/**
 * Session-gate key: set in sessionStorage only after explicit Google sign-in
 * on the admin login page. Cleared when the browser tab/window closes.
 */
const ADMIN_SESSION_KEY = "nhb_admin_session";

export function isAdminSessionActive(): boolean {
  if (typeof window === "undefined") return false;
  return sessionStorage.getItem(ADMIN_SESSION_KEY) === "active";
}

export function activateAdminSession(): void {
  sessionStorage.setItem(ADMIN_SESSION_KEY, "active");
}

export function clearAdminSession(): void {
  sessionStorage.removeItem(ADMIN_SESSION_KEY);
}

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  // The login page always renders without any guard
  const isLoginPage = pathname === "/admin/login";

  useEffect(() => {
    if (isLoginPage) return;
    if (loading) return;
    if (redirecting) return;

    // Not logged in at all → redirect to admin login
    if (!user) {
      clearAdminSession();
      setRedirecting(true);
      router.replace("/admin/login");
      return;
    }

    // Must be admin-tier role
    const isAdmin = user.is_admin || ["editor", "admin", "owner"].includes(user.role);
    if (!isAdmin) {
      clearAdminSession();
      setRedirecting(true);
      router.replace("/");
      return;
    }

    // Security enforcement: admin must have used Google auth
    if (user.auth_provider !== "google") {
      clearAdminSession();
      setRedirecting(true);
      logout().then(() => {
        router.replace("/admin/login");
      });
      return;
    }

    // Session gate: must have gone through admin login page explicitly
    if (!isAdminSessionActive()) {
      setRedirecting(true);
      router.replace("/admin/login");
      return;
    }
  }, [user, loading, router, isLoginPage, logout, redirecting]);

  // Login page renders freely — no guards
  if (isLoginPage) {
    return <>{children}</>;
  }

  // While loading auth → show spinner
  if (loading) {
    return <PageLoading label="Checking admin access" />;
  }

  // Redirecting or no user → show spinner (useEffect handles redirect)
  if (redirecting || !user) {
    return <PageLoading label="Redirecting to login" />;
  }

  // Not admin, not google, or no admin session → block rendering
  const isAdmin = user.is_admin || ["editor", "admin", "owner"].includes(user.role);
  if (!isAdmin || user.auth_provider !== "google" || !isAdminSessionActive()) {
    return <PageLoading label="Verifying security credentials" />;
  }

  return <>{children}</>;
}
