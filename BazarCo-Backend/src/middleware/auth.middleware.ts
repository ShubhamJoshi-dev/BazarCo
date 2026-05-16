import type { Request, Response, NextFunction } from "express";
import * as userRepo from "../repositories/user.repository";
import { verifyToken } from "../lib/jwt";

export type AuthUser = { id: string; email: string; name?: string; role: string };

async function attachUserFromToken(req: Request): Promise<AuthUser | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload) return null;

  const user = await userRepo.findById(payload.userId);
  if (!user) return null;

  return {
    id: user._id.toString(),
    email: user.email,
    name: user.name ?? undefined,
    role: (user as { role?: string }).role ?? "buyer",
  };
}

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const user = await attachUserFromToken(req);
  if (!user) {
    res.status(401).json({
      status: "error",
      message: req.headers.authorization ? "Invalid or expired token" : "Authentication required",
    });
    return;
  }
  (req as Request & { user: AuthUser }).user = user;
  next();
}

/** Sets req.user when a valid token is present; continues without user otherwise. */
export async function optionalAuth(req: Request, _res: Response, next: NextFunction): Promise<void> {
  const user = await attachUserFromToken(req);
  if (user) {
    (req as Request & { user: AuthUser }).user = user;
  }
  next();
}
