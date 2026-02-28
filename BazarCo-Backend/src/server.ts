import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { createApp } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { logger } from "./lib/logger";

const app = createApp();

async function start(): Promise<void> {
  await connectDb();
  app.listen(env.PORT, () => {
    logger.info("Server running", { url: `http://localhost:${env.PORT}`, env: env.NODE_ENV });
  });
}

start().catch((err) => {
  logger.error("Startup failed", { err });
  process.exit(1);
});
