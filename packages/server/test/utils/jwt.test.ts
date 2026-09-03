import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { signToken, verifyToken, generateRefreshToken, hashRefreshToken } from "../../src/utils/jwt";

describe("access tokens", () => {
  it("round-trips a signed token", () => {
    const token = signToken({ id: 1, userType: 2 });
    const payload = verifyToken(token);
    assert.equal(payload.id, 1);
    assert.equal(payload.userType, 2);
  });

  it("rejects a tampered token", () => {
    const token = signToken({ id: 1, userType: 0 });
    assert.throws(() => verifyToken(token + "tampered"));
  });
});

describe("refresh tokens", () => {
  it("generates unique tokens", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    assert.notEqual(a, b);
    assert.match(a, /^[0-9a-f]{80}$/);
  });

  it("hashes the token instead of storing it raw", () => {
    const token = generateRefreshToken();
    assert.equal(hashRefreshToken(token), hashRefreshToken(token));
    assert.notEqual(hashRefreshToken(token), token);
  });
});
