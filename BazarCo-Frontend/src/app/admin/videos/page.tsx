"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Eye, Film, Play, RefreshCw, Search, Trash2, Ban } from "lucide-react";
import {
  adminDeleteVideo,
  adminGetVideo,
  adminListVideos,
  adminUpdateVideoStatus,
} from "@/lib/adminApi";
import { resolveAdminMediaUrl } from "@/lib/adminMediaUrl";
import type { AdminVideoRow } from "@/types/admin";
import { AdminPageShell } from "@/components/admin/ui/AdminPageShell";
import { AdminModernTable } from "@/components/admin/ui/AdminModernTable";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { AdminActionBtn } from "@/components/admin/ui/AdminActionBtn";
import { AdminSlidePanel } from "@/components/admin/ui/AdminSlidePanel";
import { TablePaginationBar } from "@/components/dashboard/TablePaginationBar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";

const STATUS_TABS = [
  { id: "", label: "All" },
  { id: "live", label: "Live" },
  { id: "draft", label: "Draft" },
  { id: "processing", label: "Processing" },
  { id: "categorized", label: "Categorized" },
] as const;

function formatDuration(sec?: number) {
  if (!sec) return "—";
  const m = Math.floor(sec / 60);
  const s = sec % 60;
  return `${m}:${String(s).padStart(2, "0")}`;
}

