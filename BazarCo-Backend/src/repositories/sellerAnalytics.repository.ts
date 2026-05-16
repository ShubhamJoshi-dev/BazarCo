import type { Types } from "mongoose";
import { Order } from "../models/order.model";
import { Product } from "../models/product.model";
import { Category } from "../models/category.model";

export interface AnalyticsKpi {
  value: number;
  changePercent: number;
}

export interface SalesTrendPoint {
  date: string;
  label: string;
  sales: number;
}

export interface TrafficSourceRow {
  id: string;
  name: string;
  percent: number;
  count: number;
  color: string;
}

export interface RegionRow {
  region: string;
  orders: number;
  growth: number;
  revenue: number;
}

export interface RegionHotspot {
  region: string;
  x: number;
  y: number;
  intensity: number;
}

export interface SellerAnalyticsData {
  shopId: string;
  salesTrend: SalesTrendPoint[];
  trafficSources: TrafficSourceRow[];
  topRegions: RegionRow[];
  regionHotspots: RegionHotspot[];
  kpis: {
    totalSales: AnalyticsKpi;
    conversionRate: AnalyticsKpi;
    avgOrderValue: AnalyticsKpi;
    activeVisitors: AnalyticsKpi;
  };
}

const TRAFFIC_COLORS = ["#c62828", "#1565c0", "#2e7d32", "#f9a825", "#7b1fa2", "#00838f"];

const NEPAL_REGION_MAP: Record<string, string> = {
  kathmandu: "Kathmandu Valley",
  lalitpur: "Kathmandu Valley",
  bhaktapur: "Kathmandu Valley",
  pokhara: "Pokhara Region",
  kaski: "Pokhara Region",
  butwal: "Butwal / Bhairahawa",
  bhairahawa: "Butwal / Bhairahawa",
  rupandehi: "Butwal / Bhairahawa",
  biratnagar: "Biratnagar",
  morang: "Biratnagar",
  dharan: "Dharan",
  sunsari: "Dharan",
  hetauda: "Hetauda",
  makwanpur: "Hetauda",
  nepalgunj: "Nepalgunj",
  banke: "Nepalgunj",
  dhangadhi: "Dhangadhi",
  kailali: "Dhangadhi",
};

const HOTSPOT_POSITIONS: Record<string, { x: number; y: number }> = {
  "Kathmandu Valley": { x: 52, y: 48 },
  "Pokhara Region": { x: 38, y: 42 },
  "Butwal / Bhairahawa": { x: 42, y: 58 },
  Biratnagar: { x: 72, y: 44 },
  Dharan: { x: 76, y: 40 },
  Hetauda: { x: 54, y: 54 },
  Nepalgunj: { x: 28, y: 50 },
  Dhangadhi: { x: 18, y: 46 },
  Other: { x: 50, y: 62 },
};

function startOfDay(d: Date): Date {
  const x = new Date(d);
  x.setHours(0, 0, 0, 0);
  return x;
}

function pctChange(current: number, previous: number): number {
  if (previous > 0) return Math.round(((current - previous) / previous) * 1000) / 10;
  if (current > 0) return 100;
  return 0;
}

function resolveRegion(city?: string, state?: string): string {
  const raw = `${city ?? ""} ${state ?? ""}`.toLowerCase();
  for (const [key, region] of Object.entries(NEPAL_REGION_MAP)) {
    if (raw.includes(key)) return region;
  }
  if (state?.trim()) return state.trim();
  if (city?.trim()) return city.trim();
  return "Other";
}

function bucketTrend(
  orders: Array<{ total: number; createdAt: Date }>,
  periodStart: Date,
  periodEnd: Date,
  days: number
): SalesTrendPoint[] {
  const points: SalesTrendPoint[] = [];
  const bucketDays = days <= 30 ? 7 : days <= 90 ? 14 : 30;
  const cursor = startOfDay(new Date(periodStart));
  const end = startOfDay(new Date(periodEnd));

  while (cursor <= end) {
    const bucketEnd = new Date(cursor);
    bucketEnd.setDate(bucketEnd.getDate() + bucketDays);
    const bucketOrders = orders.filter((o) => {
      const t = new Date(o.createdAt).getTime();
      return t >= cursor.getTime() && t < bucketEnd.getTime();
    });
    const sales = bucketOrders.reduce((s, o) => s + o.total, 0);
    const label = cursor.toLocaleDateString("en-US", {
      month: "short",
      day: days <= 90 ? "numeric" : undefined,
    });
    points.push({
      date: cursor.toISOString().slice(0, 10),
      label: label.replace(",", ""),
      sales,
    });
    cursor.setDate(cursor.getDate() + bucketDays);
  }

  return points.length ? points : [{ date: periodEnd.toISOString().slice(0, 10), label: "—", sales: 0 }];
}

