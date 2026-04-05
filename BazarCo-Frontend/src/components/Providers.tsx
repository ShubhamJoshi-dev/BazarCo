"use client";

import { ThemeProvider } from "@/components/ThemeProvider";
import { I18nProvider } from "@/contexts/I18nProvider";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastProvider } from "@/contexts/ToastContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <I18nProvider>
        <AuthProvider>
          <CurrencyProvider>
            <ToastProvider>{children}</ToastProvider>
          </CurrencyProvider>
        </AuthProvider>
      </I18nProvider>
    </ThemeProvider>
  );
}
