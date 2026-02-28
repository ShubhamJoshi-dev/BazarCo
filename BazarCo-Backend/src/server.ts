import { createApp } from "./app.js";
import { connectDb } from "./config/db.js";
import { env } from "./config/env.js";

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
