"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useTranslations } from "next-intl";
import {
  Calendar,
  ClipboardList,
  Download,
  FileText,
  Package,
  Truck,
  Wallet,
} from "lucide-react";
import { useCurrency } from "@/contexts/CurrencyContext";
import { listOrders, type Order } from "@/lib/api";

type TabId = "all" | "pending" | "processing" | "shipped" | "completed";

const PAGE_SIZE = 10;

const TABS: { id: TabId; labelKey: string }[] = [
  { id: "all", labelKey: "tabAll" },
  { id: "pending", labelKey: "tabPending" },
  { id: "processing", labelKey: "tabProcessing" },
  { id: "shipped", labelKey: "tabShipped" },
  { id: "completed", labelKey: "tabCompleted" },
];

function orderMatchesTab(status: string, tab: TabId): boolean {
  if (tab === "all") return true;
  if (tab === "pending") return status === "pending";
  if (tab === "processing") return status === "paid";
  if (tab === "shipped") return status === "in_progress";
  if (tab === "completed") return status === "completed";
  return true;
}

function displayStatus(status: string): {
  labelKey: string;
  dotClass: string;
} {
  switch (status) {
    case "paid":
      return { labelKey: "statusProcessing", dotClass: "bg-amber-500" };
    case "in_progress":
      return { labelKey: "statusShipped", dotClass: "bg-blue-500" };
    case "completed":
      return { labelKey: "statusCompleted", dotClass: "bg-emerald-500" };
    case "cancelled":
      return { labelKey: "statusCancelled", dotClass: "bg-neutral-400" };
    default:
      return { labelKey: "statusPending", dotClass: "bg-red-500" };
  }
}

function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "??";
}

function formatOrderDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString("en-AU", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch {
    return iso;
  }
}

function orderDisplayId(order: Order): string {
  return order.orderNumber ?? `#ORD-${order.id.slice(-4).toUpperCase()}`;
}

