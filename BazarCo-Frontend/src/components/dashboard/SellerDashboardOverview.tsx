"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  AlertTriangle,
  BarChart3,
  ChevronRight,
  Download,
  MoreVertical,
  Package,
  ShoppingBag,
  TrendingDown,
  TrendingUp,
} from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useAuth } from "@/contexts/AuthContext";
import { sellerDashboard, type SellerDashboard } from "@/lib/api";
import { SellerOnboardingBanner } from "@/components/dashboard/SellerOnboardingBanner";

const STATUS_PILL: Record<string, { label: string; className: string }> = {
  completed: { label: "DELIVERED", className: "bg-emerald-100 text-emerald-800 border-emerald-200" },
  in_progress: { label: "SHIPPED", className: "bg-blue-100 text-blue-800 border-blue-200" },
  paid: { label: "PROCESSING", className: "bg-amber-100 text-amber-800 border-amber-200" },
  pending: { label: "PROCESSING", className: "bg-amber-100 text-amber-800 border-amber-200" },
  cancelled: { label: "CANCELLED", className: "bg-red-100 text-red-800 border-red-200" },
};

const ALERT_ACCENT: Record<string, string> = {
  urgent: "bg-[var(--brand-red)]",
  warning: "bg-amber-500",
  info: "bg-[var(--brand-blue)]",
};

