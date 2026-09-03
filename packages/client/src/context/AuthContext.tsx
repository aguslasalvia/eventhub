import { useCallback, useMemo, useState } from "react";
import type { ReactNode } from "react";
import { login as loginRequest } from "../api/users";
import type { UserDto } from "../api/users";
import { ApiError } from "../api/client";
import { setAuthToken } from "../api/client";
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
 * Holds the logged-in user client-side and persists the JWT issued by
 * /users/login (read by api/client.ts on every request).
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserDto | null>(readStoredUser);
  const [isAuthenticating, setIsAuthenticating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const login = useCallback(async (email: string, password: string) => {
    setIsAuthenticating(true);
    setError(null);
    try {
      const { user: loggedInUser, token } = await loginRequest({ email, password });
      setUser(loggedInUser);
      localStorage.setItem(STORAGE_KEY, JSON.stringify(loggedInUser));
      setAuthToken(token);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Couldn't log in. Please try again.");
      throw err;
    } finally {
      setIsAuthenticating(false);
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
    setAuthToken(null);
  }, []);

  const value = useMemo(
    () => ({ user, isAuthenticating, error, login, logout }),
    [user, isAuthenticating, error, login, logout],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
