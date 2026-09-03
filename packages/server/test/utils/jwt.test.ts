import { describe, it, expect } from "vitest";
import { signToken, verifyToken, generateRefreshToken, hashRefreshToken } from "@utils/jwt";

describe("access tokens", () => {
  it("round-trips a signed token", () => {
    const token = signToken({ id: 1, userType: 2 });
    const payload = verifyToken(token);
    expect(payload.id).toBe(1);
    expect(payload.userType).toBe(2);
  });

  it("rejects a tampered token", () => {
    const token = signToken({ id: 1, userType: 0 });
    expect(() => verifyToken(`${token}tampered`)).toThrow();
  });
});

describe("refresh tokens", () => {
  it("generates unique, high-entropy tokens", () => {
    const a = generateRefreshToken();
    const b = generateRefreshToken();
    expect(a).not.toBe(b);
    expect(a).toMatch(/^[0-9a-f]{80}$/);
  });

  it("hashes deterministically, and never returns the raw token", () => {
    const token = generateRefreshToken();
    expect(hashRefreshToken(token)).toBe(hashRefreshToken(token));
    expect(hashRefreshToken(token)).not.toBe(token);
  });
});
