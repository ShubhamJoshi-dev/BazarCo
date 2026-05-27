import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../../helpers/response.helper";
import * as adminAuthService from "../services/adminAuth.service";
import type { AdminAuthUser } from "../middleware/requireAdminAuth.middleware";

export async function login(req: Request, res: Response): Promise<void> {
  const username = typeof req.body.username === "string" ? req.body.username.trim() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (!username || !password) {
    errorResponse(res, 400, "Username and password are required");
    return;
  }
  const result = await adminAuthService.loginAdmin(username, password, {
    ip: req.ip,
    userAgent: req.get("user-agent") ?? undefined,
  });
  if (!result.success) {
    errorResponse(res, 401, "Invalid username or password");
    return;
  }
  successResponse(res, 200, "Admin login successful", {
    token: result.token,
    admin: result.admin,
  });
}

export async function me(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const profile = await adminAuthService.getAdminProfile(admin.id);
  if (!profile) {
    errorResponse(res, 404, "Admin not found");
    return;
  }
  successResponse(res, 200, "Admin profile", { admin: profile });
}
