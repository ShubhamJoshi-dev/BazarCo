import jwt from "jsonwebtoken";
import { env } from "../config/env";
import type { AdminJwtPayload, JwtPayload } from "../interfaces/auth";

const SEVEN_DAYS_SEC = 7 * 24 * 60 * 60;

function parseExpiresIn(): number {
  const v = env.JWT_EXPIRES_IN;
  if (/^\d+$/.test(v)) return Number(v);
  if (v.endsWith("d")) return Number(v.slice(0, -1)) * 24 * 60 * 60;
  if (v.endsWith("h")) return Number(v.slice(0, -1)) * 60 * 60;
  return SEVEN_DAYS_SEC;
}

export function signToken(payload: JwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: parseExpiresIn() });
}

export function signAdminToken(payload: AdminJwtPayload): string {
  return jwt.sign(payload, env.JWT_SECRET, { expiresIn: parseExpiresIn() });
}

export function verifyToken(token: string): JwtPayload | AdminJwtPayload | null {
  try {
    const decoded = jwt.verify(token, env.JWT_SECRET) as JwtPayload | AdminJwtPayload;
    return decoded;
  } catch {
    return null;
  }
}
