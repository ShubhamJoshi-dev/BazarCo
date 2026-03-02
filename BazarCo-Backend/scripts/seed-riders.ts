import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

import bcrypt from "bcrypt";
import { connectDb, disconnectDb } from "../src/config/db";
import { User } from "../src/models/user.model";
import { Rider } from "../src/models/rider.model";

const RIDER_PASSWORD = process.env.DEV_SEED_PASSWORD ?? "BazarCoRider2026";

const RIDERS = [
  { email: "rider1@bazarco.local", name: "Rider One", phone: "+9779800000001" },
  { email: "rider2@bazarco.local", name: "Rider Two", phone: "+9779800000002" },
  { email: "rider3@bazarco.local", name: "Rider Three", phone: "+9779800000003" },
  { email: "rider4@bazarco.local", name: "Rider Four", phone: "+9779800000004" },
  { email: "rider5@bazarco.local", name: "Rider Five", phone: "+9779800000005" },
];

async function seed(): Promise<void> {
  await connectDb();
  const hashed = await bcrypt.hash(RIDER_PASSWORD, 10);

  for (const r of RIDERS) {
    const email = r.email.toLowerCase().trim();
    let user = await User.findOne({ email });
    if (!user) {
      const created = await User.create({
        email,
        password: hashed,
        name: r.name,
        role: "rider",
      });
      user = created;
      console.log("Created rider user:", email);
    } else {
      await User.updateOne({ email }, { $set: { name: r.name, role: "rider" } });
      console.log("Updated user to rider:", email);
    }

    const riderExists = await Rider.findOne({ userId: user._id });
    if (!riderExists) {
      await Rider.create({
        userId: user._id,
        name: r.name,
        phone: r.phone,
        isActive: true,
      });
      console.log("Created rider record:", r.name);
    } else {
      await Rider.updateOne({ userId: user._id }, { $set: { name: r.name, phone: r.phone, isActive: true } });
      console.log("Updated rider record:", r.name);
    }
  }

  await disconnectDb();
  console.log("Riders seeded. Password for rider logins:", RIDER_PASSWORD);
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
