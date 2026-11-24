"use client";

import {
  getCurrentUser,
  login as loginApi,
  logout as logoutApi,
  signup as signupApi,
  updateCurrentUser,
} from "@/lib/api/services";
import type { MerchantUser } from "@/types";
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";

interface AuthContextValue {
  user: MerchantUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<MerchantUser>;
  signup: (input: {
    businessName: string;
    ownerName: string;
    email: string;
    password: string;
  }) => Promise<MerchantUser>;
  logout: () => void;
  refreshUser: () => void;
  patchUser: (patch: Partial<MerchantUser>) => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<MerchantUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setUser(getCurrentUser());
    setLoading(false);
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const next = await loginApi(email, password);
    setUser(next);
    return next;
  }, []);

  const signup = useCallback(
    async (input: {
      businessName: string;
      ownerName: string;
      email: string;
      password: string;
    }) => {
      const next = await signupApi(input);
      setUser(next);
      return next;
    },
    []
  );

  const logout = useCallback(() => {
    logoutApi();
    setUser(null);
  }, []);

  const refreshUser = useCallback(() => {
    setUser(getCurrentUser());
  }, []);

  const patchUser = useCallback((patch: Partial<MerchantUser>) => {
    const next = updateCurrentUser(patch);
    if (next) setUser(next);
  }, []);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshUser, patchUser }),
    [user, loading, login, signup, logout, refreshUser, patchUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
