import { pool } from "../db/database";
import { generateRefreshToken, hashRefreshToken, REFRESH_TOKEN_TTL_MS } from "@utils/jwt";

export default class RefreshTokenService {
  /** Issues a new refresh token for the user and persists its hash. */
  static async issue(userId: number): Promise<string> {
    const token = generateRefreshToken();
    const tokenHash = hashRefreshToken(token);
    const expiresAt = new Date(Date.now() + REFRESH_TOKEN_TTL_MS);

    await pool.execute(
      `INSERT INTO refresh_tokens(userId, tokenHash, expiresAt) VALUES (?, ?, ?);`,
      [userId, tokenHash, expiresAt]
    );

    return token;
  }

  /**
   * Validates a refresh token and rotates it: the presented token is revoked
   * and a fresh one is issued in its place. Rotation means a token can only
   * ever be redeemed once, so a stolen-but-unused one stops working the
   * moment the legitimate client refreshes.
   * @throws {Error} if the token is unknown, expired, or already used/revoked
   */
  static async rotate(rawToken: string): Promise<{ userId: number; token: string }> {
    const tokenHash = hashRefreshToken(rawToken);
    const [rows] = await pool.execute(
      `SELECT * FROM refresh_tokens WHERE tokenHash = ?;`,
      [tokenHash]
    );
    const row = (rows as any[])[0];

    if (!row || row.revokedAt || new Date(row.expiresAt) < new Date())
      throw new Error("Invalid refresh token");

    await pool.execute(`UPDATE refresh_tokens SET revokedAt = NOW() WHERE id = ?;`, [row.id]);

    const token = await RefreshTokenService.issue(row.userId);
    return { userId: row.userId, token };
  }

  /** Revokes a refresh token (logout). No-op if it's unknown or already revoked. */
  static async revoke(rawToken: string): Promise<void> {
    const tokenHash = hashRefreshToken(rawToken);
    await pool.execute(
      `UPDATE refresh_tokens SET revokedAt = NOW() WHERE tokenHash = ? AND revokedAt IS NULL;`,
      [tokenHash]
    );
  }
}
