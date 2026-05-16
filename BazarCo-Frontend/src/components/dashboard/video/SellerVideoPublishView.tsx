"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Heart, Loader2, MessageCircle, Share2 } from "lucide-react";
import { useTranslations } from "next-intl";
import { useCurrency } from "@/contexts/CurrencyContext";
import { useToast } from "@/contexts/ToastContext";
import { productsList, sellerVideosGet, sellerVideosPublish, sellerVideosUpdate, type SellerVideo } from "@/lib/api";
import type { Product } from "@/types/api";
import { getBackendBaseUrl } from "@/config/env";

function mediaUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${getBackendBaseUrl().replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

export function SellerVideoPublishView({ videoId }: { videoId: string }) {
  const t = useTranslations("sellerVideos");
  const toast = useToast();
  const router = useRouter();
  const { formatPrice } = useCurrency();

  const [video, setVideo] = useState<SellerVideo | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [caption, setCaption] = useState("");
  const [visibility, setVisibility] = useState("public");
  const [category, setCategory] = useState("Fashion & Apparel");
  const [linkedIds, setLinkedIds] = useState<string[]>([]);
  const [allowBargain, setAllowBargain] = useState(false);
  const [minOffer, setMinOffer] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [productQ, setProductQ] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const [v, p] = await Promise.all([sellerVideosGet(videoId), productsList("active")]);
    if (v) {
      setVideo(v);
      setCaption(v.caption);
      setVisibility(v.visibility || "public");
      setCategory(v.category || "Fashion & Apparel");
      setLinkedIds(v.linkedProductIds ?? []);
      setAllowBargain(v.allowBargaining);
      setMinOffer(v.minOfferPrice > 0 ? String(v.minOfferPrice) : "");
    }
    setProducts(p);
    setLoading(false);
  }, [videoId]);

  useEffect(() => {
    load();
  }, [load]);

  function toggleProduct(id: string) {
    setLinkedIds((ids) => (ids.includes(id) ? ids.filter((x) => x !== id) : [...ids, id].slice(0, 5)));
  }

  async function saveDraft() {
    setSaving(true);
    const updated = await sellerVideosUpdate(videoId, {
      caption,
      visibility,
      category,
      linkedProductIds: linkedIds,
      allowBargaining: allowBargain,
      minOfferPrice: parseFloat(minOffer) || 0,
      scheduledAt: scheduledAt || null,
      status: "draft",
    });
    setSaving(false);
    if (updated) {
      toast.success(t("draftSaved"));
      setVideo(updated);
    } else toast.error(t("saveFailed"));
  }

  async function publish() {
    setSaving(true);
    const updated = await sellerVideosPublish(videoId, {
      caption,
      visibility,
      category,
      linkedProductIds: linkedIds,
      allowBargaining: allowBargain,
      minOfferPrice: parseFloat(minOffer) || 0,
    });
    setSaving(false);
    if (updated) {
      toast.success(t("published"));
      router.push("/dashboard/videos/performance");
    } else toast.error(t("saveFailed"));
  }

  const filteredProducts = products.filter(
    (p) => !productQ || p.name.toLowerCase().includes(productQ.toLowerCase()),
  );

  if (loading) {
    return <div className="h-64 animate-pulse rounded-xl bg-neutral-100" />;
  }
  if (!video) {
    return <p className="text-neutral-500">{t("notFound")}</p>;
  }

  return (
    <div className="w-full space-y-6 pb-10">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold">{t("publishTitle")}</h1>
          <p className="text-sm text-neutral-500 mt-1">{t("publishSubtitle")}</p>
        </div>
        <div className="flex gap-2 shrink-0">
          <button
            type="button"
            disabled={saving}
            onClick={saveDraft}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium hover:bg-neutral-50"
          >
            {t("saveDraft")}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={publish}
            className="rounded-lg bg-[var(--brand-red)] px-5 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin inline" /> : t("publishVideo")}
          </button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <div className="mx-auto w-full max-w-[320px]">
          <div className="relative aspect-[9/16] rounded-2xl overflow-hidden bg-black shadow-xl border border-neutral-200">
            <video
              src={mediaUrl(video.videoUrl)}
              className="absolute inset-0 h-full w-full object-cover"
              controls
              playsInline
            />
            <div className="absolute right-2 bottom-24 flex flex-col gap-3 text-white text-center text-xs">
              <Heart className="w-6 h-6 mx-auto" />
              <MessageCircle className="w-6 h-6 mx-auto" />
              <Share2 className="w-6 h-6 mx-auto" />
            </div>
            {linkedIds[0] && products.find((p) => p.id === linkedIds[0]) && (
              <div className="absolute bottom-3 left-3 right-3 rounded-lg bg-white/95 p-2 flex gap-2 items-center">
                {products.find((p) => p.id === linkedIds[0])?.imageUrl && (
                  <Image
                    src={products.find((p) => p.id === linkedIds[0])!.imageUrl!}
                    alt=""
                    width={40}
                    height={40}
                    className="rounded object-cover w-10 h-10"
                    unoptimized
                  />
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">
                    {products.find((p) => p.id === linkedIds[0])?.name}
                  </p>
                  <p className="text-xs text-[var(--brand-red)] font-bold">
                    {formatPrice(products.find((p) => p.id === linkedIds[0])?.price ?? 0)}
                  </p>
                </div>
                <span className="text-[10px] font-bold bg-[var(--brand-red)] text-white px-2 py-1 rounded">
                  {t("buyNow")}
                </span>
              </div>
            )}
          </div>
        </div>

        <div className="space-y-5">
          <section className="clay-card p-5 space-y-3">
            <h2 className="font-semibold">{t("shortDetails")}</h2>
            <label className="block text-xs font-semibold uppercase text-neutral-500">{t("caption")}</label>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              rows={4}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              placeholder={t("captionPlaceholder")}
            />
            <div className="grid sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">{t("visibility")}</label>
                <select
                  value={visibility}
                  onChange={(e) => setVisibility(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                >
                  <option value="public">{t("visibilityPublic")}</option>
                  <option value="private">{t("visibilityPrivate")}</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">{t("category")}</label>
                <select
                  value={category}
                  onChange={(e) => setCategory(e.target.value)}
                  className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                >
                  <option>Fashion & Apparel</option>
                  <option>Electronics</option>
                  <option>Home & Living</option>
                </select>
              </div>
            </div>
          </section>

          <section className="clay-card p-5 space-y-3">
            <h2 className="font-semibold">{t("linkProducts")}</h2>
            <input
              type="search"
              value={productQ}
              onChange={(e) => setProductQ(e.target.value)}
              placeholder={t("searchProducts")}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
            />
            <ul className="space-y-2 max-h-48 overflow-y-auto">
              {filteredProducts.slice(0, 8).map((p) => (
                <li key={p.id}>
                  <button
                    type="button"
                    onClick={() => toggleProduct(p.id)}
                    className={`w-full flex items-center gap-3 rounded-lg border p-2 text-left transition-colors ${
                      linkedIds.includes(p.id)
                        ? "border-[var(--brand-red)] bg-red-50/50"
                        : "border-neutral-200 hover:bg-neutral-50"
                    }`}
                  >
                    {p.imageUrl && (
                      <Image src={p.imageUrl} alt="" width={40} height={40} className="rounded object-cover" unoptimized />
                    )}
                    <span className="flex-1 text-sm font-medium truncate">{p.name}</span>
                    <span className="text-sm font-semibold text-[var(--brand-red)]">{formatPrice(p.price)}</span>
                  </button>
                </li>
              ))}
            </ul>
          </section>

          <section className="clay-card p-5 grid sm:grid-cols-2 gap-4">
            <div>
              <label className="flex items-center gap-2 text-sm font-medium">
                <input type="checkbox" checked={allowBargain} onChange={(e) => setAllowBargain(e.target.checked)} />
                {t("allowBargaining")}
              </label>
              {allowBargain && (
                <input
                  type="number"
                  min="0"
                  value={minOffer}
                  onChange={(e) => setMinOffer(e.target.value)}
                  placeholder={t("minOffer")}
                  className="mt-2 w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
                />
              )}
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">{t("schedulePublish")}</label>
              <input
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm"
              />
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
