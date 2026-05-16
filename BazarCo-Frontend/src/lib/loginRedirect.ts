/** Build login URL that returns the user to a path after sign-in. */

export function getLoginHref(returnPath: string): string {
  const safe =
    returnPath.startsWith("/") && !returnPath.startsWith("//")
      ? returnPath
      : "/dashboard/browse";
  return `/login?returnUrl=${encodeURIComponent(safe)}`;
}

export function getReturnUrlFromSearch(search: string): string | null {
  if (!search) return null;
  const value = new URLSearchParams(search).get("returnUrl");
  if (!value || !value.startsWith("/") || value.startsWith("//")) return null;
  return value;
}
