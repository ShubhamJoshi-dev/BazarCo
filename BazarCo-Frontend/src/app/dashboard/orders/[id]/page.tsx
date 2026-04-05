"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import {
  ArrowLeft, MapPin, MessageCircle, UserCircle, Zap,
  CheckCircle2, Clock, Truck, XCircle, Package,
  Phone, CreditCard, Loader2, ChevronRight, ShoppingBag,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { getOrderById, updateOrderStatus, createConversationByOrder, type Order } from "@/lib/api";
import { useCurrency } from "@/contexts/CurrencyContext";

/* ─── Helpers ─────────────────────────────────────────── */
function formatDate(iso: string) {
  try { return new Date(iso).toLocaleString(undefined, { dateStyle: "long", timeStyle: "short" }); }
  catch { return iso; }
}

const STATUS_CFG: Record<string, { label: string; color: string; glow: string; bg: string; icon: typeof Clock }> = {
  pending:     { label: "Pending",     color: "#a1a1aa", glow: "rgba(161,161,170,0.3)", bg: "rgba(161,161,170,0.1)", icon: Clock },
  paid:        { label: "Paid",        color: "#4da6ff", glow: "rgba(77,166,255,0.35)", bg: "rgba(77,166,255,0.1)",  icon: CheckCircle2 },
  in_progress: { label: "In Progress", color: "#f59e0b", glow: "rgba(245,158,11,0.35)", bg: "rgba(245,158,11,0.1)",  icon: Truck },
  completed:   { label: "Completed",   color: "#22c55e", glow: "rgba(34,197,94,0.35)",  bg: "rgba(34,197,94,0.1)",   icon: CheckCircle2 },
  cancelled:   { label: "Cancelled",   color: "#ff5c72", glow: "rgba(255,92,114,0.3)",  bg: "rgba(255,92,114,0.1)",  icon: XCircle },
};

/* Step order for progress tracker */
const STEPS: { key: string; label: string; icon: typeof Clock }[] = [
  { key: "pending",     label: "Placed",      icon: ShoppingBag },
  { key: "paid",        label: "Paid",         icon: CreditCard },
  { key: "in_progress", label: "On the Way",   icon: Truck },
  { key: "completed",   label: "Delivered",    icon: CheckCircle2 },
];
const STEP_INDEX: Record<string, number> = {
  pending: 0, paid: 1, in_progress: 2, completed: 3, cancelled: -1,
};

/* ─── Count-up ────────────────────────────────────────── */
function CountUp({ to, prefix = "" }: { to: number; prefix?: string }) {
  const mv  = useMotionValue(0);
  const out = useTransform(mv, (v) => `${prefix}${v.toFixed(2)}`);
  useEffect(() => {
    const c = animate(mv, to, { duration: 1.4, ease: [0.22, 1, 0.36, 1] });
    return c.stop;
  }, [to, mv]);
  return <motion.span>{out}</motion.span>;
}

