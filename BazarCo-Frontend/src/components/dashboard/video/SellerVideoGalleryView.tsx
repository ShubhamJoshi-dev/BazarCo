"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Cloud,
  Grid3X3,
  LayoutList,
  Loader2,
  Pencil,
  Play,
  Plus,
  Trash2,
  Upload,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/contexts/ToastContext";
import {
  sellerVideosDelete,
  sellerVideosList,
  sellerVideosUpload,
  type SellerVideo,
  type SellerVideoStatus,
} from "@/lib/api";
import { formatFileSize, timeAgo } from "@/lib/videoFormat";
import { resolveMediaUrl } from "@/lib/videoMedia";

type Tab = "recent" | "drafts" | "categorized";

function VideoThumb({ video, large }: { video: SellerVideo; large?: boolean }) {
  const src = resolveMediaUrl(video.thumbnailUrl || video.videoUrl);
  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-gradient-to-br from-slate-800 to-slate-900 ${
        large ? "aspect-[16/10] min-h-[200px]" : "aspect-video"
      }`}
    >
      {src ? (
        <video
          src={resolveMediaUrl(video.videoUrl)}
          className="absolute inset-0 h-full w-full object-cover"
          muted
          playsInline
          preload="metadata"
        />
      ) : null}
      <div className="absolute inset-0 flex items-center justify-center bg-black/25">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-white/90 text-[var(--brand-red)] shadow-lg">
          <Play className="h-5 w-5 ml-0.5 fill-current" />
        </span>
      </div>
    </div>
  );
}

export function SellerVideoGalleryView() {
  const t = useTranslations("sellerVideos");
  const toast = useToast();
  const router = useRouter();
  const searchParams = useSearchParams();
  const fileRef = useRef<HTMLInputElement>(null);

  const [videos, setVideos] = useState<SellerVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("recent");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadName, setUploadName] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    const status: SellerVideoStatus | undefined =
      tab === "drafts" ? "draft" : tab === "categorized" ? "categorized" : undefined;
    const list = await sellerVideosList(status ? { status } : undefined);
    setVideos(list);
    setLoading(false);
  }, [tab]);

  useEffect(() => {
    load();
  }, [load]);

  useEffect(() => {
    if (searchParams.get("upload") === "1") {
      fileRef.current?.click();
      router.replace("/dashboard/videos");
    }
  }, [searchParams, router]);

  async function onFilePick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("video/")) {
      toast.error(t("videoTypeError"));
      return;
    }
    setUploading(true);
    setUploadName(file.name);
    setUploadProgress(0);
    const tick = setInterval(() => {
      setUploadProgress((p) => Math.min(p + 8, 90));
    }, 400);
    const created = await sellerVideosUpload(file);
    clearInterval(tick);
    setUploadProgress(100);
    setUploading(false);
    if (created) {
      toast.success(t("uploadSuccess"));
      router.push(`/dashboard/videos/editor/${created.id}`);
    } else {
      toast.error(t("uploadFailed"));
    }
    setTimeout(() => setUploadProgress(0), 1500);
  }

  async function handleDelete(id: string) {
    if (!confirm(t("deleteConfirm"))) return;
    const ok = await sellerVideosDelete(id);
    if (ok) {
      toast.success(t("deleted"));
      load();
    } else toast.error(t("deleteFailed"));
  }

  const featured = videos[0];
  const rest = videos.slice(1);

  return (
    <div className="w-full space-y-6 pb-8">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-[var(--foreground)]">{t("galleryTitle")}</h1>
          <p className="mt-1 text-sm text-neutral-500 max-w-xl">{t("gallerySubtitle")}</p>
        </div>
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={uploading}
          className="inline-flex items-center justify-center gap-2 rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#b71c1c] disabled:opacity-60 shrink-0"
        >
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
          {t("selectFiles")}
        </button>
      </div>

      <input ref={fileRef} type="file" accept="video/*" className="sr-only" onChange={onFilePick} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-1 rounded-lg border border-neutral-200 bg-white p-1">
          {(["recent", "drafts", "categorized"] as Tab[]).map((key) => (
            <button
              key={key}
              type="button"
              onClick={() => setTab(key)}
              className={`rounded-md px-4 py-2 text-sm font-medium transition-colors ${
                tab === key
                  ? "bg-[var(--brand-red)] text-white"
                  : "text-neutral-600 hover:bg-neutral-50"
              }`}
            >
              {t(`tab_${key}`)}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-neutral-200 p-1 bg-white">
          <button
            type="button"
            onClick={() => setViewMode("grid")}
            className={`p-2 rounded-md ${viewMode === "grid" ? "bg-neutral-100 text-[var(--brand-red)]" : "text-neutral-400"}`}
            aria-label="Grid"
          >
            <Grid3X3 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => setViewMode("list")}
            className={`p-2 rounded-md ${viewMode === "list" ? "bg-neutral-100 text-[var(--brand-red)]" : "text-neutral-400"}`}
            aria-label="List"
          >
            <LayoutList className="w-4 h-4" />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {[0, 1, 2].map((i) => (
            <div key={i} className="h-48 rounded-xl bg-neutral-100 animate-pulse" />
          ))}
        </div>
      ) : videos.length === 0 ? (
        <div className="clay-card p-16 text-center">
          <Upload className="w-12 h-12 mx-auto text-neutral-300 mb-4" />
          <p className="font-semibold text-[var(--foreground)]">{t("emptyTitle")}</p>
          <p className="text-sm text-neutral-500 mt-2 max-w-md mx-auto">{t("emptyDesc")}</p>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="mt-6 inline-flex items-center gap-2 rounded-lg bg-[var(--brand-red)] px-5 py-2.5 text-sm font-semibold text-white"
          >
            <Plus className="w-4 h-4" />
            {t("uploadVideo")}
          </button>
        </div>
      ) : viewMode === "grid" && featured ? (
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1fr]">
          <article className="clay-card overflow-hidden p-0">
            <VideoThumb video={featured} large />
            <div className="p-5">
              <div className="flex items-start justify-between gap-2">
                <h2 className="font-bold text-lg text-[var(--foreground)] line-clamp-2">{featured.title}</h2>
                {featured.status === "categorized" && (
                  <span className="shrink-0 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200 px-2 py-0.5 text-[10px] font-bold uppercase">
                    {t("categorized")}
                  </span>
                )}
              </div>
              <p className="text-xs text-neutral-500 mt-2">
                {t("edited")} {timeAgo(featured.updatedAt)} · {formatFileSize(featured.fileSizeBytes)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/dashboard/videos/editor/${featured.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg border border-neutral-200 px-3 py-1.5 text-xs font-semibold hover:bg-neutral-50"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  {t("edit")}
                </Link>
                <Link
                  href={`/dashboard/videos/publish/${featured.id}`}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-[var(--brand-red)] px-3 py-1.5 text-xs font-semibold text-white"
                >
                  {t("publish")}
                </Link>
              </div>
            </div>
          </article>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1">
            {rest.slice(0, 4).map((v) => (
              <VideoCard key={v.id} video={v} onDelete={handleDelete} t={t} compact />
            ))}
          </div>
        </div>
      ) : (
        <div className={`grid gap-4 ${viewMode === "grid" ? "sm:grid-cols-2 lg:grid-cols-3" : "grid-cols-1"}`}>
          {videos.map((v) => (
            <VideoCard key={v.id} video={v} onDelete={handleDelete} t={t} list={viewMode === "list"} />
          ))}
        </div>
      )}

      {uploading && (
        <div className="fixed bottom-6 right-6 z-50 w-80 rounded-xl border border-neutral-200 bg-white p-4 shadow-xl">
          <p className="text-sm font-semibold truncate">{uploadName}</p>
          <div className="mt-2 h-2 rounded-full bg-neutral-100 overflow-hidden">
            <div
              className="h-full bg-[var(--brand-red)] transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
          <p className="text-xs text-neutral-500 mt-2">{uploadProgress}%</p>
        </div>
      )}

      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 lg:left-auto lg:translate-x-0 lg:right-96 z-40 hidden sm:flex items-center gap-2 rounded-full border border-neutral-200 bg-white px-4 py-2 text-xs text-neutral-600 shadow-md">
        <Cloud className="w-4 h-4 text-[var(--brand-blue)]" />
        {t("cloudSync")}
      </div>
    </div>
  );
}

function VideoCard({
  video,
  onDelete,
  t,
  compact,
  list,
}: {
  video: SellerVideo;
  onDelete: (id: string) => void;
  t: ReturnType<typeof useTranslations>;
  compact?: boolean;
  list?: boolean;
}) {
  return (
    <article className={`clay-card overflow-hidden p-0 ${list ? "flex flex-row" : ""}`}>
      <div className={list ? "w-40 shrink-0" : ""}>
        <VideoThumb video={video} />
      </div>
      <div className={`p-4 ${compact ? "p-3" : ""} flex-1 min-w-0`}>
        <h3 className="font-semibold text-sm text-[var(--foreground)] line-clamp-2">{video.title}</h3>
        <p className="text-xs text-neutral-500 mt-1 capitalize">{video.status}</p>
        <div className="mt-3 flex flex-wrap gap-2">
          <Link
            href={`/dashboard/videos/editor/${video.id}`}
            className="text-xs font-semibold text-[var(--brand-blue)] hover:underline"
          >
            {t("edit")}
          </Link>
          <Link
            href={`/dashboard/videos/publish/${video.id}`}
            className="text-xs font-semibold text-[var(--brand-red)] hover:underline"
          >
            {t("publish")}
          </Link>
          <button
            type="button"
            onClick={() => onDelete(video.id)}
            className="text-xs text-neutral-400 hover:text-red-600 inline-flex items-center gap-1"
          >
            <Trash2 className="w-3 h-3" />
          </button>
        </div>
      </div>
    </article>
  );
}
