"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { MessageCircle, Loader2, Send, ArrowLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { useChatSocket } from "@/contexts/ChatSocketContext";
import {
  listConversations,
  getConversation,
  getConversationMessages,
  type ChatConversation,
} from "@/lib/api";
import {
  joinConversation,
  leaveConversation,
  sendMessage as sendMessageSocket,
  emitTypingStart,
  emitTypingStop,
  emitMarkSeen,
  unsendMessage as unsendMessageSocket,
} from "@/lib/socket";
import type { ChatMessagePayload } from "@/lib/socket";

const UNSEND_WINDOW_MS = 15 * 60 * 1000;

function ConversationRow({
  conv,
  currentUserId,
  selectedId,
  onSelect,
  t,
}: {
  conv: ChatConversation;
  currentUserId: string;
  selectedId: string | null;
  onSelect: (id: string) => void;
  t: (key: string) => string;
}) {
  const other = currentUserId === conv.buyerId ? conv.seller : conv.buyer;
  const label = conv.order?.id
    ? `${t("order")} #${conv.order.id.slice(-6)}`
    : conv.product?.name
      ? conv.product.name
      : other?.name ?? other?.email ?? t("chat");
  const sub = conv.order?.id ? `$${conv.order.total?.toFixed(2) ?? "—"}` : conv.product?.price != null ? `$${conv.product.price.toFixed(2)}` : "";
  const isSelected = selectedId === conv.id;

  return (
    <button
      type="button"
      onClick={() => onSelect(conv.id)}
      className={`w-full text-left flex items-center gap-3 rounded-xl p-3 transition-all duration-200 ${
        isSelected
          ? "bg-[var(--brand-blue)]/20 border border-[var(--brand-blue)]/40"
          : "hover:bg-white/[0.06] border border-transparent"
      }`}
    >
      <div className="relative h-11 w-11 rounded-full bg-white/10 flex items-center justify-center shrink-0 overflow-hidden ring-2 ring-white/10">
        <span className="text-base font-semibold text-[var(--brand-white)]">
          {(other?.name ?? other?.email ?? "?")[0].toUpperCase()}
        </span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-medium text-[var(--brand-white)] truncate">{other?.name ?? other?.email ?? "—"}</p>
        <p className="text-xs text-neutral-400 truncate">
          {label}
          {sub ? ` · ${sub}` : ""}
        </p>
      </div>
      <span className="text-xs text-neutral-500 shrink-0">{conv.updatedAt ? new Date(conv.updatedAt).toLocaleDateString() : ""}</span>
    </button>
  );
}

