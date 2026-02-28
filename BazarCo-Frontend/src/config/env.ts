const FALLBACK_BACKEND_URL = "http://localhost:3000";

export function getBackendBaseUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_BACKEND_URL;
  }
  return process.env.NEXT_PUBLIC_API_URL ?? FALLBACK_BACKEND_URL;
}
