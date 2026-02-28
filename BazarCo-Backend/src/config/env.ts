/**
 * Environment and app config.
 * Load from process.env; validate in one place.
 */

const NODE_ENV = process.env.NODE_ENV ?? "development";
const PORT = Number(process.env.PORT) || 3000;

export const env = {
  NODE_ENV: NODE_ENV as "development" | "production" | "test",
  PORT,
  isDev: NODE_ENV === "development",
  isProd: NODE_ENV === "production",
} as const;
