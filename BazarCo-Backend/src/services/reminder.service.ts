import { logger } from "../lib/logger";
import * as userInvitationRepo from "../repositories/userInvitation.repository";
import { sendReminderEmail } from "./mail.service";

export interface ReminderCampaignResult {
  total: number;
  sent: number;
  failed: number;
  errors: Array<{ email: string; error: string }>;
}

export async function runReminderCampaign(): Promise<ReminderCampaignResult> {
  const emails = await userInvitationRepo.findAllEmails();
  const result: ReminderCampaignResult = { total: emails.length, sent: 0, failed: 0, errors: [] };

  for (const email of emails) {
    try {
      await sendReminderEmail(email);
      result.sent += 1;
    } catch (err) {
      result.failed += 1;
      const message = err instanceof Error ? err.message : String(err);
      result.errors.push({ email, error: message });
      logger.warn("Reminder email failed", { email, error: message });
    }
  }

  return result;
}
