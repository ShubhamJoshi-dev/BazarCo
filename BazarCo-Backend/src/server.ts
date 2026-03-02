import http from "http";
import path from "path";
import dotenv from "dotenv";

dotenv.config({ path: path.resolve(__dirname, "..", ".env") });

import { createApp } from "./app";
import { connectDb } from "./config/db";
import { env } from "./config/env";
import { startScheduler } from "./jobs/scheduler";
import { logger } from "./lib/logger";
import { createSocketServer } from "./socket";
import { isAlgoliaConfigured, setAlgoliaIndexSettings } from "./services/algolia.service";

const app = createApp();
const httpServer = http.createServer(app);

async function start(): Promise<void> {
  await connectDb();
  if (isAlgoliaConfigured()) {
    const ok = await setAlgoliaIndexSettings();
    if (ok) logger.info("Algolia index settings applied (searchableAttributes: name, description)");
    else logger.warn("Algolia setSettings failed; search may still work if index is already configured");
  }
  startScheduler();
  if (!env.STRIPE_SECRET_KEY) {
    logger.warn("STRIPE_SECRET_KEY is not set; checkout will return 'Stripe is not configured'");
  }
  createSocketServer(httpServer);
  httpServer.listen(env.PORT, () => {
    logger.info("Server running", { url: `http://localhost:${env.PORT}`, env: env.NODE_ENV });
  });
}

start().catch((err) => {
  logger.error("Startup failed", { err });
  process.exit(1);
});
