"use client";

import { useLocale } from "@/contexts/I18nProvider";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function LocaleSwitcher({
  compact = false,
  menuPlacement = "bottom",
  alignMenu = "start",
  className = "",
}: {
  compact?: boolean;
  menuPlacement?: "top" | "bottom";
  alignMenu?: "start" | "end";
  className?: string;
}) {
  const { locale, setLocale } = useLocale();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const menuPos =
    menuPlacement === "top"
      ? alignMenu === "end"
        ? "bottom-full right-0 mb-1 w-full min-w-[10rem]"
        : "bottom-full left-0 right-0 mb-1"
      : alignMenu === "end"
        ? "right-0 top-full mt-1 min-w-[10rem]"
        : "left-0 right-0 top-full mt-1";

  return (
    <div className={`relative min-w-0 ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={`flex w-full min-w-0 items-center gap-1.5 rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] py-1.5 text-sm text-[var(--foreground)] hover:bg-[var(--input-bg)] transition-colors ${
          compact ? "justify-start px-2.5" : "px-2.5"
        }`}
        aria-label="Change language"
      >
        <Globe className="h-4 w-4 shrink-0 text-[var(--brand-muted)]" />
        {!compact && <span className="min-w-0 truncate">{localeLabels[locale]}</span>}
      </button>
      {open && (
        <ul
          className={`absolute z-[60] rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] py-1 shadow-lg ${menuPos}`}
          role="listbox"
        >
          {locales.map((loc) => (
            <li key={loc} role="option">
              <button
                type="button"
                onClick={() => {
                  setLocale(loc as Locale);
                  setOpen(false);
                }}
                className={`w-full px-3 py-2 text-left text-sm transition-colors ${
                  locale === loc
                    ? "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)]"
                    : "text-[var(--brand-white)] hover:bg-[var(--input-bg)]"
                }`}
              >
                {localeLabels[loc]}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
