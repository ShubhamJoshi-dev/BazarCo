"use client";

import { useCallback, useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Flag,
  MessageCircle,
  MessagesSquare,
  RefreshCw,
  Search,
  Trash2,
  Eye,
  Users,
} from "lucide-react";
import {
  adminDeleteMessage,
  adminFlagMessage,
  adminGetConversationMessages,
  adminListConversations,
  adminSearchMessages,
} from "@/lib/adminApi";
import type { AdminConversationRow, AdminMessageRow } from "@/types/admin";
import { AdminPageShell } from "@/components/admin/ui/AdminPageShell";
import { AdminModernTable } from "@/components/admin/ui/AdminModernTable";
import { AdminStatusBadge } from "@/components/admin/ui/AdminStatusBadge";
import { AdminActionBtn } from "@/components/admin/ui/AdminActionBtn";
import { AdminSlidePanel } from "@/components/admin/ui/AdminSlidePanel";
import { TablePaginationBar } from "@/components/dashboard/TablePaginationBar";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";

type Tab = "messages" | "conversations";

function formatTime(iso?: string) {
  if (!iso) return "—";
  return new Date(iso).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminChatPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("messages");
  const [q, setQ] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [flagged, setFlagged] = useState("");
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [messages, setMessages] = useState<AdminMessageRow[]>([]);
  const [total, setTotal] = useState(0);
  const [conversations, setConversations] = useState<AdminConversationRow[]>([]);
  const [convTotal, setConvTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [viewMessage, setViewMessage] = useState<AdminMessageRow | null>(null);
  const [threadId, setThreadId] = useState<string | null>(null);
  const [threadMessages, setThreadMessages] = useState<AdminMessageRow[]>([]);
  const [threadLoading, setThreadLoading] = useState(false);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    const query: Record<string, string | number> = { page, limit: pageSize };
    if (q) query.q = q;
    if (flagged) query.flagged = flagged;
    const data = await adminSearchMessages(query);
    setMessages(data?.messages ?? []);
    setTotal(data?.pagination.total ?? 0);
    setLoading(false);
  }, [page, pageSize, q, flagged]);

  const loadConversations = useCallback(async () => {
    setLoading(true);
    const data = await adminListConversations({ page, limit: pageSize });
    setConversations(data?.conversations ?? []);
    setConvTotal(data?.pagination.total ?? 0);
    setLoading(false);
  }, [page, pageSize]);

  useEffect(() => {
    setPage(1);
  }, [tab]);

  useEffect(() => {
    if (tab === "messages") void loadMessages();
    else void loadConversations();
  }, [tab, loadMessages, loadConversations]);

  useEffect(() => {
    if (!threadId) {
      setThreadMessages([]);
      return;
    }
    setThreadLoading(true);
    void adminGetConversationMessages(threadId, { limit: 100 }).then((data) => {
      setThreadMessages(data?.messages ?? []);
      setThreadLoading(false);
    });
  }, [threadId]);

  async function confirmDelete() {
    if (!deleteId) return;
    const ok = await adminDeleteMessage(deleteId);
    setDeleteId(null);
    if (ok) {
      toast.success("Message removed");
      setViewMessage(null);
      if (tab === "messages") void loadMessages();
      if (threadId) void adminGetConversationMessages(threadId, { limit: 100 }).then((d) => setThreadMessages(d?.messages ?? []));
    } else toast.error("Moderation failed");
  }

  async function toggleFlag(messageId: string, next: boolean) {
    const ok = await adminFlagMessage(messageId, next);
    if (ok) {
      toast.success(next ? "Message flagged" : "Flag removed");
      void loadMessages();
      if (threadId) void adminGetConversationMessages(threadId, { limit: 100 }).then((d) => setThreadMessages(d?.messages ?? []));
    } else toast.error("Could not update flag");
  }

  const tabs = (
    <div className="flex rounded-xl border border-[var(--brand-border)] bg-[var(--input-bg)]/50 p-1">
      {(
        [
          { id: "messages" as const, label: "All messages", icon: MessagesSquare },
          { id: "conversations" as const, label: "Conversations", icon: Users },
        ] as const
      ).map(({ id, label, icon: Icon }) => (
        <button
          key={id}
          type="button"
          onClick={() => setTab(id)}
          className={`relative flex flex-1 items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold transition-colors sm:flex-none ${
            tab === id ? "text-white" : "text-[var(--brand-muted)] hover:text-[var(--foreground)]"
          }`}
        >
          {tab === id && (
            <motion.span
              layoutId="chat-tab"
              className="absolute inset-0 rounded-lg bg-[var(--brand-blue)]"
              transition={{ type: "spring", stiffness: 400, damping: 30 }}
            />
          )}
          <Icon className="relative z-10 h-4 w-4" />
          <span className="relative z-10">{label}</span>
        </button>
      ))}
    </div>
  );

  return (
    <AdminPageShell
      title="Chat monitoring"
      description="Search messages, review buyer–seller threads, flag abuse, and remove policy violations."
      icon={MessageCircle}
      toolbar={
        <div className="space-y-4">
          {tabs}
          {tab === "messages" ? (
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <div className="relative flex-1 max-w-lg">
                <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-muted)]" />
                <input
                  placeholder="Search message content…"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && (setQ(searchInput), setPage(1))}
                  className="clay-input w-full py-2.5 pl-10"
                />
              </div>
              <select value={flagged} onChange={(e) => { setFlagged(e.target.value); setPage(1); }} className="clay-input sm:w-44">
                <option value="">All messages</option>
                <option value="true">Flagged only</option>
              </select>
              <button type="button" onClick={() => { setQ(searchInput); setPage(1); }} className="clay-btn-blue inline-flex items-center gap-2 px-4 py-2.5 text-sm">
                <Search className="h-4 w-4" />
                Search
              </button>
              <button type="button" onClick={() => void loadMessages()} className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-border)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--input-bg)]">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
              </button>
            </div>
          ) : (
            <div className="flex justify-end">
              <button type="button" onClick={() => void loadConversations()} className="inline-flex items-center gap-2 rounded-xl border border-[var(--brand-border)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--input-bg)]">
                <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
                Refresh
              </button>
            </div>
          )}
        </div>
      }
    >
      <AnimatePresence mode="wait">
        {tab === "messages" ? (
          <motion.div key="messages" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AdminModernTable
              loading={loading}
              emptyMessage={q ? "No messages match your search." : "No chat messages in the database yet."}
              columns={[
                {
                  key: "content",
                  label: "Message",
                  render: (m) => (
                    <div className="max-w-md">
                      <p className="text-sm leading-relaxed line-clamp-2">{m.content || "—"}</p>
                      <p className="mt-1 text-[10px] font-mono text-[var(--brand-muted)]">#{m.messageId.slice(0, 8)}</p>
                    </div>
                  ),
                },
                {
                  key: "meta",
                  label: "Participants",
                  render: (m) => (
                    <div className="text-xs text-[var(--brand-muted)] space-y-0.5">
                      <p>
                        <span className="text-[var(--foreground)] font-medium">{m.role ?? "user"}</span>
                      </p>
                      <p className="font-mono truncate max-w-[120px]">→ {m.receiverId?.slice(-6) ?? "—"}</p>
                    </div>
                  ),
                },
                {
                  key: "status",
                  label: "Status",
                  render: (m) => (m.flagged ? <AdminStatusBadge status="flagged" /> : <AdminStatusBadge status="active" label="OK" />),
                },
                {
                  key: "date",
                  label: "Sent",
                  render: (m) => <span className="text-xs text-[var(--brand-muted)] whitespace-nowrap">{formatTime(m.createdAt)}</span>,
                },
                {
                  key: "actions",
                  label: "Actions",
                  className: "text-right",
                  render: (m) => (
                    <div className="flex justify-end gap-1.5 flex-wrap">
                      <AdminActionBtn icon={Eye} label="View" variant="primary" onClick={() => setViewMessage(m)} />
                      <AdminActionBtn
                        icon={Flag}
                        label={m.flagged ? "Unflag" : "Flag"}
                        variant="warn"
                        onClick={() => void toggleFlag(m.messageId, !m.flagged)}
                      />
                      <AdminActionBtn icon={Trash2} label="Remove" variant="danger" onClick={() => setDeleteId(m.messageId)} />
                    </div>
                  ),
                },
              ]}
              rows={messages}
            />
            <TablePaginationBar page={page} pageSize={pageSize} total={total} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
          </motion.div>
        ) : (
          <motion.div key="conversations" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}>
            <AdminModernTable
              loading={loading}
              emptyMessage="No conversations yet."
              columns={[
                {
                  key: "id",
                  label: "Thread",
                  render: (c) => (
                    <div>
                      <p className="font-mono text-sm font-semibold">#{c.id.slice(-8)}</p>
                      <p className="text-xs text-[var(--brand-muted)] mt-0.5">Buyer ↔ Seller</p>
                    </div>
                  ),
                },
                {
                  key: "buyer",
                  label: "Buyer",
                  render: (c) => <span className="font-mono text-xs">{c.buyerId.slice(-8)}</span>,
                },
                {
                  key: "seller",
                  label: "Seller",
                  render: (c) => <span className="font-mono text-xs">{c.sellerId.slice(-8)}</span>,
                },
                {
                  key: "updated",
                  label: "Last activity",
                  render: (c) => <span className="text-xs text-[var(--brand-muted)]">{formatTime(c.updatedAt)}</span>,
                },
                {
                  key: "actions",
                  label: "",
                  className: "text-right",
                  render: (c) => (
                    <AdminActionBtn icon={Eye} label="Open thread" variant="primary" onClick={() => setThreadId(c.id)} />
                  ),
                },
              ]}
              rows={conversations}
            />
            <TablePaginationBar page={page} pageSize={pageSize} total={convTotal} onPageChange={setPage} onPageSizeChange={(s) => { setPageSize(s); setPage(1); }} />
          </motion.div>
        )}
      </AnimatePresence>

      <AdminSlidePanel
        open={!!viewMessage}
        title="Message detail"
        subtitle={viewMessage ? formatTime(viewMessage.createdAt) : undefined}
        onClose={() => setViewMessage(null)}
        footer={
          viewMessage ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => void toggleFlag(viewMessage.messageId, !viewMessage.flagged)}
                className="flex-1 rounded-xl border border-amber-500/40 py-2.5 text-sm font-semibold text-amber-600 hover:bg-amber-500/10"
              >
                {viewMessage.flagged ? "Remove flag" : "Flag message"}
              </button>
              <button type="button" onClick={() => setDeleteId(viewMessage.messageId)} className="flex-1 clay-btn-red py-2.5 text-sm">
                Remove message
              </button>
            </div>
          ) : undefined
        }
      >
        {viewMessage && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
            <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--input-bg)]/50 p-4">
              <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{viewMessage.content}</p>
            </div>
            <dl className="grid gap-2 text-sm">
              {[
                ["Message ID", viewMessage.messageId],
                ["Conversation", viewMessage.conversationId],
                ["Sender", viewMessage.senderId ?? "—"],
                ["Receiver", viewMessage.receiverId ?? "—"],
                ["Role", viewMessage.role ?? "—"],
              ].map(([k, v]) => (
                <div key={k} className="flex justify-between gap-3 border-b border-[var(--brand-border)]/60 py-2">
                  <dt className="text-[var(--brand-muted)]">{k}</dt>
                  <dd className="font-mono text-xs text-right break-all">{v}</dd>
                </div>
              ))}
            </dl>
          </motion.div>
        )}
      </AdminSlidePanel>

      <AdminSlidePanel
        open={!!threadId}
        title="Conversation thread"
        subtitle={threadId ? `Thread #${threadId.slice(-8)}` : undefined}
        onClose={() => setThreadId(null)}
      >
        {threadLoading ? (
          <div className="space-y-3 animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-16 rounded-xl bg-[var(--input-bg)]" />
            ))}
          </div>
        ) : threadMessages.length === 0 ? (
          <p className="text-center text-sm text-[var(--brand-muted)] py-8">No messages in this thread.</p>
        ) : (
          <div className="space-y-3">
            {threadMessages.map((m, i) => (
              <motion.div
                key={m.messageId}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.02 }}
                className={`rounded-xl border p-3 ${
                  m.flagged ? "border-[var(--brand-red)]/40 bg-[var(--brand-red)]/5" : "border-[var(--brand-border)] bg-[var(--input-bg)]/30"
                }`}
              >
                <div className="flex items-start justify-between gap-2 mb-1.5">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)]">{m.role ?? "user"}</span>
                  <span className="text-[10px] text-[var(--brand-muted)]">{formatTime(m.createdAt)}</span>
                </div>
                <p className="text-sm leading-relaxed">{m.content}</p>
                <div className="mt-2 flex gap-2">
                  <button type="button" onClick={() => setViewMessage(m)} className="text-xs font-semibold text-[var(--brand-blue)]">
                    Details
                  </button>
                  <button type="button" onClick={() => setDeleteId(m.messageId)} className="text-xs font-semibold text-[var(--brand-red)]">
                    Remove
                  </button>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </AdminSlidePanel>

      <ConfirmModal
        open={!!deleteId}
        title="Remove message?"
        message="The message will be replaced with a moderation notice. Participants will no longer see the original content."
        confirmLabel="Remove"
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteId(null)}
      />
    </AdminPageShell>
  );
}
