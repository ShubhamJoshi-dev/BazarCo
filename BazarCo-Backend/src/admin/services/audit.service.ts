import * as auditRepo from "../repositories/adminAuditLog.repository";

export async function logAdminAction(data: {
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
}): Promise<void> {
  try {
    await auditRepo.createLog(data);
  } catch {
    // Audit failures must not break admin operations
  }
}
