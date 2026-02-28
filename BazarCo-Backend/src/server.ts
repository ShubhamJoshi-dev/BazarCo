import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { createApp } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";

const app = createApp();


async function start(): Promise<void> {
  await connectDb();
  app.listen(env.PORT, () => {
    console.log(`[BazarCo] Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
  });
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});