function exportOrdersCsv(rows: Order[]) {
  const headers = ["Order ID", "Customer", "Location", "Date", "Status", "Amount"];
  const lines = [
    headers.join(","),
    ...rows.map((o) => {
      const name = o.customerName ?? "Customer";
      const loc = (o.customerLocation ?? "").replace(/,/g, " ");
      const vals = [
        orderDisplayId(o),
        `"${name.replace(/"/g, '""')}"`,
        `"${loc.replace(/"/g, '""')}"`,
        formatOrderDate(o.createdAt),
        o.status,
        String(o.total),
      ];
      return vals.join(",");
    }),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `orders-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SellerOrdersView() {
  const t = useTranslations("sellerOrders");
  const { formatPrice } = useCurrency();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabId>("all");
  const [days, setDays] = useState(30);
  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listOrders({ asSeller: true });
    setOrders(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const periodStart = useMemo(() => {
    const d = new Date();
    d.setDate(d.getDate() - days);
    d.setHours(0, 0, 0, 0);
    return d;
  }, [days]);

  const inPeriod = useMemo(
    () => orders.filter((o) => new Date(o.createdAt) >= periodStart),
    [orders, periodStart],
  );

  const kpis = useMemo(() => {
    const total = inPeriod.length;
    const pending = inPeriod.filter((o) => o.status === "pending" || o.status === "paid").length;
    const inTransit = inPeriod.filter((o) => o.status === "in_progress").length;
    const revenue = inPeriod
      .filter((o) => o.status === "completed")
      .reduce((s, o) => s + Number(o.total), 0);
    const prevStart = new Date(periodStart);
    prevStart.setDate(prevStart.getDate() - days);
    const prevTotal = orders.filter((o) => {
      const d = new Date(o.createdAt);
      return d >= prevStart && d < periodStart;
    }).length;
    const orderChange =
      prevTotal > 0 ? Math.round(((total - prevTotal) / prevTotal) * 1000) / 10 : total > 0 ? 100 : 0;
    const prevRevenue = orders
      .filter((o) => {
        const d = new Date(o.createdAt);
        return d >= prevStart && d < periodStart && o.status === "completed";
      })
      .reduce((s, o) => s + Number(o.total), 0);
    const revenueChange =
      prevRevenue > 0
        ? Math.round(((revenue - prevRevenue) / prevRevenue) * 1000) / 10
        : revenue > 0
          ? 100
          : 0;
    return { total, pending, inTransit, revenue, orderChange, revenueChange };
  }, [inPeriod, orders, periodStart, days]);

  const tabCounts = useMemo(() => {
    const c: Record<TabId, number> = {
      all: inPeriod.length,
      pending: 0,
      processing: 0,
      shipped: 0,
      completed: 0,
    };
    for (const o of inPeriod) {
      if (o.status === "pending") c.pending += 1;
      if (o.status === "paid") c.processing += 1;
      if (o.status === "in_progress") c.shipped += 1;
      if (o.status === "completed") c.completed += 1;
    }
    return c;
  }, [inPeriod]);

  const filtered = useMemo(
    () =>
      inPeriod
        .filter((o) => orderMatchesTab(o.status, tab))
        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()),
    [inPeriod, tab],
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paginated = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  useEffect(() => {
    if (page > totalPages) setPage(totalPages);
  }, [page, totalPages]);

  useEffect(() => {
    setPage(1);
  }, [tab, days]);

  const regions = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of inPeriod.filter((x) => x.status === "completed")) {
      const city =
        o.shippingAddress?.city?.trim() ||
        o.customerLocation?.split(",")[0]?.trim() ||
        "Other";
      const key = city.toUpperCase();
      map.set(key, (map.get(key) ?? 0) + Number(o.total));
    }
    return [...map.entries()]
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([region, revenue]) => ({ region, revenue }));
  }, [inPeriod]);

  const maxRegion = Math.max(...regions.map((r) => r.revenue), 1);

  return (
    <div className="space-y-6 w-full pb-8">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-[var(--foreground)]">{t("title")}</h1>
          <p className="mt-1 text-sm text-[var(--brand-muted)]">{t("subtitle")}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => exportOrdersCsv(filtered)}
            className="inline-flex items-center gap-2 rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] hover:bg-[var(--input-bg)] transition-colors"
          >
            <Download className="h-4 w-4" />
            {t("exportCsv")}
          </button>
          <div className="relative">
            <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-neutral-400 pointer-events-none" />
            <select
              value={days}
              onChange={(e) => setDays(Number(e.target.value))}
              className="appearance-none rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] pl-10 pr-8 py-2.5 text-sm font-semibold text-[var(--foreground)] focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/15"
            >
              <option value={7}>{t("last7Days")}</option>
              <option value={30}>{t("last30Days")}</option>
              <option value={90}>{t("last90Days")}</option>
            </select>
          </div>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          {
            label: t("kpiTotal"),
            value: kpis.total.toLocaleString(),
            change: kpis.orderChange,
            icon: FileText,
            iconBg: "bg-blue-100 text-blue-600",
          },
          {
            label: t("kpiPending"),
            value: String(kpis.pending),
            icon: ClipboardList,
            iconBg: "bg-amber-100 text-amber-600",
          },
          {
            label: t("kpiInTransit"),
            value: String(kpis.inTransit),
            icon: Truck,
            iconBg: "bg-violet-100 text-violet-600",
          },
          {
            label: t("kpiRevenue"),
            value: formatPrice(kpis.revenue),
            change: kpis.revenueChange,
            icon: Wallet,
            iconBg: "bg-emerald-100 text-emerald-600",
          },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <div key={card.label} className="clay-card p-5 flex items-start justify-between gap-3">
              <div>
                <p className="text-xs font-medium text-[var(--brand-muted)]">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-[var(--foreground)] tabular-nums">{card.value}</p>
                {card.change !== undefined && (
                  <p
                    className={`mt-1 text-xs font-semibold ${
                      card.change >= 0 ? "text-emerald-600" : "text-red-600"
                    }`}
                  >
                    {card.change >= 0 ? "+" : ""}
                    {card.change}% {t("vsPrevious")}
                  </p>
                )}
              </div>
              <div className={`rounded-xl p-2.5 ${card.iconBg}`}>
                <Icon className="h-5 w-5" />
              </div>
            </div>
          );
        })}
      </div>

      <div className="clay-card overflow-hidden">
        <div className="border-b border-[var(--brand-border)] px-4 pt-2">
          <div className="flex flex-wrap gap-1">
            {TABS.map((item) => {
              const active = tab === item.id;
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setTab(item.id)}
                  className={`relative px-4 py-3 text-sm font-semibold transition-colors ${
                    active ? "text-[var(--brand-red)]" : "text-[var(--brand-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {t(item.labelKey)}
                  {tabCounts[item.id] > 0 && (
                    <span className="ml-1.5 text-xs font-normal opacity-70">({tabCounts[item.id]})</span>
                  )}
                  {active && (
                    <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--brand-red)] rounded-full" />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-[var(--brand-border)] bg-[var(--input-bg)]/40 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  {t("colOrderId")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  {t("colCustomer")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  {t("colDate")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  {t("colStatus")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  {t("colAmount")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wide text-[var(--brand-muted)]">
                  {t("colActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-neutral-500">
                    {t("loading")}
                  </td>
                </tr>
              ) : paginated.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-neutral-500">
                    {t("noOrders")}
                  </td>
                </tr>
              ) : (
                paginated.map((order) => {
                  const customer = order.customerName ?? t("guestCustomer");
                  const statusUi = displayStatus(order.status);
                  return (
                    <tr
                      key={order.id}
                      className="border-b border-[var(--brand-border)] hover:bg-[var(--row-hover)]"
                    >
                      <td className="px-5 py-4 font-semibold text-[var(--foreground)] whitespace-nowrap">
                        {orderDisplayId(order)}
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-3 min-w-[180px]">
                          <div className="h-9 w-9 shrink-0 rounded-full bg-[var(--brand-blue)]/15 text-[var(--brand-blue)] flex items-center justify-center text-xs font-bold">
                            {customerInitials(customer)}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-[var(--foreground)] truncate">{customer}</p>
                            <p className="text-xs text-neutral-500 truncate">
                              {order.customerLocation ?? order.shippingAddress?.city ?? "—"}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-neutral-600 whitespace-nowrap">
                        {formatOrderDate(order.createdAt)}
                      </td>
                      <td className="px-5 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-2 text-sm font-medium text-[var(--foreground)]">
                          <span className={`h-2 w-2 rounded-full ${statusUi.dotClass}`} />
                          {t(statusUi.labelKey)}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-bold text-[var(--foreground)] whitespace-nowrap tabular-nums">
                        {formatPrice(Number(order.total))}
                      </td>
                      <td className="px-5 py-4">
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="inline-flex items-center rounded-lg bg-blue-50 px-3 py-1.5 text-sm font-semibold text-[var(--brand-blue)] hover:bg-blue-100 transition-colors"
                        >
                          {t("viewDetails")}
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 px-5 py-4 border-t border-[var(--brand-border)]">
          <p className="text-xs text-neutral-500">
            {t("showing", {
              from: filtered.length ? (page - 1) * PAGE_SIZE + 1 : 0,
              to: Math.min(page * PAGE_SIZE, filtered.length),
              total: filtered.length,
            })}
          </p>
          <div className="flex items-center gap-1">
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => i + 1).map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setPage(p)}
                className={`min-w-[2rem] h-8 rounded-md text-sm font-medium ${
                  p === page
                    ? "bg-[var(--brand-red)] text-white"
                    : "text-neutral-600 hover:bg-[var(--input-bg)]"
                }`}
              >
                {p}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="lg:col-span-2 clay-card p-5">
          <h2 className="text-base font-semibold text-[var(--foreground)] mb-4">{t("regionalBreakdown")}</h2>
          {regions.length === 0 ? (
            <p className="text-sm text-neutral-500">{t("noRegionalData")}</p>
          ) : (
            <ul className="space-y-4">
              {regions.map(({ region, revenue }) => (
                <li key={region}>
                  <div className="flex items-center justify-between text-sm mb-1.5">
                    <span className="font-semibold tracking-wide text-[var(--foreground)]">{region}</span>
                    <span className="text-neutral-600 tabular-nums">{formatPrice(revenue)}</span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--input-bg)] overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[var(--brand-red)]/80"
                      style={{ width: `${(revenue / maxRegion) * 100}%` }}
                    />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="rounded-xl bg-[var(--brand-red)] p-6 text-white flex flex-col">
          <Package className="h-8 w-8 mb-3 opacity-90" />
          <h2 className="text-lg font-bold">{t("proInsightsTitle")}</h2>
          <p className="mt-2 text-sm text-white/90 flex-1">{t("proInsightsDesc")}</p>
          <Link
            href="/dashboard/analytics"
            className="mt-5 inline-flex justify-center rounded-lg bg-white px-4 py-2.5 text-sm font-semibold text-[var(--brand-red)] hover:bg-red-50 transition-colors"
          >
            {t("viewPerformance")}
          </Link>
        </div>
      </div>

      <footer className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pt-2 text-xs text-neutral-500">
        <span>{t("footerCopy")}</span>
        <div className="flex flex-wrap gap-4">
          <span>{t("privacy")}</span>
          <span>{t("terms")}</span>
          <span>{t("help")}</span>
        </div>
      </footer>
    </div>
  );
}
