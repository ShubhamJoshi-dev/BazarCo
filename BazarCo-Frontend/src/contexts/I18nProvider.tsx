"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { defaultLocale, type Locale } from "@/i18n/config";

const LOCALE_STORAGE_KEY = "bazarco-locale";

function getStoredLocale(): Locale {
  if (typeof window === "undefined") return defaultLocale;
  try {
    const stored = localStorage.getItem(LOCALE_STORAGE_KEY);
    if (stored === "ne" || stored === "en-AU") return stored;
  } catch {
    // ignore
  }
  return defaultLocale;
}

type LocaleContextValue = { locale: Locale; setLocale: (l: Locale) => void };
const LocaleContext = createContext<LocaleContextValue | null>(null);

export function useLocale() {
  const ctx = useContext(LocaleContext);
  return ctx ?? { locale: defaultLocale, setLocale: () => {} };
}

const messagesEn = require("@/i18n/messages/en-AU.json");
const messagesNe = require("@/i18n/messages/ne.json");

const messageMap: Record<Locale, Record<string, unknown>> = {
  "en-AU": messagesEn,
  ne: messagesNe,
};

export function I18nProvider({ children }: { children: React.ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setLocaleState(getStoredLocale());
    setMounted(true);
  }, []);

  const setLocale = useCallback((next: Locale) => {
    setLocaleState(next);
    try {
      localStorage.setItem(LOCALE_STORAGE_KEY, next);
    } catch {
      // ignore
    }
  }, []);

  const messages = messageMap[locale];

  return (
    <LocaleContext.Provider value={{ locale, setLocale }}>
      <NextIntlClientProvider
        locale={mounted ? locale : defaultLocale}
        messages={mounted ? messages : messagesEn}
      >
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
