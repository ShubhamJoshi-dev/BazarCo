import { UserInvitation } from "../models/userInvitation.model";

export async function findByEmail(email: string) {
  return UserInvitation.findOne({ email: email.toLowerCase() });
}

export async function create(email: string) {
  return UserInvitation.create({ email: email.toLowerCase() });
}

export async function findAllEmails(): Promise<string[]> {
  const docs = await UserInvitation.find({}).select("email").lean();
  return docs.map((d) => d.email);
}
