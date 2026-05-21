"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageLoading } from "@/components/PageLoading";

import { isAdminSessionActive } from "@/lib/adminSession";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  // Disable browser-level overscroll/rubber-band on admin routes (rescinded on unmount).
  useEffect(() => {
    const html = document.documentElement;
    const body = document.body;
    const prevHtml = html.style.overscrollBehavior;
    const prevBody = body.style.overscrollBehavior;
    html.style.overscrollBehavior = "none";
    body.style.overscrollBehavior = "none";
    return () => {
      html.style.overscrollBehavior = prevHtml;
      body.style.overscrollBehavior = prevBody;
    };
  }, []);

  useEffect(() => {
    if (isLoginPage) return;
    if (loading) return;
    if (redirecting) return;

    // Not logged in at all → redirect to admin login
    if (!user) {
      setRedirecting(true);
      router.replace("/admin/login");
      return;
    }

    // Must be admin-tier role
    const isAdmin = user.is_admin || ["editor", "admin", "owner"].includes(user.role);
    if (!isAdmin) {
      setRedirecting(true);
      logout().then(() => {
        router.replace("/admin/login");
      });
      return;
    }

    // Security enforcement: admin must have used Google auth
    if (user.auth_provider !== "google") {
      setRedirecting(true);
      logout().then(() => {
        router.replace("/admin/login");
      });
      return;
    }

    // Session gate check: must have explicitly signed in at the admin portal
    if (!isAdminSessionActive()) {
      setRedirecting(true);
      router.replace("/admin/login");
      return;
    }
  }, [user, loading, router, isLoginPage, logout, redirecting]);

  // Reset redirecting flag when we successfully land on the login page
  useEffect(() => {
    if (isLoginPage) {
      setRedirecting(false);
    }
  }, [isLoginPage]);

  // Login page renders freely without checks
  if (isLoginPage) {
    return <>{children}</>;
  }

  // While loading auth → show spinner
  if (loading) {
    return <PageLoading label="Checking admin access" />;
  }

  // Redirecting or no user or inactive admin session → show spinner
  if (redirecting || !user || !isAdminSessionActive()) {
    return <PageLoading label="Redirecting to login" />;
  }

  // Not admin or not google → block rendering
  const isAdmin = user.is_admin || ["editor", "admin", "owner"].includes(user.role);
  if (!isAdmin || user.auth_provider !== "google") {
    return <PageLoading label="Verifying security credentials" />;
  }

  return <>{children}</>;
}
