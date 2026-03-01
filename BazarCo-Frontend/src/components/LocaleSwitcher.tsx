"use client";

import { useLocale } from "@/contexts/I18nProvider";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { Globe } from "lucide-react";
import { useState, useRef, useEffect } from "react";

export function LocaleSwitcher() {
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

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1.5 rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] px-2.5 py-1.5 text-sm text-[var(--brand-white)] hover:bg-white/5 transition-colors"
        aria-label="Change language"
      >
        <Globe className="w-4 h-4 text-[var(--brand-muted)]" />
        <span>{localeLabels[locale]}</span>
      </button>
      {open && (
        <ul
          className="absolute right-0 top-full mt-1 min-w-[140px] rounded-lg border border-[var(--brand-border)] bg-[var(--card-bg)] py-1 shadow-lg z-50"
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
                    : "text-[var(--brand-white)] hover:bg-white/5"
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
