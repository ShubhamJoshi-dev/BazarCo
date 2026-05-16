import { getBackendBaseUrl } from "@/config/env";

export function resolveMediaUrl(url: string): string {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${getBackendBaseUrl().replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}
