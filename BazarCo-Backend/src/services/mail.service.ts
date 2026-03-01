import { emailHelper } from "../helpers/email.helper";
import { getPasswordResetEmailHtml, getPasswordResetEmailText } from "../templates/password-reset-email";
import { getReminderEmailHtml, getReminderEmailText } from "../templates/reminder-email";
import { getNotifyEmailHtml, getNotifyEmailText } from "../templates/notify-email";

export async function sendNotifyEmail(to: string): Promise<void> {
  await emailHelper.sendEmail({
    to,
    subject: "BazarCo – You're on the list",
    text: getNotifyEmailText(),
    html: getNotifyEmailHtml(),
  });
}

export async function sendReminderEmail(to: string): Promise<void> {
  await emailHelper.sendEmail({
    to,
    subject: "BazarCo – Launch reminder",
    text: getReminderEmailText(),
    html: getReminderEmailHtml(),
  });
}

export async function sendPasswordResetEmail(to: string, resetLink: string): Promise<void> {
  await emailHelper.sendEmail({
    to,
    subject: "BazarCo – Reset your password",
    text: getPasswordResetEmailText(resetLink),
    html: getPasswordResetEmailHtml(resetLink),
  });
}
