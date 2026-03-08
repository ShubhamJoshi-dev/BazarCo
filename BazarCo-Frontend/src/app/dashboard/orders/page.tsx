"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingBag, Loader2, ChevronRight, MapPin, Package, Calendar, UserCircle, Zap, CheckCircle2, Truck, XCircle } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { listOrders, updateOrderStatus, type Order } from "@/lib/api";

function formatDate(iso: string) {
  try {
    return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" });
  } catch {
    return iso;
  }
}

function StatusBadge({ status, label }: { status: string; label: string }) {
  const config: Record<string, { class: string; icon: typeof CheckCircle2 }> = {
    pending: { class: "bg-neutral-500/25 text-neutral-300 border-neutral-500/50 shadow-[0_0_12px_rgba(163,163,163,0.08)]", icon: Package },
    paid: { class: "bg-[var(--brand-blue)]/25 text-[var(--brand-blue)] border-[var(--brand-blue)]/50 shadow-[0_0_14px_rgba(59,130,246,0.15)]", icon: CheckCircle2 },
    in_progress: { class: "bg-amber-500/25 text-amber-400 border-amber-500/50 shadow-[0_0_14px_rgba(245,158,11,0.12)]", icon: Truck },
    completed: { class: "bg-emerald-500/25 text-emerald-400 border-emerald-500/50 shadow-[0_0_14px_rgba(34,197,94,0.12)]", icon: CheckCircle2 },
    cancelled: { class: "bg-[var(--brand-red)]/25 text-[var(--brand-red)] border-[var(--brand-red)]/50", icon: XCircle },
  };
  const { class: s, icon: Icon } = config[status] ?? config.pending;
  return (
    <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold ${s} transition-transform hover:scale-[1.02]`}>
      <Icon className="w-3.5 h-3.5 shrink-0" />
      {label}
    </span>
  );
}

const STATUS_OPTIONS = [
  { value: "paid", labelKey: "statusPaid" as const },
  { value: "in_progress", labelKey: "statusInProgress" as const },
  { value: "completed", labelKey: "statusCompleted" as const },
  { value: "cancelled", labelKey: "statusCancelled" as const },
];
const statusLabelKeys: Record<string, string> = {
  pending: "statusPending",
  paid: "statusPaid",
  in_progress: "statusInProgress",
  completed: "statusCompleted",
  cancelled: "statusCancelled",
};

const statusAccentColor: Record<string, string> = {
  pending: "from-neutral-500/15 to-transparent",
  paid: "from-[var(--brand-blue)]/12 to-transparent",
  in_progress: "from-amber-500/12 to-transparent",
  completed: "from-emerald-500/12 to-transparent",
  cancelled: "from-[var(--brand-red)]/10 to-transparent",
};

export default function OrdersPage() {
  const { user } = useAuth();
  const t = useTranslations("orders");
  const isSeller = user?.role === "seller";
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const list = await listOrders({
      asSeller: isSeller,
      status: filter || undefined,
    });
    setOrders(list);
    setLoading(false);
  }, [isSeller, filter]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!isSeller) return;
    setUpdatingId(orderId);
    const ok = await updateOrderStatus(orderId, newStatus);
    setUpdatingId(null);
    if (ok) fetchOrders();
  };

  if (loading && orders.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
        >
          <Loader2 className="w-10 h-10 text-[var(--brand-blue)]" />
        </motion.div>
        <p className="text-sm text-neutral-400">Loading orders…</p>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--brand-white)] flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] shadow-[0_0_20px_rgba(59,130,246,0.15)]">
              <ShoppingBag className="w-6 h-6" />
            </span>
            {isSeller ? t("orderDashboard") : t("orderHistory")}
          </h1>
          <p className="text-sm text-neutral-400 mt-1.5">
            {orders.length > 0 ? `${orders.length} order${orders.length !== 1 ? "s" : ""}` : "Manage and track your orders"}
          </p>
        </div>
        {isSeller && (
          <>
            <div className="hidden sm:flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 flex-wrap">
              <button
                type="button"
                onClick={() => setFilter("")}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  filter === ""
                    ? "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] shadow-sm"
                    : "text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5"
                }`}
              >
                {t("allStatuses")}
              </button>
              {STATUS_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setFilter(opt.value)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                    filter === opt.value
                      ? "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] shadow-sm"
                      : "text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5"
                  }`}
                >
                  {t(opt.labelKey)}
                </button>
              ))}
            </div>
            <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="sm:hidden rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2.5 text-sm text-[var(--brand-white)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/50 w-full max-w-[200px]"
            >
              <option value="">{t("allStatuses")}</option>
              {STATUS_OPTIONS.map((opt) => (
                <option key={opt.value} value={opt.value}>
                  {t(opt.labelKey)}
                </option>
              ))}
            </select>
          </>
        )}
      </motion.div>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-16 text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/10">
            <ShoppingBag className="w-10 h-10 text-neutral-500" />
          </div>
          <p className="text-lg font-semibold text-[var(--brand-white)] mb-2">{t("noOrders")}</p>
          <p className="text-sm text-neutral-400 mb-8 max-w-sm mx-auto">
            {isSeller ? t("noOrdersSeller") : t("noOrdersBuyer")}
          </p>
          {!isSeller && (
            <Link
              href="/dashboard/browse"
              className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40 px-5 py-2.5 text-sm font-medium hover:bg-[var(--brand-blue)]/30 transition-colors"
            >
              {t("browseProducts")}
              <ChevronRight className="w-4 h-4" />
            </Link>
          )}
        </motion.div>
      ) : (
        <ul className="space-y-4">
          <AnimatePresence mode="popLayout">
            {orders.map((order, i) => (
              <motion.li
                key={order.id}
                layout
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.98 }}
                transition={{ delay: Math.min(i * 0.05, 0.3), duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
                className="group list-none"
              >
                <div
                  className={`relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br ${statusAccentColor[order.status] ?? "from-white/[0.04]"} to-white/[0.02] p-0 transition-all duration-300 hover:border-white/20 hover:shadow-[0_12px_40px_rgba(0,0,0,0.25)] hover:shadow-[var(--brand-blue)]/5 hover:-translate-y-0.5`}
                >
                  {/* Left accent bar */}
                  <div
                    className={`absolute left-0 top-0 bottom-0 w-1 rounded-l-2xl ${
                      order.status === "paid"
                        ? "bg-[var(--brand-blue)]"
                        : order.status === "in_progress"
                          ? "bg-amber-500"
                          : order.status === "completed"
                            ? "bg-emerald-500"
                            : order.status === "cancelled"
                              ? "bg-[var(--brand-red)]"
                              : "bg-neutral-500"
                    } opacity-80`}
                  />
                  <div className="pl-5 pr-5 py-5 sm:py-5">
                    <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-5">
                      <div className="min-w-0 flex-1 space-y-4">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
                          <span className="font-mono text-sm font-medium text-neutral-400">#{order.id.slice(-8)}</span>
                          <StatusBadge status={order.status} label={t(statusLabelKeys[order.status] ?? "statusPending")} />
                          {order.urgent && (
                            <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/20 px-2.5 py-1 text-xs font-medium text-amber-400 shadow-[0_0_12px_rgba(245,158,11,0.15)]">
                              <Zap className="w-3.5 h-3.5" />
                              {t("urgent")}
                            </span>
                          )}
                          <span className="flex items-center gap-1.5 text-xs text-neutral-500">
                            <Calendar className="w-3.5 h-3.5 text-neutral-500" />
                            {formatDate(order.createdAt)}
                          </span>
                        </div>
                        <p className="text-2xl font-bold text-[var(--brand-white)] tracking-tight tabular-nums">
                          ${Number(order.total).toFixed(2)}
                        </p>
                        <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm">
                          <p className="flex items-center gap-2 text-neutral-400">
                            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-white/5 text-neutral-400">
                              <Package className="w-4 h-4" />
                            </span>
                            {order.items.length} {order.items.length !== 1 ? t("items") : t("item")}:{" "}
                            <span className="text-[var(--brand-white)]/95 font-medium">
                              {order.items.slice(0, 2).map((it) => it.productName).join(", ")}
                              {order.items.length > 2 ? ` +${order.items.length - 2}` : ""}
                            </span>
                          </p>
                          {order.rider && (
                            <p className="flex items-center gap-2 text-neutral-400">
                              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-emerald-500/10 text-emerald-400/90">
                                <UserCircle className="w-4 h-4" />
                              </span>
                              {t("rider")}: <span className="text-[var(--brand-white)]/90">{order.rider.name}</span>
                            </p>
                          )}
                        </div>
                        {order.shippingAddress && (
                          <div className="flex items-start gap-3 rounded-xl bg-white/[0.04] border border-white/5 px-4 py-3">
                            <MapPin className="w-4 h-4 shrink-0 text-[var(--brand-blue)]/90 mt-0.5" />
                            <span className="text-sm text-neutral-400 leading-relaxed">
                              {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.country}
                            </span>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-3 shrink-0 lg:flex-col lg:items-end lg:gap-4">
                        {isSeller && !["completed", "cancelled"].includes(order.status) && (
                          <select
                            value={order.status}
                            onChange={(e) => handleStatusChange(order.id, e.target.value)}
                            disabled={updatingId === order.id}
                            className="rounded-xl bg-white/[0.08] border border-white/15 px-4 py-2.5 text-sm font-medium text-[var(--brand-white)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/50 focus:border-[var(--brand-blue)]/40 disabled:opacity-50 cursor-pointer transition-all"
                          >
                            {order.status === "paid" && <option value="paid">{t("statusPaid")}</option>}
                            <option value="in_progress">{t("statusInProgress")}</option>
                            <option value="completed">{t("statusCompleted")}</option>
                            <option value="cancelled">{t("statusCancelled")}</option>
                          </select>
                        )}
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)]/15 border border-[var(--brand-blue)]/30 px-4 py-2.5 text-sm font-semibold text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/25 hover:border-[var(--brand-blue)]/50 transition-all group/link"
                        >
                          {t("view")}
                          <ChevronRight className="w-4 h-4 group-hover/link:translate-x-0.5 transition-transform" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              </motion.li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
