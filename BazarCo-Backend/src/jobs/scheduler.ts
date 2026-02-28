import cron from "node-cron";
import {
  REMINDER_CRON_ENABLED,
  REMINDER_CRON_SCHEDULE,
} from "../constant/cron.constant";
import { logger } from "../lib/logger";
import { runReminderJob } from "./reminder.job";

export function startScheduler(): void {
  if (!REMINDER_CRON_ENABLED) {
    logger.info("Reminder cron disabled", { REMINDER_CRON_ENABLED: false });
    return;
  }

  const valid = cron.validate(REMINDER_CRON_SCHEDULE);
  if (!valid) {
    logger.warn("Invalid reminder cron schedule, job not scheduled", {
      schedule: REMINDER_CRON_SCHEDULE,
    });
    return;
  }

  cron.schedule(REMINDER_CRON_SCHEDULE, () => {
    runReminderJob().catch((err) => {
      logger.error("Reminder job threw", { err });
    });
  });

  logger.info("Reminder cron scheduled", { schedule: REMINDER_CRON_SCHEDULE });
}
