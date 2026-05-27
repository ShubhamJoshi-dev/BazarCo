import type { Request, Response } from "express";
import bcrypt from "bcrypt";
import { errorResponse, successResponse } from "../../helpers/response.helper";
import { User } from "../../models/user.model";
import { parsePagination, paginationMeta } from "../lib/pagination";
import { SALT_ROUNDS } from "../services/adminAuth.service";
import type { AdminAuthUser } from "../middleware/requireAdminAuth.middleware";
import { logAdminAction } from "../services/audit.service";
import { env } from "../../config/env";

function buildUserFilter(query: Record<string, unknown>) {
  const filter: Record<string, unknown> = {};
  if (query.deleted === "true") filter.deletedAt = { $ne: null };
  else if (query.deleted !== "all") filter.deletedAt = null;
  if (query.role === "buyer" || query.role === "seller" || query.role === "rider") filter.role = query.role;
  if (query.suspended === "true") filter.suspendedAt = { $ne: null };
  if (typeof query.q === "string" && query.q.trim()) {
    const q = query.q.trim();
    filter.$or = [
      { email: new RegExp(q, "i") },
      { name: new RegExp(q, "i") },
      { phone: new RegExp(q, "i") },
    ];
  }
  return filter;
}

function serializeUser(u: Record<string, unknown>) {
  return {
    id: String(u._id),
    email: u.email,
    name: u.name,
    role: u.role,
    kycVerified: u.kycVerified,
    emailVerified: u.emailVerified,
    suspendedAt: u.suspendedAt,
    suspendedReason: u.suspendedReason,
    deletedAt: u.deletedAt,
    messagingBanned: u.messagingBanned,
    lastLoginAt: u.lastLoginAt,
    createdAt: u.createdAt,
    updatedAt: u.updatedAt,
  };
}

export async function listUsers(req: Request, res: Response): Promise<void> {
  const { page, limit, sort, order, skip } = parsePagination(req.query as Record<string, unknown>);
  const filter = buildUserFilter(req.query as Record<string, unknown>);
  const [items, total] = await Promise.all([
    User.find(filter).sort({ [sort]: order }).skip(skip).limit(limit).lean(),
    User.countDocuments(filter),
  ]);
  successResponse(res, 200, "Users", {
    users: items.map((u) => serializeUser(u as Record<string, unknown>)),
    pagination: paginationMeta(total, page, limit),
  });
}

export async function getUser(req: Request, res: Response): Promise<void> {
  const user = await User.findById(req.params.id).lean();
  if (!user) {
    errorResponse(res, 404, "User not found");
    return;
  }
  successResponse(res, 200, "User details", {
    user: {
      ...serializeUser(user as Record<string, unknown>),
      loginHistory: (user as { loginHistory?: unknown[] }).loginHistory ?? [],
    },
  });
}

export async function createUser(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const email = typeof req.body.email === "string" ? req.body.email.trim().toLowerCase() : "";
  const password = typeof req.body.password === "string" ? req.body.password : "";
  const name = typeof req.body.name === "string" ? req.body.name.trim() : undefined;
  const role = req.body.role === "seller" || req.body.role === "rider" ? req.body.role : "buyer";
  if (!email || password.length < 8) {
    errorResponse(res, 400, "Valid email and password (min 8 chars) required");
    return;
  }
  const exists = await User.findOne({ email });
  if (exists) {
    errorResponse(res, 409, "Email already registered");
    return;
  }
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.create({ email, password: hashed, name, role });
  await logAdminAction({
    adminId: admin.id,
    adminUsername: admin.username,
    action: "user.create",
    resource: "user",
    resourceId: user._id.toString(),
  });
  successResponse(res, 201, "User created", { user: serializeUser(user.toObject() as Record<string, unknown>) });
}

