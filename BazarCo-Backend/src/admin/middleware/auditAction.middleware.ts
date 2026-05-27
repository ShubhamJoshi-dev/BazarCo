import type { Request, Response, NextFunction } from "express";
import { logAdminAction } from "../services/audit.service";
import type { AdminAuthUser } from "./requireAdminAuth.middleware";

export function auditAction(action: string, resource?: string) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const admin = (req as Request & { admin?: AdminAuthUser }).admin;
    const started = Date.now();
    const originalJson = res.json.bind(res);

    res.json = function auditJson(body: unknown) {
      const success = typeof body === "object" && body !== null && (body as { status?: string }).status !== "error";
      void logAdminAction({
        adminId: admin?.id ?? "unknown",
        adminUsername: admin?.username,
        action,
        resource,
        resourceId: typeof req.params.id === "string" ? req.params.id : undefined,
        method: req.method,
        path: req.originalUrl,
        ip: req.ip,
        userAgent: req.get("user-agent") ?? undefined,
        metadata: { durationMs: Date.now() - started, statusCode: res.statusCode },
        success,
        errorMessage: success ? undefined : (body as { message?: string })?.message,
      });
      return originalJson(body);
    };

    next();
  };
}
