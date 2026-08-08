"use client";

import {
  createContext,
  PropsWithChildren,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  clearStoredAuthUser,
  getStoredAuthUser,
  storeAuthUser,
} from "@/lib/auth-storage";
import { login as loginRequest } from "@/lib/api";
import type { AuthUser, LoginInput } from "@/lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();

  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    setUser(getStoredAuthUser());
    setIsLoading(false);
  }, []);

  async function login(input: LoginInput) {
    const response = await loginRequest(input);

    const nextUser: AuthUser = {
      username: response.username,
      role: response.role,
      token: response.token,
    };

    storeAuthUser(nextUser);
    setUser(nextUser);
    router.push("/");
  }

  async function logout() {
    clearStoredAuthUser();
    setUser(null);

    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }

    router.push("/login");
  }

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading,
      login,
      logout,
    }),
    [user, isLoading],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
}
