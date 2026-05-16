"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import Link from "next/link";
import {
  ArrowDownAZ,
  ArrowUpAZ,
  Calendar,
  CheckCircle2,
  ChevronRight,
  Clock,
  MapPin,
  Package,
  ShoppingBag,
  Truck,
  UserCircle,
  XCircle,
  Zap,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { listOrders, type Order } from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";

const STATUS_FILTERS = ["", "pending", "paid", "in_progress", "completed", "cancelled"] as const;

type StatusKey = (typeof STATUS_FILTERS)[number];

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function statusMeta(status: string, t: ReturnType<typeof useTranslations<"buyerOrders">>) {
  const map: Record<string, { label: string; className: string; icon: typeof CheckCircle2 }> = {
    pending: { label: t("statusPending"), className: "bg-neutral-100 text-neutral-700", icon: Clock },
    paid: { label: t("statusPaid"), className: "bg-sky-100 text-sky-800", icon: CheckCircle2 },
    in_progress: { label: t("statusInProgress"), className: "bg-amber-100 text-amber-800", icon: Truck },
    completed: { label: t("statusCompleted"), className: "bg-emerald-100 text-emerald-800", icon: CheckCircle2 },
    cancelled: { label: t("statusCancelled"), className: "bg-neutral-200 text-neutral-600", icon: XCircle },
  };
  return map[status] ?? map.pending;
}

function OrderCard({ order, t }: { order: Order; t: ReturnType<typeof useTranslations<"buyerOrders">> }) {
  const { formatPrice } = useCurrency();
  const meta = statusMeta(order.status, t);
  const Icon = meta.icon;
  const itemPreview = order.items
    .slice(0, 2)
    .map((i) => i.productName)
    .join(", ");
  const extra = order.items.length > 2 ? ` +${order.items.length - 2}` : "";

  return (
    <article className="rounded-xl border border-neutral-200 bg-[var(--card-bg)] shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <div className="p-5 space-y-4">
        <div className="flex flex-wrap items-center gap-2 justify-between">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-mono text-xs font-bold text-[var(--brand-muted)]">
              #{order.id.slice(-8)}
            </span>
            <span
              className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase ${meta.className}`}
            >
              <Icon className="h-3 w-3" />
              {meta.label}
            </span>
            {order.urgent && (
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-100 text-amber-800 px-2.5 py-1 text-[10px] font-bold uppercase">
                <Zap className="h-3 w-3" />
                {t("urgent")}
              </span>
            )}
          </div>
          <span className="flex items-center gap-1 text-xs text-[var(--brand-muted)]">
            <Calendar className="h-3.5 w-3.5" />
            {formatDate(order.createdAt)}
          </span>
        </div>

        <div className="flex items-center justify-between gap-4">
          <p className="text-2xl sm:text-3xl font-black text-[var(--foreground)] tabular-nums">
            {formatPrice(Number(order.total))}
          </p>
          <Link
            href={`/dashboard/orders/${order.id}`}
            className="inline-flex items-center gap-1 rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-bold text-white hover:bg-[#b71c1c] shrink-0"
          >
            {t("view")} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>

        <div className="flex flex-wrap gap-2">
          <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700">
            <Package className="h-3.5 w-3.5 text-[var(--brand-red)] shrink-0" />
            {t("itemsSummary", {
              count: order.items.length,
              names: itemPreview + extra,
            })}
          </span>
          {order.rider && (
            <span className="inline-flex items-center gap-1.5 rounded-full border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs font-medium text-neutral-700">
              <UserCircle className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
              {t("riderLabel", { name: order.rider.name })}
            </span>
          )}
        </div>

        {order.shippingAddress && (
          <div className="flex items-start gap-2 rounded-lg bg-sky-50 border border-sky-100 px-3 py-2.5 text-sm text-sky-900/80">
            <MapPin className="h-4 w-4 text-sky-600 shrink-0 mt-0.5" />
            <span>
              {order.shippingAddress.line1}, {order.shippingAddress.city},{" "}
              {order.shippingAddress.country}
            </span>
          </div>
        )}
      </div>
    </article>
  );
}

export function BuyerOrderHistoryView() {
  const t = useTranslations("buyerOrders");
  const tOrders = useTranslations("orders");
  const { formatPrice } = useCurrency();
  const [allOrders, setAllOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusKey>("");
  const [sortNewest, setSortNewest] = useState(true);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const list = await listOrders();
    setAllOrders(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const filtered = useMemo(() => {
    if (!filter) return allOrders;
    return allOrders.filter((o) => o.status === filter);
  }, [allOrders, filter]);

  const sorted = useMemo(() => {
    return [...filtered].sort((a, b) => {
      const da = new Date(a.createdAt).getTime();
      const db = new Date(b.createdAt).getTime();
      return sortNewest ? db - da : da - db;
    });
  }, [filtered, sortNewest]);

  const counts = useMemo(() => {
    const c: Record<string, number> = {};
    for (const o of allOrders) c[o.status] = (c[o.status] ?? 0) + 1;
    return c;
  }, [allOrders]);

  const totalSpent = useMemo(
    () => allOrders.reduce((s, o) => s + Number(o.total), 0),
    [allOrders],
  );

  const tabs = [
    { key: "" as const, label: t("tabAll") },
    { key: "pending" as const, label: tOrders("statusPending") },
    { key: "paid" as const, label: tOrders("statusPaid") },
    { key: "in_progress" as const, label: tOrders("statusInProgress") },
    { key: "completed" as const, label: tOrders("statusCompleted") },
    { key: "cancelled" as const, label: tOrders("statusCancelled") },
  ];

  return (
    <div className="w-full max-w-[960px] mx-auto space-y-6 pb-8">
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-sky-100 text-sky-700 border border-sky-200/60">
            <ShoppingBag className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t("title")}</h1>
            {allOrders.length > 0 && (
              <p className="text-sm text-[var(--brand-muted)] mt-1">
                {t("summary", {
                  count: allOrders.length,
                  total: formatPrice(totalSpent),
                })}
              </p>
            )}
          </div>
        </div>
        {allOrders.length > 0 && (
          <div className="flex items-end gap-3 shrink-0">
            <StatPill label={tOrders("statusPaid")} value={counts.paid ?? 0} color="sky" />
            <StatPill label={tOrders("statusCompleted")} value={counts.completed ?? 0} color="emerald" />
          </div>
        )}
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div className="flex flex-wrap gap-2">
          {tabs.map((tab) => {
            const active = filter === tab.key;
            const count = tab.key ? counts[tab.key] : allOrders.length;
            return (
              <button
                key={tab.key || "all"}
                type="button"
                onClick={() => setFilter(tab.key)}
                className={`rounded-full px-4 py-2 text-xs font-bold transition-colors border ${
                  active
                    ? "border-[var(--brand-red)] bg-[var(--brand-red)] text-white shadow-sm"
                    : "border-neutral-200 bg-neutral-100 text-neutral-700 hover:bg-neutral-200 hover:text-neutral-900"
                }`}
              >
                {tab.label}
                {count != null && count > 0 ? ` (${count})` : ""}
              </button>
            );
          })}
        </div>
        <div className="flex items-center gap-2 text-xs text-[var(--brand-muted)]">
          <span>{t("sort")}</span>
          <button
            type="button"
            onClick={() => setSortNewest(true)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold border ${
              sortNewest
                ? "border-sky-200 bg-sky-100 text-sky-800"
                : "border-transparent text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <ArrowDownAZ className="h-3.5 w-3.5" />
            {t("newest")}
          </button>
          <button
            type="button"
            onClick={() => setSortNewest(false)}
            className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1.5 font-semibold border ${
              !sortNewest
                ? "border-sky-200 bg-sky-100 text-sky-800"
                : "border-transparent text-neutral-600 hover:bg-neutral-100"
            }`}
          >
            <ArrowUpAZ className="h-3.5 w-3.5" />
            {t("oldest")}
          </button>
        </div>
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-36 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && sorted.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-[var(--card-bg)] p-14 text-center">
          <ShoppingBag className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <p className="font-bold text-lg">{tOrders("noOrders")}</p>
          <p className="text-sm text-[var(--brand-muted)] mt-2 mb-6">
            {filter ? t("noMatch") : tOrders("noOrdersBuyer")}
          </p>
          {filter ? (
            <button
              type="button"
              onClick={() => setFilter("")}
              className="rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              {t("clearFilter")}
            </button>
          ) : (
            <Link
              href="/dashboard/browse"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white"
            >
              {tOrders("browseProducts")} <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      )}

      {!loading && sorted.length > 0 && (
        <ul className="space-y-4 list-none">
          {sorted.map((order) => (
            <li key={order.id}>
              <OrderCard order={order} t={t} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function StatPill({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color: "sky" | "emerald";
}) {
  const bg = color === "sky" ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800";
  return (
    <div className={`rounded-xl px-3 py-2 text-center min-w-[72px] ${bg}`}>
      <p className="text-xl font-black leading-none">{value}</p>
      <p className="text-[10px] font-bold uppercase mt-1 opacity-80">{label}</p>
    </div>
  );
}
