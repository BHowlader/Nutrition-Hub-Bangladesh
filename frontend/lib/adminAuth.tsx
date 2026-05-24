"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { csrfHeader } from "@/lib/auth";

const API = typeof window === "undefined" ? (process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000") : "";
const ADMIN_AUTH_SIGNAL_KEY = "nhb-admin-authed";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  photo_url: string | null;
  auth_provider: string;
  is_admin: boolean;
  role: string;
}

interface AdminAuthState {
  adminUser: AdminUser | null;
  adminLoading: boolean;
  adminLogin: (params: {
    code: string;
    code_verifier: string;
    redirect_uri: string;
    nonce?: string;
  }) => Promise<AdminUser>;
  adminLogout: () => Promise<void>;
  refreshAdminUser: () => Promise<void>;
}

const AdminAuthContext = createContext<AdminAuthState | null>(null);

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}

async function adminApiFetch(path: string, opts: RequestInit = {}) {
  const method = (opts.method || "GET").toUpperCase();
  const res = await fetch(`${API}${path}`, {
    credentials: "include",
    ...opts,
    headers: {
      "Content-Type": "application/json",
      ...csrfHeader(method),
      ...opts.headers,
    },
  });
  if (res.status === 401) {
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_AUTH_SIGNAL_KEY);
    }
    throw new Error("Admin session expired");
  }
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function AdminAuthProvider({ children }: { children: ReactNode }) {
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [adminLoading, setAdminLoading] = useState(true);

  const fetchAdminMe = useCallback(async () => {
    try {
      const u = await adminApiFetch("/api/auth/admin/me");
      setAdminUser(u);
    } catch {
      setAdminUser(null);
    }
  }, []);

  useEffect(() => {
    const maybeLoggedIn = typeof window !== "undefined" && localStorage.getItem(ADMIN_AUTH_SIGNAL_KEY) === "1";
    if (!maybeLoggedIn) {
      setAdminLoading(false);
      return;
    }
    fetchAdminMe().finally(() => setAdminLoading(false));
  }, [fetchAdminMe]);

  const adminLogin = useCallback(
    async (params: { code: string; code_verifier: string; redirect_uri: string; nonce?: string }) => {
      const data = await adminApiFetch("/api/auth/admin/login", {
        method: "POST",
        body: JSON.stringify(params),
      });
      if (typeof window !== "undefined") {
        localStorage.setItem(ADMIN_AUTH_SIGNAL_KEY, "1");
      }
      setAdminUser(data.user);
      return data.user;
    },
    []
  );

  const adminLogout = useCallback(async () => {
    try {
      await adminApiFetch("/api/auth/admin/logout", { method: "POST" });
    } catch {
      // ignore — clear local state regardless
    }
    if (typeof window !== "undefined") {
      localStorage.removeItem(ADMIN_AUTH_SIGNAL_KEY);
    }
    setAdminUser(null);
  }, []);

  const refreshAdminUser = useCallback(async () => {
    await fetchAdminMe();
  }, [fetchAdminMe]);

  return (
    <AdminAuthContext.Provider
      value={{ adminUser, adminLoading, adminLogin, adminLogout, refreshAdminUser }}
    >
      {children}
    </AdminAuthContext.Provider>
  );
}
