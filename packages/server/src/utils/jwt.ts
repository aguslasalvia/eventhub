import jwt from "jsonwebtoken";
import { randomBytes, createHash } from "crypto";
import SETTING from "src/config/system";

export interface JwtPayload {
  id: number;
  userType: number;
}

const ACCESS_TOKEN_EXPIRES_IN = "15m";
export const REFRESH_TOKEN_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * @param payload -> the user's id and userType to embed in the token
 * @returns a signed JWT, valid for 15 minutes
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SETTING.JWT_SECRET, { expiresIn: ACCESS_TOKEN_EXPIRES_IN });
}

/**
 * @param token -> the raw JWT (without the "Bearer " prefix)
 * @throws {Error} if the token is missing, malformed, or expired
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SETTING.JWT_SECRET) as JwtPayload;
}

/**
 * Refresh tokens are opaque high-entropy strings rather than JWTs: they're
 * only ever looked up against their hash in the DB, which is also what
 * makes per-token revocation/rotation possible (a JWT can't be revoked
 * without extra state anyway).
 */
export function generateRefreshToken(): string {
  return randomBytes(40).toString("hex");
}

/** Stored hashed so a leaked DB dump can't be replayed as a live refresh token. */
export function hashRefreshToken(token: string): string {
  return createHash("sha256").update(token).digest("hex");
}
