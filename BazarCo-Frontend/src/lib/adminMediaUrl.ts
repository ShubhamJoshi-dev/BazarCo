import { getBackendBaseUrl } from "@/config/env";

/** Resolve relative upload paths to absolute backend URLs for admin previews. */
export function resolveAdminMediaUrl(url?: string | null): string | undefined {
  if (!url?.trim()) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) return url;
  const base = getBackendBaseUrl().replace(/\/$/, "");
  return `${base}${url.startsWith("/") ? url : `/${url}`}`;
}
