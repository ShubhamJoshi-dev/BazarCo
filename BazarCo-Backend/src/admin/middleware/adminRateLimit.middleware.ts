import type { Request, Response, NextFunction } from "express";
import { env } from "../../config/env";
import { errorResponse } from "../../helpers/response.helper";

type Bucket = { count: number; resetAt: number };

const buckets = new Map<string, Bucket>();

function clientKey(req: Request): string {
  const admin = (req as Request & { admin?: { id: string } }).admin;
  if (admin?.id) return `admin:${admin.id}`;
  const forwarded = req.headers["x-forwarded-for"];
  const ip = typeof forwarded === "string" ? forwarded.split(",")[0]?.trim() : req.ip;
  return `ip:${ip ?? "unknown"}`;
}

export function adminRateLimit(req: Request, res: Response, next: NextFunction): void {
  const key = clientKey(req);
  const now = Date.now();
  let bucket = buckets.get(key);
  if (!bucket || now >= bucket.resetAt) {
    bucket = { count: 0, resetAt: now + env.ADMIN_RATE_LIMIT_WINDOW_MS };
    buckets.set(key, bucket);
  }
  bucket.count += 1;
  if (bucket.count > env.ADMIN_RATE_LIMIT_MAX) {
    errorResponse(res, 429, "Too many admin requests. Please try again shortly.");
    return;
  }
  next();
}
