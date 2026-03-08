"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { MessageCircle, X, Send, Loader2 } from "lucide-react";
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
  const listRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (open && listRef.current) listRef.current.scrollTop = listRef.current.scrollHeight;
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
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-2">
      {open && (
        <div
          className="flex flex-col w-[min(400px,calc(100vw-2rem))] h-[min(520px,70vh)] rounded-2xl border border-white/10 bg-[var(--brand-black)] shadow-xl overflow-hidden"
          style={{ boxShadow: "0 8px 32px rgba(0,0,0,0.4)" }}
        >
          <div className="flex items-center justify-between shrink-0 px-4 py-3 border-b border-white/10 bg-white/[0.04]">
            <div className="flex items-center gap-2">
              <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <p className="font-semibold text-[var(--brand-white)]">BazarCoBot</p>
                <p className="text-xs text-neutral-500">Ask about products, orders & help</p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-lg p-1.5 text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/10"
              aria-label="Close chat"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div ref={listRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.length === 0 && (
              <div className="text-center py-6">
                <p className="text-sm text-neutral-400 mb-4">Hi! I can help you with:</p>
                <ul className="space-y-2 text-left max-w-xs mx-auto">
                  {QUICK_PROMPTS.map((prompt) => (
                    <li key={prompt}>
                      <button
                        type="button"
                        onClick={() => send(prompt)}
                        className="w-full text-left text-sm px-3 py-2 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:bg-white/10 hover:text-[var(--brand-white)] transition-colors"
                      >
                        {prompt}
                      </button>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-neutral-500 mt-4">
                  Or type your question below. Try &quot;Hot products&quot; or &quot;Top reviews&quot;.
                </p>
              </div>
            )}
            {messages.map((m, i) => (
              <div
                key={i}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                    m.role === "user"
                      ? "bg-[var(--brand-blue)] text-white rounded-br-md"
                      : "bg-white/[0.08] text-[var(--brand-white)] border border-white/10 rounded-bl-md"
                  }`}
                >
                  <p className="whitespace-pre-wrap break-words">{m.content}</p>
                </div>
              </div>
            ))}
            {loading && (
              <div className="flex justify-start">
                <div className="rounded-2xl rounded-bl-md px-4 py-2.5 bg-white/[0.08] border border-white/10">
                  <Loader2 className="h-5 w-5 animate-spin text-[var(--brand-blue)]" />
                </div>
              </div>
            )}
          </div>

          <form onSubmit={handleSubmit} className="shrink-0 p-3 border-t border-white/10 bg-white/[0.02]">
            <div className="flex gap-2">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask anything..."
                className="flex-1 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:outline-none focus:ring-2 focus:ring-[var(--brand-blue)]/50"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="shrink-0 rounded-xl bg-[var(--brand-blue)] px-4 py-2.5 text-white hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Send className="h-5 w-5" />
              </button>
            </div>
            <p className="text-xs text-neutral-500 mt-2">
              <Link href="/dashboard/browse" className="text-[var(--brand-blue)] hover:underline">
                Browse products
              </Link>
              {" · "}
              <Link href="/dashboard/orders" className="text-[var(--brand-blue)] hover:underline">
                Orders
              </Link>
            </p>
          </form>
        </div>
      )}

      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full bg-[var(--brand-blue)] px-4 py-3 text-white font-medium shadow-lg hover:opacity-90 transition-opacity"
        aria-label={open ? "Close BazarCoBot" : "Open BazarCoBot"}
      >
        <MessageCircle className="h-5 w-5" />
        <span>BazarCoBot</span>
      </button>
    </div>
  );
}
