import { logger } from "../lib/logger";
import * as reminderService from "../services/reminder.service";

export async function runReminderJob(): Promise<void> {
  logger.info("Reminder job started");
  try {
    const result = await reminderService.runReminderCampaign();
    logger.info("Reminder job completed", {
      total: result.total,
      sent: result.sent,
      failed: result.failed,
    });
    if (result.errors.length > 0) {
      logger.warn("Reminder job partial failures", { errors: result.errors });
    }
  } catch (err) {
    logger.error("Reminder job failed", { err });
    throw err;
  }
}
