/** Routes guests may visit without signing in (browse, product detail, shop videos). */

export function isPublicMarketplacePath(pathname: string | null | undefined): boolean {
  if (!pathname) return false;
  if (pathname === "/dashboard/browse") return true;
  if (pathname.startsWith("/dashboard/reels")) return true;
  if (/^\/dashboard\/product\/[^/]+$/.test(pathname)) return true;
  return false;
}

export function isReelsPath(pathname: string | null | undefined): boolean {
  return Boolean(pathname?.startsWith("/dashboard/reels"));
}