export function SellerDashboardOverview() {
  const { user } = useAuth();
  const t = useTranslations("sellerDashboard");
  const { formatPrice } = useCurrency();
  const [days, setDays] = useState(30);
  const [data, setData] = useState<SellerDashboard | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    sellerDashboard(days)
      .then(setData)
      .finally(() => setLoading(false));
  }, [days]);

  const chartData = useMemo(
    () => (data?.salesByDay ?? []).map((d) => ({ ...d, display: d.label })),
    [data?.salesByDay],
  );

  const maxChart = useMemo(
    () => Math.max(...chartData.map((d) => d.amount), 1),
    [chartData],
  );

  const urgentCount = data?.alerts.filter((a) => a.severity === "urgent").length ?? 0;
  const firstName = user?.name?.split(" ")[0] ?? "there";

  if (loading && !data) {
    return (
      <div className="space-y-6">
        <div className="h-10 w-64 rounded-lg bg-[var(--input-bg)] animate-pulse" />
        <div className="grid gap-4 sm:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="clay-card h-32 animate-pulse bg-[var(--input-bg)]" />
          ))}
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          <div className="clay-card lg:col-span-2 h-72 animate-pulse bg-[var(--input-bg)]" />
          <div className="clay-card h-72 animate-pulse bg-[var(--input-bg)]" />
        </div>
      </div>
    );
  }

  const m = data?.metrics;

  return (
    <div className="space-y-6">
      <SellerOnboardingBanner />

      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-[var(--foreground)] sm:text-2xl">
            {t("title")}
          </h2>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">
            {t("subtitle", {
              name: firstName,
              change: m?.revenueChangePercent ?? 0,
            })}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={days}
            onChange={(e) => setDays(Number(e.target.value))}
            className="rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] px-3 py-2 text-sm text-[var(--foreground)] focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/15"
          >
            <option value={7}>{t("last7Days")}</option>
            <option value={30}>{t("last30Days")}</option>
            <option value={90}>{t("last90Days")}</option>
          </select>
          <Link
            href="/dashboard/report"
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-blue)] px-4 py-2 text-sm font-semibold text-white shadow-sm hover:opacity-95 transition-opacity"
          >
            <Download className="h-4 w-4" />
            {t("exportReports")}
          </Link>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-3">
        <div className="clay-card p-5">
          <div className="flex items-start justify-between gap-2">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                {t("totalRevenue")}
              </p>
              <p className="mt-2 text-2xl font-bold text-[var(--foreground)] tabular-nums">
                {formatPrice(m?.totalRevenue ?? 0)}
              </p>
              <p
                className={`mt-1 flex items-center gap-1 text-xs font-semibold ${
                  (m?.revenueChangePercent ?? 0) >= 0 ? "text-emerald-600" : "text-red-600"
                }`}
              >
                {(m?.revenueChangePercent ?? 0) >= 0 ? (
                  <TrendingUp className="h-3.5 w-3.5" />
                ) : (
                  <TrendingDown className="h-3.5 w-3.5" />
                )}
                {(m?.revenueChangePercent ?? 0) >= 0 ? "+" : ""}
                {m?.revenueChangePercent ?? 0}%
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-100 text-emerald-700">
              <BarChart3 className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="flex justify-between text-xs text-[var(--brand-muted)] mb-1.5">
              <span>{t("targetProgress")}</span>
              <span className="font-semibold text-[var(--brand-blue)]">
                {m?.revenueTargetPercent ?? 0}% {t("ofTarget")}
              </span>
            </div>
            <div className="h-2 rounded-full bg-[var(--input-bg)] overflow-hidden">
              <div
                className="h-full rounded-full bg-[var(--brand-blue)] transition-all duration-500"
                style={{ width: `${Math.min(m?.revenueTargetPercent ?? 0, 100)}%` }}
              />
            </div>
          </div>
        </div>

        <Link href="/dashboard/orders" className="clay-card p-5 block hover:shadow-md transition-shadow no-underline">
          <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
            {t("activeOrders")}
          </p>
          <p className="mt-2 text-3xl font-bold text-[var(--foreground)] tabular-nums">
            {m?.activeOrders ?? 0}
          </p>
          <p className="mt-2 text-sm font-medium text-amber-700">
            {t("pendingDispatch", { count: m?.pendingDispatch ?? 0 })}
          </p>
          <div className="mt-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-blue-700">
            <ShoppingBag className="h-5 w-5" />
          </div>
        </Link>

        <Link href="/dashboard/products" className="clay-card p-5 block hover:shadow-md transition-shadow no-underline">
          <div className="flex items-start justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                {t("outOfStock")}
              </p>
              <p className="mt-2 text-3xl font-bold text-[var(--foreground)] tabular-nums">
                {String(m?.outOfStock ?? 0).padStart(2, "0")}
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--brand-red)] flex items-center gap-1">
                <AlertTriangle className="h-3.5 w-3.5" />
                {t("requiresAttention")}
              </p>
            </div>
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-100 text-[var(--brand-red)]">
              <Package className="h-5 w-5" />
            </div>
          </div>
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="clay-card lg:col-span-2 p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--foreground)]">{t("salesPerformance")}</h3>
            <span className="text-xs font-medium text-[var(--brand-muted)]">{t("thisWeek")}</span>
          </div>
          <div className="h-56 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--brand-border)" />
                <XAxis
                  dataKey="display"
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
                  formatter={(value: number | undefined) => [
                    formatPrice(typeof value === "number" ? value : 0),
                    t("revenue"),
                  ]}
                  contentStyle={{
                    borderRadius: 10,
                    border: "1px solid var(--brand-border)",
                    background: "var(--card-bg)",
                  }}
                />
                <Bar dataKey="amount" fill="var(--brand-blue)" radius={[6, 6, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 flex justify-between px-1">
            {chartData.map((d) => (
              <span
                key={d.day}
                className={`text-[10px] font-bold ${
                  d.amount === maxChart && d.amount > 0
                    ? "text-[var(--brand-blue)]"
                    : "text-[var(--brand-muted)]"
                }`}
              >
                {d.label}
              </span>
            ))}
          </div>
        </div>

        <div className="clay-card p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold text-[var(--foreground)]">{t("criticalAlerts")}</h3>
            {urgentCount > 0 && (
              <span className="rounded-full bg-[var(--brand-red)] px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-white">
                {urgentCount} {t("urgent")}
              </span>
            )}
          </div>
          <ul className="flex-1 space-y-3">
            {(data?.alerts ?? []).length === 0 ? (
              <li className="text-sm text-[var(--brand-muted)] py-4 text-center">{t("noAlerts")}</li>
            ) : (
              data?.alerts.map((alert) => (
                <li
                  key={alert.id}
                  className="flex gap-3 rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] p-3"
                >
                  <span className={`mt-0.5 h-8 w-1 shrink-0 rounded-full ${ALERT_ACCENT[alert.severity]}`} />
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-[var(--foreground)]">{alert.title}</p>
                    <p className="text-xs text-[var(--brand-muted)] mt-0.5 truncate">{alert.description}</p>
                  </div>
                </li>
              ))
            )}
          </ul>
          <Link
            href="/dashboard/products"
            className="mt-4 text-center text-sm font-semibold text-[var(--brand-blue)] hover:underline"
          >
            {t("viewAllAlerts")}
          </Link>
        </div>
      </div>

      <div className="clay-card overflow-hidden">
        <div className="flex items-center justify-between border-b border-[var(--brand-border)] px-5 py-4">
          <h3 className="font-semibold text-[var(--foreground)]">{t("recentOrders")}</h3>
          <Link
            href="/dashboard/orders"
            className="text-sm font-semibold text-[var(--brand-blue)] hover:underline flex items-center gap-1"
          >
            {t("viewAll")} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="border-b border-[var(--brand-border)] bg-[var(--input-bg)]/50 text-left text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                <th className="px-5 py-3">{t("colOrderId")}</th>
                <th className="px-5 py-3">{t("colCustomer")}</th>
                <th className="px-5 py-3">{t("colProduct")}</th>
                <th className="px-5 py-3">{t("colAmount")}</th>
                <th className="px-5 py-3">{t("colStatus")}</th>
                <th className="px-5 py-3 w-12" />
              </tr>
            </thead>
            <tbody>
              {(data?.recentOrders ?? []).length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-10 text-center text-[var(--brand-muted)]">
                    {t("noOrders")}
                  </td>
                </tr>
              ) : (
                data?.recentOrders.map((order) => {
                  const pill = STATUS_PILL[order.status] ?? STATUS_PILL.pending;
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-[var(--brand-border)] last:border-0 hover:bg-[var(--row-hover)] transition-colors"
                    >
                      <td className="px-5 py-3.5 font-mono text-xs font-semibold text-[var(--foreground)]">
                        {order.orderNumber}
                      </td>
                      <td className="px-5 py-3.5 text-[var(--foreground)]">{order.customerName}</td>
                      <td className="px-5 py-3.5 text-[var(--brand-muted)] max-w-[200px] truncate">
                        {order.productName}
                      </td>
                      <td className="px-5 py-3.5 font-semibold text-[var(--foreground)] tabular-nums">
                        {formatPrice(order.amount)}
                      </td>
                      <td className="px-5 py-3.5">
                        <span
                          className={`inline-flex rounded-full border px-2.5 py-0.5 text-[10px] font-bold tracking-wide ${pill.className}`}
                        >
                          {pill.label}
                        </span>
                      </td>
                      <td className="px-5 py-3.5">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="inline-flex h-8 w-8 items-center justify-center rounded-lg text-[var(--brand-muted)] hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]"
                          aria-label={t("viewOrder")}
                        >
                          <MoreVertical className="h-4 w-4" />
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
