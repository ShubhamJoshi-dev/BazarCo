"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";

export type Currency = "USD" | "NPR" | "AUD";

/** All product/order amounts in the database are stored in Nepalese Rupees. */
export const BASE_CURRENCY: Currency = "NPR";

interface CurrencyContextValue {
  currency: Currency;
  setCurrency: (c: Currency) => void;
  /** Format an amount stored in NPR for the selected display currency. */
  formatPrice: (nprAmount: number) => string;
  /** Convert an NPR amount to the selected display currency (numeric). */
  convertPrice: (nprAmount: number) => number;
  symbol: string;
  rates: Record<Currency, number>;
  ratesLoading: boolean;
}

const FALLBACK_RATES: Record<Currency, number> = {
  USD: 1,
  NPR: 133.85,
  AUD: 1.54,
};

export const CURRENCY_META: Record<Currency, { symbol: string; label: string; flag: string; locale: string }> = {
  USD: { symbol: "$", label: "USD – US Dollar", flag: "🇺🇸", locale: "en-US" },
  NPR: { symbol: "रू", label: "NPR – Nepalese Rupee", flag: "🇳🇵", locale: "en-NP" },
  AUD: { symbol: "A$", label: "AUD – Australian Dollar", flag: "🇦🇺", locale: "en-AU" },
};

/** Convert NPR (base) → display currency using USD cross-rates. */
export function convertFromNpr(
  nprAmount: number,
  target: Currency,
  rates: Record<Currency, number> = FALLBACK_RATES
): number {
  if (!Number.isFinite(nprAmount)) return 0;
  if (target === "NPR") return nprAmount;
  const usd = nprAmount / rates.NPR;
  if (target === "USD") return usd;
  return usd * rates.AUD;
}

/** Format a numeric amount for a given currency (already in that currency, not NPR). */
export function formatCurrencyAmount(amount: number, target: Currency): string {
  const meta = CURRENCY_META[target];
  if (target === "NPR") {
    const rounded = Math.round(amount);
    const formatted = new Intl.NumberFormat("en-IN", {
      maximumFractionDigits: 0,
      minimumFractionDigits: 0,
    }).format(rounded);
    return `${meta.symbol}\u00A0${formatted}`;
  }
  const decimals = target === "USD" ? 2 : 2;
  const formatted = new Intl.NumberFormat(meta.locale, {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  }).format(amount);
  return `${meta.symbol}${formatted}`;
}

function formatNprDefault(n: number): string {
  return formatCurrencyAmount(n, "NPR");
}

const CurrencyContext = createContext<CurrencyContextValue>({
  currency: "NPR",
  setCurrency: () => {},
  formatPrice: formatNprDefault,
  convertPrice: (n) => n,
  symbol: "रू",
  rates: FALLBACK_RATES,
  ratesLoading: false,
});

export function CurrencyProvider({ children }: { children: React.ReactNode }) {
  const [currency, setCurrencyState] = useState<Currency>("NPR");
  const [rates, setRates] = useState<Record<Currency, number>>(FALLBACK_RATES);
  const [ratesLoading, setRatesLoading] = useState(true);

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

  useEffect(() => {
    if (typeof window === "undefined") return;
    const saved = localStorage.getItem("bazarco-currency") as Currency | null;
    if (saved && Object.keys(FALLBACK_RATES).includes(saved)) {
      setCurrencyState(saved);
    }
  }, []);

  const setCurrency = useCallback((c: Currency) => {
    setCurrencyState(c);
    if (typeof window !== "undefined") localStorage.setItem("bazarco-currency", c);
  }, []);

  const convertPrice = useCallback(
    (nprAmount: number) => convertFromNpr(nprAmount, currency, rates),
    [currency, rates]
  );

  const formatPrice = useCallback(
    (nprAmount: number): string => {
      const displayAmount = convertFromNpr(nprAmount, currency, rates);
      return formatCurrencyAmount(displayAmount, currency);
    },
    [currency, rates]
  );

  return (
    <CurrencyContext.Provider
      value={{
        currency,
        setCurrency,
        formatPrice,
        convertPrice,
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
