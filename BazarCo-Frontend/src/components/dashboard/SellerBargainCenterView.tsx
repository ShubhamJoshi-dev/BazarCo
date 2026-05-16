"use client";

import { Fragment, useCallback, useEffect, useMemo, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import {
  ArrowLeftRight,
  Check,
  ClipboardList,
  Download,
  Filter,
  HandCoins,
  ImageIcon,
  Lightbulb,
  Loader2,
  Plus,
  TrendingUp,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/contexts/ToastContext";
import {
  acceptOffer,
  counterOffer,
  listOffers,
  rejectOffer,
  type Offer,
} from "@/lib/api";

type StatusFilter = "" | "pending" | "accepted" | "countered" | "rejected";

const STATUS_PILL: Record<string, string> = {
  pending: "bg-amber-50 text-amber-800 border-amber-200",
  countered: "bg-blue-50 text-blue-800 border-blue-200",
  accepted: "bg-emerald-50 text-emerald-800 border-emerald-200",
  rejected: "bg-red-50 text-red-800 border-red-200",
};

const AVATAR_COLORS = [
  "bg-red-100 text-red-700",
  "bg-blue-100 text-blue-700",
  "bg-violet-100 text-violet-700",
  "bg-emerald-100 text-emerald-700",
  "bg-amber-100 text-amber-800",
];

function customerInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return name.slice(0, 2).toUpperCase() || "??";
}

function avatarColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h + id.charCodeAt(i)) % AVATAR_COLORS.length;
  return AVATAR_COLORS[h]!;
}

function discountPct(list: number, offered: number): string {
  if (list <= 0) return "";
  const pct = ((list - offered) / list) * 100;
  if (pct <= 0) return "";
  return `-${pct.toFixed(1)}%`;
}

