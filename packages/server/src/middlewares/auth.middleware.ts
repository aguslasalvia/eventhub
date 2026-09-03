import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "@utils/jwt";

const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token)
    return res.status(401).json({ error: "Missing authentication token" });

  try {
    req.user = verifyToken(token);
    next();
  } catch {
    return res.status(401).json({ error: "Invalid or expired token" });
  }
};

export default authMiddleware;
