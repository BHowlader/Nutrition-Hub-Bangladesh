"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface User {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  address: string | null;
  photo_url: string | null;
  auth_provider: string;
}

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  googleLogin: (credential: string) => Promise<void>;
  logout: () => void;
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
  const res = await fetch(`${API}${path}`, {
    ...opts,
    headers: { "Content-Type": "application/json", ...opts.headers },
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.detail || `Request failed (${res.status})`);
  }
  return res.json();
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const saveAuth = useCallback((t: string, u: User) => {
    setToken(t);
    setUser(u);
    localStorage.setItem("nhb_token", t);
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
    localStorage.removeItem("nhb_token");
  }, []);

  const fetchMe = useCallback(async (t: string) => {
    try {
      const u = await apiFetch("/api/auth/me", {
        headers: { Authorization: `Bearer ${t}`, "Content-Type": "application/json" },
      });
      setUser(u);
      setToken(t);
    } catch {
      localStorage.removeItem("nhb_token");
    }
  }, []);

  useEffect(() => {
    const t = localStorage.getItem("nhb_token");
    if (t) {
      fetchMe(t).finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, [fetchMe]);

  const login = useCallback(async (email: string, password: string) => {
    const data = await apiFetch("/api/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
    saveAuth(data.access_token, data.user);
  }, [saveAuth]);

  const register = useCallback(async (name: string, email: string, password: string) => {
    const data = await apiFetch("/api/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    });
    saveAuth(data.access_token, data.user);
  }, [saveAuth]);

  const googleLogin = useCallback(async (credential: string) => {
    const data = await apiFetch("/api/auth/google", {
      method: "POST",
      body: JSON.stringify({ credential }),
    });
    saveAuth(data.access_token, data.user);
  }, [saveAuth]);

  const updateProfile = useCallback(async (body: { name?: string; phone?: string; address?: string }) => {
    if (!token) return;
    const u = await apiFetch("/api/auth/me", {
      method: "PATCH",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setUser(u);
  }, [token]);

  const uploadPhoto = useCallback(async (file: File) => {
    if (!token) return;
    const formData = new FormData();
    formData.append("file", file);
    const res = await fetch(`${API}/api/auth/me/photo`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}` },
      body: formData,
    });
    if (!res.ok) throw new Error("Upload failed");
    const u = await res.json();
    setUser(u);
  }, [token]);

  const refreshUser = useCallback(async () => {
    if (token) await fetchMe(token);
  }, [token, fetchMe]);

  return (
    <AuthContext.Provider
      value={{ user, token, loading, login, register, googleLogin, logout, updateProfile, uploadPhoto, refreshUser }}
    >
      {children}
    </AuthContext.Provider>
  );
}
