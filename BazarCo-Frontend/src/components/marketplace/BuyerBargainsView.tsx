"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import {
  ArrowRight,
  Bell,
  Check,
  ChevronRight,
  Clock,
  HandCoins,
  ImageIcon,
  Loader2,
  MessageCircle,
  Plus,
  ShoppingCart,
  TrendingUp,
  X,
} from "lucide-react";
import { useToast } from "@/contexts/ToastContext";
import { useCurrency } from "@/contexts/CurrencyContext";
import {
  acceptCounter,
  createConversationByOffer,
  listOffers,
  rejectOffer,
  respondToCounter,
  type Offer,
} from "@/lib/api";

type TabFilter = "active" | "counters" | "accepted" | "all";

function pseudoRounds(offer: Offer): { current: number; max: number } {
  let hash = 0;
  for (const ch of offer.id) hash = (hash * 17 + ch.charCodeAt(0)) & 0xffffffff;
  const max = 5;
  if (offer.status === "accepted") return { current: max, max };
  if (offer.status === "countered") return { current: 3 + (Math.abs(hash) % 2), max };
  if (offer.status === "pending") return { current: 2 + (Math.abs(hash) % 2), max };
  return { current: 1, max };
}

function expiryLabel(updatedAt: string): string {
  const end = new Date(updatedAt).getTime() + 3 * 60 * 60 * 1000;
  const diff = Math.max(0, end - Date.now());
  const h = Math.floor(diff / (60 * 60 * 1000));
  const m = Math.floor((diff % (60 * 60 * 1000)) / (60 * 1000));
  return `${h}H ${m}M`;
}

