"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  Download,
  Eye,
  Heart,
  MessageCircle,
  Pencil,
  Trash2,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";
import { useTranslations } from "next-intl";
import {
  sellerVideosDelete,
  sellerVideosInsights,
  type SellerVideo,
  type SellerVideoInsights,
} from "@/lib/api";
import { formatViews, timeAgo } from "@/lib/videoFormat";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/contexts/ToastContext";

export function SellerVideoInsightsView() {
  const t = useTranslations("sellerVideos");
  const toast = useToast();
  const { formatPrice } = useCurrency();
  const [data, setData] = useState<SellerVideoInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "live" | "draft">("all");

  useEffect(() => {
    sellerVideosInsights().then((d) => {
      setData(d);
      setLoading(false);
    });
  }, []);

  async function onDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    const ok = await sellerVideosDelete(id);
    if (ok) {
      toast.success(t("deleted"));
      const refreshed = await sellerVideosInsights();
      setData(refreshed);
    }
  }

  const videos = (data?.videos ?? []).filter((v) => {
    if (filter === "live") return v.status === "live" || v.status === "categorized";
    if (filter === "draft") return v.status === "draft" || v.status === "processing";
    return true;
  });

  const s = data?.summary;

  if (loading) {
    return <div className="space-y-4">{[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-xl bg-neutral-100" />)}</div>;
  }

  return (
    <div className="w-full space-y-6 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("insightsTitle")}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t("insightsSubtitle")}</p>
        </div>
        <div className="flex gap-2">
          <select className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white">
            <option>{t("last30Days")}</option>
          </select>
          <button type="button" className="inline-flex items-center gap-2 rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium">
            <Download className="w-4 h-4" />
            {t("exportReport")}
          </button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[
          { label: t("totalViews"), value: formatViews(s?.totalViews ?? 0), trend: "+12.5%", up: true, color: "from-violet-500 to-purple-600" },
          { label: t("watchTime"), value: String(s?.watchTimeHours ?? 0), trend: "+8.2%", up: true, color: "from-blue-500 to-cyan-600" },
          { label: t("conversionRate"), value: `${s?.conversionRate ?? 0}%`, trend: "-1.4%", up: false, color: "from-orange-500 to-amber-600" },
          { label: t("engagementRate"), value: `${s?.engagementRate ?? 0}%`, trend: "+24%", up: true, color: "from-emerald-500 to-teal-600" },
        ].map((card) => (
          <div key={card.label} className={`clay-card p-5 bg-gradient-to-br ${card.color} text-white`}>
            <p className="text-xs font-medium opacity-90">{card.label}</p>
            <p className="text-2xl font-bold mt-2">{card.value}</p>
            <p className="text-xs mt-2 flex items-center gap-1 opacity-90">
              {card.up ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
              {card.trend}
            </p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="clay-card p-5 lg:col-span-2 min-h-[200px]">
          <h2 className="font-semibold mb-4">{t("viewsTrend")}</h2>
          <div className="h-40 flex items-end gap-2">
            {[40, 55, 45, 70, 60, 85, 75, 90, 65, 95].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-[var(--brand-blue)]/70"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
        <div className="clay-card p-5">
          <h2 className="font-semibold mb-4">{t("videoToSales")}</h2>
          <ul className="space-y-3">
            {(data?.topByRevenue ?? []).map((row) => (
              <li key={row.videoId} className="flex justify-between gap-2 text-sm">
                <span className="truncate text-neutral-700">{row.title}</span>
                <span className="font-semibold text-[var(--brand-red)] shrink-0">
                  {formatPrice(row.revenue)}
                </span>
              </li>
            ))}
            {!(data?.topByRevenue?.length) && (
              <li className="text-sm text-neutral-500">{t("noSalesYet")}</li>
            )}
          </ul>
        </div>
      </div>

      <section className="clay-card overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4 border-b border-neutral-100">
          <h2 className="font-semibold">{t("publishedShorts")}</h2>
          <div className="flex gap-1">
            {(["all", "live", "draft"] as const).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`rounded-md px-3 py-1.5 text-xs font-semibold capitalize ${
                  filter === f ? "bg-[var(--brand-red)] text-white" : "text-neutral-600 hover:bg-neutral-50"
                }`}
              >
                {t(`filter_${f}`)}
              </button>
            ))}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm min-w-[720px]">
            <thead>
              <tr className="bg-neutral-50 text-left text-xs uppercase text-neutral-500">
                <th className="px-5 py-3">{t("colVideo")}</th>
                <th className="px-5 py-3">{t("colStatus")}</th>
                <th className="px-5 py-3">{t("colViews")}</th>
                <th className="px-5 py-3">{t("colEngagement")}</th>
                <th className="px-5 py-3">{t("colRevenue")}</th>
                <th className="px-5 py-3 text-right">{t("colActions")}</th>
              </tr>
            </thead>
            <tbody>
              {videos.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-5 py-12 text-center text-neutral-500">
                    {t("noVideos")}
                  </td>
                </tr>
              ) : (
                videos.map((v) => <VideoRow key={v.id} video={v} t={t} formatPrice={formatPrice} onDelete={onDelete} />)
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function VideoRow({
  video,
  t,
  formatPrice,
  onDelete,
}: {
  video: SellerVideo;
  t: ReturnType<typeof useTranslations>;
  formatPrice: (n: number) => string;
  onDelete: (id: string) => void;
}) {
  const statusClass =
    video.status === "live" || video.status === "categorized"
      ? "text-emerald-700 bg-emerald-50"
      : video.status === "processing"
        ? "text-blue-700 bg-blue-50"
        : "text-neutral-600 bg-neutral-100";

  return (
    <tr className="border-t border-neutral-50 hover:bg-neutral-50/50">
      <td className="px-5 py-4">
        <p className="font-semibold">{video.title}</p>
        <p className="text-xs text-neutral-500">{timeAgo(video.publishedAt || video.createdAt)}</p>
      </td>
      <td className="px-5 py-4">
        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-semibold capitalize ${statusClass}`}>
          <span className="h-1.5 w-1.5 rounded-full bg-current" />
          {video.status === "processing" ? t("uploading") : video.status}
        </span>
      </td>
      <td className="px-5 py-4 tabular-nums">{formatViews(video.views)}</td>
      <td className="px-5 py-4">
        <span className="inline-flex items-center gap-3 text-neutral-600">
          <span className="inline-flex items-center gap-1">
            <Heart className="w-3.5 h-3.5" />
            {video.likes}
          </span>
          <span className="inline-flex items-center gap-1">
            <MessageCircle className="w-3.5 h-3.5" />
            {video.comments}
          </span>
        </span>
      </td>
      <td className="px-5 py-4 font-semibold text-[var(--brand-red)]">{formatPrice(video.revenue)}</td>
      <td className="px-5 py-4">
        <div className="flex justify-end gap-2">
          {video.status === "processing" ? (
            <button type="button" className="p-1.5 text-neutral-400" title={t("cancel")}>
              <X className="w-4 h-4" />
            </button>
          ) : (
            <>
              <Link href={`/dashboard/videos/editor/${video.id}`} className="p-1.5 text-neutral-500 hover:text-[var(--brand-red)]">
                <Pencil className="w-4 h-4" />
              </Link>
              <button type="button" onClick={() => onDelete(video.id)} className="p-1.5 text-neutral-400 hover:text-red-600">
                <Trash2 className="w-4 h-4" />
              </button>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}
