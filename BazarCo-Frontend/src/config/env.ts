const FALLBACK_BACKEND_URL = "http://localhost:3000";
const DEV_LOGIN_SECRET = "bazarco-dev-login";

export function getBackendBaseUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_BACKEND_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_BACKEND_URL;
}

export function getDevLoginSecret(): string {
  return process.env.NEXT_PUBLIC_DEV_LOGIN_SECRET ?? DEV_LOGIN_SECRET;
}
