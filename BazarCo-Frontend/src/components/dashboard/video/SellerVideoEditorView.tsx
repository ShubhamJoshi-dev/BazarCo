"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  Loader2,
  Music,
  Scissors,
  Send,
  SlidersHorizontal,
  Type,
  Wand2,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useToast } from "@/contexts/ToastContext";
import { sellerVideosGet, sellerVideosUpdate, type SellerVideo } from "@/lib/api";
import { getBackendBaseUrl } from "@/config/env";

function mediaUrl(url: string) {
  if (!url) return "";
  if (url.startsWith("http")) return url;
  return `${getBackendBaseUrl().replace(/\/$/, "")}${url.startsWith("/") ? url : `/${url}`}`;
}

const TOOLS = [
  { icon: Wand2, labelKey: "toolSelect" },
  { icon: Type, labelKey: "toolText" },
  { icon: Music, labelKey: "toolAudio" },
  { icon: SlidersHorizontal, labelKey: "toolFilters" },
  { icon: Scissors, labelKey: "toolTrim" },
] as const;

export function SellerVideoEditorView({ videoId }: { videoId: string }) {
  const t = useTranslations("sellerVideos");
  const toast = useToast();
  const [video, setVideo] = useState<SellerVideo | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const v = await sellerVideosGet(videoId);
    if (v) {
      setVideo(v);
      setTitle(v.title);
    }
    setLoading(false);
  }, [videoId]);

  useEffect(() => {
    load();
  }, [load]);

  async function saveTitle() {
    setSaving(true);
    const updated = await sellerVideosUpdate(videoId, { title });
    setSaving(false);
    if (updated) {
      setVideo(updated);
      toast.success(t("saved"));
    } else toast.error(t("saveFailed"));
  }

  if (loading) return <div className="h-96 animate-pulse rounded-xl bg-neutral-100" />;
  if (!video) return <p className="text-neutral-500">{t("notFound")}</p>;

  return (
    <div className="w-full space-y-4 pb-10">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase text-neutral-500">{t("project")}</p>
          <h1 className="text-xl font-bold">{video.title}</h1>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            disabled={saving}
            onClick={saveTitle}
            className="rounded-lg border border-neutral-200 px-4 py-2 text-sm font-medium"
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : t("save")}
          </button>
          <Link
            href={`/dashboard/videos/publish/${videoId}`}
            className="inline-flex items-center gap-2 rounded-lg bg-[var(--brand-red)] px-4 py-2 text-sm font-semibold text-white"
          >
            <Send className="w-4 h-4" />
            {t("continuePublish")}
          </Link>
        </div>
      </div>

      <div className="flex gap-4 min-h-[480px]">
        <aside className="hidden sm:flex flex-col gap-2 w-12 shrink-0">
          {TOOLS.map(({ icon: Icon, labelKey }) => (
            <button
              key={labelKey}
              type="button"
              title={t(labelKey)}
              className="flex h-10 w-10 items-center justify-center rounded-lg border border-neutral-200 bg-white text-neutral-600 hover:border-[var(--brand-red)] hover:text-[var(--brand-red)]"
            >
              <Icon className="w-4 h-4" />
            </button>
          ))}
        </aside>

        <div className="flex-1 clay-card overflow-hidden flex flex-col">
          <div className="flex-1 bg-black flex items-center justify-center min-h-[320px]">
            <video
              src={mediaUrl(video.videoUrl)}
              controls
              className="max-h-[420px] w-full"
              playsInline
            />
          </div>
          <div className="border-t border-neutral-200 p-4 bg-neutral-50">
            <label className="block text-xs font-semibold uppercase text-neutral-500 mb-1">{t("projectTitle")}</label>
            <input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full rounded-lg border border-neutral-200 px-3 py-2 text-sm mb-4"
            />
            <p className="text-xs text-neutral-500 mb-2">{t("timelineHint")}</p>
            <div className="h-16 rounded-lg bg-neutral-200/80 border border-neutral-300 flex items-center px-3 gap-1 overflow-hidden">
              {Array.from({ length: 12 }).map((_, i) => (
                <div
                  key={i}
                  className={`h-10 w-14 shrink-0 rounded ${i === 4 ? "ring-2 ring-[var(--brand-red)]" : ""} bg-gradient-to-br from-slate-600 to-slate-800`}
                />
              ))}
            </div>
            <div className="mt-2 h-8 rounded bg-blue-100 border border-blue-200 relative overflow-hidden">
              <div className="absolute inset-y-0 left-0 w-2/3 bg-blue-400/40" />
              <span className="text-[10px] text-blue-800 px-2 leading-8">{t("audioTrack")}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
