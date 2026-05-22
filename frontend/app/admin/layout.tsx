"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/lib/adminAuth";
import { PageLoading } from "@/components/PageLoading";

export default function AdminLayout({ children }: { children: ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminLayoutGuard>{children}</AdminLayoutGuard>
    </AdminAuthProvider>
  );
}

function AdminLayoutGuard({ children }: { children: ReactNode }) {
  const { adminUser, adminLoading, adminLogout } = useAdminAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [redirecting, setRedirecting] = useState(false);

  const isLoginPage = pathname === "/admin/login";

  function redirectToAdminLogin() {
    router.replace("/admin/login");
    window.setTimeout(() => {
      if (window.location.pathname !== "/admin/login") {
        window.location.replace("/admin/login");
      }
    }, 600);
  }

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
    if (adminLoading) return;
    if (redirecting) return;

    // No admin session → redirect to admin login
    if (!adminUser) {
      setRedirecting(true);
      redirectToAdminLogin();
      return;
    }

    // Must be admin-tier role
    const isAdmin = adminUser.is_admin || ["editor", "admin", "owner"].includes(adminUser.role);
    if (!isAdmin) {
      setRedirecting(true);
      adminLogout();
      redirectToAdminLogin();
      return;
    }

    // Security enforcement: admin must have used Google auth
    if (adminUser.auth_provider !== "google") {
      setRedirecting(true);
      adminLogout();
      redirectToAdminLogin();
      return;
    }
  }, [adminUser, adminLoading, router, isLoginPage, adminLogout, redirecting]);

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
  if (adminLoading) {
    return <PageLoading label="Checking admin access" />;
  }

  // Redirecting or no admin user → show spinner
  if (redirecting || !adminUser) {
    return <PageLoading label="Redirecting to login" />;
  }

  // Not admin or not google → block rendering
  const isAdmin = adminUser.is_admin || ["editor", "admin", "owner"].includes(adminUser.role);
  if (!isAdmin || adminUser.auth_provider !== "google") {
    return <PageLoading label="Verifying security credentials" />;
  }

  return <>{children}</>;
}
