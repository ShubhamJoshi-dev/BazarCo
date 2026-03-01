import dotenv from "dotenv";
dotenv.config();


const NODE_ENV = process.env.NODE_ENV ?? "development";
const PORT = Number(process.env.PORT) || 3000;
const BASE_URL = process.env.BASE_URL ?? `http://localhost:${Number(process.env.PORT) || 3000}`;
const MONGO_URI = process.env.MONGO_URI ?? "mongodb://localhost:27017/bazarco";
const CLUSTER_MONGO_ENABLED = process.env.CLUSTER_MONGO_ENABLED === "true" || process.env.CLUSTER_MONGO_ENABLED === "1";
const CLUSTER_MONGO_URI = process.env.CLUSTER_MONGO_URI ?? "";
const APP_MAIL = process.env.APP_MAIL ?? "";
const APP_PW = process.env.APP_PW ?? "";
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

export const env = {
  NODE_ENV: NODE_ENV as "development" | "production" | "test",
  PORT,
  BASE_URL,
  MONGO_URI,
  CLUSTER_MONGO_ENABLED,
  CLUSTER_MONGO_URI,
  APP_MAIL,
  APP_PW,
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
  isDev: NODE_ENV === "development",
  isProd: NODE_ENV === "production",
} as const;
