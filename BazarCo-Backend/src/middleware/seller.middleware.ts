import type { Request, Response, NextFunction } from "express";

type AuthUser = { id: string; email: string; name?: string; role: string };

export function requireSeller(req: Request, res: Response, next: NextFunction): void {
  const user = (req as Request & { user?: AuthUser }).user;
  if (!user) {
    res.status(401).json({ status: "error", message: "Authentication required" });
    return;
  }
  if (user.role !== "seller") {
    res.status(403).json({ status: "error", message: "Seller access required" });
    return;
  }
  next();
}
