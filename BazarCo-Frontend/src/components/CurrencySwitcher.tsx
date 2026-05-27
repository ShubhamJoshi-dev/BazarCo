"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronDown, RefreshCw } from "lucide-react";
import { useCurrency, CURRENCY_META, type Currency } from "@/contexts/CurrencyContext";

const CURRENCIES: Currency[] = ["NPR", "USD", "AUD"];

export function CurrencySwitcher({
  compact = false,
  menuPlacement = "bottom",
  alignMenu = "start",
}: {
  compact?: boolean;
  menuPlacement?: "top" | "bottom";
  alignMenu?: "start" | "end";
}) {
  const { currency, setCurrency, rates, ratesLoading } = useCurrency();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const current = CURRENCY_META[currency];

  return (
    <div className="relative shrink-0" ref={ref}>
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.97 }}
        className={`flex items-center gap-1.5 rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] py-1.5 text-sm font-semibold text-[var(--foreground)] transition-all ${
          compact ? "px-2" : "rounded-2xl px-2.5"
        }`}
        style={{ boxShadow: "var(--clay-shadow-neutral)" }}
        aria-expanded={open}
        aria-label={`Currency: ${currency}`}
      >
        <span className="text-base leading-none">{current.flag}</span>
        {!compact && <span className="hidden sm:block text-xs">{currency}</span>}
        {ratesLoading ? (
          <RefreshCw className="w-3 h-3 text-[var(--brand-muted)] animate-spin" />
        ) : (
          <ChevronDown className={`w-3 h-3 text-[var(--brand-muted)] transition-transform ${open ? "rotate-180" : ""}`} />
        )}
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.95 }}
            transition={{ duration: 0.15 }}
            className={`absolute z-[60] clay-card py-2 ${
              menuPlacement === "top"
                ? alignMenu === "end"
                  ? "bottom-full right-0 mb-2 w-52 max-w-[calc(16rem-0.5rem)]"
                  : "bottom-full left-0 mb-2 w-52 max-w-[calc(16rem-0.5rem)]"
                : alignMenu === "end"
                  ? "right-0 top-full mt-2 w-52"
                  : "left-0 top-full mt-2 w-52"
            }`}
            style={{ borderRadius: compact ? "12px" : "18px" }}
          >
            <p className="px-4 py-1.5 text-[10px] font-bold uppercase tracking-widest text-[var(--brand-muted)]">
              Select Currency
            </p>
            {CURRENCIES.map((c) => {
              const meta = CURRENCY_META[c];
              const selected = currency === c;
              const rate = rates[c];
              return (
                <motion.button
                  key={c}
                  type="button"
                  onClick={() => { setCurrency(c); setOpen(false); }}
                  whileHover={{ x: 3 }}
                  className={`flex w-full items-center gap-3 px-4 py-2.5 text-sm transition-all rounded-xl mx-1 ${
                    selected
                      ? "bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                      : "text-[var(--foreground)] hover:bg-[var(--brand-border)]"
                  }`}
                  style={{ width: "calc(100% - 8px)" }}
                >
                  <span className="text-xl leading-none">{meta.flag}</span>
                  <div className="flex-1 text-left">
                    <p className="font-bold text-sm">{c}</p>
                    <p className="text-[10px] text-[var(--brand-muted)]">
                      {c === "USD" ? "Base currency" : `1 USD = ${c === "NPR" ? Math.round(rate) : rate.toFixed(2)} ${c}`}
                    </p>
                  </div>
                  {selected && (
                    <span className="w-2 h-2 rounded-full bg-[var(--brand-blue)] shrink-0" />
                  )}
                </motion.button>
              );
            })}
            <div className="mx-4 mt-2 pt-2 border-t border-[var(--brand-border)]">
              <p className="text-[10px] text-[var(--brand-muted)] text-center">
                {ratesLoading ? "Fetching live rates…" : "Live exchange rates"}
              </p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
