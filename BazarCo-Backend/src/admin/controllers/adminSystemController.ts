import type { Request, Response } from "express";
import mongoose from "mongoose";
import { errorResponse, successResponse } from "../../helpers/response.helper";
import { env } from "../../config/env";
import type { AdminAuthUser } from "../middleware/requireAdminAuth.middleware";
import { logAdminAction } from "../services/audit.service";
import * as auditRepo from "../repositories/adminAuditLog.repository";
import { runReminderJob } from "../../jobs/reminder.job";

const PROTECTED_COLLECTIONS = new Set(["products"]);

function verifyMaintenance(req: Request): boolean {
  const secret = typeof req.body.maintenanceSecret === "string" ? req.body.maintenanceSecret : "";
  return Boolean(env.ADMIN_MAINTENANCE_SECRET && secret === env.ADMIN_MAINTENANCE_SECRET);
}

export async function diagnostics(_req: Request, res: Response): Promise<void> {
  const dbState = mongoose.connection.readyState;
  const states = ["disconnected", "connected", "connecting", "disconnecting"];
  successResponse(res, 200, "System diagnostics", {
    diagnostics: {
      nodeEnv: env.NODE_ENV,
      db: states[dbState] ?? "unknown",
      uptimeSec: Math.floor(process.uptime()),
      memoryMb: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
      redisConfigured: Boolean(env.REDIS_URI),
      timestamp: new Date().toISOString(),
    },
  });
}

export async function listAuditLogs(req: Request, res: Response): Promise<void> {
  const result = await auditRepo.listLogs(req.query as Record<string, unknown>);
  successResponse(res, 200, "Audit logs", result);
}

export async function refreshCollections(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  if (!verifyMaintenance(req) || req.body.confirm !== true) {
    errorResponse(res, 400, "Requires confirm:true and valid maintenanceSecret");
    return;
  }
  const db = mongoose.connection.db;
  if (!db) {
    errorResponse(res, 503, "Database not connected");
    return;
  }
  const collections = await db.listCollections().toArray();
  const cleared: string[] = [];
  for (const col of collections) {
    const name = col.name;
    if (PROTECTED_COLLECTIONS.has(name)) continue;
    if (name.startsWith("system.")) continue;
    await db.collection(name).deleteMany({});
    cleared.push(name);
  }
  await logAdminAction({
    adminId: admin.id,
    adminUsername: admin.username,
    action: "system.refresh_collections",
    metadata: { cleared },
  });
  successResponse(res, 200, "Non-product collections cleared", { cleared });
}

export async function rebuildIndexes(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  if (!verifyMaintenance(req)) {
    errorResponse(res, 400, "Valid maintenanceSecret required");
    return;
  }
  const db = mongoose.connection.db;
  if (!db) {
    errorResponse(res, 503, "Database not connected");
    return;
  }
  const results: { collection: string; ok: boolean }[] = [];
  const collections = await db.listCollections().toArray();
  for (const col of collections) {
    try {
      await db.collection(col.name).createIndexes([]);
      results.push({ collection: col.name, ok: true });
    } catch {
      results.push({ collection: col.name, ok: false });
    }
  }
  await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "system.rebuild_indexes", metadata: { results } });
  successResponse(res, 200, "Index rebuild attempted", { results });
}

export async function clearCache(_req: Request, res: Response): Promise<void> {
  successResponse(res, 200, "Cache clear requested (no application cache layer configured)");
}

export async function runMaintenanceJob(req: Request, res: Response): Promise<void> {
  const admin = (req as Request & { admin: AdminAuthUser }).admin;
  const job = typeof req.body.job === "string" ? req.body.job : "";
  if (job === "cart_reminder") {
    await runReminderJob();
    await logAdminAction({ adminId: admin.id, adminUsername: admin.username, action: "system.job.cart_reminder" });
    successResponse(res, 200, "Cart reminder job executed");
    return;
  }
  errorResponse(res, 400, "Unknown job. Supported: cart_reminder");
}
