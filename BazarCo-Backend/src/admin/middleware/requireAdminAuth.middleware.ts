import type { Request, Response, NextFunction } from "express";
import { verifyToken } from "../../lib/jwt";
import { isAdminJwtPayload } from "../../interfaces/auth";
import { errorResponse } from "../../helpers/response.helper";
import * as adminUserRepo from "../repositories/adminUser.repository";
import { resolvePermissions } from "../lib/rbac";
import type { AdminRole } from "../constants/roles";
import type { Permission } from "../constants/permissions";

export type AdminAuthUser = {
  id: string;
  username: string;
  email: string;
  name?: string;
  role: AdminRole;
  permissions: Permission[];
};

async function attachAdminFromToken(req: Request): Promise<AdminAuthUser | null> {
  const authHeader = req.headers.authorization;
  const token = authHeader?.startsWith("Bearer ") ? authHeader.slice(7) : null;
  if (!token) return null;

  const payload = verifyToken(token);
  if (!payload || !isAdminJwtPayload(payload)) return null;

  const admin = await adminUserRepo.findById(payload.adminId);
  if (!admin || !admin.isActive) return null;

  const tokenVersion = (admin as { tokenVersion?: number }).tokenVersion ?? 0;
  if ((payload.tokenVersion ?? 0) !== tokenVersion) return null;

  const role = admin.role as AdminRole;
  return {
    id: admin._id.toString(),
    username: admin.username,
    email: admin.email,
    name: admin.name ?? undefined,
    role,
    permissions: resolvePermissions(role, admin.extraPermissions ?? []),
  };
}

export async function requireAdminAuth(req: Request, res: Response, next: NextFunction): Promise<void> {
  const admin = await attachAdminFromToken(req);
  if (!admin) {
    errorResponse(
      res,
      401,
      req.headers.authorization ? "Invalid or expired admin token" : "Admin authentication required"
    );
    return;
  }
  (req as Request & { admin: AdminAuthUser }).admin = admin;
  next();
}
