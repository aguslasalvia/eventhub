const API_BASE = "/api";
const DEFAULT_TIMEOUT_MS = 8000;
const TOKEN_KEY = "eventhub.token";
const REFRESH_TOKEN_KEY = "eventhub.refreshToken";

// Paths that must never trigger the 401 -> refresh -> retry dance below,
// either because they hand out tokens themselves (refresh-token) or because
// a 401 there is a real "wrong credentials" answer, not an expired session.
const NO_REFRESH_PATHS = new Set(["/users/login", "/users/refresh-token"]);

export function setAuthToken(token: string | null) {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

export function getAuthToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setRefreshToken(token: string | null) {
  if (token) localStorage.setItem(REFRESH_TOKEN_KEY, token);
  else localStorage.removeItem(REFRESH_TOKEN_KEY);
}

export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Lets AuthContext learn about session expiry that happens deep inside a
 * fetch call (i.e. when refreshing the access token itself fails), so it can
 * clear the logged-in user instead of leaving stale state in localStorage.
 */
let onSessionExpired: (() => void) | null = null;
export function setOnSessionExpired(callback: (() => void) | null) {
  onSessionExpired = callback;
}

export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

interface RequestOptions {
  method?: "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
  body?: unknown;
  timeoutMs?: number;
}

// Deduplicates concurrent refreshes: several requests can 401 around the
// same time, but the server rotates the refresh token on every use, so only
// the first call may actually redeem it — the rest just await its result.
let refreshInFlight: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return false;

  if (!refreshInFlight) {
    refreshInFlight = (async () => {
      try {
        const res = await fetch(`${API_BASE}/users/refresh-token`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ refreshToken }),
        });

        if (!res.ok) {
          setAuthToken(null);
          setRefreshToken(null);
          onSessionExpired?.();
          return false;
        }

        const data = await res.json();
        setAuthToken(data.token);
        setRefreshToken(data.refreshToken);
        return true;
      } catch {
        return false;
      } finally {
        refreshInFlight = null;
      }
    })();
  }

  return refreshInFlight;
}

async function doFetch(path: string, options: RequestOptions, timeoutMs: number): Promise<Response> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);

  const headers: Record<string, string> = {};
  if (options.body) headers["Content-Type"] = "application/json";
  const token = getAuthToken();
  if (token) headers["Authorization"] = `Bearer ${token}`;

  try {
    return await fetch(`${API_BASE}${path}`, {
      method: options.method ?? "GET",
      headers: Object.keys(headers).length ? headers : undefined,
      body: options.body ? JSON.stringify(options.body) : undefined,
      signal: controller.signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new ApiError("The server took too long to respond.", 0);
    }
    throw new ApiError("Couldn't reach the server.", 0);
  } finally {
    clearTimeout(timeout);
  }
}

/**
 * Thin fetch wrapper shared by every resource-specific api/*.ts module.
 * Applies a client-side timeout because some in-progress endpoints don't
 * send a response yet, which would otherwise hang forever. On a 401 from an
 * authenticated endpoint, it silently refreshes the access token once and
 * retries the request before giving up.
 */
export async function request<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const timeoutMs = options.timeoutMs ?? DEFAULT_TIMEOUT_MS;

  let res = await doFetch(path, options, timeoutMs);

  if (res.status === 401 && !NO_REFRESH_PATHS.has(path) && (await refreshAccessToken())) {
    res = await doFetch(path, options, timeoutMs);
  }

  if (res.status === 204) {
    return undefined as T;
  }

  const isJson = res.headers.get("content-type")?.includes("application/json");
  const payload = isJson ? await res.json().catch(() => null) : null;

  if (!res.ok) {
    const message = (payload && typeof payload === "object" && "error" in payload)
      ? String((payload as { error: unknown }).error)
      : res.statusText;
    throw new ApiError(message, res.status);
  }

  return payload as T;
}
