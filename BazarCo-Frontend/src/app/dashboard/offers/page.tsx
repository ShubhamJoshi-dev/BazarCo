"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence, useInView, useMotionValue, useTransform, animate } from "framer-motion";
import {
  HandCoins, Loader2, ImageIcon, UserCircle, ChevronRight,
  Check, X, MessageSquare, MessageCircle, Package,
  ArrowRight, Tag, Sparkles, TrendingUp,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  listOffers, acceptOffer, rejectOffer, counterOffer,
  acceptCounter, respondToCounter, createConversationByOffer,
  type Offer,
} from "@/lib/api";

/* ─── Status config ─────────────────────────────────── */
const STATUS_OPTIONS = [
  { value: "",          labelKey: "all" as const },
  { value: "pending",   labelKey: "statusPending" as const },
  { value: "countered", labelKey: "statusCountered" as const },
  { value: "accepted",  labelKey: "statusAccepted" as const },
  { value: "rejected",  labelKey: "statusRejected" as const },
];

const STATUS_STYLE: Record<string, { bg: string; text: string; border: string; label: string; glow: string }> = {
  pending:   { bg: "rgba(245,158,11,0.15)",  text: "#f59e0b", border: "rgba(245,158,11,0.4)",  label: "Pending",   glow: "rgba(245,158,11,0.3)" },
  countered: { bg: "rgba(77,166,255,0.15)",  text: "#4da6ff", border: "rgba(77,166,255,0.4)",  label: "Countered", glow: "rgba(77,166,255,0.3)" },
  accepted:  { bg: "rgba(34,197,94,0.15)",   text: "#22c55e", border: "rgba(34,197,94,0.4)",   label: "Accepted",  glow: "rgba(34,197,94,0.3)" },
  rejected:  { bg: "rgba(255,92,114,0.15)",  text: "#ff5c72", border: "rgba(255,92,114,0.4)",  label: "Rejected",  glow: "rgba(255,92,114,0.25)" },
};

/* ─── Count-up ─────────────────────────────────────── */
function CountUp({ to }: { to: number }) {
  const motionVal = useMotionValue(0);
  const rounded   = useTransform(motionVal, (v) => String(Math.round(v)));
  useEffect(() => {
    const c = animate(motionVal, to, { duration: 1.1, ease: [0.22, 1, 0.36, 1] });
    return c.stop;
  }, [to, motionVal]);
  return <motion.span>{rounded}</motion.span>;
}

/* ─── Skeleton card ─────────────────────────────────── */
function SkeletonCard({ i }: { i: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: i * 0.08, type: "spring", stiffness: 300, damping: 24 }}
      className="clay-card overflow-hidden relative"
      style={{ borderLeft: "3px solid rgba(255,255,255,0.07)" }}
    >
      <div className="flex gap-5 p-5">
        <div className="w-20 h-20 rounded-2xl bg-[var(--brand-border)] loading-shimmer-bar opacity-40 shrink-0" />
        <div className="flex-1 space-y-3">
          <div className="h-5 w-40 rounded-xl bg-[var(--brand-border)] loading-shimmer-bar opacity-40" />
          <div className="h-4 w-56 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-30" />
          <div className="flex gap-2">
            <div className="h-6 w-20 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-25" />
            <div className="h-6 w-16 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-20" />
          </div>
        </div>
        <div className="w-36 space-y-2 hidden md:block">
          <div className="h-9 rounded-2xl bg-[var(--brand-border)] loading-shimmer-bar opacity-30" />
          <div className="h-9 rounded-2xl bg-[var(--brand-border)] loading-shimmer-bar opacity-20" />
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Status chip ───────────────────────────────────── */
function StatusChip({ status }: { status: string }) {
  const s = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  const isPending  = status === "pending";
  const isAccepted = status === "accepted";
  return (
    <motion.span
      initial={{ scale: 0.6, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: "spring", stiffness: 520, damping: 20 }}
      className="inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-bold border select-none"
      style={{ background: s.bg, color: s.text, borderColor: s.border, boxShadow: `0 2px 12px ${s.glow}` }}
    >
      {isPending ? (
        <span className="relative flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full opacity-60" style={{ background: s.text }} />
          <span className="relative inline-flex rounded-full h-2 w-2" style={{ background: s.text }} />
        </span>
      ) : isAccepted ? (
        <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.08, type: "spring", stiffness: 600 }}>
          <Check className="w-3 h-3" />
        </motion.span>
      ) : (
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: s.text }} />
      )}
      {s.label}
    </motion.span>
  );
}

