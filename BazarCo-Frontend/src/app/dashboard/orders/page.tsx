"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import {
  ShoppingBag, ChevronRight, MapPin, Package, Calendar,
  UserCircle, Zap, CheckCircle2, Truck, XCircle, Clock,
  ArrowDownAZ, ArrowUpAZ, TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { listOrders, updateOrderStatus, type Order } from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";

function formatDate(iso: string) {
  try { return new Date(iso).toLocaleDateString(undefined, { dateStyle: "medium" }); }
  catch { return iso; }
}

const STATUS_CONFIG: Record<string, {
  label: string; icon: typeof CheckCircle2;
  bg: string; text: string; glow: string; barColor: string;
}> = {
  pending:     { label: "Pending",     icon: Clock,        bg: "rgba(113,113,122,0.15)", text: "#a1a1aa", glow: "rgba(113,113,122,0.25)", barColor: "#71717a" },
  paid:        { label: "Paid",        icon: CheckCircle2, bg: "rgba(77,166,255,0.15)",  text: "#4da6ff", glow: "rgba(77,166,255,0.35)",  barColor: "#4da6ff" },
  in_progress: { label: "In Progress", icon: Truck,        bg: "rgba(245,158,11,0.15)",  text: "#f59e0b", glow: "rgba(245,158,11,0.35)",  barColor: "#f59e0b" },
  completed:   { label: "Completed",   icon: CheckCircle2, bg: "rgba(34,197,94,0.15)",   text: "#22c55e", glow: "rgba(34,197,94,0.35)",   barColor: "#22c55e" },
  cancelled:   { label: "Cancelled",   icon: XCircle,      bg: "rgba(255,92,114,0.15)",  text: "#ff5c72", glow: "rgba(255,92,114,0.3)",   barColor: "#ff5c72" },
};

/* ── Animated count-up number ── */
function CountUp({ to, prefix = "" }: { to: number; prefix?: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => `${prefix}${Math.round(v).toLocaleString()}`);
  useEffect(() => {
    const controls = animate(motionVal, to, { duration: 1.2, ease: [0.22, 1, 0.36, 1] });
    return controls.stop;
  }, [to, motionVal]);
  return <motion.span ref={ref}>{rounded}</motion.span>;
}

/* ── Skeleton card ── */
function SkeletonCard({ i }: { i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.07, type: "spring", stiffness: 300, damping: 24 }}
      className="clay-card overflow-hidden relative"
      style={{ borderLeft: "3px solid rgba(255,255,255,0.08)" }}
    >
      <div className="p-5 space-y-3">
        <div className="flex gap-2">
          <div className="h-6 w-24 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-40" />
          <div className="h-6 w-20 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-30" />
          <div className="h-6 w-28 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-20" />
        </div>
        <div className="h-9 w-40 rounded-xl bg-[var(--brand-border)] loading-shimmer-bar opacity-50" />
        <div className="h-8 w-64 rounded-xl bg-[var(--brand-border)] loading-shimmer-bar opacity-30" />
        <div className="h-8 w-48 rounded-xl bg-[var(--brand-border)] loading-shimmer-bar opacity-20" />
      </div>
    </motion.div>
  );
}

/* ── Status pill with per-status animation ── */
function StatusPill({ status }: { status: string }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const Icon = cfg.icon;
  return (
    <motion.span
      initial={{ scale: 0.7, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 500, damping: 22 }}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-bold border select-none"
      style={{ background: cfg.bg, color: cfg.text, borderColor: cfg.text + "50", boxShadow: `0 2px 12px ${cfg.glow}` }}
    >
      {status === "in_progress" ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: cfg.text }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: cfg.text }} />
        </span>
      ) : status === "completed" ? (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.1, type: "spring", stiffness: 600 }}>
          <Icon className="w-3.5 h-3.5" />
        </motion.span>
      ) : (
        <Icon className="w-3.5 h-3.5" />
      )}
      {cfg.label}
    </motion.span>
  );
}

