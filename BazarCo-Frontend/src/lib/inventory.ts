import type { Product } from "@/types/api";

export const LOW_STOCK_THRESHOLD = 10;

export type StockLevel = "in_stock" | "low_stock" | "out_of_stock";

export function getStockLevel(product: Product): StockLevel {
  if (product.status === "archived") return "out_of_stock";
  const stock = product.stock ?? 0;
  if (stock <= 0) return "out_of_stock";
  if (stock < LOW_STOCK_THRESHOLD) return "low_stock";
  return "in_stock";
}

export function displayMarginPercent(price: number): number {
  return Math.min(48, Math.round(12 + price / 25));
}

export function formatRelativeUpdated(iso?: string): string {
  if (!iso) return "—";
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "Just now";
  if (mins < 60) return `${mins} min ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours} hour${hours === 1 ? "" : "s"} ago`;
  const days = Math.floor(hours / 24);
  if (days < 7) return `${days} day${days === 1 ? "" : "s"} ago`;
  return new Date(iso).toLocaleDateString("en-AU", { month: "short", day: "numeric", year: "numeric" });
}

export function productSku(product: Product): string {
  return product.sku ?? `SKU-${product.id.slice(-6).toUpperCase()}`;
}
