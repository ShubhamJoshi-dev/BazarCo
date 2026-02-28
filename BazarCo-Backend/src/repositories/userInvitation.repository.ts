import { UserInvitation } from "../models/userInvitation.model";

export async function findByEmail(email: string) {
  return UserInvitation.findOne({ email: email.toLowerCase() });
}

export async function create(email: string) {
  return UserInvitation.create({ email: email.toLowerCase() });
}
