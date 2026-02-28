import type { Request, Response } from "express";
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
    res.status(400).json({ error: "email is required" });
    return;
  }
  try {
    const result = await notifyService.signUpNotify(email);
    if (result.status === "already_notified") {
      res.status(200).json({ message: "Already notified" });
      return;
    }
    res.status(200).json({ message: "Notification signup successful" });
  } catch (err: unknown) {
    const isDuplicate = err && typeof err === "object" && "code" in err && (err as { code: number }).code === 11000;
    if (isDuplicate) {
      res.status(200).json({ message: "Already notified" });
      return;
    }
    logger.error("Notify error", { err });
    res.status(500).json({ error: "Failed to send notification" });
  }
}