function BargainCard({ offer, onRefresh }: { offer: Offer; onRefresh: () => void }) {
  const router = useRouter();
  const toast = useToast();
  const t = useTranslations("buyerBargains");
  const { formatPrice } = useCurrency();
  const [loading, setLoading] = useState(false);
  const [respondPrice, setRespondPrice] = useState("");

  const product = offer.product;
  const listPrice = product?.price ?? 0;
  const shopName = offer.seller?.name ?? offer.seller?.email?.split("@")[0] ?? t("defaultShop");
  const rounds = pseudoRounds(offer);
  const roundPct = (rounds.current / rounds.max) * 100;

  const handleChat = async () => {
    setLoading(true);
    const result = await createConversationByOffer(offer.id);
    setLoading(false);
    if (result.success) {
      router.push("/dashboard/chat?with=" + encodeURIComponent(result.conversation.id));
    } else {
      toast.error(result.error ?? "Could not start chat");
    }
  };

  const handleAcceptCounter = async () => {
    setLoading(true);
    await acceptCounter(offer.id);
    setLoading(false);
    onRefresh();
  };

  const handleRespond = async () => {
    const p = parseFloat(respondPrice);
    if (Number.isNaN(p) || p < 0) return;
    setLoading(true);
    await respondToCounter(offer.id, p);
    setLoading(false);
    setRespondPrice("");
    onRefresh();
  };

  const handleWithdraw = async () => {
    if (!confirm(t("withdrawConfirm"))) return;
    setLoading(true);
    await rejectOffer(offer.id);
    setLoading(false);
    onRefresh();
  };

  const status = offer.status;
  const theme =
    status === "accepted"
      ? { bar: "bg-emerald-500", badge: "bg-emerald-100 text-emerald-800", price: "text-emerald-600" }
      : status === "countered"
        ? { bar: "bg-[var(--brand-red)]", badge: "bg-red-100 text-red-800", price: "text-[var(--brand-red)]" }
        : status === "pending"
          ? { bar: "bg-sky-500", badge: "bg-sky-100 text-sky-800", price: "text-sky-600" }
          : { bar: "bg-neutral-400", badge: "bg-neutral-100 text-neutral-700", price: "text-neutral-600" };

  const priceLabel =
    status === "accepted"
      ? t("finalPrice", { price: formatPrice(offer.proposedPrice) })
      : status === "countered"
        ? t("counterPrice", { price: formatPrice(offer.counterPrice ?? 0) })
        : t("yourOffer", { price: formatPrice(offer.proposedPrice) });

  const savings =
    listPrice > 0
      ? listPrice -
        (status === "countered" && offer.counterPrice != null
          ? offer.counterPrice
          : offer.proposedPrice)
      : 0;

  return (
    <article className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] shadow-sm overflow-hidden">
      <div className="flex flex-col lg:flex-row">
        <div className="flex flex-1 gap-4 p-5 min-w-0">
          <Link
            href={`/dashboard/product/${offer.productId}`}
            className="relative h-28 w-28 sm:h-32 sm:w-32 shrink-0 rounded-xl overflow-hidden bg-neutral-100 border border-neutral-200 hover:opacity-95"
          >
            {product?.imageUrl ? (
              <Image src={product.imageUrl} alt={product.name ?? ""} fill className="object-cover" sizes="128px" />
            ) : (
              <ImageIcon className="absolute inset-0 m-auto h-10 w-10 text-neutral-300" />
            )}
          </Link>

          <div className="min-w-0 flex-1 space-y-3">
            <div>
              <Link
                href={`/dashboard/product/${offer.productId}`}
                className="font-bold text-lg text-[var(--foreground)] hover:text-[var(--brand-red)] line-clamp-2"
              >
                {product?.name ?? t("product")}
              </Link>
              <p className="text-xs text-[var(--brand-muted)] mt-0.5">
                {t("shopLabel")}: <span className="font-medium text-[var(--foreground)]">{shopName}</span>
              </p>
            </div>

            {status !== "rejected" && (
              <div>
                <div className="flex justify-between text-[10px] font-semibold text-[var(--brand-muted)] mb-1">
                  <span>{t("negotiationProgress")}</span>
                  <span>
                    {t("rounds", { current: rounds.current, max: rounds.max })}
                  </span>
                </div>
                <div className="h-2 rounded-full bg-neutral-100 overflow-hidden">
                  <div
                    className={`h-full rounded-full transition-all ${theme.bar}`}
                    style={{ width: `${roundPct}%` }}
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap items-center gap-2">
              <span className={`text-[10px] font-bold uppercase px-2.5 py-1 rounded-md ${theme.badge}`}>
                {status === "countered"
                  ? t("badgeCountered")
                  : status === "pending"
                    ? t("badgeAwaiting")
                    : status === "accepted"
                      ? t("badgeAccepted")
                      : t("statusRejected")}
              </span>
              {status === "accepted" && (
                <>
                  <span className="text-[10px] font-bold uppercase px-2.5 py-1 rounded-md bg-emerald-500 text-white">
                    {t("bargainSuccessful")}
                  </span>
                  <span className="text-xs font-semibold text-emerald-700 flex items-center gap-1">
                    <Check className="h-3.5 w-3.5" /> {t("offerLocked")}
                  </span>
                </>
              )}
            </div>

            <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
              {listPrice > 0 && (
                <span className="text-sm text-neutral-400 line-through">{formatPrice(listPrice)}</span>
              )}
              <span className={`text-xl font-black ${theme.price}`}>{priceLabel}</span>
              {status === "accepted" && savings > 0 && (
                <span className="text-xs font-semibold text-emerald-600">{t("youSave", { amount: formatPrice(savings) })}</span>
              )}
            </div>

            {offer.buyerMessage && (
              <p className="text-xs text-[var(--brand-muted)] italic line-clamp-2">&ldquo;{offer.buyerMessage}&rdquo;</p>
            )}
            {status === "countered" && offer.counterMessage && (
              <p className="text-xs text-red-800/90 bg-red-50 rounded-lg px-2.5 py-1.5 line-clamp-2">{offer.counterMessage}</p>
            )}
          </div>
        </div>

        <div className="flex flex-row lg:flex-col gap-2 p-4 lg:w-48 border-t lg:border-t-0 lg:border-l border-neutral-100 bg-neutral-50/80 dark:bg-neutral-900/30 lg:justify-center shrink-0">
          <button
            type="button"
            onClick={handleChat}
            disabled={loading}
            className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
          >
            {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <MessageCircle className="h-4 w-4" />}
            {t("chat")}
          </button>

          {status === "countered" && (
            <>
              <button
                type="button"
                onClick={handleAcceptCounter}
                disabled={loading}
                className="flex-1 lg:flex-none rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-bold text-white hover:bg-[#b71c1c] disabled:opacity-50"
              >
                {t("acceptCounter")}
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={loading}
                className="flex-1 lg:flex-none rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50 disabled:opacity-50"
              >
                {t("withdraw")}
              </button>
            </>
          )}

          {status === "pending" && (
            <>
              <button
                type="button"
                disabled
                className="flex-1 lg:flex-none rounded-xl bg-neutral-200 text-neutral-500 px-4 py-2.5 text-sm font-semibold cursor-not-allowed"
              >
                {t("waiting")}
              </button>
              <button
                type="button"
                onClick={handleWithdraw}
                disabled={loading}
                className="flex-1 lg:flex-none rounded-xl border-2 border-neutral-300 bg-white px-4 py-2.5 text-sm font-semibold hover:bg-neutral-50"
              >
                {t("withdraw")}
              </button>
            </>
          )}

          {status === "accepted" && (
            <Link
              href={`/dashboard/product/${offer.productId}`}
              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white hover:bg-emerald-700"
            >
              <ShoppingCart className="h-4 w-4" />
              {t("checkoutNow")}
            </Link>
          )}

          {(status === "rejected" || (status !== "countered" && status !== "pending" && status !== "accepted")) && (
            <Link
              href={`/dashboard/product/${offer.productId}`}
              className="flex-1 lg:flex-none inline-flex items-center justify-center gap-1 rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-semibold text-white"
            >
              {t("view")} <ChevronRight className="h-4 w-4" />
            </Link>
          )}
        </div>
      </div>

      {status === "countered" && (
        <div className="border-t border-neutral-100 px-5 py-3 bg-neutral-50/50 flex flex-col sm:flex-row gap-2 items-stretch sm:items-center">
          <input
            type="number"
            step="0.01"
            min={0}
            placeholder={t("newOfferPlaceholder")}
            value={respondPrice}
            onChange={(e) => setRespondPrice(e.target.value)}
            className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm"
          />
          <button
            type="button"
            onClick={handleRespond}
            disabled={loading || !respondPrice.trim()}
            className="rounded-lg bg-sky-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-50 shrink-0"
          >
            {t("respondWithOffer")}
          </button>
        </div>
      )}

      {status === "accepted" && (
        <div className="border-t border-emerald-200 bg-emerald-50 px-5 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <span className="text-sm font-semibold text-emerald-800">{t("readyToBuy")}</span>
          <div className="flex items-center gap-4">
            <span className="text-[10px] font-bold uppercase text-amber-700 flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {t("expiresIn", { time: expiryLabel(offer.updatedAt) })}
            </span>
            <Link
              href={`/dashboard/product/${offer.productId}`}
              className="text-sm font-bold text-[var(--brand-red)] hover:underline inline-flex items-center gap-1"
            >
              {t("addToCartHint")} <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      )}
    </article>
  );
}

export function BuyerBargainsView() {
  const t = useTranslations("buyerBargains");
  const tOffers = useTranslations("offers");
  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<TabFilter>("active");

  const loadAll = useCallback(async () => {
    setLoading(true);
    const list = await listOffers({ asSeller: false });
    setAllOffers(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    loadAll();
  }, [loadAll]);

  const counts = useMemo(() => {
    const pending = allOffers.filter((o) => o.status === "pending").length;
    const countered = allOffers.filter((o) => o.status === "countered").length;
    const accepted = allOffers.filter((o) => o.status === "accepted").length;
    const active = pending + countered;
    return { pending, countered, accepted, active, all: allOffers.length };
  }, [allOffers]);

  const filtered = useMemo(() => {
    if (tab === "all") return allOffers;
    if (tab === "active") return allOffers.filter((o) => o.status === "pending" || o.status === "countered");
    if (tab === "counters") return allOffers.filter((o) => o.status === "countered");
    if (tab === "accepted") return allOffers.filter((o) => o.status === "accepted");
    return allOffers;
  }, [allOffers, tab]);

  const tabs: { id: TabFilter; label: string; count?: number }[] = [
    { id: "active", label: t("tabActiveOffers"), count: counts.active },
    { id: "counters", label: t("tabPendingCounters"), count: counts.countered },
    { id: "accepted", label: t("tabAccepted"), count: counts.accepted },
    { id: "all", label: t("tabAll"), count: counts.all },
  ];

  return (
    <div className="w-full max-w-[960px] mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
        <div className="flex items-start gap-3">
          <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-amber-100 text-amber-700 border border-amber-200/60">
            <HandCoins className="h-6 w-6" />
          </span>
          <div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight">{t("title")}</h1>
            <p className="text-sm text-[var(--brand-muted)] mt-1 max-w-md">{t("subtitleLong")}</p>
          </div>
        </div>
        <Link
          href="/dashboard/browse"
          className="inline-flex items-center gap-1 text-sm font-bold text-[var(--brand-red)] hover:underline shrink-0"
        >
          {t("newBargain")} <Plus className="h-4 w-4" />
        </Link>
      </div>

      {/* Stat cards */}
      <div className="grid sm:grid-cols-3 gap-4">
        <StatCard
          icon={<TrendingUp className="h-5 w-5 text-sky-600" />}
          iconBg="bg-sky-100"
          label={t("statActiveOffers")}
          value={counts.active}
        />
        <StatCard
          icon={<Bell className="h-5 w-5 text-[var(--brand-red)]" />}
          iconBg="bg-red-100"
          label={t("statPendingCounters")}
          value={counts.countered}
        />
        <StatCard
          icon={<Check className="h-5 w-5 text-emerald-600" />}
          iconBg="bg-emerald-100"
          label={t("statSuccess")}
          value={counts.accepted}
        />
      </div>

      {/* Underline tabs */}
      <div className="flex gap-1 overflow-x-auto border-b border-neutral-200 scrollbar-hide">
        {tabs.map((item) => {
          const active = tab === item.id;
          return (
            <button
              key={item.id}
              type="button"
              onClick={() => setTab(item.id)}
              className={`shrink-0 px-4 py-3 text-sm font-semibold border-b-2 -mb-px transition-colors ${
                active
                  ? "border-[var(--brand-red)] text-[var(--brand-red)]"
                  : "border-transparent text-[var(--brand-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              {item.label}
              {item.count != null ? ` (${item.count})` : ""}
            </button>
          );
        })}
      </div>

      {loading && (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-40 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      )}

      {!loading && filtered.length === 0 && (
        <div className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-14 text-center">
          <HandCoins className="mx-auto h-12 w-12 text-neutral-300 mb-4" />
          <p className="font-bold text-lg">{tOffers("noOffers")}</p>
          <p className="text-sm text-[var(--brand-muted)] mt-2 mb-6">{tOffers("noOffersBuyer")}</p>
          <Link
            href="/dashboard/browse"
            className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            {tOffers("browseProducts")} <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
      )}

      {!loading && filtered.length > 0 && (
        <ul className="space-y-5 list-none">
          {filtered.map((offer) => (
            <li key={offer.id}>
              <BargainCard offer={offer} onRefresh={loadAll} />
            </li>
          ))}
        </ul>
      )}

      {/* Footer CTA */}
      <div className="rounded-xl border-2 border-dashed border-neutral-300 bg-neutral-50/80 dark:bg-neutral-900/20 p-8 text-center">
        <ShoppingCart className="mx-auto h-10 w-10 text-neutral-400 mb-3" />
        <p className="text-sm text-[var(--brand-muted)] max-w-md mx-auto">{t("browseCta")}</p>
        <Link
          href="/dashboard/browse"
          className="inline-flex items-center gap-1 mt-4 text-sm font-bold text-sky-600 hover:underline"
        >
          {t("browseNegotiable")} <ArrowRight className="h-4 w-4" />
        </Link>
      </div>

      {allOffers.length > 0 && (
        <div className="rounded-xl bg-neutral-800 text-white px-5 py-4 flex items-center justify-between gap-4">
          <p className="text-sm font-medium">{t("manageAll")}</p>
          <Link
            href="/dashboard/browse"
            className="flex h-11 w-11 items-center justify-center rounded-full bg-[var(--brand-red)] hover:bg-[#b71c1c] shadow-lg"
            aria-label={t("newBargain")}
          >
            <Plus className="h-5 w-5" />
          </Link>
        </div>
      )}
    </div>
  );
}

function StatCard({
  icon,
  iconBg,
  label,
  value,
}: {
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  value: number;
}) {
  return (
    <div className="rounded-xl border border-neutral-200 bg-white dark:bg-[var(--card-bg)] p-4 flex items-center gap-4 shadow-sm">
      <span className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl ${iconBg}`}>{icon}</span>
      <div>
        <p className="text-2xl font-black leading-none">{value}</p>
        <p className="text-xs font-semibold text-[var(--brand-muted)] mt-1">{label}</p>
      </div>
    </div>
  );
}
