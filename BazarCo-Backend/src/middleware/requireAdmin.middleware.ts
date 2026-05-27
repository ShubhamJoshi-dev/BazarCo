import type { Request, Response, NextFunction } from "express";
import { requireAuth, type AuthUser } from "./auth.middleware";
import { isAdminUser } from "../lib/admin";

export async function requireAdmin(req: Request, res: Response, next: NextFunction): Promise<void> {
  await requireAuth(req, res, () => {
    const user = (req as Request & { user?: AuthUser }).user;
    if (!user) return;
    if (!isAdminUser(user)) {
      res.status(403).json({ status: "error", message: "Admin access required" });
      return;
    }
    next();
  });
}
