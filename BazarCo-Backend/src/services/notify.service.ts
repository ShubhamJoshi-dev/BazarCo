import type { NotifySignUpResult } from "../interfaces/notify";
import * as userInvitationRepo from "../repositories/userInvitation.repository";
import { sendNotifyEmail } from "./mail.service";

export async function signUpNotify(email: string): Promise<NotifySignUpResult> {
  const existing = await userInvitationRepo.findByEmail(email);
  if (existing) {
    return { status: "already_notified" };
  }
  await userInvitationRepo.create(email);
  await sendNotifyEmail(email);
  return { status: "created" };
}
