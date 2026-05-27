import { env } from "../config/env";

export type AdminCheckUser = { email: string; role: string };

/** Legacy marketplace-user admin check (email allowlist). Enterprise panel uses admin_users + /admin/auth. */
export function isAdminUser(user: AdminCheckUser): boolean {
  if (user.role === "admin") return true;
  const adminMail = env.ADMIN_MAIL.trim().toLowerCase();
  if (adminMail && user.email.trim().toLowerCase() === adminMail) return true;
  return false;
}
