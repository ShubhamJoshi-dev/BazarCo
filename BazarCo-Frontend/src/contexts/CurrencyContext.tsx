"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";

export type Currency = "USD" | "NPR" | "AUD";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  formatPrice: (usdAmount: number) => string;
  /** USD → selected display currency */
  convertPrice: (usdAmount: number) => number;
  /** Display currency → USD (for API payloads) */
  toUsd: (displayAmount: number) => number;
  symbol: string;
  rates: Record<Currency, number>;
  ratesLoading: boolean;
}

/** Format a display-currency amount for price inputs */
export function formatDisplayAmount(
  amount: number,
  currency: Currency,
): string {
  if (!Number.isFinite(amount)) return "";
  if (currency === "NPR") return String(Math.round(amount));
  const rounded = Math.round(amount * 100) / 100;
  return Number.isInteger(rounded) ? String(rounded) : rounded.toFixed(2);
}

/**
 * Map stored `price` (USD) to a display-currency value for seller inputs.
 * Pre–Phase 1 rows sometimes stored NPR directly in `price`; detect inflated conversion.
 */
export function storedPriceToDisplay(
  storedUsd: number,
  currency: Currency,
  convertPrice: (usd: number) => number,
): number {
  if (!Number.isFinite(storedUsd) || storedUsd <= 0) return 0;
  const converted = convertPrice(storedUsd);
  if (currency === "NPR" && storedUsd >= 50 && converted >= 100_000) {
    return storedUsd;
  }
  return converted;
}

const FALLBACK_RATES: Record<Currency, number> = {
  USD: 1,
  NPR: 133.85,
  AUD: 1.54,
};

export const CURRENCY_META: Record<
  Currency,
  { symbol: string; label: string; flag: string; locale: string }
> = {
  USD: { symbol: "$", label: "USD – US Dollar", flag: "🇺🇸", locale: "en-US" },
  NPR: {
    symbol: "रू",
    label: "NPR – Nepalese Rupee",
    flag: "🇳🇵",
    locale: "en-NP",
  },
  AUD: {
    symbol: "A$",
    label: "AUD – Australian Dollar",
    flag: "🇦🇺",
    locale: "en-AU",
  },
};

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "NPR",
  setCurrency: () => {},
  formatPrice: (n) =>
    `रू${Math.round(n * FALLBACK_RATES.NPR).toLocaleString("en-IN")}`,
  convertPrice: (n) => n * FALLBACK_RATES.NPR,
  toUsd: (n) => n / FALLBACK_RATES.NPR,
  symbol: "रू",
  rates: FALLBACK_RATES,
  ratesLoading: false,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("NPR");
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES);
  const [ratesLoading, setRatesLoading] = useState(true);

  /* Fetch live rates once on mount */
  useEffect(() => {
    fetch("https://api.exchangerate-api.com/v4/latest/USD")
      .then((r) => r.json())
      .then((data: { rates?: Record<string, number> }) => {
        if (data?.rates) {
          setRates({
            USD: 1,
            NPR: data.rates["NPR"] ?? FALLBACK_RATES.NPR,
            AUD: data.rates["AUD"] ?? FALLBACK_RATES.AUD,
          });
        }
      })
      .catch(() => {})
      .finally(() => setRatesLoading(false));
  }, []);

  /* Restore saved currency */
  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("bazarco-currency") as Currency | null;
    if (saved && Object.keys(FALLBACK_RATES).includes(saved)) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    if (typeof window !== "undefined")
      localStorage.setItem("bazarco-currency", c);
  }, []);

  const convertPrice = useCallback(
    (usdAmount: number) => usdAmount * rates[currency],
    [currency, rates],
  );

  const toUsd = useCallback(
    (displayAmount: number) => {
      const rate = rates[currency];
      if (!rate) return displayAmount;
      return Math.round((displayAmount / rate) * 10000) / 10000;
    },
    [currency, rates],
  );

  const formatPrice = useCallback(
    (usdAmount: number): string => {
      const converted = usdAmount * rates[currency];
      const meta = CURRENCY_META[currency];
      if (currency === "NPR") {
        return `${meta.symbol}${Math.round(converted).toLocaleString("en-IN")}`;
      }
      return `${meta.symbol}${converted.toFixed(2)}`;
    },
    [currency, rates],
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        convertPrice,
        toUsd,
        symbol: CURRENCY_META[currency].symbol,
        rates,
        ratesLoading,
      }}
    >
      {children}
    </CurrencyContext.Provider>
  );
}

export function useCurrency() {
  return useContext(CurrencyContext);
}
