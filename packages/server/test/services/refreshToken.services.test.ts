import { describe, it, expect, vi, beforeEach } from "vitest";

const executeMock = vi.fn();
vi.mock("src/db/database", () => ({
  pool: { execute: executeMock },
}));

const { default: RefreshTokenService } = await import("@services/refreshToken.services");

describe("RefreshTokenService", () => {
  beforeEach(() => {
    executeMock.mockReset();
  });

  it("issue() stores a hash of the token, not the raw value, and returns the raw token", async () => {
    executeMock.mockResolvedValueOnce([{ insertId: 1 }]);

    const token = await RefreshTokenService.issue(42);

    expect(token).toMatch(/^[0-9a-f]{80}$/);
    expect(executeMock).toHaveBeenCalledTimes(1);
    const [sql, params] = executeMock.mock.calls[0] as [string, unknown[]];
    expect(sql).toContain("INSERT INTO refresh_tokens");
    expect(params[0]).toBe(42);
    expect(params[1]).not.toBe(token);
  });

  it("rotate() rejects a token that doesn't exist", async () => {
    executeMock.mockResolvedValueOnce([[]]);

    await expect(RefreshTokenService.rotate("unknown")).rejects.toThrow("Invalid refresh token");
  });

  it("rotate() rejects an already-used (revoked) token", async () => {
    executeMock.mockResolvedValueOnce([[
      { id: 1, userId: 42, revokedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) },
    ]]);

    await expect(RefreshTokenService.rotate("already-used")).rejects.toThrow("Invalid refresh token");
  });

  it("rotate() rejects an expired token", async () => {
    executeMock.mockResolvedValueOnce([[
      { id: 1, userId: 42, revokedAt: null, expiresAt: new Date(Date.now() - 1000) },
    ]]);

    await expect(RefreshTokenService.rotate("expired")).rejects.toThrow("Invalid refresh token");
  });

  it("rotate() revokes the presented token and issues a new one for the same user", async () => {
    executeMock
      .mockResolvedValueOnce([[
        { id: 1, userId: 42, revokedAt: null, expiresAt: new Date(Date.now() + 60_000) },
      ]]) // SELECT
      .mockResolvedValueOnce([{}]) // UPDATE ... revokedAt
      .mockResolvedValueOnce([{ insertId: 2 }]); // INSERT new token

    const result = await RefreshTokenService.rotate("still-valid");

    expect(result.userId).toBe(42);
    expect(typeof result.token).toBe("string");
    expect(executeMock).toHaveBeenCalledTimes(3);
    expect((executeMock.mock.calls[1] as [string])[0]).toContain("UPDATE refresh_tokens SET revokedAt");
  });

  it("revoke() marks the matching, still-active token as revoked", async () => {
    executeMock.mockResolvedValueOnce([{}]);

    await RefreshTokenService.revoke("some-token");

    expect(executeMock).toHaveBeenCalledTimes(1);
    const [sql] = executeMock.mock.calls[0] as [string];
    expect(sql).toContain("UPDATE refresh_tokens SET revokedAt");
    expect(sql).toContain("revokedAt IS NULL");
  });
});