export async function updateUser(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const updates: Record<string, unknown> = {};
  if (typeof req.body.name === "string") updates.name = req.body.name.trim().slice(0, 100);
  if (req.body.role === "buyer" || req.body.role === "seller" || req.body.role === "rider") updates.role = req.body.role;
  if (typeof req.body.kycVerified === "boolean") updates.kycVerified = req.body.kycVerified;
  if (typeof req.body.emailVerified === "boolean") updates.emailVerified = req.body.emailVerified;
  const user = await User.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true }).lean();
  if (!user) {
    errorResponse(res, 404, "User not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "user.update", resource: "user", resourceId: req.params.id });
  successResponse(res, 200, "User updated", { user: serializeUser(user as Record<string, unknown>) });
}

export async function suspendUser(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const reason = typeof req.body.reason === "string" ? req.body.reason.trim().slice(0, 500) : "Suspended by admin";
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { suspendedAt: new Date(), suspendedReason: reason }, $inc: { tokenVersion: 1 } },
    { new: true }
  ).lean();
  if (!user) {
    errorResponse(res, 404, "User not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "user.suspend", resource: "user", resourceId: req.params.id, metadata: { reason } });
  successResponse(res, 200, "User suspended", { user: serializeUser(user as Record<string, unknown>) });
}

export async function unsuspendUser(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { suspendedAt: null, suspendedReason: undefined } },
    { new: true }
  ).lean();
  if (!user) {
    errorResponse(res, 404, "User not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "user.unsuspend", resource: "user", resourceId: req.params.id });
  successResponse(res, 200, "User unsuspended", { user: serializeUser(user as Record<string, unknown>) });
}

export async function softDeleteUser(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const confirm = req.body.confirm === true || req.body.confirm === "true";
  if (!confirm) {
    errorResponse(res, 400, "Confirmation required (confirm: true)");
    return;
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { $set: { deletedAt: new Date(), $inc: { tokenVersion: 1 } } },
    { new: true }
  ).lean();
  if (!user) {
    errorResponse(res, 404, "User not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "user.soft_delete", resource: "user", resourceId: req.params.id });
  successResponse(res, 200, "User soft deleted", { user: serializeUser(user as Record<string, unknown>) });
}

export async function restoreUser(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const user = await User.findByIdAndUpdate(req.params.id, { $set: { deletedAt: null } }, { new: true }).lean();
  if (!user) {
    errorResponse(res, 404, "User not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "user.restore", resource: "user", resourceId: req.params.id });
  successResponse(res, 200, "User restored", { user: serializeUser(user as Record<string, unknown>) });
}

export async function permanentDeleteUser(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const confirm = req.body.confirm === true || req.body.confirm === "true";
  const secret = typeof req.body.maintenanceSecret === "string" ? req.body.maintenanceSecret : "";
  if (!confirm || !env.ADMIN_MAINTENANCE_SECRET || secret !== env.ADMIN_MAINTENANCE_SECRET) {
    errorResponse(res, 400, "Permanent delete requires confirm:true and valid maintenanceSecret");
    return;
  }
  const deleted = await User.findByIdAndDelete(req.params.id);
  if (!deleted) {
    errorResponse(res, 404, "User not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "user.permanent_delete", resource: "user", resourceId: req.params.id });
  successResponse(res, 200, "User permanently deleted");
}

export async function forceLogoutUser(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const user = await User.findByIdAndUpdate(req.params.id, { $inc: { tokenVersion: 1 } }, { new: true }).lean();
  if (!user) {
    errorResponse(res, 404, "User not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "user.force_logout", resource: "user", resourceId: req.params.id });
  successResponse(res, 200, "User sessions invalidated");
}

export async function resetUserPassword(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const password = typeof req.body.password === "string" ? req.body.password : "";
  if (password.length < 8) {
    errorResponse(res, 400, "Password must be at least 8 characters");
    return;
  }
  const hashed = await bcrypt.hash(password, SALT_ROUNDS);
  const user = await User.findByIdAndUpdate(req.params.id, { $set: { password: hashed, $inc: { tokenVersion: 1 } } });
  if (!user) {
    errorResponse(res, 404, "User not found");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "user.reset_password", resource: "user", resourceId: req.params.id });
  successResponse(res, 200, "Password reset");
}

export async function banMessaging(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const banned = req.body.banned !== false;
  const user = await User.findByIdAndUpdate(req.params.id, { $set: { messagingBanned: banned } }, { new: true }).lean();
  if (!user) {
    errorResponse(res, 404, "User not found");
    return;
  }
  await logAdminAction({
    adminId: admin.id,
    adminUsername: admin.username,
    action: banned ? "user.messaging_ban" : "user.messaging_unban",
    resource: "user",
    resourceId: req.params.id,
  });
  successResponse(res, 200, banned ? "User banned from messaging" : "Messaging ban removed", {
    user: serializeUser(user as Record<string, unknown>),
  });
}

export async function bulkAction(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const ids = Array.isArray(req.body.ids) ? req.body.ids.filter((id: unknown) => typeof id === "string") : [];
  const action = typeof req.body.action === "string" ? req.body.action : "";
  if (!ids.length) {
    errorResponse(res, 400, "ids array required");
    return;
  }
  let modified = 0;
  if (action === "suspend") {
    const r = await User.updateMany({ _id: { $in: ids } }, { $set: { suspendedAt: new Date() }, $inc: { tokenVersion: 1 } });
    modified = r.modifiedCount;
  } else if (action === "unsuspend") {
    const r = await User.updateMany({ _id: { $in: ids } }, { $set: { suspendedAt: null, suspendedReason: undefined } });
    modified = r.modifiedCount;
  } else if (action === "soft_delete") {
    const r = await User.updateMany({ _id: { $in: ids } }, { $set: { deletedAt: new Date() }, $inc: { tokenVersion: 1 } });
    modified = r.modifiedCount;
  } else {
    errorResponse(res, 400, "Unsupported bulk action");
    return;
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: `user.bulk.${action}`, metadata: { ids, modified } });
  successResponse(res, 200, "Bulk action completed", { modified });
}

export async function exportUsers(req: Request, res: Response): Promise<void> {
  const filter = buildUserFilter(req.query as Record<string, unknown>);
  const users = await User.find(filter).limit(5000).select("-password").lean();
  successResponse(res, 200, "User export", { users: users.map((u) => serializeUser(u as Record<string, unknown>)) });
}
