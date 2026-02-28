import type { Request, Response } from "express";
import { errorResponse, successResponse } from "../helpers/response.helper";
import { logger } from "../lib/logger";
import * as notifyService from "../services/notify.service";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function parseEmail(body: unknown): string | null {
  const email = typeof body === "object" && body !== null && "email" in body
    ? (body as { email: unknown }).email
    : undefined;
  if (typeof email !== "string") return null;
  const trimmed = email.trim();
  return trimmed && EMAIL_REGEX.test(trimmed) ? trimmed : null;
}

export async function postNotify(req: Request, res: Response): Promise<void> {
  const email = parseEmail(req.body);
  if (!email) {
    errorResponse(res, 400, "email is required");
    return;
  }
  try {
    const result = await notifyService.signUpNotify(email);
    if (result.status === "already_notified") {
      successResponse(res, 200, "Already notified");
      return;
    }
    successResponse(res, 200, "Notification signup successful");
  } catch (err: unknown) {
    const isDuplicate = err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000;
    if (isDuplicate) {
      successResponse(res, 200, "Already notified");
      return;
    }
    logger.error("Notify error", { err });
    errorResponse(res, 500, "Failed to send notification");
  }
}