/* ─── Delivery progress bar ───────────────────────────── */
function DeliveryTracker({ status }: { status: string }) {
  const ref    = useRef(null);
  const inView = useInView(ref, { once: true });
  const step   = STEP_INDEX[status] ?? 0;
  const isCancelled = status === "cancelled";

  if (isCancelled) {
    return (
      <motion.div
        initial={{ opacity: 0, scale: 0.96 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.3, type: "spring", stiffness: 340 }}
        className="flex items-center justify-center gap-3 py-6"
      >
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-10 h-10 rounded-full bg-[var(--brand-red)]/15 flex items-center justify-center"
        >
          <XCircle className="w-5 h-5 text-[var(--brand-red)]" />
        </motion.div>
        <span className="font-bold text-[var(--brand-red)]">This order was cancelled</span>
      </motion.div>
    );
  }

  const pct = step / (STEPS.length - 1);

  return (
    <div ref={ref} className="py-2">
      {/* Line + dots */}
      <div className="relative flex items-center justify-between">
        {/* Track background */}
        <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 rounded-full bg-[var(--brand-border)]" />
        {/* Animated fill */}
        <motion.div
          className="absolute left-0 top-1/2 -translate-y-1/2 h-1 rounded-full origin-left"
          style={{ background: `linear-gradient(to right, #4da6ff, #22c55e)`, boxShadow: "0 0 10px rgba(77,166,255,0.4)" }}
          initial={{ scaleX: 0 }}
          animate={inView ? { scaleX: pct } : { scaleX: 0 }}
          transition={{ delay: 0.5, duration: 1, ease: [0.22, 1, 0.36, 1] }}
        />

        {STEPS.map((s, i) => {
          const done    = i <= step;
          const current = i === step;
          const Icon    = s.icon;
          return (
            <motion.div
              key={s.key}
              initial={{ scale: 0, opacity: 0 }}
              animate={inView ? { scale: 1, opacity: 1 } : { scale: 0, opacity: 0 }}
              transition={{ delay: 0.3 + i * 0.12, type: "spring", stiffness: 500, damping: 20 }}
              className="relative flex flex-col items-center gap-2 z-10"
            >
              <motion.div
                animate={current ? { scale: [1, 1.12, 1], boxShadow: ["0 0 0px transparent", "0 0 18px rgba(77,166,255,0.6)", "0 0 0px transparent"] } : {}}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all ${
                  done
                    ? "bg-[var(--brand-blue)] border-[var(--brand-blue)] text-white"
                    : "bg-[var(--card-bg)] border-[var(--brand-border)] text-[var(--brand-muted)]"
                }`}
                style={done ? { boxShadow: current ? "0 0 20px rgba(77,166,255,0.5)" : "0 0 10px rgba(77,166,255,0.25)" } : undefined}
              >
                {done && !current
                  ? <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.1, type: "spring", stiffness: 600 }}>
                      <CheckCircle2 className="w-5 h-5" />
                    </motion.span>
                  : <Icon className="w-4.5 h-4.5" />
                }
              </motion.div>
              <span className={`text-[11px] font-bold whitespace-nowrap ${done ? "text-[var(--brand-blue)]" : "text-[var(--brand-muted)]"}`}>
                {s.label}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}

/* ─── Skeleton ────────────────────────────────────────── */
function Skeleton() {
  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <div className="h-5 w-32 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-40" />
      <div className="clay-card p-6 space-y-4">
        <div className="flex justify-between">
          <div className="space-y-2">
            <div className="h-3 w-24 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-40" />
            <div className="h-6 w-48 rounded-xl bg-[var(--brand-border)] loading-shimmer-bar opacity-35" />
          </div>
          <div className="h-8 w-20 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-30" />
        </div>
        <div className="h-16 rounded-2xl bg-[var(--brand-border)] loading-shimmer-bar opacity-25" />
      </div>
      {[0, 1, 2].map((i) => (
        <div key={i} className="clay-card p-5">
          <div className="h-4 w-32 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-30 mb-3" />
          <div className="h-10 rounded-xl bg-[var(--brand-border)] loading-shimmer-bar opacity-20" />
        </div>
      ))}
    </div>
  );
}

/* ─── Page ────────────────────────────────────────────── */
export default function OrderDetailPage() {
  const params = useParams();
  const id     = typeof params.id === "string" ? params.id : "";
  const { user }   = useAuth();
  const t          = useTranslations("orders");
  const { formatPrice } = useCurrency();
  const isSeller   = user?.role === "seller";
  const router     = useRouter();

  const [order,        setOrder]        = useState<Order | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [updating,     setUpdating]     = useState(false);
  const [startingChat, setStartingChat] = useState(false);

  useEffect(() => {
    if (!id) { setLoading(false); return; }
    getOrderById(id).then((o) => { setOrder(o ?? null); setLoading(false); });
  }, [id]);

  const handleStatusChange = async (newStatus: string) => {
    if (!order || !isSeller) return;
    setUpdating(true);
    const ok = await updateOrderStatus(order.id, newStatus);
    setUpdating(false);
    if (ok) setOrder((prev) => prev ? { ...prev, status: newStatus } : null);
  };

  const handleMessage = async () => {
    if (!order?.id) return;
    setStartingChat(true);
    const conv = await createConversationByOrder(order.id);
    setStartingChat(false);
    if (conv) router.push(`/dashboard/chat/${conv.id}`);
  };

  if (loading) return <Skeleton />;

  if (!order) {
    return (
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
        className="clay-card p-16 text-center max-w-md mx-auto">
        <Package className="mx-auto w-12 h-12 text-[var(--brand-muted)]/30 mb-4" />
        <p className="font-bold text-[var(--foreground)] mb-2">{t("orderNotFound")}</p>
        <Link href="/dashboard/orders" className="text-[var(--brand-blue)] hover:underline text-sm">
          {t("backToOrders")}
        </Link>
      </motion.div>
    );
  }

  const cfg  = STATUS_CFG[order.status] ?? STATUS_CFG.pending;
  const Icon = cfg.icon;

  const pageVariants = {
    hidden: {},
    show:   { transition: { staggerChildren: 0.08 } },
  };
  const cardVariant = {
    hidden: { opacity: 0, y: 20, scale: 0.97 },
    show:   { opacity: 1, y: 0, scale: 1, transition: { type: "spring" as const, stiffness: 320, damping: 26 } },
  };

  return (
    <motion.div
      className="max-w-2xl mx-auto space-y-4"
      variants={pageVariants}
      initial="hidden"
      animate="show"
    >
      {/* ── Back link ── */}
      <motion.div
        variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400 } } }}
      >
        <Link
          href="/dashboard/orders"
          className="inline-flex items-center gap-2 text-sm text-[var(--brand-muted)] hover:text-[var(--foreground)] transition-colors group"
        >
          <motion.span whileHover={{ x: -3 }} transition={{ type: "spring", stiffness: 500 }}>
            <ArrowLeft className="w-4 h-4" />
          </motion.span>
          {t("backToOrders")}
        </Link>
      </motion.div>

      {/* ── Hero status card ── */}
      <motion.div
        variants={cardVariant}
        className="clay-card overflow-hidden relative"
        style={{ borderTop: `3px solid ${cfg.color}` }}
      >
        {/* Animated background glow */}
        <motion.div
          animate={{ opacity: [0.06, 0.12, 0.06], scale: [1, 1.1, 1] }}
          transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-16 -right-16 w-64 h-64 rounded-full blur-3xl pointer-events-none"
          style={{ background: cfg.color }}
        />
        <div className="absolute inset-0 pointer-events-none rounded-[24px]"
          style={{ background: `linear-gradient(135deg, ${cfg.color}0a, transparent 60%)` }} />

        <div className="relative p-6">
          {/* Top row */}
          <div className="flex flex-wrap items-start justify-between gap-4 mb-5">
            <div>
              <p className="font-mono text-xs text-[var(--brand-muted)] mb-1">
                Order #{order.id.slice(-8)}
              </p>
              <p className="text-lg font-bold text-[var(--foreground)]">{formatDate(order.createdAt)}</p>
              {order.urgent && (
                <motion.span
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.2, type: "spring", stiffness: 600 }}
                  className="inline-flex items-center gap-1 mt-2 rounded-full border border-amber-500/40 bg-amber-500/15 px-2.5 py-1 text-xs font-bold text-amber-400"
                  style={{ boxShadow: "0 2px 12px rgba(245,158,11,0.25)" }}
                >
                  <motion.span animate={{ rotate: [0, 15, -15, 10, 0] }} transition={{ duration: 1.5, repeat: Infinity, repeatDelay: 2, style: { display: "inline-flex" } }}>
                    <Zap className="w-3.5 h-3.5" />
                  </motion.span>
                  {t("urgent")}
                </motion.span>
              )}
            </div>

            {/* Status badge */}
            <motion.div
              initial={{ scale: 0.6, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.15, type: "spring", stiffness: 500, damping: 18 }}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold border"
              style={{ background: cfg.bg, color: cfg.color, borderColor: cfg.color + "50", boxShadow: `0 4px 16px ${cfg.glow}` }}
            >
              {order.status === "in_progress" ? (
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: cfg.color }} />
                  <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: cfg.color }} />
                </span>
              ) : <Icon className="w-4 h-4" />}
              {cfg.label}
            </motion.div>
          </div>

          {/* Progress tracker */}
          <DeliveryTracker status={order.status} />
        </div>
      </motion.div>

      {/* ── Actions row ── */}
      <motion.div variants={cardVariant} className="flex flex-wrap gap-3">
        {/* Message button */}
        <motion.button
          type="button" onClick={handleMessage} disabled={startingChat}
          whileHover={{ scale: 1.04, y: -1 }} whileTap={{ scale: 0.94 }}
          className="clay-card-blue flex items-center gap-2 px-5 py-3 text-sm font-semibold text-[var(--brand-blue)] rounded-2xl disabled:opacity-50"
        >
          {startingChat
            ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                <Loader2 className="w-4 h-4" />
              </motion.span>
            : <MessageCircle className="w-4 h-4" />
          }
          {isSeller ? t("messageBuyer") : t("messageSeller")}
        </motion.button>

        {/* Seller status update */}
        {isSeller && ["paid", "in_progress"].includes(order.status) && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[var(--brand-muted)]">{t("updateStatus")}:</span>
            <motion.select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updating}
              whileFocus={{ scale: 1.02 }}
              className="clay-input px-3 py-2.5 text-sm font-semibold text-[var(--foreground)] cursor-pointer disabled:opacity-50 rounded-xl"
            >
              <option value="in_progress">{t("statusInProgress")}</option>
              <option value="completed">{t("statusCompleted")}</option>
              <option value="cancelled">{t("statusCancelled")}</option>
            </motion.select>
            <AnimatePresence>
              {updating && (
                <motion.span initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.5 }}>
                  <Loader2 className="w-4 h-4 animate-spin text-[var(--brand-blue)]" />
                </motion.span>
              )}
            </AnimatePresence>
          </div>
        )}
      </motion.div>

      {/* ── Rider card ── */}
      <AnimatePresence>
        {order.rider && (
          <motion.div
            variants={cardVariant}
            className="clay-card p-5 relative overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-transparent pointer-events-none rounded-[24px]" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)] mb-3 flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-400" /> Delivery Rider
            </p>
            <div className="flex items-center gap-4 relative">
              <motion.div
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.2, type: "spring", stiffness: 500, damping: 18 }}
                className="w-12 h-12 rounded-full bg-emerald-500/15 flex items-center justify-center shrink-0"
                style={{ boxShadow: "0 4px 16px rgba(34,197,94,0.2)" }}
              >
                <UserCircle className="w-7 h-7 text-emerald-400" />
              </motion.div>
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.22 }}
                  className="font-bold text-[var(--foreground)]"
                >
                  {order.rider.name}
                </motion.p>
                {order.rider.phone && (
                  <motion.a
                    href={`tel:${order.rider.phone}`}
                    initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.28 }}
                    whileHover={{ x: 2 }}
                    className="flex items-center gap-1.5 text-sm text-emerald-400 hover:text-emerald-300 transition-colors mt-0.5"
                  >
                    <Phone className="w-3.5 h-3.5" /> {order.rider.phone}
                  </motion.a>
                )}
              </div>
              <motion.div
                animate={{ x: [0, 6, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="ml-auto"
              >
                <Truck className="w-8 h-8 text-emerald-400/20" />
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Order items ── */}
      <motion.div variants={cardVariant} className="clay-card overflow-hidden">
        <div className="px-5 pt-5 pb-3 border-b border-[var(--brand-border)]">
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)] flex items-center gap-1.5">
            <Package className="w-3.5 h-3.5 text-[var(--brand-blue)]" /> Items
          </p>
        </div>

        <motion.ul
          className="divide-y divide-[var(--brand-border)]"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: 0.2 } } }}
        >
          {order.items.map((item, idx) => (
            <motion.li
              key={idx}
              variants={{ hidden: { opacity: 0, x: -12 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 380, damping: 26 } } }}
              whileHover={{ x: 4, backgroundColor: "rgba(255,255,255,0.02)", transition: { duration: 0.18 } }}
              className="flex items-center justify-between px-5 py-4"
            >
              <div className="flex items-center gap-3 min-w-0">
                <motion.div
                  initial={{ scale: 0 }} animate={{ scale: 1 }}
                  transition={{ delay: 0.15 + idx * 0.07, type: "spring", stiffness: 500 }}
                  className="w-8 h-8 rounded-xl bg-[var(--brand-blue)]/10 flex items-center justify-center shrink-0"
                >
                  <Package className="w-4 h-4 text-[var(--brand-blue)]" />
                </motion.div>
                <div className="min-w-0">
                  <p className="font-semibold text-[var(--foreground)] truncate">{item.productName}</p>
                  <p className="text-xs text-[var(--brand-muted)]">
                    {formatPrice(Number(item.price))} × {item.quantity}
                  </p>
                </div>
              </div>
              <motion.span
                initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                transition={{ delay: 0.2 + idx * 0.07 }}
                className="font-bold text-[var(--foreground)] tabular-nums shrink-0 ml-4"
              >
                {formatPrice(Number(item.price) * item.quantity)}
              </motion.span>
            </motion.li>
          ))}
        </motion.ul>

        {/* Total row */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.35, type: "spring", stiffness: 340 }}
          className="mx-4 mb-4 mt-1 rounded-2xl p-4 flex items-center justify-between"
          style={{
            background: `linear-gradient(135deg, ${cfg.color}12, transparent)`,
            border: `1px solid ${cfg.color}30`,
            boxShadow: `0 4px 20px ${cfg.glow}`,
          }}
        >
          <div className="flex items-center gap-2">
            <CreditCard className="w-5 h-5" style={{ color: cfg.color }} />
            <span className="font-bold text-[var(--foreground)]">Total</span>
          </div>
          <span className="text-2xl font-black tabular-nums" style={{ color: cfg.color }}>
            <CountUp to={Number(order.total)} prefix={order.items[0]?.price !== undefined ? "$" : ""} />
          </span>
        </motion.div>
      </motion.div>

      {/* ── Shipping address ── */}
      {order.shippingAddress && (
        <motion.div variants={cardVariant} className="clay-card p-5 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--brand-blue)]/5 to-transparent pointer-events-none rounded-[24px]" />
          <p className="text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)] mb-4 flex items-center gap-1.5">
            <MapPin className="w-3.5 h-3.5 text-[var(--brand-blue)]" /> {t("shipping")}
          </p>

          <motion.div
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06, delayChildren: 0.15 } } }}
            className="space-y-2.5"
          >
            {[
              order.shippingAddress.line1,
              order.shippingAddress.line2,
              [order.shippingAddress.city, order.shippingAddress.state, order.shippingAddress.zip].filter(Boolean).join(", "),
              order.shippingAddress.country,
            ].filter(Boolean).map((line, i) => (
              <motion.div
                key={i}
                variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400 } } }}
                className="flex items-center gap-2.5"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)]/40 shrink-0" />
                <span className="text-sm text-[var(--foreground)]">{line}</span>
              </motion.div>
            ))}

            {order.shippingAddress.phone && (
              <motion.a
                href={`tel:${order.shippingAddress.phone}`}
                variants={{ hidden: { opacity: 0, x: -10 }, show: { opacity: 1, x: 0, transition: { type: "spring", stiffness: 400 } } }}
                whileHover={{ x: 3 }}
                className="flex items-center gap-2 text-sm text-[var(--brand-blue)] hover:text-[var(--brand-blue)]/80 transition-colors mt-1"
              >
                <Phone className="w-3.5 h-3.5" /> {order.shippingAddress.phone}
              </motion.a>
            )}
          </motion.div>
        </motion.div>
      )}

      {/* ── View all orders link ── */}
      <motion.div
        variants={{ hidden: { opacity: 0 }, show: { opacity: 1, transition: { delay: 0.1 } } }}
        className="flex justify-center pb-4"
      >
        <motion.div whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.95 }}>
          <Link
            href="/dashboard/orders"
            className="clay-card inline-flex items-center gap-2 px-6 py-3 text-sm font-semibold text-[var(--brand-muted)] hover:text-[var(--foreground)] transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> All orders
            <ChevronRight className="w-3.5 h-3.5 opacity-40" />
          </Link>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}