/* ─── Animated stat bar ─────────────────────────────── */
function StatBar({ status, count, max, delay }: { status: string; count: number; max: number; delay: number }) {
  const s   = STATUS_STYLE[status] ?? STATUS_STYLE.pending;
  const ref = useRef(null);
  const inView = useInView(ref, { once: true });
  return (
    <div ref={ref} className="flex flex-col items-center gap-1.5" title={`${s.label}: ${count}`}>
      <span className="text-xs font-bold tabular-nums" style={{ color: s.text }}>{count}</span>
      <div className="w-6 h-14 rounded-full overflow-hidden flex flex-col-reverse"
        style={{ background: s.bg, border: `1px solid ${s.text}20` }}>
        <motion.div
          className="w-full rounded-full"
          style={{ background: s.text, boxShadow: `0 0 8px ${s.glow}` }}
          initial={{ height: "0%" }}
          animate={inView ? { height: `${(count / max) * 100}%` } : { height: "0%" }}
          transition={{ delay, duration: 0.75, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
      <span className="text-[9px] font-semibold text-[var(--brand-muted)] max-w-[28px] text-center leading-tight">
        {s.label.split(" ")[0]}
      </span>
    </div>
  );
}

/* ─── Framer variants ──────────────────────────────── */
const listVariants = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08 } },
};
const cardVariants = {
  hidden: { opacity: 0, y: 22, scale: 0.97 },
  show:   { opacity: 1, y: 0, scale: 1, transition: { type: "spring", stiffness: 320, damping: 24 } },
  exit:   { opacity: 0, scale: 0.94, y: -8, transition: { duration: 0.2 } },
};