export default function ChatPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const withId = searchParams.get("with");
  const { user } = useAuth();
  const { connected, on, off } = useChatSocket();
  const t = useTranslations("chat");

  const [conversations, setConversations] = useState<ChatConversation[]>([]);
  const [loadingList, setLoadingList] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [messages, setMessages] = useState<ChatMessagePayload[]>([]);
  const [loadingChat, setLoadingChat] = useState(false);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [typingUserId, setTypingUserId] = useState<string | null>(null);
  const [onlineUserIds, setOnlineUserIds] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const id = withId ?? null;
  const isBuyer = user?.id === selectedConversation?.buyerId;
  const otherParty = isBuyer ? selectedConversation?.seller : selectedConversation?.buyer;
  const otherName = otherParty?.name ?? otherParty?.email ?? "—";

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => {
    (async () => {
      const list = await listConversations();
      setConversations(list);
      setLoadingList(false);
    })();
  }, []);

  useEffect(() => {
    if (!withId) {
      setSelectedConversation(null);
      setMessages([]);
      return;
    }
    let cancelled = false;
    setLoadingChat(true);
    (async () => {
      const conv = await getConversation(withId);
      if (cancelled) return;
      setSelectedConversation(conv ?? null);
      if (!conv) {
        setLoadingChat(false);
        return;
      }
      const list = await getConversationMessages(withId, { limit: 30 });
      if (cancelled) return;
      setMessages(list as ChatMessagePayload[]);
      setLoadingChat(false);
    })();
    return () => {
      cancelled = true;
    };
  }, [withId]);

  useEffect(() => {
    if (!id || !connected) return;
    joinConversation(id)
      .then(() => emitMarkSeen(id))
      .catch(() => {});
    return () => leaveConversation(id);
  }, [id, connected]);

  useEffect(() => {
    if (!id) return;
    const onMessage = (msg: ChatMessagePayload) => {
      if (msg.conversationId !== id) return;
      setMessages((prev) => {
        if (prev.some((m) => m.messageId === msg.messageId)) return prev;
        return [...prev, msg];
      });
      scrollToBottom();
    };
    const onUnsent = (payload: { messageId: string; content: string; isUnsent: boolean }) => {
      setMessages((prev) =>
        prev.map((m) => (m.messageId === payload.messageId ? { ...m, content: payload.content, isUnsent: payload.isUnsent } : m))
      );
    };
    const onTyping = (payload: { userId: string }) => {
      setTypingUserId(payload.userId);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => setTypingUserId(null), 3000);
    };
    const onTypingStop = (payload: { userId: string }) => {
      if (payload.userId === typingUserId) setTypingUserId(null);
    };
    const onUserOnline = (payload: { userId: string }) => setOnlineUserIds((prev) => new Set(prev).add(payload.userId));
    const onUserOffline = (payload: { userId: string }) => {
      setOnlineUserIds((prev) => {
        const next = new Set(prev);
        next.delete(payload.userId);
        return next;
      });
    };
    const onMessageStatus = (payload: { messageId: string; status: string }) => {
      setMessages((prev) =>
        prev.map((m) => (m.messageId === payload.messageId ? { ...m, status: payload.status } : m))
      );
    };
    on("message", onMessage);
    on("message_unsent", onUnsent);
    on("message_status", onMessageStatus);
    on("typing", onTyping);
    on("typing_stop", onTypingStop);
    on("user_online", onUserOnline);
    on("user_offline", onUserOffline);
    return () => {
      off("message", onMessage);
      off("message_unsent", onUnsent);
      off("message_status", onMessageStatus);
      off("typing", onTyping);
      off("typing_stop", onTypingStop);
      off("user_online", onUserOnline);
      off("user_offline", onUserOffline);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    };
  }, [id, on, off, scrollToBottom]);

  const loadOlder = useCallback(async () => {
    if (!id || messages.length === 0 || loadingOlder) return;
    setLoadingOlder(true);
    const first = messages[0];
    const older = await getConversationMessages(id, { limit: 20, beforeMessageId: first.messageId });
    setLoadingOlder(false);
    if (older.length) setMessages((prev) => [...(older as ChatMessagePayload[]), ...prev]);
  }, [id, messages, loadingOlder]);

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text || !id || sending || !connected) return;
    setInput("");
    setSending(true);
    try {
      await sendMessageSocket(id, text);
      emitTypingStop(id);
    } catch {
      setInput(text);
    }
    setSending(false);
  }, [id, input, sending, connected]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    if (connected && id) {
      emitTypingStart(id);
      if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
      typingTimeoutRef.current = setTimeout(() => emitTypingStop(id), 2000);
    }
  };

  const handleUnsend = useCallback(
    async (messageId: string) => {
      if (!id) return;
      try {
        await unsendMessageSocket(id, messageId);
      } catch {
        // ignore
      }
    },
    [id]
  );

  const canUnsend = (msg: ChatMessagePayload) => {
    if (msg.senderId !== user?.id || msg.isUnsent) return false;
    return Date.now() - new Date(msg.createdAt).getTime() < UNSEND_WINDOW_MS;
  };

  const clearSelection = () => router.push("/dashboard/chat");

  return (
    <div className="flex flex-col h-[calc(100vh-6rem)] min-h-[420px] rounded-2xl border border-white/10 bg-white/[0.02] overflow-hidden shadow-xl">
      <div className="flex flex-1 min-h-0">
        <aside className="w-full sm:w-80 lg:w-96 border-r border-white/10 flex flex-col bg-white/[0.03] shrink-0">
          <div className="p-4 border-b border-white/10">
            <h1 className="text-lg font-bold text-[var(--brand-white)] flex items-center gap-2">
              <MessageCircle className="w-5 h-5 text-[var(--brand-blue)]" />
              {t("conversations")}
            </h1>
          </div>
          <div className="flex-1 overflow-y-auto p-3">
            {loadingList ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 text-[var(--brand-blue)] animate-spin" />
              </div>
            ) : conversations.length === 0 ? (
              <div className="py-12 text-center">
                <MessageCircle className="mx-auto w-12 h-12 text-neutral-500 mb-3" />
                <p className="text-sm text-neutral-400">{t("noConversations")}</p>
                <p className="text-xs text-neutral-500 mt-1">{t("noConversationsHint")}</p>
              </div>
            ) : (
              <div className="space-y-1">
                {conversations.map((conv) => (
                  <ConversationRow
                    key={conv.id}
                    conv={conv}
                    currentUserId={user?.id ?? ""}
                    selectedId={id}
                    onSelect={(convId) => router.push("/dashboard/chat?with=" + encodeURIComponent(convId))}
                    t={t}
                  />
                ))}
              </div>
            )}
          </div>
        </aside>

        <main className="flex-1 flex flex-col min-w-0 bg-[var(--brand-black)]/40">
          <AnimatePresence mode="wait">
            {!id ? (
              <motion.div
                key="empty"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex flex-col items-center justify-center p-8 text-center"
              >
                <div className="rounded-full bg-white/5 p-6 mb-4">
                  <MessageCircle className="w-16 h-16 text-neutral-500" />
                </div>
                <p className="text-lg font-medium text-[var(--brand-white)] mb-1">{t("conversations")}</p>
                <p className="text-sm text-neutral-400 max-w-sm">{t("noConversationsHint")}</p>
                <p className="text-xs text-neutral-500 mt-4">{t("selectConversation")}</p>
              </motion.div>
            ) : loadingChat || !selectedConversation ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex-1 flex items-center justify-center"
              >
                <Loader2 className="w-10 h-10 text-[var(--brand-blue)] animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key={id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col flex-1 min-h-0"
              >
                <header className="flex items-center gap-3 border-b border-white/10 px-4 py-3 shrink-0 bg-white/[0.02]">
                  <button
                    type="button"
                    onClick={clearSelection}
                    className="p-1.5 rounded-lg text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5 sm:hidden"
                  >
                    <ArrowLeft className="w-5 h-5" />
                  </button>
                  <div className="relative h-10 w-10 rounded-full bg-white/10 flex items-center justify-center shrink-0 ring-2 ring-white/10">
                    <span className="text-sm font-semibold text-[var(--brand-white)]">{otherName[0].toUpperCase()}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-[var(--brand-white)] truncate">{otherName}</p>
                    <p className="text-xs text-neutral-400 flex items-center gap-2">
                      {selectedConversation.order?.id ? (
                        <span>{t("order")} #{selectedConversation.order.id.slice(-6)}</span>
                      ) : selectedConversation.product?.name ? (
                        <span>{selectedConversation.product.name}</span>
                      ) : null}
                      <span className={onlineUserIds.has(isBuyer ? selectedConversation.sellerId : selectedConversation.buyerId) ? "text-emerald-400" : "text-neutral-500"}>
                        {onlineUserIds.has(isBuyer ? selectedConversation.sellerId : selectedConversation.buyerId) ? t("online") : t("offline")}
                      </span>
                    </p>
                  </div>
                </header>

                <div
                  ref={listRef}
                  className="flex-1 overflow-y-auto p-4 space-y-3"
                  onScroll={(e) => {
                    const el = e.currentTarget;
                    if (el.scrollTop < 80) loadOlder();
                  }}
                >
                  {loadingOlder && (
                    <div className="flex justify-center py-2">
                      <Loader2 className="w-5 h-5 animate-spin text-neutral-500" />
                    </div>
                  )}
                  {messages.map((msg) => {
                    const isOwn = msg.senderId === user?.id;
                    return (
                      <div key={msg.messageId} className={`flex ${isOwn ? "justify-end" : "justify-start"}`}>
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-2.5 ${
                            isOwn ? "bg-[var(--brand-blue)] text-white shadow-lg shadow-[var(--brand-blue)]/20" : "bg-white/10 text-[var(--brand-white)] border border-white/10"
                          }`}
                        >
                          <p className="text-sm whitespace-pre-wrap break-words">
                            {msg.isUnsent ? <span className="italic text-neutral-400">{t("unsentPlaceholder")}</span> : msg.content}
                          </p>
                          <div className="flex items-center gap-2 mt-1 justify-end">
                            <span className="text-xs opacity-70">
                              {new Date(msg.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                            </span>
                            {isOwn && (
                              <>
                                <span className="text-xs opacity-70">
                                  {msg.status === "seen" ? t("seen") : msg.status === "delivered" ? t("delivered") : t("sent")}
                                </span>
                                {canUnsend(msg) && (
                                  <button type="button" onClick={() => handleUnsend(msg.messageId)} className="text-xs opacity-70 hover:underline">
                                    {t("unsend")}
                                  </button>
                                )}
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {typingUserId && typingUserId !== user?.id && (
                    <p className="text-sm text-neutral-400 animate-pulse">
                      {typingUserId === selectedConversation.buyerId ? t("buyerTyping") : t("sellerTyping")}
                    </p>
                  )}
                  <div ref={messagesEndRef} />
                </div>

                <div className="border-t border-white/10 p-3 shrink-0 bg-white/[0.02]">
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={input}
                      onChange={handleInputChange}
                      onKeyDown={handleKeyDown}
                      placeholder={t("typeMessage")}
                      className="flex-1 rounded-xl border border-white/10 bg-white/[0.06] px-4 py-3 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/50 focus:border-[var(--brand-blue)]/50"
                      disabled={!connected}
                    />
                    <button
                      type="button"
                      onClick={handleSend}
                      disabled={!input.trim() || sending || !connected}
                      className="rounded-xl bg-[var(--brand-blue)] p-3 text-white hover:bg-[var(--brand-blue)]/90 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-[var(--brand-blue)]/20"
                    >
                      {sending ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
