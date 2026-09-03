import { describe, it, mock, beforeEach } from "node:test";
import assert from "node:assert/strict";
import { pool } from "../../src/db/database";
import RefreshTokenService from "../../src/services/refreshToken.services";

describe("RefreshTokenService", () => {
  beforeEach(() => {
    mock.restoreAll();
  });

  it("issue() stores a hash of the token, not the raw value", async () => {
    const executeMock = mock.method(pool, "execute", async () => [{ insertId: 1 }]);

    const token = await RefreshTokenService.issue(42);

    assert.match(token, /^[0-9a-f]{80}$/);
    assert.equal(executeMock.mock.calls.length, 1);

    const [sql, params] = executeMock.mock.calls[0]!.arguments as unknown as [string, unknown[]];
    assert.ok(sql.includes("INSERT INTO refresh_tokens"));
    assert.equal(params[0], 42);
    assert.notEqual(params[1], token);
  });

  it("rotate() rejects a token that doesn't exist", async () => {
    mock.method(pool, "execute", async () => [[]]);

    await assert.rejects(
      () => RefreshTokenService.rotate("unknown"),
      /Invalid refresh token/,
    );
  });

  it("rotate() rejects an already-used (revoked) token", async () => {
    mock.method(pool, "execute", async () => [[
      { id: 1, userId: 42, revokedAt: new Date(), expiresAt: new Date(Date.now() + 60_000) },
    ]]);

    await assert.rejects(
      () => RefreshTokenService.rotate("already-used"),
      /Invalid refresh token/,
    );
  });

  it("rotate() rejects an expired token", async () => {
    mock.method(pool, "execute", async () => [[
      { id: 1, userId: 42, revokedAt: null, expiresAt: new Date(Date.now() - 1000) },
    ]]);

    await assert.rejects(
      () => RefreshTokenService.rotate("expired"),
      /Invalid refresh token/,
    );
  });

  it("rotate() revokes the old token and issues a new one for the same user", async () => {
    const responses = [
      [[{ id: 1, userId: 42, revokedAt: null, expiresAt: new Date(Date.now() + 60_000) }]], // SELECT
      [{}], // UPDATE revokedAt
      [{ insertId: 2 }], // INSERT new token
    ];
    let call = 0;
    const executeMock = mock.method(pool, "execute", async () => responses[call++]);

    const result = await RefreshTokenService.rotate("still-valid");

    assert.equal(result.userId, 42);
    assert.equal(typeof result.token, "string");
    assert.equal(executeMock.mock.calls.length, 3);

    const updateSql = executeMock.mock.calls[1]!.arguments[0] as unknown as string;
    assert.ok(updateSql.includes("UPDATE refresh_tokens SET revokedAt"));
  });

  it("revoke() marks the token as revoked", async () => {
    const executeMock = mock.method(pool, "execute", async () => [{}]);

    await RefreshTokenService.revoke("some-token");

    assert.equal(executeMock.mock.calls.length, 1);
    const sql = executeMock.mock.calls[0]!.arguments[0] as unknown as string;
    assert.ok(sql.includes("UPDATE refresh_tokens SET revokedAt"));
    assert.ok(sql.includes("revokedAt IS NULL"));
  });
});