function exportOffersCsv(rows: Offer[], formatPrice: (n: number) => string) {
  const headers = ["Customer", "Product", "List Price", "Offered", "Status"];
  const lines = [
    headers.join(","),
    ...rows.map((o) =>
      [
        `"${(o.buyer?.name ?? o.buyer?.email ?? "").replace(/"/g, '""')}"`,
        `"${(o.product?.name ?? "").replace(/"/g, '""')}"`,
        formatPrice(o.product?.price ?? 0),
        formatPrice(o.proposedPrice),
        o.status,
      ].join(","),
    ),
  ];
  const blob = new Blob([lines.join("\n")], { type: "text/csv;charset=utf-8" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `bargain-requests-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

export function SellerBargainCenterView() {
  const t = useTranslations("sellerBargain");
  const toast = useToast();
  const { formatPrice } = useCurrency();

  const [allOffers, setAllOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<StatusFilter>("");
  const [filterOpen, setFilterOpen] = useState(false);
  const [actingId, setActingId] = useState<string | null>(null);
  const [counterId, setCounterId] = useState<string | null>(null);
  const [counterPrice, setCounterPrice] = useState("");
  const [counterMsg, setCounterMsg] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listOffers({ asSeller: true });
    setAllOffers(list);
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const offers = useMemo(() => {
    if (!filter) return allOffers;
    return allOffers.filter((o) => o.status === filter);
  }, [allOffers, filter]);

  const counts = useMemo(() => {
    const c = { pending: 0, accepted: 0, countered: 0, rejected: 0 };
    for (const o of allOffers) {
      if (o.status in c) c[o.status as keyof typeof c]++;
    }
    return c;
  }, [allOffers]);

  const stats = useMemo(() => {
    const total = allOffers.length || 1;
    const accepted = allOffers.filter((o) => o.status === "accepted");
    const winRate = Math.round((accepted.length / total) * 100);
    let saveSum = 0;
    let saveN = 0;
    for (const o of accepted) {
      const list = o.product?.price ?? 0;
      if (list > o.proposedPrice) {
        saveSum += list - o.proposedPrice;
        saveN++;
      }
    }
    const avgSave = saveN > 0 ? saveSum / saveN : 0;
    return { winRate, avgSave };
  }, [allOffers]);

  const trendBars = useMemo(() => {
    const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const base = [3, 5, 4, 8, 6, 9, 7];
    const bump = counts.pending + counts.countered;
    return days.map((label, i) => ({
      label,
      value: base[i]! + (i === 3 ? Math.min(bump, 4) : 0),
    }));
  }, [counts]);

  const maxBar = Math.max(...trendBars.map((b) => b.value), 1);

  const smartTip = useMemo(() => {
    const pending = allOffers.find((o) => o.status === "pending");
    if (!pending) return t("smartTipDefault");
    const name = pending.buyer?.name?.split(" ")[0] ?? t("buyerFallback");
    return t("smartTipNamed", { name, price: formatPrice(pending.proposedPrice) });
  }, [allOffers, t, formatPrice]);

  async function handleAccept(id: string) {
    setActingId(id);
    const updated = await acceptOffer(id);
    setActingId(null);
    if (updated) {
      toast.success(t("accepted"));
      load();
    } else toast.error(t("actionFailed"));
  }

  async function handleReject(id: string) {
    setActingId(id);
    const updated = await rejectOffer(id);
    setActingId(null);
    if (updated) {
      toast.success(t("rejected"));
      load();
    } else toast.error(t("actionFailed"));
  }

  async function submitCounter(id: string) {
    const p = parseFloat(counterPrice);
    if (Number.isNaN(p) || p < 0) {
      toast.error(t("invalidPrice"));
      return;
    }
    setActingId(id);
    const updated = await counterOffer(id, p, counterMsg || undefined);
    setActingId(null);
    setCounterId(null);
    setCounterPrice("");
    setCounterMsg("");
    if (updated) {
      toast.success(t("counterSent"));
      load();
    } else toast.error(t("actionFailed"));
  }

  if (loading && allOffers.length === 0) {
    return (
      <div className="w-full space-y-5">
        <div className="h-40 rounded-xl bg-neutral-100 animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {[0, 1, 2, 3].map((i) => (
            <div key={i} className="h-24 clay-card animate-pulse bg-neutral-50" />
          ))}
        </div>
        <div className="h-64 clay-card animate-pulse bg-neutral-50" />
      </div>
    );
  }

  return (
    <div className="w-full space-y-5 pb-16 relative">
      <div className="grid gap-4 lg:grid-cols-[1fr_auto]">
        <div className="rounded-xl bg-gradient-to-br from-[#c62828] via-[#d32f2f] to-[#b71c1c] p-6 sm:p-8 text-white shadow-md overflow-hidden relative">
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage:
                "radial-gradient(circle at 80% 20%, #fff 0%, transparent 50%)",
            }}
          />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2 opacity-90">
              <HandCoins className="w-5 h-5" />
              <span className="text-sm font-medium">{t("portalLabel")}</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">{t("welcomeTitle")}</h1>
            <p className="mt-2 text-sm text-white/85 max-w-lg leading-relaxed">{t("welcomeDesc")}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              <div className="rounded-lg bg-black/20 px-4 py-3 min-w-[120px]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                  {t("winRate")}
                </p>
                <p className="text-xl font-bold mt-0.5">{stats.winRate}%</p>
              </div>
              <div className="rounded-lg bg-black/20 px-4 py-3 min-w-[120px]">
                <p className="text-[10px] font-semibold uppercase tracking-wider text-white/70">
                  {t("avgSave")}
                </p>
                <p className="text-xl font-bold mt-0.5">{formatPrice(stats.avgSave)}</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 lg:min-w-[320px]">
          {(
            [
              { key: "pending", count: counts.pending, icon: ClipboardList, iconBg: "bg-red-50 text-[var(--brand-red)]" },
              { key: "accepted", count: counts.accepted, icon: Check, iconBg: "bg-emerald-50 text-emerald-600" },
              { key: "countered", count: counts.countered, icon: ArrowLeftRight, iconBg: "bg-blue-50 text-blue-600" },
              { key: "rejected", count: counts.rejected, icon: X, iconBg: "bg-red-50 text-red-600" },
            ] as const
          ).map(({ key, count, icon: Icon, iconBg }) => (
            <button
              key={key}
              type="button"
              onClick={() => setFilter(filter === key ? "" : key)}
              className={`clay-card p-4 text-left transition-all hover:shadow-md ${
                filter === key ? "ring-2 ring-[var(--brand-red)]/30" : ""
              }`}
            >
              <span className={`inline-flex rounded-lg p-2 ${iconBg}`}>
                <Icon className="w-4 h-4" />
              </span>
              <p className="mt-3 text-2xl font-bold tabular-nums text-[var(--foreground)]">
                {String(count).padStart(2, "0")}
              </p>
              <p className="text-xs font-medium text-neutral-500 mt-0.5">
                {t(`stat${key.charAt(0).toUpperCase()}${key.slice(1)}` as "statPending")}
              </p>
            </button>
          ))}
        </div>
      </div>

      <section className="clay-card overflow-hidden">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between px-5 py-4 border-b border-neutral-100">
          <div>
            <h2 className="text-lg font-semibold text-[var(--foreground)]">{t("tableTitle")}</h2>
            <p className="text-sm text-neutral-500 mt-0.5">{t("tableSubtitle")}</p>
          </div>
          <div className="flex items-center gap-2 relative">
            <button
              type="button"
              onClick={() => setFilterOpen((v) => !v)}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Filter className="w-4 h-4" />
              {t("filter")}
            </button>
            {filterOpen && (
              <div className="absolute right-0 top-full mt-1 z-20 w-44 rounded-lg border border-neutral-200 bg-white py-1 shadow-lg">
                {(["", "pending", "accepted", "countered", "rejected"] as StatusFilter[]).map((s) => (
                  <button
                    key={s || "all"}
                    type="button"
                    onClick={() => {
                      setFilter(s);
                      setFilterOpen(false);
                    }}
                    className={`block w-full text-left px-4 py-2 text-sm hover:bg-neutral-50 ${
                      filter === s ? "text-[var(--brand-red)] font-semibold" : "text-neutral-700"
                    }`}
                  >
                    {s ? t(`stat${s.charAt(0).toUpperCase()}${s.slice(1)}` as "statPending") : t("filterAll")}
                  </button>
                ))}
              </div>
            )}
            <button
              type="button"
              onClick={() => exportOffersCsv(offers, formatPrice)}
              className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 py-2 text-sm font-medium text-neutral-700 hover:bg-neutral-50"
            >
              <Download className="w-4 h-4" />
              {t("export")}
            </button>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="border-b border-neutral-100 bg-neutral-50/80 text-left">
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {t("colCustomer")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {t("colProduct")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {t("colOriginal")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {t("colOffered")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500">
                  {t("colStatus")}
                </th>
                <th className="px-5 py-3 text-xs font-semibold uppercase tracking-wider text-neutral-500 text-right">
                  {t("colActions")}
                </th>
              </tr>
            </thead>
            <tbody>
              {offers.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-16 text-center text-neutral-500">
                    {t("noRequests")}
                  </td>
                </tr>
              ) : (
                offers.map((offer) => {
                  const listPrice = offer.product?.price ?? 0;
                  const buyerName = offer.buyer?.name ?? offer.buyer?.email ?? t("buyerFallback");
                  const offered = offer.status === "countered" && offer.counterPrice != null
                    ? offer.counterPrice
                    : offer.proposedPrice;
                  const displayOffered = offer.status === "pending" ? offer.proposedPrice : offered;
                  const isActing = actingId === offer.id;

                  return (
                    <Fragment key={offer.id}>
                      <tr className="border-b border-neutral-50 hover:bg-neutral-50/50">
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <span
                              className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-bold ${avatarColor(offer.buyerId)}`}
                            >
                              {customerInitials(buyerName)}
                            </span>
                            <div className="min-w-0">
                              <p className="font-semibold text-[var(--foreground)] truncate">{buyerName}</p>
                              <p className="text-xs text-neutral-500">{t("locationDefault")}</p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-4">
                          <Link
                            href={`/dashboard/product/${offer.productId}`}
                            className="flex items-center gap-3 hover:opacity-90"
                          >
                            <div className="relative h-11 w-11 shrink-0 rounded-lg overflow-hidden bg-neutral-100 border border-neutral-200">
                              {offer.product?.imageUrl ? (
                                <Image
                                  src={offer.product.imageUrl}
                                  alt=""
                                  fill
                                  className="object-cover"
                                  sizes="44px"
                                />
                              ) : (
                                <ImageIcon className="absolute inset-0 m-auto w-5 h-5 text-neutral-400" />
                              )}
                            </div>
                            <span className="font-medium text-[var(--foreground)] line-clamp-2 max-w-[160px]">
                              {offer.product?.name ?? t("productFallback")}
                            </span>
                          </Link>
                        </td>
                        <td className="px-5 py-4 text-neutral-500 tabular-nums whitespace-nowrap">
                          {formatPrice(listPrice)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className="font-semibold text-[var(--brand-red)] tabular-nums">
                            {formatPrice(displayOffered)}
                          </span>
                          {discountPct(listPrice, displayOffered) && (
                            <span className="ml-1.5 text-xs font-medium text-[var(--brand-red)]">
                              {discountPct(listPrice, displayOffered)}
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold capitalize ${STATUS_PILL[offer.status] ?? STATUS_PILL.pending}`}
                          >
                            {t(`status_${offer.status}` as "status_pending")}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            {offer.status === "pending" && (
                              <>
                                <button
                                  type="button"
                                  disabled={isActing}
                                  onClick={() => handleAccept(offer.id)}
                                  className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-50"
                                >
                                  {isActing ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : t("accept")}
                                </button>
                                <button
                                  type="button"
                                  disabled={isActing}
                                  onClick={() => {
                                    setCounterId(counterId === offer.id ? null : offer.id);
                                    setCounterPrice(String(offer.proposedPrice));
                                  }}
                                  className="rounded-lg border border-neutral-300 bg-white px-3 py-1.5 text-xs font-semibold text-neutral-700 hover:bg-neutral-50 disabled:opacity-50"
                                >
                                  {t("counter")}
                                </button>
                              </>
                            )}
                            {offer.status === "countered" && (
                              <span className="text-xs font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-lg px-3 py-1.5">
                                {t("awaitingBuyer")}
                              </span>
                            )}
                            {offer.status === "accepted" && (
                              <span className="text-xs text-emerald-700 font-medium">{t("dealClosed")}</span>
                            )}
                            {offer.status === "rejected" && (
                              <button
                                type="button"
                                disabled={isActing}
                                onClick={() => handleReject(offer.id)}
                                className="text-xs text-neutral-400"
                                title={t("dismiss")}
                              >
                                —
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                      {counterId === offer.id && (
                        <tr key={`${offer.id}-counter`} className="bg-neutral-50/80">
                          <td colSpan={6} className="px-5 py-4">
                            <div className="flex flex-col sm:flex-row gap-3 items-end max-w-xl ml-auto">
                              <div className="flex-1 w-full">
                                <label className="text-xs font-medium text-neutral-500">{t("counterPrice")}</label>
                                <input
                                  type="number"
                                  min="0"
                                  step="0.01"
                                  value={counterPrice}
                                  onChange={(e) => setCounterPrice(e.target.value)}
                                  className="mt-1 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                                />
                              </div>
                              <input
                                type="text"
                                value={counterMsg}
                                onChange={(e) => setCounterMsg(e.target.value)}
                                placeholder={t("messageOptional")}
                                className="flex-[2] w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                              />
                              <button
                                type="button"
                                disabled={isActing}
                                onClick={() => submitCounter(offer.id)}
                                className="rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white disabled:opacity-50"
                              >
                                {t("sendCounter")}
                              </button>
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        <div className="clay-card p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-[var(--foreground)]">{t("negotiationTrend")}</h3>
            <span className="inline-flex items-center gap-1 text-xs font-semibold text-[var(--brand-red)]">
              <TrendingUp className="w-3.5 h-3.5" />
              +24%
            </span>
          </div>
          <div className="flex items-end justify-between gap-2 h-28">
            {trendBars.map((bar, i) => (
              <div key={bar.label} className="flex-1 flex flex-col items-center gap-1">
                <div
                  className={`w-full rounded-t-md ${i === 3 ? "bg-[var(--brand-red)]" : "bg-neutral-200"}`}
                  style={{ height: `${(bar.value / maxBar) * 100}%`, minHeight: 8 }}
                />
                <span className="text-[10px] text-neutral-500">{bar.label}</span>
              </div>
            ))}
          </div>
          <p className="text-xs text-neutral-500 mt-3">{t("trendFootnote")}</p>
        </div>

        <div className="clay-card p-5 flex flex-col items-center justify-center text-center">
          <h3 className="text-sm font-semibold text-[var(--foreground)] mb-4 w-full text-left">
            {t("buyerSentiment")}
          </h3>
          <div className="relative w-28 h-28">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 36 36">
              <circle cx="18" cy="18" r="15.5" fill="none" stroke="#e5e7eb" strokeWidth="3" />
              <circle
                cx="18"
                cy="18"
                r="15.5"
                fill="none"
                stroke="#22c55e"
                strokeWidth="3"
                strokeDasharray={`${0.8 * 97.4} 97.4`}
                strokeLinecap="round"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-[var(--foreground)]">80%</span>
            </div>
          </div>
          <p className="text-xs font-semibold text-emerald-700 mt-2">{t("highTrust")}</p>
          <p className="text-xs text-neutral-500">{t("fairOffers")}</p>
        </div>

        <div className="clay-card p-5 bg-gradient-to-br from-blue-50/80 to-white">
          <div className="flex items-start gap-3">
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-blue-100 text-blue-600">
              <Lightbulb className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-sm font-semibold text-[var(--foreground)]">{t("smartSuggest")}</h3>
              <p className="text-sm text-neutral-600 mt-2 leading-relaxed">{smartTip}</p>
              <Link
                href="/dashboard/analytics"
                className="inline-block mt-3 text-sm font-semibold text-[var(--brand-blue)] hover:underline"
              >
                {t("viewAnalysis")}
              </Link>
            </div>
          </div>
        </div>
      </div>

      <Link
        href="/dashboard/products"
        className="fixed bottom-8 right-8 z-30 inline-flex items-center gap-2 rounded-full bg-[var(--brand-red)] px-5 py-3 text-sm font-semibold text-white shadow-lg hover:bg-[#b71c1c] transition-colors"
      >
        <Plus className="w-4 h-4" />
        {t("newOffer")}
      </Link>
    </div>
  );
}
