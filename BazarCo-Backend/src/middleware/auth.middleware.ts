import type { Request, Response, NextFunction } from "express";
import * as userRepo from "../repositories/user.repository";
import { verifyToken } from "../lib/jwt";

export async function requireAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;

  if (!token) {
    res.status(401).json({ status: "error", message: "Authentication required" });
    return;
  }

  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ status: "error", message: "Invalid or expired token" });
    return;
  }

  const user = await userRepo.findById(payload.userId);
  if (!user) {
    res.status(401).json({ status: "error", message: "User not found" });
    return;
  }

  (req as Request & { user: { id: string; email: string; name?: string; role: string } }).user = {
    id: user._id.toString(),
    email: user.email,
    name: user.name ?? undefined,
    role: (user as { role?: string }).role ?? "buyer",
  };
  next();
}
