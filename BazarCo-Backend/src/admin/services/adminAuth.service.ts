import bcrypt from "bcrypt";
import { signAdminToken } from "../../lib/jwt";
import type { AdminJwtPayload } from "../../interfaces/auth";
import * as adminUserRepo from "../repositories/adminUser.repository";
import { resolvePermissions } from "../lib/rbac";
import type { AdminRole } from "../constants/roles";

const SALT_ROUNDS = 10;

export async function loginAdmin(username: string, password: string, meta?: { ip?: string; userAgent?: string }) {
  const admin = await adminUserRepo.findByUsernameWithPassword(username);
  if (!admin?.password) {
    return { success: false as const, reason: "invalid_credentials" as const };
  }
  const match = await bcrypt.compare(password, admin.password);
  if (!match) {
    return { success: false as const, reason: "invalid_credentials" as const };
  }

  await adminUserRepo.recordLogin(admin._id.toString(), meta ?? {});

  const role = admin.role as AdminRole;
  const tokenVersion = (admin as { tokenVersion?: number }).tokenVersion ?? 0;
  const payload: AdminJwtPayload = {
    adminId: admin._id.toString(),
    email: admin.email,
    username: admin.username,
    role,
    scope: "admin",
    tokenVersion,
  };
  const token = signAdminToken(payload);
  const permissions = resolvePermissions(role, admin.extraPermissions ?? []);

  return {
    success: true as const,
    token,
    admin: {
      id: admin._id.toString(),
      username: admin.username,
      email: admin.email,
      name: admin.name,
      role,
      permissions,
      twoFactorEnabled: admin.twoFactorEnabled ?? false,
    },
  };
}

export async function getAdminProfile(adminId: string) {
  const admin = await adminUserRepo.findById(adminId);
  if (!admin) return null;
  const role = admin.role as AdminRole;
  return {
    id: admin._id.toString(),
    username: admin.username,
    email: admin.email,
    name: admin.name,
    role,
    permissions: resolvePermissions(role, admin.extraPermissions ?? []),
    twoFactorEnabled: admin.twoFactorEnabled ?? false,
    lastLoginAt: admin.lastLoginAt,
  };
}

export { SALT_ROUNDS };
