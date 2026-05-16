"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  ChevronDown,
  ChevronUp,
  HandCoins,
  Heart,
  Loader2,
  MessageCircle,
  ShoppingBag,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { listVideoFeed, recordVideoView, type VideoFeedItem } from "@/lib/api";
import { resolveMediaUrl } from "@/lib/videoMedia";
import { useCurrency } from "@/contexts/CurrencyContext";

function ReelSlide({
  video,
  isActive,
  onViewed,
}: {
  video: VideoFeedItem;
  isActive: boolean;
  onViewed: () => void;
}) {
  const t = useTranslations("productReels");
  const { formatPrice } = useCurrency();
  const videoRef = useRef<HTMLVideoElement>(null);
  const [muted, setMuted] = useState(true);
  const [liked, setLiked] = useState(false);
  const viewedRef = useRef(false);
  const src = resolveMediaUrl(video.videoUrl);
  const product = video.product;
  const productHref = product?.id ? `/dashboard/product/${product.id}` : "/dashboard/browse";

  useEffect(() => {
    const el = videoRef.current;
    if (!el) return;
    if (isActive) {
      el.play().catch(() => {});
      if (!viewedRef.current) {
        viewedRef.current = true;
        onViewed();
      }
    } else {
      el.pause();
    }
  }, [isActive, onViewed]);

  return (
    <section className="relative h-full w-full shrink-0 snap-start snap-always bg-black overflow-hidden">
      <video
        ref={videoRef}
        src={src}
        className="absolute inset-0 h-full w-full object-cover"
        loop
        muted={muted}
        playsInline
        preload={isActive ? "auto" : "metadata"}
        poster={video.thumbnailUrl ? resolveMediaUrl(video.thumbnailUrl) : undefined}
      />

      <div className="absolute inset-0 bg-gradient-to-b from-black/50 via-transparent to-black/70 pointer-events-none" />

      <div className="absolute inset-0 flex flex-col justify-between p-4 pb-8 pt-3 pointer-events-none">
        <div className="pointer-events-auto flex items-center justify-between">
          <Link
            href="/dashboard"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm hover:bg-black/55"
            aria-label={t("back")}
          >
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <span className="text-xs font-bold uppercase tracking-wider text-white/90">
            {t("shopVideos")}
          </span>
          <span className="w-10" />
        </div>

        <div className="flex gap-3 items-end pointer-events-auto">
          <div className="flex-1 min-w-0 text-white pb-2">
            <p className="font-bold text-sm drop-shadow-md">@{video.sellerName}</p>
            <h2 className="font-semibold text-base mt-1 line-clamp-2 drop-shadow-md">
              {video.title}
            </h2>
            {video.caption && (
              <p className="text-sm text-white/85 mt-1 line-clamp-2 drop-shadow-md">{video.caption}</p>
            )}
            {product && (
              <Link
                href={productHref}
                className="mt-3 inline-flex items-center gap-2 rounded-xl bg-white/15 backdrop-blur-md border border-white/25 px-3 py-2 text-sm font-semibold hover:bg-white/25 transition-colors"
              >
                {product.imageUrl && (
                  <span className="relative h-9 w-9 rounded-lg overflow-hidden shrink-0 bg-white/20">
                    <Image
                      src={resolveMediaUrl(product.imageUrl)}
                      alt=""
                      fill
                      className="object-cover"
                      sizes="36px"
                    />
                  </span>
                )}
                <span className="min-w-0">
                  <span className="block truncate">{product.name}</span>
                  <span className="text-[var(--brand-red)] font-bold">{formatPrice(product.price)}</span>
                </span>
              </Link>
            )}
          </div>

          <div className="flex flex-col items-center gap-4 pb-2 shrink-0">
            <button
              type="button"
              onClick={() => setLiked((l) => !l)}
              className="flex flex-col items-center gap-1 text-white"
              aria-label={t("like")}
            >
              <span
                className={`flex h-12 w-12 items-center justify-center rounded-full backdrop-blur-sm ${
                  liked ? "bg-[var(--brand-red)]" : "bg-black/40"
                }`}
              >
                <Heart className={`h-6 w-6 ${liked ? "fill-white" : ""}`} />
              </span>
              <span className="text-[10px] font-semibold">
                {(video.likes + (liked ? 1 : 0)).toLocaleString()}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setMuted((m) => !m)}
              className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 text-white backdrop-blur-sm"
              aria-label={muted ? t("unmute") : t("mute")}
            >
              {muted ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </button>
            {video.allowBargaining && product && (
              <Link
                href={`${productHref}#offer`}
                className="flex flex-col items-center gap-1 text-white"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-black/40 backdrop-blur-sm">
                  <HandCoins className="h-6 w-6" />
                </span>
                <span className="text-[10px] font-semibold">{t("bargain")}</span>
              </Link>
            )}
            <Link href={productHref} className="flex flex-col items-center gap-1 text-white">
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[var(--brand-red)] shadow-lg">
                <ShoppingBag className="h-6 w-6" />
              </span>
              <span className="text-[10px] font-semibold">{t("shop")}</span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

export function ProductReelsView({
  productId,
  startVideoId,
}: {
  productId?: string | null;
  startVideoId?: string | null;
}) {
  const t = useTranslations("productReels");
  const [videos, setVideos] = useState<VideoFeedItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const [showScrollHint, setShowScrollHint] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);
  const slideRefs = useRef<(HTMLDivElement | null)[]>([]);

  const scrollToIndex = useCallback((index: number, smooth = true) => {
    const clamped = Math.max(0, Math.min(index, videos.length - 1));
    const el = slideRefs.current[clamped];
    if (!el) return;
    el.scrollIntoView({ behavior: smooth ? "smooth" : "auto", block: "start" });
    setActiveIndex(clamped);
    setShowScrollHint(false);
  }, [videos.length]);

  const load = useCallback(async () => {
    setLoading(true);
    const list = await listVideoFeed({ limit: 40 });
    setVideos(list);
    setLoading(false);

    let startIdx = 0;
    if (startVideoId) {
      const byId = list.findIndex((v) => v.id === startVideoId);
      if (byId >= 0) startIdx = byId;
    } else if (productId) {
      const byProduct = list.findIndex(
        (v) =>
          v.product?.id === productId || v.linkedProductIds.includes(productId),
      );
      if (byProduct >= 0) startIdx = byProduct;
    }
    setActiveIndex(startIdx);
  }, [productId, startVideoId]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (loading || videos.length === 0) return;
    requestAnimationFrame(() => scrollToIndex(activeIndex, false));
  }, [loading, videos.length]); // eslint-disable-line react-hooks/exhaustive-deps -- initial scroll only after load

  useEffect(() => {
    const root = containerRef.current;
    if (!root || videos.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        let best: { idx: number; ratio: number } | null = null;
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          const idx = Number((entry.target as HTMLElement).dataset.index);
          if (Number.isNaN(idx)) continue;
          if (!best || entry.intersectionRatio > best.ratio) {
            best = { idx, ratio: entry.intersectionRatio };
          }
        }
        if (best && best.ratio >= 0.5) {
          setActiveIndex(best.idx);
          setShowScrollHint(false);
        }
      },
      { root, threshold: [0.5, 0.75, 0.9] },
    );

    slideRefs.current.forEach((node) => {
      if (node) observer.observe(node);
    });
    return () => observer.disconnect();
  }, [videos]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowDown" || e.key === "j") {
        e.preventDefault();
        scrollToIndex(activeIndex + 1);
      } else if (e.key === "ArrowUp" || e.key === "k") {
        e.preventDefault();
        scrollToIndex(activeIndex - 1);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [activeIndex, scrollToIndex]);

  if (loading) {
    return (
      <div className="absolute inset-0 flex items-center justify-center bg-black text-white">
        <Loader2 className="h-10 w-10 animate-spin" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 bg-neutral-900 text-white px-6 text-center">
        <MessageCircle className="h-12 w-12 text-neutral-500" />
        <p className="font-bold text-lg">{t("emptyTitle")}</p>
        <p className="text-sm text-neutral-400 max-w-sm">{t("emptyHint")}</p>
        <Link
          href="/dashboard/browse"
          className="rounded-xl bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white"
        >
          {t("browseProducts")}
        </Link>
      </div>
    );
  }

  const hasMultiple = videos.length > 1;
  const canGoPrev = activeIndex > 0;
  const canGoNext = activeIndex < videos.length - 1;

  return (
    <div className="absolute inset-0 bg-black">
      <div
        ref={containerRef}
        className="h-full w-full overflow-y-scroll overscroll-y-contain snap-y snap-mandatory scrollbar-hide touch-pan-y"
        aria-label={t("feedLabel")}
      >
        {videos.map((video, index) => (
          <div
            key={video.id}
            ref={(el) => {
              slideRefs.current[index] = el;
            }}
            data-index={index}
            className="h-full w-full shrink-0"
          >
            <ReelSlide
              video={video}
              isActive={index === activeIndex}
              onViewed={() => recordVideoView(video.id)}
            />
          </div>
        ))}
      </div>

      {/* Counter */}
      <div className="pointer-events-none absolute top-14 left-1/2 -translate-x-1/2 z-10 rounded-full bg-black/50 px-3 py-1 text-xs font-bold text-white backdrop-blur-sm">
        {activeIndex + 1} / {videos.length}
      </div>

      {/* Prev / next buttons (desktop & mobile) */}
      {hasMultiple && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 z-10 flex flex-col gap-2">
          <button
            type="button"
            disabled={!canGoPrev}
            onClick={() => scrollToIndex(activeIndex - 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:opacity-30 hover:bg-black/70"
            aria-label={t("prevVideo")}
          >
            <ChevronUp className="h-6 w-6" />
          </button>
          <button
            type="button"
            disabled={!canGoNext}
            onClick={() => scrollToIndex(activeIndex + 1)}
            className="flex h-10 w-10 items-center justify-center rounded-full bg-black/50 text-white backdrop-blur-sm disabled:opacity-30 hover:bg-black/70"
            aria-label={t("nextVideo")}
          >
            <ChevronDown className="h-6 w-6" />
          </button>
        </div>
      )}

      {/* Scroll hint */}
      {hasMultiple && showScrollHint && canGoNext && (
        <div className="pointer-events-none absolute bottom-24 left-1/2 -translate-x-1/2 z-10 flex flex-col items-center gap-1 text-white/90 animate-bounce">
          <ChevronDown className="h-6 w-6" />
          <span className="text-xs font-semibold">{t("scrollHint")}</span>
        </div>
      )}
    </div>
  );
}
