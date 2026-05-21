"use client";

import { useEffect, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";

export default function AdminLayout({ children }: { children: ReactNode }) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login?redirect=/admin/products");
      return;
    }
    if (!user.is_admin) {
      router.replace("/");
    }
  }, [user, loading, router]);

  if (loading || !user || !user.is_admin) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-[#eef0e8] text-ink/60 text-sm">
        Checking access…
      </div>
    );
  }

  return <>{children}</>;
}
