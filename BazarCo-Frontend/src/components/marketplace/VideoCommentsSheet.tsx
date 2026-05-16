"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, MessageCircle, Send, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  addVideoComment,
  listVideoComments,
  type VideoComment,
  type VideoCommentReply,
} from "@/lib/api";

function initials(name: string) {
  return (name || "U").slice(0, 2).toUpperCase();
}

function timeAgo(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "now";
  if (mins < 60) return `${mins}m`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h`;
  const days = Math.floor(hrs / 24);
  return `${days}d`;
}

function Avatar({ name }: { name: string }) {
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-[var(--brand-blue)] to-[var(--brand-red)] text-[11px] font-bold text-white">
      {initials(name)}
    </span>
  );
}

/** md+ uses a right rail; mobile keeps the bottom sheet. */
function useCommentsDesktopLayout() {
  const [isDesktop, setIsDesktop] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 768px)");
    const update = () => setIsDesktop(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isDesktop;
}

function ReplyRow({
  reply,
  onReply,
}: {
  reply: VideoCommentReply;
  onReply: (id: string, userName: string) => void;
}) {
  const t = useTranslations("videoComments");
  return (
    <div className="flex gap-2 pl-11">
      <Avatar name={reply.userName} />
      <div className="min-w-0 flex-1">
        <p className="text-xs font-semibold text-[var(--foreground)]">
          {reply.userName}{" "}
          <span className="font-normal text-[var(--brand-muted)]">{timeAgo(reply.createdAt)}</span>
        </p>
        <p className="text-sm text-[var(--foreground)] mt-0.5 leading-relaxed">{reply.text}</p>
        <button
          type="button"
          onClick={() => onReply(reply.id, reply.userName)}
          className="text-xs font-semibold text-[var(--brand-muted)] mt-1 hover:text-[var(--brand-red)]"
        >
          {t("reply")}
        </button>
      </div>
    </div>
  );
}

function CommentRow({
  comment,
  onReply,
}: {
  comment: VideoComment;
  onReply: (id: string, userName: string) => void;
}) {
  const t = useTranslations("videoComments");
  return (
    <div className="space-y-3 py-3 border-b border-[var(--brand-border)] last:border-0">
      <div className="flex gap-2">
        <Avatar name={comment.userName} />
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold text-[var(--foreground)]">
            {comment.userName}{" "}
            <span className="font-normal text-[var(--brand-muted)]">{timeAgo(comment.createdAt)}</span>
          </p>
          <p className="text-sm text-[var(--foreground)] mt-0.5 leading-relaxed">{comment.text}</p>
          <button
            type="button"
            onClick={() => onReply(comment.id, comment.userName)}
            className="text-xs font-semibold text-[var(--brand-muted)] mt-1 hover:text-[var(--brand-red)]"
          >
            {t("reply")}
          </button>
        </div>
      </div>
      {comment.replies.length > 0 && (
        <div className="space-y-3">
          {comment.replies.map((r) => (
            <ReplyRow key={r.id} reply={r} onReply={onReply} />
          ))}
        </div>
      )}
    </div>
  );
}

export function VideoCommentsSheet({
  open,
  videoId,
  onClose,
  isGuest,
  onSignInRequired,
  onTotalChange,
}: {
  open: boolean;
  videoId: string | null;
  onClose: () => void;
  isGuest: boolean;
  onSignInRequired: () => void;
  onTotalChange?: (total: number) => void;
}) {
  const t = useTranslations("videoComments");
  const isDesktop = useCommentsDesktopLayout();
  const [comments, setComments] = useState<VideoComment[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [text, setText] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyingTo, setReplyingTo] = useState<{ id: string; userName: string } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const load = useCallback(async () => {
    if (!videoId) return;
    setLoading(true);
    const res = await listVideoComments(videoId);
    setComments(res.comments);
    setTotal(res.total);
    onTotalChange?.(res.total);
    setLoading(false);
  }, [videoId, onTotalChange]);

  useEffect(() => {
    if (open && videoId) {
      setReplyingTo(null);
      setText("");
      load();
    }
  }, [open, videoId, load]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!videoId || !text.trim()) return;
    if (isGuest) {
      onSignInRequired();
      return;
    }
    setSubmitting(true);
    const result = await addVideoComment(videoId, text.trim(), replyingTo?.id);
    setSubmitting(false);
    if (!result.success) return;
    setText("");
    setReplyingTo(null);
    setTotal(result.total);
    onTotalChange?.(result.total);
    await load();
    inputRef.current?.focus();
  }

  function startReply(id: string, userName: string) {
    if (isGuest) {
      onSignInRequired();
      return;
    }
    setReplyingTo({ id, userName });
    inputRef.current?.focus();
  }

  return (
    <AnimatePresence>
      {open && videoId && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50 md:bg-black/35"
            onClick={onClose}
          />
          <motion.div
            initial={isDesktop ? { x: "100%" } : { y: "100%" }}
            animate={isDesktop ? { x: 0 } : { y: 0 }}
            exit={isDesktop ? { x: "100%" } : { y: "100%" }}
            transition={{ type: "spring", stiffness: 400, damping: 36 }}
            className="fixed z-[75] flex flex-col border border-[var(--brand-border)] bg-[var(--card-bg)] shadow-2xl inset-x-0 bottom-0 max-h-[min(85vh,720px)] rounded-t-2xl md:inset-x-auto md:inset-y-0 md:right-0 md:top-0 md:bottom-0 md:w-[min(400px,36vw)] md:max-h-none md:rounded-none md:border-t-0 md:border-l md:shadow-[-12px_0_40px_rgba(0,0,0,0.2)]"
            role="dialog"
            aria-modal="true"
            aria-labelledby="video-comments-title"
          >
            <div className="mx-auto mt-2 h-1 w-10 shrink-0 rounded-full bg-neutral-300 md:hidden" />
            <div className="flex items-center justify-between gap-3 px-4 py-3 border-b border-[var(--brand-border)]">
              <div className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5 text-[var(--brand-red)]" />
                <h2 id="video-comments-title" className="font-bold text-[var(--foreground)]">
                  {t("title")}{" "}
                  <span className="text-[var(--brand-muted)] font-semibold">({total})</span>
                </h2>
              </div>
              <button
                type="button"
                onClick={onClose}
                className="flex h-9 w-9 items-center justify-center rounded-full hover:bg-neutral-100"
                aria-label={t("close")}
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto px-4 min-h-0">
              {loading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)]" />
                </div>
              ) : comments.length === 0 ? (
                <p className="text-center text-sm text-[var(--brand-muted)] py-12">{t("empty")}</p>
              ) : (
                comments.map((c) => <CommentRow key={c.id} comment={c} onReply={startReply} />)
              )}
            </div>

            <form
              onSubmit={handleSubmit}
              className="shrink-0 border-t border-[var(--brand-border)] p-3 pb-[max(0.75rem,env(safe-area-inset-bottom))] bg-[var(--card-bg)]"
            >
              {replyingTo && (
                <div className="flex items-center justify-between gap-2 mb-2 text-xs">
                  <span className="text-[var(--brand-muted)]">
                    {t("replyingTo", { name: replyingTo.userName })}
                  </span>
                  <button
                    type="button"
                    onClick={() => setReplyingTo(null)}
                    className="font-semibold text-[var(--brand-red)]"
                  >
                    {t("cancelReply")}
                  </button>
                </div>
              )}
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder={isGuest ? t("signInToComment") : t("placeholder")}
                  disabled={submitting}
                  onFocus={() => {
                    if (isGuest) onSignInRequired();
                  }}
                  readOnly={isGuest}
                  className="flex-1 rounded-full border border-[var(--brand-border)] bg-neutral-50 px-4 py-2.5 text-sm outline-none focus:border-[var(--brand-red)]"
                />
                <button
                  type="submit"
                  disabled={submitting || !text.trim()}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-red)] text-white disabled:opacity-40"
                  aria-label={t("post")}
                >
                  {submitting ? (
                    <Loader2 className="h-5 w-5 animate-spin" />
                  ) : (
                    <Send className="h-5 w-5" />
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
