import { emailHelper } from "../helpers/email.helper";
import { getNotifyEmailHtml, getNotifyEmailText } from "../templates/notify-email";

export async function sendNotifyEmail(to: string): Promise<void> {
  await emailHelper.sendEmail({
    to,
    subject: "BazarCo – You're on the list",
    text: getNotifyEmailText(),
    html: getNotifyEmailHtml(),
  });
}
