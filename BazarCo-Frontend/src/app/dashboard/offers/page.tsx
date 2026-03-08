"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  HandCoins,
  Loader2,
  ImageIcon,
  UserCircle,
  ChevronRight,
  Check,
  X,
  MessageSquare,
  MessageCircle,
  Package,
  DollarSign,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/contexts/ToastContext";
import {
  listOffers,
  acceptOffer,
  rejectOffer,
  counterOffer,
  acceptCounter,
  respondToCounter,
  createConversationByOffer,
  type Offer,
} from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "", labelKey: "all" as const },
  { value: "pending", labelKey: "statusPending" as const },
  { value: "countered", labelKey: "statusCountered" as const },
  { value: "accepted", labelKey: "statusAccepted" as const },
  { value: "rejected", labelKey: "statusRejected" as const },
];

const statusAccent: Record<string, string> = {
  pending: "border-l-amber-500",
  countered: "border-l-[var(--brand-blue)]",
  accepted: "border-l-emerald-500",
  rejected: "border-l-[var(--brand-red)]",
};

function OfferCard({
  offer,
  isSeller,
  t,
  onAction,
}: {
  offer: Offer;
  isSeller: boolean;
  t: (key: string) => string;
  onAction: () => void;
}) {
  const router = useRouter();
  const toast = useToast();
  const [counterPrice, setCounterPrice] = useState("");
  const [counterMsg, setCounterMsg] = useState("");
  const [respondPrice, setRespondPrice] = useState("");
  const [respondMsg, setRespondMsg] = useState("");
  const [rejectMsg, setRejectMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
  const [showRespond, setShowRespond] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const product = offer.product;
  const listPrice = product?.price ?? 0;
  const otherParty = isSeller ? offer.buyer : offer.seller;

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

  const handleAccept = async () => {
    setLoading(true);
    await acceptOffer(offer.id);
    setLoading(false);
    onAction();
  };

  const handleReject = async () => {
    setLoading(true);
    await rejectOffer(offer.id, rejectMsg || undefined);
    setLoading(false);
    setShowReject(false);
    onAction();
  };

  const handleCounter = async () => {
    const price = parseFloat(counterPrice);
    if (Number.isNaN(price) || price < 0) return;
    setLoading(true);
    await counterOffer(offer.id, price, counterMsg || undefined);
    setLoading(false);
    setShowCounter(false);
    setCounterPrice("");
    setCounterMsg("");
    onAction();
  };

  const handleAcceptCounter = async () => {
    setLoading(true);
    await acceptCounter(offer.id);
    setLoading(false);
    onAction();
  };

  const handleRespond = async () => {
    const price = parseFloat(respondPrice);
    if (Number.isNaN(price) || price < 0) return;
    setLoading(true);
    await respondToCounter(offer.id, price, respondMsg || undefined);
    setLoading(false);
    setShowRespond(false);
    setRespondPrice("");
    setRespondMsg("");
    onAction();
  };

  const statusStyles: Record<string, string> = {
    pending: "bg-amber-500/25 text-amber-400 border-amber-500/50",
    countered: "bg-[var(--brand-blue)]/25 text-[var(--brand-blue)] border-[var(--brand-blue)]/50",
    accepted: "bg-emerald-500/25 text-emerald-400 border-emerald-500/50",
    rejected: "bg-[var(--brand-red)]/25 text-[var(--brand-red)] border-[var(--brand-red)]/50",
  };
  const statusKey: Record<string, string> = {
    pending: "statusPending",
    countered: "statusCountered",
    accepted: "statusAccepted",
    rejected: "statusRejected",
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className={`rounded-2xl border border-white/10 bg-white/[0.03] overflow-hidden transition-all duration-300 hover:border-white/20 hover:shadow-xl hover:shadow-black/20 border-l-4 ${statusAccent[offer.status] ?? "border-l-neutral-500"}`}
    >
      <div className="flex flex-col sm:flex-row sm:items-stretch gap-0">
        <Link
          href={`/dashboard/product/${offer.productId}`}
          className="flex gap-4 p-5 flex-1 min-w-0 sm:border-r border-b sm:border-b-0 border-white/5"
        >
          {product?.imageUrl ? (
            <div className="relative w-24 h-24 rounded-xl overflow-hidden bg-white/5 shrink-0">
              <Image src={product.imageUrl} alt={product.name ?? ""} fill className="object-cover" sizes="96px" />
            </div>
          ) : (
            <div className="w-24 h-24 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <ImageIcon className="w-10 h-10 text-neutral-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-[var(--brand-white)] truncate">{product?.name ?? "Product"}</p>
            <p className="text-sm text-neutral-400 mt-0.5 flex items-center gap-1.5">
              <DollarSign className="w-3.5 h-3.5" />
              {t("listPrice")}: ${listPrice.toFixed(2)}
            </p>
            {otherParty && (
              <p className="flex items-center gap-1.5 mt-2 text-sm text-neutral-400">
                <UserCircle className="w-4 h-4 text-[var(--brand-blue)]/80" />
                {isSeller ? t("buyer") : t("product")}: {otherParty.name ?? otherParty.email ?? offer.buyerId}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className={`rounded-full border px-2.5 py-1 text-xs font-semibold ${statusStyles[offer.status] ?? statusStyles.pending}`}>
                {t(statusKey[offer.status] ?? "statusPending")}
              </span>
              <span className="text-base font-bold text-[var(--brand-white)]">${offer.proposedPrice.toFixed(2)}</span>
              {offer.status === "countered" && offer.counterPrice != null && (
                <span className="text-sm text-[var(--brand-blue)]">
                  {t("counterPrice")}: ${offer.counterPrice.toFixed(2)}
                </span>
              )}
            </div>
            {offer.buyerMessage && (
              <p className="mt-2 text-xs text-neutral-400 flex items-start gap-1.5 rounded-lg bg-white/[0.03] px-2.5 py-1.5">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {offer.buyerMessage}
              </p>
            )}
            {offer.counterMessage && offer.status === "countered" && (
              <p className="mt-1.5 text-xs text-[var(--brand-blue)]/90 flex items-start gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {offer.counterMessage}
              </p>
            )}
          </div>
        </Link>

        <div className="flex flex-wrap items-center gap-2 p-4 sm:p-5 bg-white/[0.02] sm:min-w-[200px]">
          <button
            type="button"
            onClick={handleChat}
            disabled={chatLoading}
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40 px-4 py-2.5 text-sm font-medium hover:bg-[var(--brand-blue)]/30 transition-colors disabled:opacity-50"
          >
            {chatLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageCircle className="w-4 h-4" />}
            {t("chat")}
          </button>
          <Link
            href={`/dashboard/product/${offer.productId}`}
            className="inline-flex items-center gap-1.5 rounded-xl border border-white/15 px-4 py-2.5 text-sm font-medium text-[var(--brand-white)] hover:bg-white/5 transition-colors"
          >
            {t("view")}
            <ChevronRight className="w-4 h-4" />
          </Link>
          {isSeller && offer.status === "pending" && (
            <>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-2.5 text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {t("accept")}
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-red)]/20 text-[var(--brand-red)] border border-[var(--brand-red)]/40 px-3 py-2.5 text-sm font-medium hover:bg-[var(--brand-red)]/30 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                {t("reject")}
              </button>
              <button
                onClick={() => setShowCounter(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-2.5 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50"
              >
                {t("counter")}
              </button>
            </>
          )}
          {!isSeller && offer.status === "countered" && (
            <>
              <button
                onClick={handleAcceptCounter}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-2.5 text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {t("acceptCounter")}
              </button>
              <button
                onClick={() => setShowRespond(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-2.5 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50"
              >
                {t("respondWithOffer")}
              </button>
            </>
          )}
        </div>
      </div>

      {showCounter && (
        <div className="border-t border-white/10 p-4 flex flex-col sm:flex-row gap-3 bg-white/[0.02]">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder={t("counterPrice")}
            value={counterPrice}
            onChange={(e) => setCounterPrice(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-[var(--brand-white)] w-full sm:w-36"
          />
          <input
            type="text"
            placeholder={t("message")}
            value={counterMsg}
            onChange={(e) => setCounterMsg(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-[var(--brand-white)] placeholder:text-neutral-500"
          />
          <div className="flex gap-2">
            <button onClick={handleCounter} disabled={loading} className="rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("counter")}
            </button>
            <button onClick={() => setShowCounter(false)} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm text-[var(--brand-white)] hover:bg-white/5">
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {showRespond && (
        <div className="border-t border-white/10 p-4 flex flex-col sm:flex-row gap-3 bg-white/[0.02]">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder={t("proposedPrice")}
            value={respondPrice}
            onChange={(e) => setRespondPrice(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-[var(--brand-white)] w-full sm:w-36"
          />
          <input
            type="text"
            placeholder={t("message")}
            value={respondMsg}
            onChange={(e) => setRespondMsg(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-[var(--brand-white)] placeholder:text-neutral-500"
          />
          <div className="flex gap-2">
            <button onClick={handleRespond} disabled={loading} className="rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("respondWithOffer")}
            </button>
            <button onClick={() => setShowRespond(false)} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm text-[var(--brand-white)] hover:bg-white/5">
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {showReject && (
        <div className="border-t border-white/10 p-4 flex flex-col sm:flex-row gap-3 bg-white/[0.02]">
          <input
            type="text"
            placeholder={t("message")}
            value={rejectMsg}
            onChange={(e) => setRejectMsg(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2.5 text-sm text-[var(--brand-white)] placeholder:text-neutral-500"
          />
          <div className="flex gap-2">
            <button onClick={handleReject} disabled={loading} className="rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white hover:opacity-90 disabled:opacity-50">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("reject")}
            </button>
            <button onClick={() => setShowReject(false)} className="rounded-xl border border-white/20 px-4 py-2.5 text-sm text-[var(--brand-white)] hover:bg-white/5">
              {t("cancel")}
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
}

export default function OffersPage() {
  const { user } = useAuth();
  const t = useTranslations("offers");
  const isSeller = user?.role === "seller";
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");

  const fetchOffers = useCallback(async () => {
    setLoading(true);
    const list = await listOffers({ asSeller: isSeller, status: filter || undefined });
    setOffers(list);
    setLoading(false);
  }, [isSeller, filter]);

  useEffect(() => {
    fetchOffers();
  }, [fetchOffers]);

  return (
    <div className="space-y-8">
      <motion.div
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl font-bold text-[var(--brand-white)] flex items-center gap-3">
            <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.1)]">
              <HandCoins className="w-6 h-6" />
            </span>
            {isSeller ? t("incomingOffers") : t("myOffers")}
          </h1>
          <p className="text-sm text-neutral-400 mt-1.5">
            {offers.length > 0 ? `${offers.length} offer${offers.length !== 1 ? "s" : ""}` : "Negotiate and chat with buyers"}
          </p>
        </div>
        <div className="flex items-center gap-2 rounded-xl border border-white/10 bg-white/[0.04] p-1.5 flex-wrap">
          {STATUS_OPTIONS.map((opt) => (
            <button
              key={opt.value || "all"}
              type="button"
              onClick={() => setFilter(opt.value)}
              className={`rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                filter === opt.value
                  ? "bg-amber-500/20 text-amber-400 shadow-sm"
                  : "text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5"
              }`}
            >
              {opt.value ? t(opt.labelKey) : t("all")}
            </button>
          ))}
        </div>
      </motion.div>

      {loading && offers.length === 0 ? (
        <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
          <Loader2 className="w-10 h-10 text-amber-400 animate-spin" />
          <p className="text-sm text-neutral-400">Loading offers…</p>
        </div>
      ) : offers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
          className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.06] to-transparent p-16 text-center"
        >
          <div className="mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-2xl bg-white/[0.06] border border-white/10">
            <HandCoins className="w-10 h-10 text-neutral-500" />
          </div>
          <p className="text-lg font-semibold text-[var(--brand-white)] mb-2">{t("noOffers")}</p>
          <p className="text-sm text-neutral-400 mb-8 max-w-sm mx-auto">
            {isSeller ? t("noOffersSeller") : t("noOffersBuyer")}
          </p>
          <Link
            href="/dashboard/browse"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40 px-5 py-2.5 text-sm font-medium hover:bg-[var(--brand-blue)]/30 transition-colors"
          >
            {t("browseProducts")}
            <ChevronRight className="w-4 h-4" />
          </Link>
        </motion.div>
      ) : (
        <ul className="space-y-4 list-none">
          <AnimatePresence mode="popLayout">
            {offers.map((offer) => (
              <li key={offer.id}>
                <OfferCard offer={offer} isSeller={isSeller} t={t} onAction={fetchOffers} />
              </li>
            ))}
          </AnimatePresence>
        </ul>
      )}
    </div>
  );
}
