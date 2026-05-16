/** Shared UI helpers for browse & product detail (NepalMarket-style). */

export function pseudoRating(id: string): number {
  let hash = 0;
  for (const ch of id) hash = (hash * 31 + ch.charCodeAt(0)) & 0xffffffff;
  return 3.8 + ((Math.abs(hash) % 12) / 10);
}

export function pseudoReviews(id: string): number {
  let hash = 0;
  for (const ch of id) hash = (hash * 17 + ch.charCodeAt(0)) & 0xffffffff;
  return 18 + (Math.abs(hash) % 983);
}

export function compareAtPrice(price: number): number {
  return Math.round(price * 1.22 * 100) / 100;
}

export function discountPercent(price: number, original: number): number {
  if (original <= price) return 0;
  return Math.round(((original - price) / original) * 100);
}

export type ProductBadge = "freeDelivery" | "hotDeal" | "bestseller";

export function productBadges(id: string): ProductBadge[] {
  let hash = 0;
  for (const ch of id) hash = (hash * 13 + ch.charCodeAt(0)) & 0xffffffff;
  const h = Math.abs(hash);
  const badges: ProductBadge[] = [];
  if (h % 3 === 0) badges.push("freeDelivery");
  if (h % 5 === 0) badges.push("hotDeal");
  if (h % 7 === 0 || h % 4 === 1) badges.push("bestseller");
  return badges;
}

export function extractBrands(products: { brand?: string }[]): string[] {
  const set = new Set<string>();
  for (const p of products) {
    if (p.brand?.trim()) set.add(p.brand.trim());
  }
  return Array.from(set).sort((a, b) => a.localeCompare(b));
}
