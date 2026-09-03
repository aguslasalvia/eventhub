import { useCallback, useEffect, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { login as loginRequest, logout as logoutRequest } from "../api/users";
import type { UserDto } from "../api/users";
import { ApiError } from "../api/client";
import { getRefreshToken, setAuthToken, setOnSessionExpired, setRefreshToken } from "../api/client";
import { AuthContext } from "./auth-context";

const STORAGE_KEY = "eventhub.user";

function readStoredUser(): UserDto | null {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? (JSON.parse(raw) as UserDto) : null;
  } catch {
    return null;
  }
}

/**
 * Holds the logged-in user client-side and persists the access/refresh
 * token pair issued by /users/login (read by api/client.ts on every
 * request, which transparently refreshes the access token as it expires).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(readStoredUser);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const { user: loggedInUser, token, refreshToken } = await loginRequest({ email, password });
      setUser(loggedInUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
      setAuthToken(token);
      setRefreshToken(refreshToken);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't log in. Please try again.");
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logout = useCallback(() => {
    const refreshToken = getRefreshToken();
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
    setRefreshToken(null);
    // Best-effort: revoke server-side so the token can't be replayed, but
    // the client is logged out either way.
    if (refreshToken) logoutRequest(refreshToken).catch(() => {});
  }, []);

  // If a background access-token refresh ever fails (refresh token expired,
  // revoked, or reused), the API client can't reach into React state itself
  // — so it calls back here to drop the stale logged-in user.
  useEffect(() => {
    setOnSessionExpired(logout);
    return () => setOnSessionExpired(null);
  }, [logout]);

  const value = useMemo(
    () => ({ user, isAuthenticating, error, login, logout }),
    [user, isAuthenticating, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
