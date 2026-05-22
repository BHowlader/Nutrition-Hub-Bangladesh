"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
const CSRF_COOKIE_NAME = "nhb_csrf";
const CSRF_HEADER_NAME = "X-CSRF-Token";
const SAFE_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

export function readCsrfToken(): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CSRF_COOKIE_NAME}=([^;]+)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export function csrfHeader(method: string = "POST"): Record<string, string> {
  if (SAFE_METHODS.has(method.toUpperCase())) return {};
  const token = readCsrfToken();
  return token ? { [CSRF_HEADER_NAME]: token } : {};
}

export interface User {
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

interface AuthState {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string, nonce?: string) => Promise<void>;
  googleCodeExchange: (params: {
    code: string;
    code_verifier: string;
    redirect_uri: string;
    nonce?: string;
  }) => Promise<User>;
  logout: () => Promise<void>;
  updateProfile: (data: { name?: string; phone?: string; address?: string }) => Promise<void>;
  uploadPhoto: (file: File) => Promise<void>;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

async function apiFetch(path: string, opts: RequestInit = {}) {
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
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  if (res.status === 204) return null;
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchMe = useCallback(async () => {
    try {
      const u = await apiFetch("/api/auth/me");
      setUser(u);
    } catch {
      setUser(null);
    }
  }, []);

  useEffect(() => {
    fetchMe().finally(() => setLoading(false));
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    setUser(data.user);
  }, []);

  const register = useCallback(async (name: string, email: string, password: string) => {
    await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    // Don't set user — account needs email verification first
  }, []);

  const googleLogin = useCallback(async (credential: string, nonce?: string) => {
    const data = await apiFetch("/api/auth/google", {
      method: "POST",
      body: JSON.stringify(nonce ? { credential, nonce } : { credential }),
    });
    setUser(data.user);
  }, []);

  const googleCodeExchange = useCallback(
    async (params: { code: string; code_verifier: string; redirect_uri: string; nonce?: string }) => {
      const data = await apiFetch("/api/auth/google/exchange", {
        method: "POST",
        body: JSON.stringify(params),
      });
      setUser(data.user);
      return data.user;
    },
    []
  );

  const logout = useCallback(async () => {
    try {
      await apiFetch("/api/auth/logout", { method: "POST" });
    } catch {
      // ignore — clear local state regardless
    }
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (body: { name?: string; phone?: string; address?: string }) => {
    const u = await apiFetch("/api/auth/me", {
      method: "PATCH",
      body: JSON.stringify(body),
    });
    setUser(u);
  }, []);

  const uploadPhoto = useCallback(async (file: File) => {
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API}/api/auth/me/photo`, {
      method: "POST",
      credentials: "include",
      headers: csrfHeader("POST"),
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const u = await res.json();
    setUser(u);
  }, []);

  const refreshUser = useCallback(async () => {
    await fetchMe();
  }, [fetchMe]);

  return (
    <AuthContext.Provider
      value={{ user, loading, login, register, googleLogin, googleCodeExchange, logout, updateProfile, uploadPhoto, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
