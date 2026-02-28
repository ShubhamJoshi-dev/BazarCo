import dotenv from "dotenv";
dotenv.config();


const NODE_ENV = process.env.NODE_ENV ?? "development";
const PORT = Number(process.env.PORT) || 3000;
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${Number(process.env.PORT) || 3000}`;
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/bazarco";
const CLUSTER_MONGO_ENABLED = process.env.CLUSTER_MONGO_ENABLED === "true" || process.env.CLUSTER_MONGO_ENABLED === "1";
const CLUSTER_MONGO_URI = process.env.CLUSTER_MONGO_URI ?? "";

export const env = {
  NODE_ENV: NODE_ENV as "development" | "production" | "test",
  PORT,
  BASE_URL,
  MONGO_URI,
  CLUSTER_MONGO_ENABLED,
  CLUSTER_MONGO_URI,
  isDev: NODE_ENV === "development",
  isProd: NODE_ENV === "production",
} as const;