/* ── Animated stat bar in header ── */
function StatBar({ status, count, max, delay }: { status: string; count: number; max: number; delay: number }) {
  const cfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.pending;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex flex-col items-center gap-1.5" title={`${cfg.label}: ${count}`}>
      <span className="text-xs font-bold tabular-nums" style={{ color: cfg.text }}>{count}</span>
      <div className="w-6 h-16 rounded-full overflow-hidden flex flex-col-reverse"
        style={{ background: cfg.bg, border: `1px solid ${cfg.text}20` }}>
        <motion.div
          className="w-full rounded-full"
          style={{ background: cfg.barColor, boxShadow: `0 0 8px ${cfg.glow}` }}
          initial={{ height: "0%" }}
          animate={inView ? { height: `${(count / max) * 100}%` } : { height: "0%" }}
          transition={{ delay, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="text-[9px] font-semibold text-[var(--brand-muted)] text-center leading-tight max-w-[28px]">
        {cfg.label.split(" ")[0]}
      </span>
    </div>
  );
}

const STATUS_FILTERS = ["", "pending", "paid", "in_progress", "completed", "cancelled"];

/* ── Framer variants for the list ── */
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 24, scale: 0.97 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 24 } },
  exit:   { opacity: 0, scale: 0.94, y: -8, transition: { duration: 0.22 } },
};

