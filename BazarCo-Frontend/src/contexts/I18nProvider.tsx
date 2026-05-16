"use client";

import { createContext, useCallback, useContext, useEffect, useState } from "react";
import { NextIntlClientProvider } from "next-intl";
import { defaultLocale, type Locale } from "@/i18n/config";
import messagesEn from "@/i18n/messages/en-AU.json";
import messagesNe from "@/i18n/messages/ne.json";

const LOCALE_STORAGE_KEY = "bazarco-locale";
const TIME_ZONE = "Asia/Kathmandu";

const MESSAGES: Record<Locale, Record<string, unknown>> = {
  "en-AU": messagesEn as Record<string, unknown>,
  ne: messagesNe as Record<string, unknown>,
};

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

  const activeLocale = mounted ? locale : defaultLocale;
  const messages = MESSAGES[activeLocale] ?? MESSAGES[defaultLocale];

  return (
    <LocaleContext.Provider value={{ locale: activeLocale, setLocale }}>
      <NextIntlClientProvider locale={activeLocale} messages={messages} timeZone={TIME_ZONE}>
        {children}
      </NextIntlClientProvider>
    </LocaleContext.Provider>
  );
}
