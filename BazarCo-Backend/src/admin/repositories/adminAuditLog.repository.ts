import { AdminAuditLog } from "../models/adminAuditLog.model";
import { parsePagination, paginationMeta } from "../lib/pagination";

export async function createLog(data: {
  adminId: string;
  adminUsername?: string;
  action: string;
  resource?: string;
  resourceId?: string;
  method?: string;
  path?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  success?: boolean;
  errorMessage?: string;
}) {
  return AdminAuditLog.create(data);
}

export async function listLogs(query: Record<string, unknown>) {
  const { page, limit, sort, order, skip } = parsePagination(query, { limit: 25 });
  const filter: Record<string, unknown> = {};
  if (typeof query.adminId === "string") filter.adminId = query.adminId;
  if (typeof query.action === "string") filter.action = new RegExp(query.action, "i");
  if (typeof query.resource === "string") filter.resource = query.resource;

  const [items, total] = await Promise.all([
    AdminAuditLog.find(filter).sort({ [sort]: order }).skip(skip).limit(limit).lean(),
    AdminAuditLog.countDocuments(filter),
  ]);

  return { items, pagination: paginationMeta(total, page, limit) };
}