export default function OrdersPage() {
  const { user } = useAuth();
  const t = useTranslations("orders");
  const { formatPrice } = useCurrency();
  const isSeller = user?.role === "seller";
  const [orders, setOrders]         = useState<Order[]>([]);
  const [loading, setLoading]       = useState(true);
  const [filter, setFilter]         = useState("");
  const [sortNewest, setSortNewest] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    const list = await listOrders({ asSeller: isSeller, status: filter || undefined });
    setOrders(list); setLoading(false);
  }, [isSeller, filter]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const handleStatusChange = async (orderId: string, newStatus: string) => {
    if (!isSeller) return;
    setUpdatingId(orderId);
    const ok = await updateOrderStatus(orderId, newStatus);
    setUpdatingId(null);
    if (ok) fetchOrders();
  };

  const sorted = [...orders].sort((a, b) => {
    const da = new Date(a.createdAt).getTime(), db = new Date(b.createdAt).getTime();
    return sortNewest ? db - da : da - db;
  });

  const statusCounts = orders.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1; return acc;
  }, {});
  const maxCount = Math.max(1, ...Object.values(statusCounts));
  const totalValue = orders.reduce((s, o) => s + Number(o.total), 0);

  /* ── Loading: skeleton cards ── */
  if (loading && orders.length === 0) {
    return (
      <div className="space-y-5">
        {/* Skeleton header */}
        <div className="clay-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-border)] loading-shimmer-bar opacity-40 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-7 w-48 rounded-xl bg-[var(--brand-border)] loading-shimmer-bar opacity-40" />
              <div className="h-4 w-32 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-25" />
            </div>
          </div>
        </div>
        {/* Skeleton filters */}
        <div className="flex gap-2 flex-wrap">
          {[80, 64, 80, 96, 88, 72].map((w, i) => (
            <div key={i} className="h-8 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-30"
              style={{ width: w }} />
          ))}
        </div>
        {/* Skeleton cards */}
        {[0, 1, 2].map((i) => <SkeletonCard key={i} i={i} />)}
      </div>
    );
  }

  return (
    <motion.div
      className="space-y-5"
      initial="hidden"
      animate="show"
      variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
    >

      {/* ── Header card ── */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: -18 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
        className="clay-card p-6 relative overflow-hidden"
      >
        {/* Background gradient blobs */}
        <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-blue)]/8 via-transparent to-transparent pointer-events-none rounded-[24px]" />
        <motion.div
          animate={{ scale: [1, 1.15, 1], opacity: [0.04, 0.08, 0.04] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-[var(--brand-blue)] blur-3xl pointer-events-none"
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          {/* Title */}
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ rotate: -15, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ delay: 0.08, type: "spring", stiffness: 500, damping: 18 }}
              whileHover={{ rotate: [0, -8, 8, 0], transition: { duration: 0.5 } }}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-[var(--brand-blue)]/15 text-[var(--brand-blue)] shrink-0 cursor-default"
              style={{ boxShadow: "var(--clay-shadow-blue)" }}
            >
              <ShoppingBag className="w-6 h-6" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 400 }}
                className="text-2xl font-black text-[var(--foreground)]"
              >
                {isSeller ? t("orderDashboard") : t("orderHistory")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 }}
                className="text-sm text-[var(--brand-muted)] mt-0.5 flex items-center gap-2"
              >
                {orders.length > 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-emerald-400" />
                    <CountUp to={orders.length} /> order{orders.length !== 1 ? "s" : ""}
                    {filter ? " · filtered" : ""}
                    {totalValue > 0 && (
                      <span className="text-[var(--brand-blue)] font-semibold">
                        · {formatPrice(totalValue)} total
                      </span>
                    )}
                  </>
                ) : (
                  isSeller ? "Orders from buyers appear here" : "Your orders and delivery status"
                )}
              </motion.p>
            </div>
          </div>

          {/* Animated bar chart */}
          {Object.keys(statusCounts).length > 0 && (
            <motion.div
              initial={{ opacity: 0, x: 16 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.25, type: "spring", stiffness: 280 }}
              className="flex items-end gap-2 shrink-0"
            >
              {Object.entries(statusCounts).map(([status, count], idx) => (
                <StatBar key={status} status={status} count={count} max={maxCount} delay={0.3 + idx * 0.1} />
              ))}
            </motion.div>
          )}
        </div>
      </motion.div>

      {/* ── Filter & Sort bar ── */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 340 } } }}
        className="flex flex-wrap items-center justify-between gap-3"
      >
        <div className="flex flex-wrap gap-2">
          {STATUS_FILTERS.map((s, idx) => {
            const cfg = s ? STATUS_CONFIG[s] : null;
            const active = filter === s;
            return (
              <motion.button
                key={s || "all"} type="button"
                onClick={() => setFilter(s)}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.05 + idx * 0.04, type: "spring", stiffness: 400, damping: 20 }}
                whileHover={{ scale: 1.06, y: -1 }}
                whileTap={{ scale: 0.93 }}
                className={`relative rounded-full px-4 py-2 text-xs font-bold transition-colors border overflow-hidden ${
                  active
                    ? s ? "border-transparent text-white" : "clay-badge-blue border-transparent"
                    : "border-[var(--brand-border)] text-[var(--brand-muted)] hover:text-[var(--foreground)]"
                }`}
                style={active && s && cfg ? { background: cfg.barColor, boxShadow: `0 4px 16px ${cfg.glow}` } : undefined}
              >
                {active && (
                  <motion.span
                    layoutId="filter-pill"
                    className="absolute inset-0 rounded-full pointer-events-none"
                    style={{ background: s && cfg ? cfg.barColor + "20" : undefined }}
                    transition={{ type: "spring", stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative">
                  {s ? (STATUS_CONFIG[s]?.label ?? s) : "All Orders"}
                  {s && statusCounts[s] ? ` (${statusCounts[s]})` : ""}
                </span>
              </motion.button>
            );
          })}
        </div>

        <div className="flex items-center gap-1.5">
          <span className="text-xs text-[var(--brand-muted)]">Sort:</span>
          {[{ v: true, label: "Newest", icon: ArrowDownAZ }, { v: false, label: "Oldest", icon: ArrowUpAZ }].map(({ v, label, icon: Icon }) => (
            <motion.button key={label} type="button" onClick={() => setSortNewest(v)}
              whileHover={{ scale: 1.06 }} whileTap={{ scale: 0.93 }}
              className={`flex items-center gap-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${sortNewest === v ? "clay-badge-blue" : "text-[var(--brand-muted)] hover:text-[var(--foreground)]"}`}>
              <Icon className="w-3.5 h-3.5" /> {label}
            </motion.button>
          ))}
        </div>
      </motion.div>

      {/* ── Empty state ── */}
      <AnimatePresence>
        {sorted.length === 0 && !loading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="clay-card p-20 text-center"
          >
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, -5, 5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <ShoppingBag className="mx-auto w-16 h-16 text-[var(--brand-muted)]/20 mb-6" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-xl font-black text-[var(--foreground)] mb-2"
            >
              {t("noOrders")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
              className="text-sm text-[var(--brand-muted)] mb-8"
            >
              {filter ? "No orders match this filter." : isSeller ? t("noOrdersSeller") : t("noOrdersBuyer")}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}>
              {filter ? (
                <motion.button type="button" onClick={() => setFilter("")}
                  whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                  className="clay-btn-blue px-7 py-3 text-sm">
                  Clear filter
                </motion.button>
              ) : !isSeller && (
                <Link href="/dashboard/browse"
                  className="clay-btn-blue px-7 py-3 text-sm inline-flex items-center gap-2">
                  {t("browseProducts")} <ChevronRight className="w-4 h-4" />
                </Link>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Order list ── */}
      <motion.ul
        className="space-y-3 list-none"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="popLayout">
          {sorted.map((order) => {
            const cfg = STATUS_CONFIG[order.status] ?? STATUS_CONFIG.pending;
            return (
              <motion.li
                key={order.id}
                layout
                variants={cardVariants}
                exit={cardVariants.exit}
                whileHover={{
                  y: -5,
                  boxShadow: `0 16px 48px -8px ${cfg.glow}, 0 4px 16px rgba(0,0,0,0.2)`,
                  transition: { duration: 0.22 },
                }}
                className="list-none clay-card overflow-hidden relative cursor-default"
                style={{
                  borderLeft: `3px solid ${cfg.barColor}`,
                  transformOrigin: "center bottom",
                }}
              >
                {/* Animated left glow on hover */}
                <motion.div
                  className="absolute left-0 top-0 bottom-0 w-12 pointer-events-none"
                  initial={{ opacity: 0.3 }}
                  whileHover={{ opacity: 1 }}
                  style={{ background: `linear-gradient(to right, ${cfg.barColor}25, transparent)` }}
                />

                <div className="pl-6 pr-5 py-5 relative">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-5">
                    <div className="flex-1 min-w-0 space-y-3">

                      {/* Top row */}
                      <div className="flex flex-wrap items-center gap-2">
                        <motion.span
                          initial={{ opacity: 0, scale: 0.8 }}
                          animate={{ opacity: 1, scale: 1 }}
                          transition={{ type: "spring", stiffness: 400 }}
                          className="font-mono text-xs font-bold text-[var(--brand-muted)] bg-[var(--card-bg)] px-2.5 py-1 rounded-xl border border-[var(--brand-border)]"
                        >
                          #{order.id.slice(-8)}
                        </motion.span>

                        <StatusPill status={order.status} />

                        {order.urgent && (
                          <motion.span
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 600, damping: 14 }}
                            whileHover={{ scale: 1.08 }}
                            style={{ boxShadow: "0 2px 12px rgba(245,158,11,0.3)" }}
                            className="inline-flex items-center gap-1 rounded-full border border-amber-500/50 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-400 cursor-default"
                          >
                            <motion.span
                              animate={{ rotate: [0, 15, -15, 10, 0] }}
                              transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2 }}
                              style={{ display: "inline-flex" }}
                            >
                              <Zap className="w-3.5 h-3.5" />
                            </motion.span>
                            {t("urgent")}
                          </motion.span>
                        )}

                        <motion.span
                          initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }}
                          className="flex items-center gap-1.5 text-xs text-[var(--brand-muted)]"
                        >
                          <Calendar className="w-3.5 h-3.5" /> {formatDate(order.createdAt)}
                        </motion.span>
                      </div>

                      {/* Total with count-up */}
                      <motion.div
                        initial={{ opacity: 0, x: -12 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.08, type: "spring", stiffness: 380 }}
                        className="text-3xl font-black text-[var(--foreground)] tabular-nums"
                      >
                        {formatPrice(Number(order.total))}
                      </motion.div>

                      {/* Items + rider chips — stagger in */}
                      <motion.div
                        className="flex flex-wrap gap-2.5"
                        initial="hidden"
                        animate="show"
                        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.08 } } }}
                      >
                        <motion.div
                          variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                          className="flex items-center gap-2 clay-card px-3 py-2 text-sm"
                          style={{ borderRadius: 14 }}
                        >
                          <Package className="w-4 h-4 text-[var(--brand-blue)] shrink-0" />
                          <span className="text-[var(--brand-muted)]">
                            {order.items.length} item{order.items.length !== 1 ? "s" : ""}:{" "}
                            <span className="font-semibold text-[var(--foreground)]">
                              {order.items.slice(0, 2).map(it => it.productName).join(", ")}
                              {order.items.length > 2 ? ` +${order.items.length - 2}` : ""}
                            </span>
                          </span>
                        </motion.div>

                        {order.rider && (
                          <motion.div
                            variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                            className="flex items-center gap-2 clay-card px-3 py-2 text-sm"
                            style={{ borderRadius: 14 }}
                          >
                            <UserCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                            <span className="text-[var(--brand-muted)]">
                              {t("rider")}: <span className="font-semibold text-[var(--foreground)]">{order.rider.name}</span>
                            </span>
                          </motion.div>
                        )}
                      </motion.div>

                      {/* Address */}
                      {order.shippingAddress && (
                        <motion.div
                          initial={{ opacity: 0, y: 4 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: 0.18 }}
                          className="flex items-center gap-2.5 clay-card-blue px-3 py-2.5 text-sm"
                          style={{ borderRadius: 14 }}
                        >
                          <MapPin className="w-4 h-4 text-[var(--brand-blue)] shrink-0" />
                          <span className="text-[var(--brand-muted)]">
                            {order.shippingAddress.line1}, {order.shippingAddress.city}, {order.shippingAddress.country}
                          </span>
                        </motion.div>
                      )}
                    </div>

                    {/* Actions */}
                    <motion.div
                      className="flex items-center gap-2 shrink-0 lg:flex-col lg:items-end lg:gap-2.5"
                      initial={{ opacity: 0, x: 12 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.14, type: "spring", stiffness: 360 }}
                    >
                      {isSeller && !["completed", "cancelled"].includes(order.status) && (
                        <motion.select
                          value={order.status}
                          onChange={(e) => handleStatusChange(order.id, e.target.value)}
                          disabled={updatingId === order.id}
                          whileFocus={{ scale: 1.02 }}
                          className="clay-input px-3 py-2 text-sm font-semibold text-[var(--foreground)] disabled:opacity-50 cursor-pointer"
                          style={{ borderRadius: 14 }}
                        >
                          {order.status === "paid" && <option value="paid">{t("statusPaid")}</option>}
                          <option value="in_progress">{t("statusInProgress")}</option>
                          <option value="completed">{t("statusCompleted")}</option>
                          <option value="cancelled">{t("statusCancelled")}</option>
                        </motion.select>
                      )}
                      <motion.div
                        whileHover={{ scale: 1.06 }}
                        whileTap={{ scale: 0.93 }}
                      >
                        <Link
                          href={`/dashboard/orders/${order.id}`}
                          className="clay-btn-blue px-5 py-2.5 text-sm inline-flex items-center gap-2 group"
                        >
                          {t("view")}
                          <motion.span
                            animate={{ x: [0, 3, 0] }}
                            transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
                          >
                            <ChevronRight className="w-4 h-4" />
                          </motion.span>
                        </Link>
                      </motion.div>
                    </motion.div>
                  </div>
                </div>
              </motion.li>
            );
          })}
        </AnimatePresence>
      </motion.ul>
    </motion.div>
  );
}
