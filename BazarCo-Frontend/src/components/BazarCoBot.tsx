"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { chatBot, type BotMessage } from "@/lib/api";

const QUICK_PROMPTS = [
  "What are the hot selling products?",
  "Show me top reviews",
  "How do I place an order?",
  "How do I browse products?",
];

export function BazarCoBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<BotMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasUnread, setHasUnread] = useState(true);
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
      setHasUnread(false);
    }
  }, [open, messages]);

  async function send(userContent: string) {
    const trimmed = userContent.trim();
    if (!trimmed || loading) return;

    const newUserMessage: BotMessage = { role: "user", content: trimmed };
    setMessages((prev) => [...prev, newUserMessage]);
    setInput("");
    setLoading(true);

    const history: BotMessage[] = [...messages, newUserMessage];
    const result = await chatBot(history);

    setLoading(false);
    if ("reply" in result) {
      setMessages((prev) => [...prev, { role: "assistant", content: result.reply }]);
    } else {
      setMessages((prev) => [...prev, { role: "assistant", content: `Sorry — ${result.error}` }]);
    }
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    send(input);
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {/* Chat panel — slides up from the button */}
      <AnimatePresence>
        {open && (
          <motion.div
            key="chat-panel"
            initial={{ opacity: 0, y: 32, scale: 0.92, transformOrigin: "bottom right" }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 24, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 380, damping: 28 }}
            className="flex flex-col w-[min(380px,calc(100vw-2rem))] h-[min(500px,68vh)] rounded-2xl border border-white/10 bg-[var(--brand-black)] overflow-hidden"
            style={{ boxShadow: "0 12px 40px rgba(0,0,0,0.45), 0 0 0 1px rgba(255,255,255,0.06)" }}
          >
            {/* Header */}
            <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-white/10 bg-white/[0.04]">
              <div className="flex items-center gap-2.5">
                <div className="relative flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white shadow-lg shadow-[var(--brand-blue)]/30">
                  <Sparkles className="h-4.5 w-4.5" />
                  <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full bg-emerald-400 border-2 border-[var(--brand-black)]" />
                </div>
                <div>
                  <p className="font-semibold text-[var(--brand-white)] text-sm">BazarCoBot</p>
                  <p className="text-[10px] text-emerald-400 font-medium">Online · AI Assistant</p>
                </div>
              </div>
              <motion.button
                type="button"
                onClick={() => setOpen(false)}
                className="rounded-full p-1.5 text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/10 transition-colors"
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                aria-label="Close chat"
              >
                <X className="h-4.5 w-4.5" />
              </motion.button>
            </div>

            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.length === 0 && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 }}
                  className="text-center py-4"
                >
                  <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-blue)]/15 mx-auto mb-3">
                    <Sparkles className="h-6 w-6 text-[var(--brand-blue)]" />
                  </div>
                  <p className="text-sm font-medium text-[var(--brand-white)] mb-1">Hi! I&apos;m BazarCoBot</p>
                  <p className="text-xs text-neutral-400 mb-4">Ask me anything about products, orders, or browsing.</p>
                  <div className="space-y-2">
                    {QUICK_PROMPTS.map((prompt, i) => (
                      <motion.button
                        key={prompt}
                        type="button"
                        onClick={() => send(prompt)}
                        initial={{ opacity: 0, x: -8 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.15 + i * 0.06 }}
                        className="w-full text-left text-xs px-3 py-2 rounded-xl bg-white/[0.06] border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-[var(--brand-white)] hover:border-[var(--brand-blue)]/40 transition-all"
                      >
                        {prompt}
                      </motion.button>
                    ))}
                  </div>
                </motion.div>
              )}
              {messages.map((m, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  transition={{ type: "spring", stiffness: 400, damping: 28 }}
                  className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[82%] rounded-2xl px-3.5 py-2.5 text-sm ${
                      m.role === "user"
                        ? "bg-[var(--brand-blue)] text-white rounded-br-[6px] shadow-lg shadow-[var(--brand-blue)]/20"
                        : "bg-white/[0.08] text-[var(--brand-white)] border border-white/10 rounded-bl-[6px]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap break-words leading-relaxed">{m.content}</p>
                  </div>
                </motion.div>
              ))}
              {loading && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex justify-start"
                >
                  <div className="rounded-2xl rounded-bl-[6px] px-4 py-3 bg-white/[0.08] border border-white/10 flex gap-1 items-center">
                    {[0, 1, 2].map((i) => (
                      <motion.span
                        key={i}
                        className="w-1.5 h-1.5 rounded-full bg-[var(--brand-blue)]"
                        animate={{ y: [0, -4, 0] }}
                        transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
                      />
                    ))}
                  </div>
                </motion.div>
              )}
            </div>

            {/* Input */}
            <form onSubmit={handleSubmit} className="shrink-0 p-3 border-t border-white/10 bg-white/[0.02]">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  placeholder="Ask anything..."
                  className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/50 focus:border-[var(--brand-blue)]/50 transition-all"
                  disabled={loading}
                />
                <motion.button
                  type="submit"
                  disabled={loading || !input.trim()}
                  className="shrink-0 rounded-xl bg-[var(--brand-blue)] px-3.5 py-2.5 text-white disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-[var(--brand-blue)]/20"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <Send className="h-4.5 w-4.5" />
                </motion.button>
              </div>
              <p className="text-[10px] text-neutral-500 mt-1.5 px-1">
                <Link href="/dashboard/browse" className="text-[var(--brand-blue)] hover:underline">Browse</Link>
                {" · "}
                <Link href="/dashboard/orders" className="text-[var(--brand-blue)] hover:underline">Orders</Link>
              </p>
            </form>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Messenger-style FAB */}
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[var(--brand-blue)] text-white shadow-xl"
        style={{ boxShadow: "0 4px 20px rgba(77,166,255,0.45), 0 2px 8px rgba(0,0,0,0.3)" }}
        whileHover={{ scale: 1.08 }}
        whileTap={{ scale: 0.92 }}
        animate={!open ? { scale: [1, 1.06, 1] } : { scale: 1 }}
        transition={!open ? { duration: 2.5, repeat: Infinity, ease: "easeInOut" } : { duration: 0.2 }}
        aria-label={open ? "Close BazarCoBot" : "Open BazarCoBot"}
      >
        <AnimatePresence mode="wait">
          {open ? (
            <motion.span
              key="x"
              initial={{ rotate: -90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: 90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <X className="h-6 w-6" />
            </motion.span>
          ) : (
            <motion.span
              key="msg"
              initial={{ rotate: 90, opacity: 0 }}
              animate={{ rotate: 0, opacity: 1 }}
              exit={{ rotate: -90, opacity: 0 }}
              transition={{ duration: 0.18 }}
            >
              <MessageCircle className="h-6 w-6" />
            </motion.span>
          )}
        </AnimatePresence>

        {/* Unread dot */}
        <AnimatePresence>
          {hasUnread && !open && (
            <motion.span
              key="badge"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0 }}
              className="absolute -top-0.5 -right-0.5 h-4 w-4 rounded-full bg-[var(--brand-red)] border-2 border-[var(--background)] flex items-center justify-center text-[9px] font-bold text-white"
            >
              1
            </motion.span>
          )}
        </AnimatePresence>
      </motion.button>
    </div>
  );
}
