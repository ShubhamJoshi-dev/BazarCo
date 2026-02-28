import { createApp } from "./app.js";
import { env } from "./config/env.js";

const app = createApp();

app.listen(env.PORT, () => {
  console.log(`[BazarCo] Server running on http://localhost:${env.PORT} (${env.NODE_ENV})`);
});
