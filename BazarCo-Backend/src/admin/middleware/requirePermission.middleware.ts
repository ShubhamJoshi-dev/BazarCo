import type { Request, Response, NextFunction } from "express";
import type { Permission } from "../constants/permissions";
import { errorResponse } from "../../helpers/response.helper";
import type { AdminAuthUser } from "./requireAdminAuth.middleware";

export function requirePermission(...permissions: Permission[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const admin = (req as Request & { admin?: AdminAuthUser }).admin;
    if (!admin) {
      errorResponse(res, 401, "Admin authentication required");
      return;
    }
    const allowed = permissions.some((p) => admin.permissions.includes(p));
    if (!allowed) {
      errorResponse(res, 403, "Insufficient permissions");
      return;
    }
    next();
  };
}
