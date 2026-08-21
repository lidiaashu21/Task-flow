"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";

import { apiFetch } from "../api/client";
import { ApiError } from "../api/error";
import type { Fetcher } from "../api/types";

import {
  getCurrentUser,
  logout as logoutRequest,
  refresh as refreshRequest,
} from "./api";

import { clearAccessToken, getAccessToken, saveAccessToken } from "./session";

import type { AuthSession, PublicUser } from "./types";

type AuthStatus = "loading" | "authenticated" | "unauthenticated";

interface AuthContextValue {
  status: AuthStatus;
  user: PublicUser | null;
  accessToken: string | null;
  setSession: (session: AuthSession) => void;
  logout: () => Promise<void>;

  /**
   * Authenticated request helper.
   *
   * Adds the current access token.
   * If the token expires, it attempts one silent refresh.
   */
  fetcher: Fetcher;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [status, setStatus] = useState<AuthStatus>("loading");

  const [user, setUser] = useState<PublicUser | null>(null);

  const [accessToken, setAccessToken] = useState<string | null>(null);

  /**
   * Save a successful authenticated session.
   */
  const setSession = useCallback((session: AuthSession) => {
    saveAccessToken(session.accessToken);

    setAccessToken(session.accessToken);
    setUser(session.user);
    setStatus("authenticated");
  }, []);

  /**
   * Completely clear the local authentication state.
   */
  const clearSession = useCallback(() => {
    clearAccessToken();

    setAccessToken(null);
    setUser(null);
    setStatus("unauthenticated");
  }, []);

  /**
   * Logout.
   *
   * The server logout is best-effort.
   * We always clear the local session.
   */
  const logout = useCallback(async () => {
    try {
      await logoutRequest();
    } catch {
      // Server logout failure should not prevent
      // local logout.
    }

    clearSession();
  }, [clearSession]);

  /**
   * Authenticated API helper.
   *
   * This is used by protected endpoints such as:
   *
   * POST /api/invitations/accept
   *
   * It does NOT affect the public invitation preview.
   */
  const fetcher: Fetcher = useCallback(
    async function fetcher<T>(
      path: string,
      options: Parameters<Fetcher>[1] = {},
    ) {
      try {
        return await apiFetch<T>(path, {
          ...options,
          token: accessToken ?? undefined,
        });
      } catch (error) {
        /*
         * Access token expired.
         *
         * Try to silently refresh once.
         */
        if (error instanceof ApiError && error.status === 401 && accessToken) {
          try {
            const session = await refreshRequest();

            setSession(session);

            return await apiFetch<T>(path, {
              ...options,
              token: session.accessToken,
            });
          } catch {
            /*
             * Refresh failed.
             *
             * The user is no longer authenticated.
             */
            clearSession();

            throw error;
          }
        }

        throw error;
      }
    },
    [accessToken, setSession, clearSession],
  );

  /**
   * Restore an existing session when the application starts.
   *
   * IMPORTANT:
   *
   * A 401 here does NOT mean the application is broken.
   * It simply means there is no valid authenticated session.
   *
   * This is especially important for public pages such as:
   *
   * /invitations/accept?token=...
   */
  useEffect(() => {
    let cancelled = false;

    async function bootstrap() {
      const token = getAccessToken();

      /*
       * No access token means the user is simply
       * not authenticated.
       *
       * Do NOT redirect.
       */
      if (!token) {
        if (!cancelled) {
          setStatus("unauthenticated");
        }

        return;
      }

      /*
       * We have a token, so first try /auth/me.
       */
      try {
        const { user } = await getCurrentUser(token);

        if (cancelled) {
          return;
        }

        setAccessToken(token);
        setUser(user);
        setStatus("authenticated");

        return;
      } catch (error) {
        /*
         * The access token may be expired.
         *
         * Only a 401 should cause a refresh attempt.
         */
        if (!(error instanceof ApiError && error.status === 401)) {
          if (!cancelled) {
            clearSession();
          }

          return;
        }
      }

      /*
       * Access token was invalid/expired.
       *
       * Try the refresh-token cookie.
       */
      try {
        const session = await refreshRequest();

        if (cancelled) {
          return;
        }

        setSession(session);
      } catch {
        /*
         * No valid refresh session either.
         *
         * This is a normal unauthenticated state.
         *
         * DO NOT redirect.
         */
        if (!cancelled) {
          clearSession();
        }
      }
    }

    void bootstrap();

    return () => {
      cancelled = true;
    };
  }, [setSession, clearSession]);

  const value = useMemo<AuthContextValue>(
    () => ({
      status,
      user,
      accessToken,
      setSession,
      logout,
      fetcher,
    }),
    [status, user, accessToken, setSession, logout, fetcher],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);

  if (!ctx) {
    throw new Error("useAuth must be used within an AuthProvider");
  }

  return ctx;
}
