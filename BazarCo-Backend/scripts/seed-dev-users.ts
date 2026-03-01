import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import bcrypt from "bcrypt";
import { connectDb, disconnectDb } from "../src/config/db";
import { User } from "../src/models/user.model";

const DEV_SEED_PASSWORD = process.env.DEV_SEED_PASSWORD ?? "BazarCoDev2026";

const DEV_USERS = [
  { email: "shubhamrajjoshi69@gmail.com", name: "Shubham", role: "buyer" as const },
  { email: "mainalisital123@gmail.com", name: "Mainali", role: "seller" as const },
];

async function seed(): Promise<void> {
  await connectDb();
  const hashed = await bcrypt.hash(DEV_SEED_PASSWORD, 10);

  for (const u of DEV_USERS) {
    const email = u.email.toLowerCase().trim();
    const existing = await User.findOne({ email });
    if (existing) {
      await User.updateOne({ email }, { $set: { name: u.name, role: u.role } });
      console.log("User already exists, updated role:", email, u.role);
      continue;
    }
    await User.create({
      email,
      password: hashed,
      name: u.name,
      role: u.role,
    });
    console.log("Seeded user:", email, u.role);
  }

  await disconnectDb();
  console.log("Done. Dev password:", DEV_SEED_PASSWORD);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
