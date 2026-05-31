import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import bcrypt from "bcrypt";
import { connectDb, disconnectDb } from "../src/config/db";
import { env } from "../src/config/env";
import * as adminUserRepo from "../src/admin/repositories/adminUser.repository";
import { SALT_ROUNDS } from "../src/admin/services/adminAuth.service";

const SUPER_ADMINS = [
  {
    username: "shubham",
    name: "Shubham",
    email: "subham@bazarco.admin",
    passwordEnv: () => env.ADMIN_SHUBHAM_PASSWORD,
  },
  {
    username: "sital",
    name: "Sital",
    email: "sital@bazarco.admin",
    passwordEnv: () => env.ADMIN_SITAL_PASSWORD,
  },
  {
    username: "sandeep",
    name: "Sandeep",
    email: "sandeep@bazarco.admin",
    passwordEnv: () => env.ADMIN_SANDEEP_PASSWORD,
  },
] as const;

const DEV_FALLBACK_PASSWORD = "BazarCoAdmin2026!";

function resolvePassword(admin: (typeof SUPER_ADMINS)[number]): string {
  return admin.passwordEnv() || env.ADMIN_SEED_PASSWORD || DEV_FALLBACK_PASSWORD;
}

async function seed(): Promise<void> {
  const usingFallback =
    !env.ADMIN_SEED_PASSWORD && SUPER_ADMINS.every((a) => !a.passwordEnv());
  if (usingFallback) {
    console.warn(
      "ADMIN_SEED_PASSWORD not set — seeding with built-in setup password. Change it in production via .env and re-run seed."
    );
  }

  await connectDb();

  for (const admin of SUPER_ADMINS) {
    const plain = resolvePassword(admin);
    const hashed = await bcrypt.hash(plain, SALT_ROUNDS);
    await adminUserRepo.upsertAdmin({
      username: admin.username,
      email: admin.email,
      password: hashed,
      name: admin.name,
      role: "super_admin",
    });
    console.log(`Seeded super admin: ${admin.username} (${admin.email})`);
  }

  await disconnectDb();
  const pwdHint = env.ADMIN_SEED_PASSWORD || SUPER_ADMINS[0].passwordEnv() || DEV_FALLBACK_PASSWORD;
  console.log("Admin seed complete. Log in at /admin/login");
  console.log("Usernames: shubham | sital | sandeep");
  console.log("Password:", pwdHint);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