/* ─── Offer card ────────────────────────────────────── */
function OfferCard({
  offer, isSeller, t, onAction, index,
}: {
  offer: Offer; isSeller: boolean; t: (k: string) => string; onAction: () => void; index: number;
}) {
  const router = useRouter();
  const toast  = useToast();
  const [counterPrice, setCounterPrice] = useState("");
  const [counterMsg,   setCounterMsg]   = useState("");
  const [respondPrice, setRespondPrice] = useState("");
  const [respondMsg,   setRespondMsg]   = useState("");
  const [rejectMsg,    setRejectMsg]    = useState("");
  const [loading,      setLoading]      = useState(false);
  const [chatLoading,  setChatLoading]  = useState(false);
  const [panel,        setPanel]        = useState<"counter" | "respond" | "reject" | null>(null);

  const product    = offer.product;
  const listPrice  = product?.price ?? 0;
  const otherParty = isSeller ? offer.buyer : offer.seller;
  const ss         = STATUS_STYLE[offer.status] ?? STATUS_STYLE.pending;

  const handleChat = async () => {
    setChatLoading(true);
    const result = await createConversationByOffer(offer.id);
    setChatLoading(false);
    if (result.success) {
      router.push("/dashboard/chat?with=" + encodeURIComponent(result.conversation.id));
    } else {
      toast.error(result.error ?? "Could not start chat");
    }
  };

  const handleAccept      = async () => { setLoading(true); await acceptOffer(offer.id);                       setLoading(false); onAction(); };
  const handleReject      = async () => { setLoading(true); await rejectOffer(offer.id, rejectMsg || undefined); setLoading(false); setPanel(null); onAction(); };
  const handleCounter     = async () => {
    const p = parseFloat(counterPrice); if (Number.isNaN(p) || p < 0) return;
    setLoading(true); await counterOffer(offer.id, p, counterMsg || undefined);
    setLoading(false); setPanel(null); setCounterPrice(""); setCounterMsg(""); onAction();
  };
  const handleAcceptCounter = async () => { setLoading(true); await acceptCounter(offer.id); setLoading(false); onAction(); };
  const handleRespond     = async () => {
    const p = parseFloat(respondPrice); if (Number.isNaN(p) || p < 0) return;
    setLoading(true); await respondToCounter(offer.id, p, respondMsg || undefined);
    setLoading(false); setPanel(null); setRespondPrice(""); setRespondMsg(""); onAction();
  };

  return (
    <motion.div
      layout
      variants={cardVariants}
      exit={cardVariants.exit}
      whileHover={{
        y: -5,
        boxShadow: `0 18px 52px -8px ${ss.glow}, 0 4px 16px rgba(0,0,0,0.2)`,
        transition: { duration: 0.2 },
      }}
      className="clay-card overflow-hidden relative"
      style={{ borderLeft: `3px solid ${ss.text}` }}
    >
      {/* Animated left glow strip */}
      <motion.div
        className="absolute left-0 top-0 bottom-0 w-14 pointer-events-none"
        initial={{ opacity: 0.25 }}
        whileHover={{ opacity: 1 }}
        style={{ background: `linear-gradient(to right, ${ss.text}22, transparent)` }}
      />

      <div className="flex flex-col md:flex-row relative">

        {/* ── Product info ── */}
        <Link
          href={`/dashboard/product/${offer.productId}`}
          className="flex gap-4 p-5 flex-1 min-w-0 md:border-r border-b md:border-b-0 border-[var(--brand-border)] hover:no-underline group"
        >
          {/* Animated product image */}
          <motion.div
            initial={{ scale: 0.85, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: index * 0.06 + 0.06, type: "spring", stiffness: 400, damping: 22 }}
            className="relative w-20 h-20 rounded-2xl overflow-hidden bg-[var(--brand-border)] shrink-0"
          >
            {product?.imageUrl
              ? <Image src={product.imageUrl} alt={product.name ?? ""} fill
                  className="object-cover transition-transform duration-500 group-hover:scale-110" sizes="80px" />
              : <div className="absolute inset-0 flex items-center justify-center">
                  <ImageIcon className="w-8 h-8 text-[var(--brand-muted)]" />
                </div>
            }
            {/* Status badge overlay on image */}
            <div className="absolute bottom-0 left-0 right-0 h-1"
              style={{ background: ss.text, boxShadow: `0 0 6px ${ss.glow}` }} />
          </motion.div>

          {/* Details — stagger in */}
          <motion.div
            className="min-w-0 flex-1 space-y-2"
            initial="hidden"
            animate="show"
            variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: index * 0.06 + 0.08 } } }}
          >
            {/* Product name */}
            <motion.p
              variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
              className="font-bold text-[var(--foreground)] truncate group-hover:text-[var(--brand-blue)] transition-colors"
            >
              {product?.name ?? "Product"}
            </motion.p>

            {/* Price flow */}
            <motion.div
              variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
              className="flex items-center gap-2 flex-wrap"
            >
              <span className="flex items-center gap-1 text-xs text-[var(--brand-muted)]">
                <Tag className="w-3 h-3" />
                List: <span className="font-semibold text-[var(--foreground)] ml-0.5">${listPrice.toFixed(2)}</span>
              </span>
              <motion.span
                animate={{ x: [0, 3, 0] }}
                transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
              >
                <ArrowRight className="w-3 h-3 text-[var(--brand-muted)]" />
              </motion.span>
              <span className="text-sm font-black text-[var(--foreground)]">
                ${offer.proposedPrice.toFixed(2)}
              </span>
              {offer.status === "countered" && offer.counterPrice != null && (
                <>
                  <motion.span
                    initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.2, type: "spring", stiffness: 500 }}
                  >
                    <ArrowRight className="w-3 h-3 text-[var(--brand-blue)]" />
                  </motion.span>
                  <motion.span
                    initial={{ opacity: 0, scale: 0.7 }} animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.28, type: "spring", stiffness: 500 }}
                    className="text-sm font-bold text-[var(--brand-blue)]"
                  >
                    ${offer.counterPrice.toFixed(2)}
                  </motion.span>
                </>
              )}
            </motion.div>

            {/* Other party */}
            {otherParty && (
              <motion.p
                variants={{ hidden: { opacity: 0, x: -8 }, show: { opacity: 1, x: 0 } }}
                className="flex items-center gap-1.5 text-xs text-[var(--brand-muted)]"
              >
                <UserCircle className="w-3.5 h-3.5 text-[var(--brand-blue)]/80" />
                {isSeller ? t("buyer") : t("product")}:
                <span className="font-semibold text-[var(--foreground)]">
                  {otherParty.name ?? otherParty.email}
                </span>
              </motion.p>
            )}

            {/* Status + messages */}
            <motion.div
              variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } }}
              className="flex flex-wrap items-center gap-2"
            >
              <StatusChip status={offer.status} />
            </motion.div>

            {offer.buyerMessage && (
              <motion.p
                variants={{ hidden: { opacity: 0, y: 4 }, show: { opacity: 1, y: 0 } }}
                className="text-xs text-[var(--brand-muted)] flex items-start gap-1.5 rounded-xl bg-[var(--card-bg)] border border-[var(--brand-border)] px-3 py-2"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5 text-[var(--brand-muted)]" />
                {offer.buyerMessage}
              </motion.p>
            )}
            {offer.counterMessage && offer.status === "countered" && (
              <motion.p
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="text-xs text-[var(--brand-blue)]/90 flex items-start gap-1.5 rounded-xl bg-[var(--brand-blue)]/8 border border-[var(--brand-blue)]/20 px-3 py-2"
              >
                <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {offer.counterMessage}
              </motion.p>
            )}
          </motion.div>
        </Link>

        {/* ── Action buttons panel ── */}
        <motion.div
          className="flex flex-wrap items-start gap-2.5 p-5 md:w-44 md:flex-col md:justify-center bg-[var(--card-bg)]/30"
          initial="hidden"
          animate="show"
          variants={{ hidden: {}, show: { transition: { staggerChildren: 0.07, delayChildren: index * 0.06 + 0.12 } } }}
        >
          {/* Chat */}
          <motion.button
            variants={{ hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }}
            type="button" onClick={handleChat} disabled={chatLoading}
            whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.93 }}
            className="inline-flex items-center gap-2 clay-card-blue px-4 py-2.5 text-sm font-semibold text-[var(--brand-blue)] disabled:opacity-50 w-full justify-center"
            style={{ borderRadius: 14 }}
          >
            {chatLoading
              ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                  <Loader2 className="w-4 h-4" />
                </motion.span>
              : <MessageCircle className="w-4 h-4" />
            }
            {t("chat")}
          </motion.button>

          {/* View */}
          <motion.div
            variants={{ hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }}
            whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.93 }}
            className="w-full"
          >
            <Link
              href={`/dashboard/product/${offer.productId}`}
              className="clay-card inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold text-[var(--foreground)] w-full justify-center"
              style={{ borderRadius: 14 }}
            >
              {t("view")}
              <motion.span animate={{ x: [0, 3, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeInOut" }}>
                <ChevronRight className="w-4 h-4" />
              </motion.span>
            </Link>
          </motion.div>

          {/* Seller: accept / counter / reject */}
          {isSeller && offer.status === "pending" && (
            <>
              <motion.button
                variants={{ hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }}
                onClick={handleAccept} disabled={loading}
                whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.93 }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-50 w-full justify-center transition-colors"
                style={{ borderRadius: 14 }}
              >
                <Check className="w-4 h-4" /> {t("accept")}
              </motion.button>
              <motion.button
                variants={{ hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }}
                onClick={() => setPanel(panel === "counter" ? null : "counter")} disabled={loading}
                whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.93 }}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-2xl border w-full justify-center transition-all ${
                  panel === "counter"
                    ? "bg-amber-500/30 text-amber-300 border-amber-500/50"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                }`}
                style={{ borderRadius: 14 }}
              >
                <Sparkles className="w-4 h-4" /> {t("counter")}
              </motion.button>
              <motion.button
                variants={{ hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }}
                onClick={() => setPanel(panel === "reject" ? null : "reject")} disabled={loading}
                whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.93 }}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-2xl border w-full justify-center transition-all ${
                  panel === "reject"
                    ? "bg-[var(--brand-red)]/30 text-red-300 border-[var(--brand-red)]/50"
                    : "bg-[var(--brand-red)]/15 text-[var(--brand-red)] border-[var(--brand-red)]/30 hover:bg-[var(--brand-red)]/25"
                }`}
                style={{ borderRadius: 14 }}
              >
                <X className="w-4 h-4" /> {t("reject")}
              </motion.button>
            </>
          )}

          {/* Buyer: accept counter / respond */}
          {!isSeller && offer.status === "countered" && (
            <>
              <motion.button
                variants={{ hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }}
                onClick={handleAcceptCounter} disabled={loading}
                whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.93 }}
                className="inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-2xl bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25 disabled:opacity-50 w-full justify-center transition-colors"
                style={{ borderRadius: 14 }}
              >
                <Check className="w-4 h-4" /> {t("acceptCounter")}
              </motion.button>
              <motion.button
                variants={{ hidden: { opacity: 0, x: 10 }, show: { opacity: 1, x: 0 } }}
                onClick={() => setPanel(panel === "respond" ? null : "respond")} disabled={loading}
                whileHover={{ scale: 1.05, y: -1 }} whileTap={{ scale: 0.93 }}
                className={`inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold rounded-2xl border w-full justify-center transition-all ${
                  panel === "respond"
                    ? "bg-amber-500/30 text-amber-300 border-amber-500/50"
                    : "bg-amber-500/15 text-amber-400 border-amber-500/30 hover:bg-amber-500/25"
                }`}
                style={{ borderRadius: 14 }}
              >
                <Sparkles className="w-4 h-4" /> {t("respondWithOffer")}
              </motion.button>
            </>
          )}
        </motion.div>
      </div>

      {/* ── Expandable panel (counter / respond / reject) ── */}
      <AnimatePresence>
        {panel && (
          <motion.div
            key={panel}
            initial={{ opacity: 0, height: 0, y: -4 }}
            animate={{ opacity: 1, height: "auto", y: 0 }}
            exit={{ opacity: 0, height: 0, y: -4 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="overflow-hidden"
          >
            <div className="border-t border-[var(--brand-border)] p-4 bg-[var(--card-bg)]/40">
              <motion.p
                initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }}
                className="text-[10px] font-bold text-[var(--brand-muted)] uppercase tracking-widest mb-3"
              >
                {panel === "counter" ? t("counter") : panel === "respond" ? t("respondWithOffer") : t("reject")}
              </motion.p>
              <motion.div
                className="flex flex-col sm:flex-row gap-2.5"
                initial="hidden"
                animate="show"
                variants={{ hidden: {}, show: { transition: { staggerChildren: 0.06 } } }}
              >
                {(panel === "counter" || panel === "respond") && (
                  <motion.input
                    variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                    type="number" step="0.01" min="0"
                    placeholder={panel === "counter" ? t("counterPrice") : t("proposedPrice")}
                    value={panel === "counter" ? counterPrice : respondPrice}
                    onChange={(e) => panel === "counter" ? setCounterPrice(e.target.value) : setRespondPrice(e.target.value)}
                    className="clay-input w-full sm:w-36 px-4 py-2.5 text-sm text-[var(--foreground)]"
                  />
                )}
                <motion.input
                  variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                  type="text"
                  placeholder={t("message")}
                  value={panel === "counter" ? counterMsg : panel === "respond" ? respondMsg : rejectMsg}
                  onChange={(e) => {
                    if (panel === "counter") setCounterMsg(e.target.value);
                    else if (panel === "respond") setRespondMsg(e.target.value);
                    else setRejectMsg(e.target.value);
                  }}
                  className="clay-input flex-1 px-4 py-2.5 text-sm text-[var(--foreground)] placeholder:text-[var(--brand-muted)]"
                />
                <motion.div
                  variants={{ hidden: { opacity: 0, y: 6 }, show: { opacity: 1, y: 0 } }}
                  className="flex gap-2 shrink-0"
                >
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
                    onClick={panel === "counter" ? handleCounter : panel === "respond" ? handleRespond : handleReject}
                    disabled={loading}
                    className={`rounded-2xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-50 flex items-center gap-1.5 ${
                      panel === "reject" ? "bg-[var(--brand-red)]" : "bg-[var(--brand-blue)]"
                    }`}
                  >
                    {loading
                      ? <motion.span animate={{ rotate: 360 }} transition={{ duration: 0.8, repeat: Infinity, ease: "linear" }}>
                          <Loader2 className="w-4 h-4" />
                        </motion.span>
                      : panel === "counter" ? t("counter") : panel === "respond" ? t("respondWithOffer") : t("reject")
                    }
                  </motion.button>
                  <motion.button
                    whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.93 }}
                    onClick={() => setPanel(null)}
                    className="clay-card rounded-2xl px-4 py-2.5 text-sm font-semibold text-[var(--foreground)]"
                  >
                    {t("cancel")}
                  </motion.button>
                </motion.div>
              </motion.div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

