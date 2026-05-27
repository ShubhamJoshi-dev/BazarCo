import dotenv from "dotenv";
dotenv.config();


const NODE_ENV = process.env.NODE_ENV ?? "development";
const PORT = Number(process.env.PORT) || 3000;
const API_PREFIX = (process.env.API_PREFIX ?? "").trim().replace(/\/+$/, "") || "";
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${Number(process.env.PORT) || 3000}`;
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/bazarco";
const CLUSTER_MONGO_ENABLED = process.env.CLUSTER_MONGO_ENABLED === "true" || process.env.CLUSTER_MONGO_ENABLED === "1";
const CLUSTER_MONGO_URI = process.env.CLUSTER_MONGO_URI ?? "";
const APP_MAIL = process.env.APP_MAIL ?? "";
const APP_PW = process.env.APP_PW ?? "";
const ADMIN_MAIL = (process.env.ADMIN_MAIL ?? process.env.APP_MAIL ?? "").trim();
const CORS_ORIGIN = process.env.CORS_ORIGIN ?? "";
const JWT_SECRET = process.env.JWT_SECRET ?? "bazarco-dev-secret-change-in-production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN ?? "7d";
const FRONTEND_URL = process.env.FRONTEND_URL ?? "http://localhost:3001";
const ALLOW_DEV_LOGIN = process.env.ALLOW_DEV_LOGIN !== "false";
const DEV_LOGIN_SECRET = process.env.DEV_LOGIN_SECRET ?? "bazarco-dev-login";

const SHOPIFY_ACCESS_TOKEN = (process.env.SHOPIFY_ACCESS_TOKEN ?? "").trim();
const SHOPIFY_STORE_DOMAIN = (process.env.SHOPIFY_STORE_DOMAIN ?? "").trim();
const CLOUDINARY_CLOUD_NAME = (process.env.CLOUDINARY_CLOUD_NAME ?? "").trim();
const CLOUDINARY_API_KEY = (process.env.CLOUDINARY_API_KEY ?? "").trim();
const CLOUDINARY_API_SECRET = (process.env.CLOUDINARY_API_SECRET ?? "").trim();

const ALGOLIA_APP_ID = (process.env.ALGOLIA_APP_ID ?? "").trim();
const ALGOLIA_WRITE_API_KEY = (process.env.ALGOLIA_WRITE_API_KEY ?? "").trim();
const ALGOLIA_INDEX_NAME = (process.env.ALGOLIA_INDEX_NAME ?? "products").trim();

const STRIPE_SECRET_KEY = (process.env.STRIPE_SECRET_KEY ?? "").trim();

const REDIS_URI = (process.env.REDIS_URI ?? "").trim();
const UNSEND_MESSAGE_WINDOW_MINUTES = Number(process.env.UNSEND_MESSAGE_WINDOW_MINUTES) || 15;
const OPENAI_API_KEY = (process.env.OPENAI_API_KEY ?? "").trim();

const ADMIN_SEED_PASSWORD = (process.env.ADMIN_SEED_PASSWORD ?? "").trim();
const ADMIN_SHUBHAM_PASSWORD = (process.env.ADMIN_SHUBHAM_PASSWORD ?? ADMIN_SEED_PASSWORD).trim();
const ADMIN_SITAL_PASSWORD = (process.env.ADMIN_SITAL_PASSWORD ?? ADMIN_SEED_PASSWORD).trim();
const ADMIN_SANDEEP_PASSWORD = (process.env.ADMIN_SANDEEP_PASSWORD ?? ADMIN_SEED_PASSWORD).trim();
const ADMIN_MAINTENANCE_SECRET = (process.env.ADMIN_MAINTENANCE_SECRET ?? "").trim();
const ADMIN_RATE_LIMIT_WINDOW_MS = Number(process.env.ADMIN_RATE_LIMIT_WINDOW_MS) || 60_000;
const ADMIN_RATE_LIMIT_MAX = Number(process.env.ADMIN_RATE_LIMIT_MAX) || 120;

export const env = {
  NODE_ENV: NODE_ENV as "development" | "production" | "test",
  PORT,
  API_PREFIX,
  BASE_URL,
  MONGO_URI,
  CLUSTER_MONGO_ENABLED,
  CLUSTER_MONGO_URI,
  APP_MAIL,
  APP_PW,
  ADMIN_MAIL,
  CORS_ORIGIN,
  JWT_SECRET,
  JWT_EXPIRES_IN,
  FRONTEND_URL,
  ALLOW_DEV_LOGIN,
  DEV_LOGIN_SECRET,
  SHOPIFY_ACCESS_TOKEN,
  SHOPIFY_STORE_DOMAIN,
  CLOUDINARY_CLOUD_NAME,
  CLOUDINARY_API_KEY,
  CLOUDINARY_API_SECRET,
  ALGOLIA_APP_ID,
  ALGOLIA_WRITE_API_KEY,
  ALGOLIA_INDEX_NAME,
  STRIPE_SECRET_KEY,
  REDIS_URI,
  UNSEND_MESSAGE_WINDOW_MINUTES,
  OPENAI_API_KEY,
  ADMIN_SEED_PASSWORD,
  ADMIN_SHUBHAM_PASSWORD,
  ADMIN_SITAL_PASSWORD,
  ADMIN_SANDEEP_PASSWORD,
  ADMIN_MAINTENANCE_SECRET,
  ADMIN_RATE_LIMIT_WINDOW_MS,
  ADMIN_RATE_LIMIT_MAX,
  isDev: NODE_ENV === "development",
  isProd: NODE_ENV === "production",
} as const;
