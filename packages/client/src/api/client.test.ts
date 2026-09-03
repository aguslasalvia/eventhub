import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import {
  request,
  setAuthToken,
  getAuthToken,
  setRefreshToken,
  getRefreshToken,
  setOnSessionExpired,
} from "./client";

function jsonResponse(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });
}

const fetchMock = vi.fn();

beforeEach(() => {
  localStorage.clear();
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
});

afterEach(() => {
  setOnSessionExpired(null);
  vi.unstubAllGlobals();
});

describe("request()", () => {
  it("returns the parsed JSON body on success, with no refresh involved", async () => {
    fetchMock.mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await request<{ ok: boolean }>("/ping");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("refreshes the access token on a 401 and retries the original request once", async () => {
    setAuthToken("expired-token");
    setRefreshToken("valid-refresh");

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: "Invalid or expired token" }, 401))
      .mockResolvedValueOnce(jsonResponse({ user: {}, token: "new-token", refreshToken: "new-refresh" }))
      .mockResolvedValueOnce(jsonResponse({ ok: true }));

    const result = await request<{ ok: boolean }>("/protected");

    expect(result).toEqual({ ok: true });
    expect(fetchMock).toHaveBeenCalledTimes(3);
    expect(getAuthToken()).toBe("new-token");
    expect(getRefreshToken()).toBe("new-refresh");

    const [refreshUrl, refreshInit] = fetchMock.mock.calls[1] as [string, RequestInit];
    expect(refreshUrl).toBe("/api/users/refresh-token");
    expect(JSON.parse(refreshInit.body as string)).toEqual({ refreshToken: "valid-refresh" });

    const [, retryInit] = fetchMock.mock.calls[2] as [string, RequestInit];
    expect((retryInit.headers as Record<string, string>).Authorization).toBe("Bearer new-token");
  });

  it("does not attempt a refresh for the login endpoint itself", async () => {
    setRefreshToken("some-refresh");
    fetchMock.mockResolvedValueOnce(jsonResponse({ error: "Invalid Credentials" }, 401));

    await expect(request("/users/login", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 401,
    });
    expect(fetchMock).toHaveBeenCalledTimes(1);
  });

  it("dedupes concurrent refreshes triggered by parallel 401s", async () => {
    setAuthToken("expired-token");
    setRefreshToken("valid-refresh");

    const retriedOnce = new Set<string>();
    fetchMock.mockImplementation(async (input: RequestInfo | URL) => {
      const url = String(input);
      if (url === "/api/users/refresh-token") {
        return jsonResponse({ user: {}, token: "new-token", refreshToken: "new-refresh" });
      }
      if (!retriedOnce.has(url)) {
        retriedOnce.add(url);
        return jsonResponse({ error: "expired" }, 401);
      }
      return jsonResponse({ ok: true, url });
    });

    const [a, b] = await Promise.all([
      request<{ ok: boolean }>("/one"),
      request<{ ok: boolean }>("/two"),
    ]);

    expect(a.ok).toBe(true);
    expect(b.ok).toBe(true);

    const refreshCalls = fetchMock.mock.calls.filter(([input]) => String(input) === "/api/users/refresh-token");
    expect(refreshCalls).toHaveLength(1);
  });

  it("clears both tokens and notifies onSessionExpired when the refresh itself fails", async () => {
    setAuthToken("expired-token");
    setRefreshToken("dead-refresh");
    const onExpired = vi.fn();
    setOnSessionExpired(onExpired);

    fetchMock
      .mockResolvedValueOnce(jsonResponse({ error: "expired" }, 401))
      .mockResolvedValueOnce(jsonResponse({ error: "Invalid refresh token" }, 401));

    await expect(request("/protected")).rejects.toMatchObject({ status: 401 });

    expect(getAuthToken()).toBeNull();
    expect(getRefreshToken()).toBeNull();
    expect(onExpired).toHaveBeenCalledTimes(1);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
