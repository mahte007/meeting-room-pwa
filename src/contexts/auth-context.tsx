"use client";

import {
  createContext,
  PropsWithChildren,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useSyncExternalStore,
} from "react";
import { useRouter } from "next/navigation";
import { useQueryClient } from "@tanstack/react-query";
import {
  clearStoredAuthUser,
  getStoredAuthUser,
  getTokenExpiry,
  isTokenExpired,
  storeAuthUser,
  subscribeToAuthUser,
} from "@/lib/auth-storage";
import { ApiError, getMe, login as loginRequest } from "@/lib/api";
import type { AuthUser, LoginInput } from "@/lib/types";

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (input: LoginInput, redirectTo?: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function subscribeNoop() {
  return () => {};
}

// False during server rendering and hydration, true afterwards. localStorage
// can only be read on the client, so auth state is unknown until then.
function useIsHydrated() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false,
  );
}

export function AuthProvider({ children }: PropsWithChildren) {
  const router = useRouter();
  const queryClient = useQueryClient();
  const isHydrated = useIsHydrated();

  const user = useSyncExternalStore(
    subscribeToAuthUser,
    getStoredAuthUser,
    () => null,
  );

  const token = user?.token ?? null;

  // Tokens already confirmed by /api/me, so login doesn't trigger a second call.
  const validatedToken = useRef<string | null>(null);

  // Validate a stored token on app start and refresh the user's details.
  useEffect(() => {
    if (!token || validatedToken.current === token) return;

    if (isTokenExpired(token)) {
      clearStoredAuthUser();
      return;
    }

    validatedToken.current = token;

    getMe(token)
      .then((me) => {
        // The user may have logged out while the request was in flight.
        if (getStoredAuthUser()?.token !== token) return;

        storeAuthUser({
          token,
          username: me.username,
          role: me.role,
          employeeId: me.employeeId,
          employeeName: me.employeeName,
        });
      })
      .catch((error) => {
        // A 401 has already cleared the stored user in apiFetch. Any other
        // failure (e.g. offline) keeps the session so cached data stays usable.
        if (!(error instanceof ApiError)) {
          validatedToken.current = null;
        }
      });
  }, [token]);

  // Sign out automatically when the token expires.
  useEffect(() => {
    if (!token) return;

    const expiry = getTokenExpiry(token);

    if (expiry === null) return;

    const timeout = window.setTimeout(
      clearStoredAuthUser,
      Math.max(expiry - Date.now(), 0),
    );

    return () => window.clearTimeout(timeout);
  }, [token]);

  // Whenever the user is signed out (logout, 401, expiry or another tab),
  // drop cached data so the next user can't see it.
  const previousToken = useRef(token);

  useEffect(() => {
    const hadUser = previousToken.current !== null;
    previousToken.current = token;

    if (!hadUser || token) return;

    validatedToken.current = null;
    queryClient.clear();

    if ("caches" in window) {
      caches
        .keys()
        .then((keys) => Promise.all(keys.map((key) => caches.delete(key))))
        .catch(() => {});
    }
  }, [token, queryClient]);

  const login = useCallback(
    async (input: LoginInput, redirectTo = "/") => {
      const response = await loginRequest(input);
      const me = await getMe(response.token);

      validatedToken.current = response.token;

      storeAuthUser({
        token: response.token,
        username: me.username,
        role: me.role,
        employeeId: me.employeeId,
        employeeName: me.employeeName,
      });

      router.replace(redirectTo);
    },
    [router],
  );

  const logout = useCallback(() => {
    clearStoredAuthUser();
    router.push("/login");
  }, [router]);

  const value = useMemo(
    () => ({
      user,
      isAuthenticated: !!user,
      isLoading: !isHydrated,
      login,
      logout,
    }),
    [user, isHydrated, login, logout],
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
