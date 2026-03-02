"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { HandCoins, Loader2, ImageIcon, UserCircle, ChevronRight, Check, X, MessageSquare } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import {
  listOffers,
  getOfferById,
  acceptOffer,
  rejectOffer,
  counterOffer,
  acceptCounter,
  respondToCounter,
  type Offer,
} from "@/lib/api";

const STATUS_OPTIONS = [
  { value: "", labelKey: "all" as const },
  { value: "pending", labelKey: "statusPending" as const },
  { value: "countered", labelKey: "statusCountered" as const },
  { value: "accepted", labelKey: "statusAccepted" as const },
  { value: "rejected", labelKey: "statusRejected" as const },
];

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
  const [counterPrice, setCounterPrice] = useState("");
  const [counterMsg, setCounterMsg] = useState("");
  const [respondPrice, setRespondPrice] = useState("");
  const [respondMsg, setRespondMsg] = useState("");
  const [rejectMsg, setRejectMsg] = useState("");
  const [loading, setLoading] = useState(false);
  const [showCounter, setShowCounter] = useState(false);
  const [showRespond, setShowRespond] = useState(false);
  const [showReject, setShowReject] = useState(false);

  const product = offer.product;
  const listPrice = product?.price ?? 0;
  const otherParty = isSeller ? offer.buyer : offer.seller;

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
    pending: "bg-amber-500/20 text-amber-400 border-amber-500/40",
    countered: "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border-[var(--brand-blue)]/40",
    accepted: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
    rejected: "bg-[var(--brand-red)]/20 text-[var(--brand-red)] border-[var(--brand-red)]/40",
  };
  const statusKey: Record<string, string> = {
    pending: "statusPending",
    countered: "statusCountered",
    accepted: "statusAccepted",
    rejected: "statusRejected",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_0_0_1px_rgba(255,255,255,0.04)]"
    >
      <div className="flex flex-col sm:flex-row sm:items-start gap-4">
        <div className="flex gap-4 flex-1 min-w-0">
          {product?.imageUrl ? (
            <Link href={`/dashboard/product/${offer.productId}`} className="relative w-20 h-20 rounded-xl overflow-hidden bg-white/5 shrink-0">
              <Image src={product.imageUrl} alt={product.name ?? ""} fill className="object-cover" sizes="80px" />
            </Link>
          ) : (
            <div className="w-20 h-20 rounded-xl bg-white/5 flex items-center justify-center shrink-0">
              <ImageIcon className="w-8 h-8 text-neutral-500" />
            </div>
          )}
          <div className="min-w-0 flex-1">
            <Link href={`/dashboard/product/${offer.productId}`} className="font-semibold text-[var(--brand-white)] hover:underline truncate block">
              {product?.name ?? "Product"}
            </Link>
            <p className="text-sm text-neutral-400 mt-0.5">
              {t("listPrice")}: ${listPrice.toFixed(2)}
            </p>
            {otherParty && (
              <p className="flex items-center gap-1.5 mt-2 text-xs text-neutral-500">
                <UserCircle className="w-3.5 h-3.5" />
                {t("buyer")}: {otherParty.name ?? otherParty.email ?? offer.buyerId}
              </p>
            )}
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className={`rounded-full border px-2.5 py-0.5 text-xs font-medium ${statusStyles[offer.status] ?? statusStyles.pending}`}>
                {t(statusKey[offer.status] ?? "statusPending")}
              </span>
              <span className="text-sm text-[var(--brand-white)] font-medium">
                ${offer.proposedPrice.toFixed(2)}
              </span>
              {offer.status === "countered" && offer.counterPrice != null && (
                <span className="text-sm text-[var(--brand-blue)]">
                  {t("counterPrice")}: ${offer.counterPrice.toFixed(2)}
                </span>
              )}
            </div>
            {offer.buyerMessage && (
              <p className="mt-2 text-xs text-neutral-400 flex items-start gap-1">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {offer.buyerMessage}
              </p>
            )}
            {offer.counterMessage && offer.status === "countered" && (
              <p className="mt-1 text-xs text-[var(--brand-blue)]/90 flex items-start gap-1">
                <MessageSquare className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                {offer.counterMessage}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {isSeller && offer.status === "pending" && (
            <>
              <button
                onClick={handleAccept}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-2 text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {t("accept")}
              </button>
              <button
                onClick={() => setShowReject(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-red)]/20 text-[var(--brand-red)] border border-[var(--brand-red)]/40 px-3 py-2 text-sm font-medium hover:bg-[var(--brand-red)]/30 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
                {t("reject")}
              </button>
              <button
                onClick={() => setShowCounter(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40 px-3 py-2 text-sm font-medium hover:bg-[var(--brand-blue)]/30 disabled:opacity-50"
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
                className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 px-3 py-2 text-sm font-medium hover:bg-emerald-500/30 disabled:opacity-50"
              >
                <Check className="w-4 h-4" />
                {t("acceptCounter")}
              </button>
              <button
                onClick={() => setShowRespond(true)}
                disabled={loading}
                className="inline-flex items-center gap-1.5 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/40 px-3 py-2 text-sm font-medium hover:bg-amber-500/30 disabled:opacity-50"
              >
                {t("respondWithOffer")}
              </button>
            </>
          )}
        </div>
      </div>

      {showCounter && (
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder={t("counterPrice")}
            value={counterPrice}
            onChange={(e) => setCounterPrice(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-[var(--brand-white)] w-32"
          />
          <input
            type="text"
            placeholder={t("message")}
            value={counterMsg}
            onChange={(e) => setCounterMsg(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-[var(--brand-white)] placeholder:text-neutral-500"
          />
          <div className="flex gap-2">
            <button onClick={handleCounter} disabled={loading} className="rounded-xl bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("counter")}
            </button>
            <button onClick={() => setShowCounter(false)} className="rounded-xl border border-white/20 px-4 py-2 text-sm">
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {showRespond && (
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
          <input
            type="number"
            step="0.01"
            min="0"
            placeholder={t("proposedPrice")}
            value={respondPrice}
            onChange={(e) => setRespondPrice(e.target.value)}
            className="rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-[var(--brand-white)] w-32"
          />
          <input
            type="text"
            placeholder={t("message")}
            value={respondMsg}
            onChange={(e) => setRespondMsg(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-[var(--brand-white)] placeholder:text-neutral-500"
          />
          <div className="flex gap-2">
            <button onClick={handleRespond} disabled={loading} className="rounded-xl bg-[var(--brand-blue)] px-4 py-2 text-sm font-medium text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("respondWithOffer")}
            </button>
            <button onClick={() => setShowRespond(false)} className="rounded-xl border border-white/20 px-4 py-2 text-sm">
              {t("cancel")}
            </button>
          </div>
        </div>
      )}

      {showReject && (
        <div className="mt-4 pt-4 border-t border-white/10 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder={t("message")}
            value={rejectMsg}
            onChange={(e) => setRejectMsg(e.target.value)}
            className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-2 text-sm text-[var(--brand-white)] placeholder:text-neutral-500"
          />
          <div className="flex gap-2">
            <button onClick={handleReject} disabled={loading} className="rounded-xl bg-[var(--brand-red)] px-4 py-2 text-sm font-medium text-white">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : t("reject")}
            </button>
            <button onClick={() => setShowReject(false)} className="rounded-xl border border-white/20 px-4 py-2 text-sm">
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
  const tNav = useTranslations("nav");
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <h1 className="text-2xl font-bold text-[var(--brand-white)] flex items-center gap-2">
          <HandCoins className="w-7 h-7 text-[var(--brand-blue)]" />
          {isSeller ? t("incomingOffers") : t("myOffers")}
        </h1>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          className="rounded-xl bg-white/[0.06] border border-white/10 px-4 py-2 text-sm text-[var(--brand-white)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/50"
        >
          {STATUS_OPTIONS.map((opt) => (
            <option key={opt.value || "all"} value={opt.value}>
              {opt.value ? t(opt.labelKey) : "All"}
            </option>
          ))}
        </select>
      </div>

      {loading && offers.length === 0 ? (
        <div className="flex items-center justify-center min-h-[40vh]">
          <Loader2 className="w-8 h-8 text-[var(--brand-blue)] animate-spin" />
        </div>
      ) : offers.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="rounded-2xl bg-white/[0.04] p-12 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
        >
          <HandCoins className="mx-auto w-12 h-12 text-neutral-500 mb-4" />
          <p className="text-[var(--brand-white)] font-medium mb-1">{t("noOffers")}</p>
          <p className="text-sm text-neutral-400 mb-6">
            {isSeller ? t("noOffersSeller") : t("noOffersBuyer")}
          </p>
          <Link href="/dashboard/browse" className="text-[var(--brand-blue)] hover:underline text-sm">
            {t("browseProducts")}
          </Link>
        </motion.div>
      ) : (
        <ul className="space-y-4">
          {offers.map((offer) => (
            <li key={offer.id}>
              <OfferCard offer={offer} isSeller={isSeller} t={t} onAction={fetchOffers} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