export default function AdminVideosPage() {
  const toast = useToast();
  const [statusFilter, setStatusFilter] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(20);
  const [videos, setVideos] = useState<AdminVideoRow[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [viewId, setViewId] = useState<string | null>(null);
  const [viewVideo, setViewVideo] = useState<AdminVideoRow | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [statusUpdating, setStatusUpdating] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const query: Record<string, string | number> = { page, limit: pageSize };
    if (statusFilter) query.status = statusFilter;
    if (q.trim()) query.q = q.trim();
    const data = await adminListVideos(query);
    const list = data?.videos ?? [];
    setVideos(list);
    setTotal(data?.pagination.total ?? 0);
    setLoading(false);
  }, [page, pageSize, statusFilter, q]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    if (!viewId) {
      setViewVideo(null);
      return;
    }
    setViewLoading(true);
    void adminGetVideo(viewId).then((v) => {
      setViewVideo(v);
      setViewLoading(false);
    });
  }, [viewId]);

  async function confirmDelete() {
    if (!deleteId) return;
    const ok = await adminDeleteVideo(deleteId);
    setDeleteId(null);
    if (ok) {
      toast.success("Video deleted");
      setViewId(null);
      void load();
    } else toast.error("Delete failed");
  }

  async function changeStatus(status: string) {
    if (!viewVideo) return;
    setStatusUpdating(true);
    const ok = await adminUpdateVideoStatus(viewVideo.id, status);
    setStatusUpdating(false);
    if (ok) {
      toast.success(`Status set to ${status}`);
      void adminGetVideo(viewVideo.id).then(setViewVideo);
      void load();
    } else toast.error("Could not update status");
  }

  const thumb = (v: AdminVideoRow) => resolveAdminMediaUrl(v.thumbnailUrl);
  const videoSrc = viewVideo ? resolveAdminMediaUrl(viewVideo.videoUrl) : undefined;

  return (
    <AdminPageShell
      title="Video management"
      description="Review seller uploads, preview videos, change status, and remove policy violations."
      icon={Film}
      toolbar={
        <div className="space-y-4">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => (
              <button
                key={tab.id || "all"}
                type="button"
                onClick={() => { setStatusFilter(tab.id); setPage(1); }}
                className={`rounded-full px-4 py-1.5 text-xs font-semibold transition-all ${
                  statusFilter === tab.id
                    ? "bg-[var(--brand-red)] text-white shadow-sm"
                    : "border border-[var(--brand-border)] text-[var(--brand-muted)] hover:bg-[var(--input-bg)]"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-muted)]" />
              <input
                placeholder="Filter by title (client-side)…"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (setQ(searchInput), setPage(1))}
                className="clay-input w-full py-2.5 pl-10"
              />
            </div>
            <button type="button" onClick={() => { setQ(searchInput); setPage(1); }} className="clay-btn-blue inline-flex items-center gap-2 px-4 py-2.5 text-sm">
              <Search className="h-4 w-4" />
              Filter
            </button>
            <button type="button" onClick={() => void load()} className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-border)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--input-bg)]">
              <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            </button>
          </div>
        </div>
      }
    >
      <AdminModernTable
        loading={loading}
        emptyMessage="No videos found for this filter."
        columns={[
          {
            key: "video",
            label: "Video",
            render: (v) => {
              const url = thumb(v);
              return (
                <div className="flex items-center gap-3">
                  <div className="relative h-14 w-24 shrink-0 overflow-hidden rounded-xl border border-[var(--brand-border)] bg-black/80">
                    {url ? (
                      <Image src={url} alt="" fill className="object-cover" sizes="96px" unoptimized />
                    ) : (
                      <div className="flex h-full items-center justify-center text-white/50">
                        <Film className="h-6 w-6" />
                      </div>
                    )}
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                      <Play className="h-5 w-5 text-white drop-shadow" />
                    </div>
                  </div>
                  <div className="min-w-0">
                    <p className="font-semibold truncate max-w-[180px] sm:max-w-xs">{v.title ?? "Untitled"}</p>
                    <p className="text-xs text-[var(--brand-muted)]">{formatDuration(v.durationSeconds)} · {v.views ?? 0} views</p>
                  </div>
                </div>
              );
            },
          },
          {
            key: "status",
            label: "Status",
            render: (v) => <AdminStatusBadge status={v.status} />,
          },
          {
            key: "engagement",
            label: "Engagement",
            render: (v) => (
              <div className="text-xs text-[var(--brand-muted)] space-y-0.5">
                <p>{v.likes ?? 0} likes</p>
                <p>{v.comments ?? 0} comments</p>
              </div>
            ),
          },
          {
            key: "actions",
            label: "Actions",
            className: "text-right",
            render: (v) => (
              <div className="flex justify-end gap-1.5">
                <AdminActionBtn icon={Eye} label="View" variant="primary" onClick={() => setViewId(v.id)} />
                <AdminActionBtn icon={Trash2} label="Delete" variant="danger" onClick={() => setDeleteId(v.id)} />
              </div>
            ),
          },
        ]}
        rows={videos}
      />

      <TablePaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />

      <AdminSlidePanel
        open={!!viewId}
        title={viewVideo?.title ?? "Video"}
        subtitle={viewVideo ? `${formatDuration(viewVideo.durationSeconds)} · ${viewVideo.views ?? 0} views` : undefined}
        onClose={() => setViewId(null)}
        footer={
          viewVideo ? (
            <div className="space-y-2">
              <p className="text-xs font-semibold text-[var(--brand-muted)] uppercase tracking-wider">Set status</p>
              <div className="flex flex-wrap gap-2">
                {(["draft", "processing", "live", "categorized"] as const).map((s) => (
                  <button
                    key={s}
                    type="button"
                    disabled={statusUpdating || viewVideo.status === s}
                    onClick={() => void changeStatus(s)}
                    className={`rounded-lg px-3 py-1.5 text-xs font-semibold capitalize transition ${
                      viewVideo.status === s
                        ? "bg-[var(--brand-blue)] text-white"
                        : "border border-[var(--brand-border)] hover:bg-[var(--input-bg)]"
                    } disabled:opacity-50`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <button type="button" onClick={() => setDeleteId(viewVideo.id)} className="mt-3 w-full clay-btn-red py-2.5 text-sm">
                Delete video
              </button>
            </div>
          ) : undefined
        }
      >
        {viewLoading ? (
          <div className="animate-pulse space-y-4">
            <div className="aspect-video rounded-2xl bg-[var(--input-bg)]" />
          </div>
        ) : viewVideo ? (
          <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            <div className="overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-black">
              {videoSrc ? (
                <video src={videoSrc} controls className="w-full max-h-[360px]" poster={thumb(viewVideo)}>
                  <track kind="captions" />
                </video>
              ) : (
                <div className="flex aspect-video items-center justify-center text-[var(--brand-muted)]">
                  <Film className="h-12 w-12 opacity-40" />
                  <span className="ml-2 text-sm">No video file URL</span>
                </div>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <AdminStatusBadge status={viewVideo.status} />
              {viewVideo.visibility && (
                <span className="rounded-full bg-[var(--input-bg)] px-2.5 py-0.5 text-[11px] font-semibold capitalize text-[var(--brand-muted)]">
                  {viewVideo.visibility}
                </span>
              )}
            </div>
            {viewVideo.caption && (
              <p className="text-sm leading-relaxed text-[var(--brand-muted)]">{viewVideo.caption}</p>
            )}
            <dl className="grid gap-3 sm:grid-cols-2 text-sm">
              {[
                ["Views", String(viewVideo.views ?? 0)],
                ["Likes", String(viewVideo.likes ?? 0)],
                ["Comments", String(viewVideo.comments ?? 0)],
                ["Category", viewVideo.category ?? "—"],
                ["Seller", viewVideo.sellerId.slice(-8) + "…"],
                ["Created", viewVideo.createdAt ? new Date(viewVideo.createdAt).toLocaleDateString() : "—"],
              ].map(([k, val]) => (
                <div key={k} className="rounded-xl border border-[var(--brand-border)] bg-[var(--input-bg)]/30 px-3 py-2.5">
                  <dt className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">{k}</dt>
                  <dd className="mt-0.5 font-medium">{val}</dd>
                </div>
              ))}
            </dl>
            <button
              type="button"
              disabled={statusUpdating}
              onClick={() => void changeStatus("draft")}
              className="w-full inline-flex items-center justify-center gap-2 rounded-xl border border-amber-500/40 py-2.5 text-sm font-semibold text-amber-600 hover:bg-amber-500/10 disabled:opacity-50"
            >
              <Ban className="h-4 w-4" />
              Disable (set to draft)
            </button>
          </motion.div>
        ) : (
          <p className="text-sm text-[var(--brand-muted)]">Video not found.</p>
        )}
      </AdminSlidePanel>

      <ConfirmModal
        open={!!deleteId}
        title="Delete video?"
        message="This permanently removes the video record and cannot be undone."
        confirmLabel="Delete"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
      />
    </AdminPageShell>
  );
}
