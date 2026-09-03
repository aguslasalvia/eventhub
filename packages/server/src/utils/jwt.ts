import jwt from "jsonwebtoken";
import SETTING from "src/config/system";

export interface JwtPayload {
  id: number;
  userType: number;
}

const EXPIRES_IN = "2h";

/**
 * @param payload -> the user's id and userType to embed in the token
 * @returns a signed JWT, valid for 2 hours
 */
export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, SETTING.JWT_SECRET, { expiresIn: EXPIRES_IN });
}

/**
 * @param token -> the raw JWT (without the "Bearer " prefix)
 * @throws {Error} if the token is missing, malformed, or expired
 */
export function verifyToken(token: string): JwtPayload {
  return jwt.verify(token, SETTING.JWT_SECRET) as JwtPayload;
}
