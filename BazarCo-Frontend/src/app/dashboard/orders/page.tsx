"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ShoppingBag, Loader2, ChevronRight, MapPin, Package, Calendar, UserCircle, Zap } from "lucide-react";
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
  const styles: Record<string, string> = {
    pending: "bg-neutral-500/20 text-neutral-300 border-neutral-500/40",
    paid: "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border-[var(--brand-blue)]/40",
    in_progress: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    completed: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    cancelled: "bg-[var(--brand-red)]/20 text-[var(--brand-red)] border-[var(--brand-red)]/40",
  };
  const s = styles[status] ?? styles.pending;
  return (
    <span className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-medium ${s}`}>
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
      <div className="flex items-center justify-center min-h-[40vh]">
        <Loader2 className="w-8 h-8 text-[var(--brand-blue)] animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--brand-white)] flex items-center gap-2">
          <ShoppingBag className="w-7 h-7 text-[var(--brand-blue)]" />
          {isSeller ? t("orderDashboard") : t("orderHistory")}
        </h1>
        {isSeller && (
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2 text-sm text-[var(--brand-white)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
          >
            <option value="">{t("allStatuses")}</option>
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {t(opt.labelKey)}
              </option>
            ))}
          </select>
        )}
      </div>

      {orders.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl bg-white/[0.04] p-12 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
        >
          <ShoppingBag className="mx-auto w-12 h-12 text-neutral-500 mb-4" />
          <p className="text-[var(--brand-white)] font-medium mb-1">{t("noOrders")}</p>
          <p className="text-sm text-neutral-400 mb-6">
            {isSeller ? t("noOrdersSeller") : t("noOrdersBuyer")}
          </p>
          {!isSeller && (
            <Link href="/dashboard/browse" className="text-[var(--brand-blue)] hover:underline text-sm">
              {t("browseProducts")}
            </Link>
          )}
        </motion.div>
      ) : (
        <ul className="space-y-5">
          {orders.map((order, i) => (
            <motion.li
              key={order.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.04, duration: 0.25 }}
              whileHover={{ y: -2 }}
              className="group"
            >
              <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-white/[0.02] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)] transition-all duration-200 hover:border-[var(--brand-blue)]/30 hover:shadow-[0_8px_30px_rgba(100,181,246,0.08)]">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="font-mono text-xs text-neutral-500">#{order.id.slice(-8)}</span>
                      <StatusBadge status={order.status} label={t(statusLabelKeys[order.status] ?? "statusPending")} />
                      {order.urgent && (
                        <span className="inline-flex items-center gap-1 rounded-full border border-amber-500/40 bg-amber-500/20 px-2 py-0.5 text-xs font-medium text-amber-400">
                          <Zap className="w-3 h-3" />
                          {t("urgent")}
                        </span>
                      )}
                      <span className="flex items-center gap-1 text-xs text-neutral-400">
                        <Calendar className="w-3.5 h-3.5" />
                        {formatDate(order.createdAt)}
                      </span>
                    </div>
                    <p className="text-xl font-bold text-[var(--brand-white)] tracking-tight">${Number(order.total).toFixed(2)}</p>
                    <p className="mt-1.5 flex items-center gap-1.5 text-sm text-neutral-400">
                      <Package className="w-4 h-4 text-neutral-500" />
                      {order.items.length} {order.items.length !== 1 ? t("items") : t("item")}:{" "}
                      <span className="text-[var(--brand-white)]/90">
                        {order.items.slice(0, 2).map((it) => it.productName).join(", ")}
                        {order.items.length > 2 ? ` +${order.items.length - 2} more` : ""}
                      </span>
                    </p>
                    {order.rider && (
                      <div className="mt-2 flex items-center gap-2 text-xs text-neutral-400">
                        <UserCircle className="w-3.5 h-3.5 text-emerald-500/80" />
                        <span>{t("rider")}: {order.rider.name}</span>
                      </div>
                    )}
                    {order.shippingAddress && (
                      <div className="mt-3 flex items-start gap-2 rounded-lg bg-white/[0.03] px-3 py-2 border border-white/5">
                        <MapPin className="w-4 h-4 shrink-0 text-[var(--brand-blue)]/80 mt-0.5" />
                        <span className="text-xs text-neutral-400 leading-relaxed">
                          {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.country}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    {isSeller && !["completed", "cancelled"].includes(order.status) && (
                      <select
                        value={order.status}
                        onChange={(e) => handleStatusChange(order.id, e.target.value)}
                        disabled={updatingId === order.id}
                        className="rounded-xl bg-white/[0.08] border border-white/10 px-3 py-2 text-sm text-[var(--brand-white)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/50 disabled:opacity-50 cursor-pointer"
                      >
                        {order.status === "paid" && <option value="paid">{t("statusPaid")}</option>}
                        <option value="in_progress">{t("statusInProgress")}</option>
                        <option value="completed">{t("statusCompleted")}</option>
                        <option value="cancelled">{t("statusCancelled")}</option>
                      </select>
                    )}
                    <Link
                      href={`/dashboard/orders/${order.id}`}
                      className="inline-flex items-center gap-1 text-sm font-medium text-[var(--brand-blue)] hover:underline group-hover:gap-2 transition-all"
                    >
                      {t("view")}
                      <ChevronRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>
            </motion.li>
          ))}
        </ul>
      )}
    </div>
  );
}
