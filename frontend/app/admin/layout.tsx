"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageLoading } from "@/components/PageLoading";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    // Allow the login page to render freely
    if (pathname === "/admin/login") return;
    if (loading) return;

    // Not logged in at all → redirect to admin login
    if (!user) {
      router.replace("/admin/login");
      return;
    }

    // Must be admin-tier role
    const isAdmin = user.is_admin || ["editor", "admin", "owner"].includes(user.role);
    if (!isAdmin) {
      router.replace("/");
      return;
    }

    // Security enforcement: admin must have used Google auth
    if (user.auth_provider !== "google") {
      // Force sign-out and redirect to admin login with error
      logout().then(() => {
        router.replace("/admin/login");
      });
    }
  }, [user, loading, router, pathname, logout]);

  // The login page renders without any guard
  if (pathname === "/admin/login") {
    return <>{children}</>;
  }

  // While loading, or if user is missing / not admin / not google-authed → show loading
  if (loading) {
    return <PageLoading label="Checking admin access" />;
  }

  if (!user) {
    return <PageLoading label="Redirecting to login" />;
  }

  const isAdmin = user.is_admin || ["editor", "admin", "owner"].includes(user.role);
  if (!isAdmin || user.auth_provider !== "google") {
    return <PageLoading label="Verifying security credentials" />;
  }

  return <>{children}</>;
}