export async function getSellerAnalyticsData(
  sellerId: string,
  options?: { days?: number }
): Promise<SellerAnalyticsData> {
  const days = Math.min(Math.max(options?.days ?? 30, 7), 365);
  const now = new Date();
  const periodStart = new Date(now);
  periodStart.setDate(periodStart.getDate() - days);
  const prevStart = new Date(periodStart);
  prevStart.setDate(prevStart.getDate() - days);

  const [periodOrders, prevOrders, products] = await Promise.all([
    Order.find({ sellerId, createdAt: { $gte: periodStart } })
      .select("total status buyerId createdAt shippingAddress items")
      .lean(),
    Order.find({ sellerId, createdAt: { $gte: prevStart, $lt: periodStart } })
      .select("total status buyerId createdAt shippingAddress items")
      .lean(),
    Product.find({ sellerId }).select("categoryId").lean(),
  ]);

  type OrderLean = {
    total: number;
    status: string;
    buyerId: Types.ObjectId;
    createdAt: Date;
    shippingAddress?: { city?: string; state?: string };
    items?: Array<{ productId?: Types.ObjectId; productName: string; quantity: number; price: number }>;
  };

  const period = periodOrders as OrderLean[];
  const prev = prevOrders as OrderLean[];

  const completedPeriod = period.filter((o) => o.status === "completed");
  const completedPrev = prev.filter((o) => o.status === "completed");

  const totalSales = completedPeriod.reduce((s, o) => s + o.total, 0);
  const prevSales = completedPrev.reduce((s, o) => s + o.total, 0);

  const conversionRate =
    period.length > 0 ? Math.round((completedPeriod.length / period.length) * 10000) / 100 : 0;
  const prevConversion =
    prev.length > 0 ? Math.round((completedPrev.length / prev.length) * 10000) / 100 : 0;

  const avgOrderValue =
    completedPeriod.length > 0 ? totalSales / completedPeriod.length : 0;
  const prevAvg =
    completedPrev.length > 0 ? prevSales / completedPrev.length : 0;

  const uniqueBuyers = new Set(period.map((o) => o.buyerId.toString())).size;
  const prevUniqueBuyers = new Set(prev.map((o) => o.buyerId.toString())).size;

  const salesTrend = bucketTrend(
    completedPeriod.map((o) => ({ total: o.total, createdAt: o.createdAt })),
    periodStart,
    now,
    days
  );

  const categoryIds = [
    ...new Set(
      products
        .map((p) => (p as { categoryId?: Types.ObjectId }).categoryId?.toString())
        .filter(Boolean) as string[]
    ),
  ];
  const categories = categoryIds.length
    ? await Category.find({ _id: { $in: categoryIds } }).select("name").lean()
    : [];
  const categoryNameById = new Map(
    categories.map((c) => [(c as { _id: Types.ObjectId })._id.toString(), (c as { name: string }).name])
  );
  const productCategory = new Map(
    products.map((p) => {
      const doc = p as { _id: Types.ObjectId; categoryId?: Types.ObjectId };
      const cid = doc.categoryId?.toString();
      return [doc._id.toString(), cid ? categoryNameById.get(cid) ?? "Uncategorized" : "Uncategorized"];
    })
  );

  const categoryCounts = new Map<string, number>();
  for (const order of completedPeriod) {
    for (const item of order.items ?? []) {
      const pid = item.productId?.toString();
      const cat = pid ? productCategory.get(pid) ?? "Other" : "Other";
      categoryCounts.set(cat, (categoryCounts.get(cat) ?? 0) + item.quantity);
    }
  }
  const categoryTotal = [...categoryCounts.values()].reduce((a, b) => a + b, 0) || 1;
  const trafficSources: TrafficSourceRow[] = [...categoryCounts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
    .map(([name, count], i) => ({
      id: `cat-${i}`,
      name,
      count,
      percent: Math.round((count / categoryTotal) * 1000) / 10,
      color: TRAFFIC_COLORS[i % TRAFFIC_COLORS.length],
    }));

  if (!trafficSources.length) {
    trafficSources.push({
      id: "direct",
      name: "Direct sales",
      count: completedPeriod.length,
      percent: 100,
      color: TRAFFIC_COLORS[0],
    });
  }

  const regionStats = new Map<string, { orders: number; revenue: number }>();
  const prevRegionStats = new Map<string, number>();

  for (const o of completedPeriod) {
    const region = resolveRegion(o.shippingAddress?.city, o.shippingAddress?.state);
    const cur = regionStats.get(region) ?? { orders: 0, revenue: 0 };
    cur.orders += 1;
    cur.revenue += o.total;
    regionStats.set(region, cur);
  }
  for (const o of completedPrev) {
    const region = resolveRegion(o.shippingAddress?.city, o.shippingAddress?.state);
    prevRegionStats.set(region, (prevRegionStats.get(region) ?? 0) + 1);
  }

  const topRegions: RegionRow[] = [...regionStats.entries()]
    .map(([region, stats]) => {
      const prevOrders = prevRegionStats.get(region) ?? 0;
      return {
        region,
        orders: stats.orders,
        revenue: Math.round(stats.revenue * 100) / 100,
        growth: pctChange(stats.orders, prevOrders),
      };
    })
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 6);

  const maxOrders = Math.max(...topRegions.map((r) => r.orders), 1);
  const regionHotspots: RegionHotspot[] = topRegions.map((r) => {
    const pos = HOTSPOT_POSITIONS[r.region] ?? HOTSPOT_POSITIONS.Other;
    return {
      region: r.region,
      x: pos.x,
      y: pos.y,
      intensity: r.orders / maxOrders,
    };
  });

  const shopTail = sellerId.replace(/[^a-f0-9]/gi, "").slice(-4).toUpperCase() || "0000";

  return {
    shopId: shopTail,
    salesTrend,
    trafficSources,
    topRegions,
    regionHotspots,
    kpis: {
      totalSales: { value: totalSales, changePercent: pctChange(totalSales, prevSales) },
      conversionRate: {
        value: conversionRate,
        changePercent: Math.round((conversionRate - prevConversion) * 10) / 10,
      },
      avgOrderValue: { value: avgOrderValue, changePercent: pctChange(avgOrderValue, prevAvg) },
      activeVisitors: {
        value: uniqueBuyers,
        changePercent: pctChange(uniqueBuyers, prevUniqueBuyers),
      },
    },
  };
}