/* ─── Page ─────────────────────────────────────────── */
export default function OffersPage() {
  const { user }  = useAuth();
  const t         = useTranslations("offers");
  const isSeller  = user?.role === "seller";
  const [offers,  setOffers]  = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter,  setFilter]  = useState("");

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const list = await listOffers({ asSeller: isSeller, status: filter || undefined });
    setOffers(list); setLoading(false);
  }, [isSeller, filter]);

  useEffect(() => { fetchOffers(); }, [fetchOffers]);

  const statusCounts = offers.reduce<Record<string, number>>((acc, o) => {
    acc[o.status] = (acc[o.status] ?? 0) + 1; return acc;
  }, {});
  const maxCount = Math.max(1, ...Object.values(statusCounts));

  /* ── Skeleton ── */
  if (loading && offers.length === 0) {
    return (
      <div className="space-y-5">
        <div className="clay-card p-6">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-2xl bg-[var(--brand-border)] loading-shimmer-bar opacity-40 shrink-0" />
            <div className="space-y-2 flex-1">
              <div className="h-7 w-44 rounded-xl bg-[var(--brand-border)] loading-shimmer-bar opacity-40" />
              <div className="h-4 w-28 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-25" />
            </div>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          {[64, 72, 84, 76, 72].map((w, i) => (
            <div key={i} className="h-8 rounded-full bg-[var(--brand-border)] loading-shimmer-bar opacity-30"
              style={{ width: w }} />
          ))}
        </div>
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

      {/* ── Header ── */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: -18 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 300, damping: 24 } } }}
        className="clay-card p-6 relative overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-amber-500/8 via-transparent to-transparent pointer-events-none rounded-[24px]" />
        <motion.div
          animate={{ scale: [1, 1.18, 1], opacity: [0.04, 0.09, 0.04] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
          className="absolute -top-12 -right-12 w-56 h-56 rounded-full bg-amber-500 blur-3xl pointer-events-none"
        />

        <div className="relative flex flex-col sm:flex-row sm:items-center sm:justify-between gap-6">
          <div className="flex items-center gap-4">
            <motion.div
              initial={{ rotate: -20, scale: 0.5, opacity: 0 }}
              animate={{ rotate: 0, scale: 1, opacity: 1 }}
              transition={{ delay: 0.08, type: "spring", stiffness: 500, damping: 18 }}
              whileHover={{ rotate: [0, -10, 10, 0], transition: { duration: 0.5 } }}
              className="w-12 h-12 flex items-center justify-center rounded-2xl bg-amber-500/15 text-amber-400 shrink-0 cursor-default"
              style={{ boxShadow: "0 4px 20px rgba(245,158,11,0.25)" }}
            >
              <HandCoins className="w-6 h-6" />
            </motion.div>
            <div>
              <motion.h1
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.12, type: "spring", stiffness: 400 }}
                className="text-2xl font-black text-[var(--foreground)]"
              >
                {isSeller ? t("incomingOffers") : t("myOffers")}
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.18 }}
                className="text-sm text-[var(--brand-muted)] mt-0.5 flex items-center gap-2"
              >
                {offers.length > 0 ? (
                  <>
                    <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
                    <CountUp to={offers.length} /> offer{offers.length !== 1 ? "s" : ""}
                    {filter ? " · filtered" : ""}
                  </>
                ) : (
                  `Negotiate prices with ${isSeller ? "buyers" : "sellers"}`
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

      {/* ── Filter tabs ── */}
      <motion.div
        variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0, transition: { type: "spring", stiffness: 340 } } }}
        className="flex flex-wrap gap-2"
      >
        {STATUS_OPTIONS.map((opt, idx) => {
          const active = filter === opt.value;
          const s      = opt.value ? STATUS_STYLE[opt.value] : null;
          return (
            <motion.button
              key={opt.value || "all"} type="button"
              onClick={() => setFilter(opt.value)}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.05 + idx * 0.04, type: "spring", stiffness: 400, damping: 20 }}
              whileHover={{ scale: 1.06, y: -1 }}
              whileTap={{ scale: 0.93 }}
              className={`relative rounded-full px-4 py-2 text-xs font-bold transition-colors border overflow-hidden ${
                active
                  ? opt.value ? "border-transparent text-white" : "clay-badge-blue border-transparent"
                  : "border-[var(--brand-border)] text-[var(--brand-muted)] hover:text-[var(--foreground)]"
              }`}
              style={active && opt.value && s ? { background: s.text, boxShadow: `0 4px 16px ${s.glow}` } : undefined}
            >
              {active && (
                <motion.span
                  layoutId="offer-filter-pill"
                  className="absolute inset-0 rounded-full pointer-events-none"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <span className="relative">
                {opt.value ? t(opt.labelKey) : t("all")}
                {opt.value && statusCounts[opt.value] ? ` (${statusCounts[opt.value]})` : ""}
              </span>
            </motion.button>
          );
        })}
      </motion.div>

      {/* ── Empty state ── */}
      <AnimatePresence>
        {offers.length === 0 && !loading && (
          <motion.div
            key="empty"
            initial={{ opacity: 0, y: 24, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -12, scale: 0.96 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
            className="clay-card p-20 text-center"
          >
            <motion.div
              animate={{ y: [0, -12, 0], rotate: [0, -6, 6, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Package className="mx-auto w-16 h-16 text-[var(--brand-muted)]/20 mb-6" />
            </motion.div>
            <motion.p
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="text-xl font-black text-[var(--foreground)] mb-2"
            >
              {t("noOffers")}
            </motion.p>
            <motion.p
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.16 }}
              className="text-sm text-[var(--brand-muted)] mb-8 max-w-sm mx-auto"
            >
              {isSeller ? t("noOffersSeller") : t("noOffersBuyer")}
            </motion.p>
            <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.22 }}
              whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
              <Link href="/dashboard/browse"
                className="clay-btn-blue px-7 py-3 text-sm inline-flex items-center gap-2">
                {t("browseProducts")} <ChevronRight className="w-4 h-4" />
              </Link>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Offers list ── */}
      <motion.ul
        className="space-y-3 list-none"
        variants={listVariants}
        initial="hidden"
        animate="show"
      >
        <AnimatePresence mode="popLayout">
          {offers.map((offer, i) => (
            <li key={offer.id} className="list-none">
              <OfferCard offer={offer} isSeller={isSeller} t={t} onAction={fetchOffers} index={i} />
            </li>
          ))}
        </AnimatePresence>
      </motion.ul>
    </motion.div>
  );
}
