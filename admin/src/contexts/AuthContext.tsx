import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { adminApi } from "@/lib/api";
import type { AdminUser } from "@/lib/types";

interface AuthContextValue {
  user: AdminUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    async function restore() {
      try {
        const res = await adminApi.get<{ admin: AdminUser }>("/auth/me");
        if (!cancelled) setUser(res.admin);
      } catch {
        // Sesi tidak ada/kedaluwarsa — biarkan user null.
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    restore();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await adminApi.post<{ admin: AdminUser }>("/auth/login", {
      email,
      password,
    });
    setUser(res.admin);
  }, []);

  const logout = useCallback(async () => {
    try {
      await adminApi.post("/auth/logout");
    } catch {
      // Abaikan — cookie tetap dibersihkan oleh server.
    }
    setUser(null);
  }, []);

  const value = useMemo(() => ({ user, loading, login, logout }), [user, loading, login, logout]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth harus dipakai di dalam AuthProvider");
  return ctx;
}