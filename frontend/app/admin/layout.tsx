"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { PageLoading } from "@/components/PageLoading";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect=/admin/products");
      return;
    }
    if (!user.is_admin && !["editor", "admin", "owner"].includes(user.role)) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user || (!user.is_admin && !["editor", "admin", "owner"].includes(user.role))) {
    return <PageLoading label="Checking admin access" />;
  }

  return <>{children}</>;
}
