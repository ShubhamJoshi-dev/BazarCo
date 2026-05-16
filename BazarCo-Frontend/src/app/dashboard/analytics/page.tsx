"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Calendar,
  Download,
  MoreHorizontal,
  Percent,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
  Users,
  Wallet,
} from "lucide-react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useAuth } from "@/contexts/AuthContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import { sellerAnalytics, type SellerAnalytics } from "@/lib/api";

type RangeKey = "30" | "90" | "365";

const RANGE_DAYS: Record<RangeKey, number> = { "30": 30, "90": 90, "365": 365 };

function ChangeBadge({ value }: { value: number }) {
  const positive = value >= 0;
  return (
    <span
      className={`inline-flex items-center gap-0.5 rounded-md px-1.5 py-0.5 text-[11px] font-bold ${
        positive ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700"
      }`}
    >
      {positive ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
      {positive ? "+" : ""}
      {value}%
    </span>
  );
}

function DonutRing({ percent, color }: { percent: number; color: string }) {
  const p = Math.min(100, Math.max(0, percent));
  return (
    <div className="relative h-11 w-11 shrink-0">
      <svg viewBox="0 0 36 36" className="h-11 w-11 -rotate-90">
        <circle cx="18" cy="18" r="15" fill="none" stroke="var(--input-bg)" strokeWidth="4" />
        <circle
          cx="18"
          cy="18"
          r="15"
          fill="none"
          stroke={color}
          strokeWidth="4"
          strokeDasharray={`${(p / 100) * 94.25} 94.25`}
          strokeLinecap="round"
        />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-[9px] font-bold text-[var(--foreground)]">
        {Math.round(p)}%
      </span>
    </div>
  );
}

function NepalRegionMap({
  hotspots,
  topRegion,
}: {
  hotspots: SellerAnalytics["regionHotspots"];
  topRegion?: string;
}) {
  return (
    <div className="relative aspect-[4/3] w-full rounded-xl bg-gradient-to-b from-slate-100 to-slate-200/80 dark:from-slate-800 dark:to-slate-900 overflow-hidden">
      <svg viewBox="0 0 100 80" className="absolute inset-0 h-full w-full opacity-40" aria-hidden>
        <path
          d="M28 12 L42 8 L58 10 L72 18 L78 32 L74 48 L68 62 L52 70 L36 68 L22 58 L18 42 L20 26 Z"
          fill="currentColor"
          className="text-slate-400"
        />
      </svg>
      {hotspots.map((h) => (
        <span
          key={h.region}
          title={h.region}
          className="absolute rounded-full bg-[var(--brand-red)] border-2 border-white shadow-md -translate-x-1/2 -translate-y-1/2"
          style={{
            left: `${h.x}%`,
            top: `${h.y}%`,
            width: `${12 + h.intensity * 20}px`,
            height: `${12 + h.intensity * 20}px`,
            opacity: 0.55 + h.intensity * 0.45,
          }}
        />
      ))}
      {topRegion && (
        <span className="absolute right-3 top-3 rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] px-2.5 py-1 text-[10px] font-semibold text-[var(--brand-red)] shadow-sm">
          Top: {topRegion}
        </span>
      )}
    </div>
  );
}

export default function AnalyticsPage() {
  const { user } = useAuth();
  const t = useTranslations("sellerAnalytics");
  const { formatPrice } = useCurrency();
  const isSeller = user?.role === "seller";
  const [range, setRange] = useState<RangeKey>("30");
  const [data, setData] = useState<SellerAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  const days = RANGE_DAYS[range];

  useEffect(() => {
    if (!isSeller) return;
    setLoading(true);
    sellerAnalytics(days)
      .then(setData)
      .finally(() => setLoading(false));
  }, [isSeller, days]);

  const topRegionName = data?.topRegions[0]?.region;

  const kpiCards = useMemo(
    () =>
      data
        ? [
            {
              label: t("totalSales"),
              value: formatPrice(data.kpis.totalSales.value),
              change: data.kpis.totalSales.changePercent,
              icon: Wallet,
              iconClass: "bg-red-100 text-[var(--brand-red)]",
            },
            {
              label: t("conversionRate"),
              value: `${data.kpis.conversionRate.value.toFixed(2)}%`,
              change: data.kpis.conversionRate.changePercent,
              icon: Percent,
              iconClass: "bg-blue-100 text-[var(--brand-blue)]",
            },
            {
              label: t("avgOrderValue"),
              value: formatPrice(data.kpis.avgOrderValue.value),
              change: data.kpis.avgOrderValue.changePercent,
              icon: ShoppingBag,
              iconClass: "bg-emerald-100 text-emerald-700",
            },
            {
              label: t("activeVisitors"),
              value: data.kpis.activeVisitors.value.toLocaleString(),
              change: data.kpis.activeVisitors.changePercent,
              icon: Users,
              iconClass: "bg-amber-100 text-amber-800",
            },
          ]
        : [],
    [data, formatPrice, t],
  );

  if (!isSeller) {
    return (
      <div className="clay-card p-16 text-center">
        <p className="font-semibold text-[var(--foreground)]">{t("sellerOnlyTitle")}</p>
        <p className="mt-1 text-sm text-[var(--brand-muted)]">{t("sellerOnlyDesc")}</p>
      </div>
    );
  }

  if (loading && !data) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-16 rounded-xl bg-[var(--input-bg)]" />
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="clay-card h-28 bg-[var(--input-bg)]" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="clay-card lg:col-span-2 h-80 bg-[var(--input-bg)]" />
          <div className="clay-card h-80 bg-[var(--input-bg)]" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{t("title")}</h1>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">
            {t("subtitle", { shopId: data?.shopId ?? "—" })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {(["30", "90", "365"] as const).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setRange(key)}
              className={`rounded-lg px-4 py-2 text-sm font-semibold transition-colors ${
                range === key
                  ? "bg-[var(--brand-red)] text-white shadow-sm"
                  : "border border-[var(--brand-border)] bg-[var(--card-bg)] text-[var(--brand-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {key === "30" ? t("last30Days") : key === "90" ? t("last90Days") : t("yearly")}
            </button>
          ))}
          <button
            type="button"
            className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] text-[var(--brand-muted)] hover:text-[var(--foreground)]"
            aria-label={t("pickDate")}
          >
            <Calendar className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* KPI row */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {kpiCards.map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="clay-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.iconClass}`}>
                  <Icon className="h-5 w-5" strokeWidth={2} />
                </div>
                <ChangeBadge value={card.change} />
              </div>
              <p className="mt-4 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">
                {card.label}
              </p>
              <p className="mt-1 text-xl font-bold text-[var(--foreground)] tabular-nums">{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Sales trend + traffic */}
      <div className="grid gap-4 lg:grid-cols-3">
        <div className="clay-card lg:col-span-2 p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--foreground)]">{t("salesTrends")}</h2>
            <div className="flex items-center gap-1">
              <Link
                href="/dashboard/report"
                className="rounded-lg p-2 text-[var(--brand-muted)] hover:bg-[var(--row-hover)] hover:text-[var(--foreground)]"
                aria-label={t("export")}
              >
                <Download className="h-4 w-4" />
              </Link>
              <button
                type="button"
                className="rounded-lg p-2 text-[var(--brand-muted)] hover:bg-[var(--row-hover)]"
                aria-label="More"
              >
                <MoreHorizontal className="h-4 w-4" />
              </button>
            </div>
          </div>
          <div className="h-72 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data?.salesTrend ?? []} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesRedGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="var(--brand-red)" stopOpacity={0.25} />
                    <stop offset="100%" stopColor="var(--brand-red)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--brand-border)" />
                <XAxis
                  dataKey="label"
                  tick={{ fontSize: 11, fill: "var(--brand-muted)" }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: "var(--brand-muted)" }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(v) => (v >= 1000 ? `${(v / 1000).toFixed(0)}k` : String(v))}
                />
                <Tooltip
                  formatter={(v: number | undefined) => [
                    formatPrice(typeof v === "number" ? v : 0),
                    t("sales"),
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--brand-border)",
                    background: "var(--card-bg)",
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sales"
                  stroke="var(--brand-red)"
                  strokeWidth={2.5}
                  fill="url(#salesRedGrad)"
                  dot={false}
                  activeDot={{ r: 5, fill: "var(--brand-red)", stroke: "#fff", strokeWidth: 2 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="clay-card p-5">
          <h2 className="mb-5 font-semibold text-[var(--foreground)]">{t("trafficSources")}</h2>
          <ul className="space-y-4">
            {(data?.trafficSources ?? []).map((src) => (
              <li key={src.id} className="flex items-center gap-3">
                <DonutRing percent={src.percent} color={src.color} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-[var(--foreground)]">{src.name}</p>
                  <p className="text-xs text-[var(--brand-muted)]">{src.count.toLocaleString()} units sold</p>
                </div>
                <span className="text-sm font-bold text-[var(--foreground)] tabular-nums">{src.percent}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>

      {/* Regional map + table */}
      <div className="grid gap-4 lg:grid-cols-2">
        <div className="clay-card p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="font-semibold text-[var(--foreground)]">{t("regionalHeatMap")}</h2>
          </div>
          <NepalRegionMap hotspots={data?.regionHotspots ?? []} topRegion={topRegionName} />
        </div>

        <div className="clay-card overflow-hidden p-0">
          <div className="flex items-center justify-between border-b border-[var(--brand-border)] px-5 py-4">
            <h2 className="font-semibold text-[var(--foreground)]">{t("topRegions")}</h2>
            <Link href="/dashboard/report" className="text-sm font-semibold text-[var(--brand-blue)] hover:underline">
              {t("viewAllRegions")}
            </Link>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[400px] text-sm">
              <thead>
                <tr className="border-b border-[var(--brand-border)] bg-[var(--input-bg)]/60 text-left text-[10px] font-bold uppercase tracking-wide text-[var(--brand-muted)]">
                  <th className="px-5 py-3">{t("colRegion")}</th>
                  <th className="px-5 py-3">{t("colOrders")}</th>
                  <th className="px-5 py-3">{t("colGrowth")}</th>
                  <th className="px-5 py-3">{t("colRevenue")}</th>
                </tr>
              </thead>
              <tbody>
                {(data?.topRegions ?? []).length === 0 ? (
                  <tr>
                    <td colSpan={4} className="px-5 py-10 text-center text-[var(--brand-muted)]">
                      {t("noRegions")}
                    </td>
                  </tr>
                ) : (
                  data?.topRegions.map((row) => (
                    <tr
                      key={row.region}
                      className="border-b border-[var(--brand-border)] last:border-0 hover:bg-[var(--row-hover)]"
                    >
                      <td className="px-5 py-3.5 font-medium text-[var(--foreground)]">{row.region}</td>
                      <td className="px-5 py-3.5 tabular-nums text-[var(--foreground)]">{row.orders}</td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`font-semibold tabular-nums ${
                            row.growth >= 0 ? "text-emerald-600" : "text-red-600"
                          }`}
                        >
                          {row.growth >= 0 ? "+" : ""}
                          {row.growth}%
                        </span>
                      </td>
                      <td className="px-5 py-3.5 font-semibold tabular-nums text-[var(--foreground)]">
                        {formatPrice(row.revenue)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
          <div className="flex justify-end p-4">
            <Link
              href="/dashboard/report"
              className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-red)] text-white shadow-md hover:opacity-95 transition-opacity"
              aria-label={t("export")}
            >
              <Download className="h-5 w-5" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
