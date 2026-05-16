"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { Play, ShoppingBag } from "lucide-react";
import { useTranslations } from "next-intl";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";

export function PublicMarketplaceLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const t = useTranslations("publicMarketplace");
  const tNav = useTranslations("nav");

  const browseActive = pathname === "/dashboard/browse";
  const reelsActive = pathname.startsWith("/dashboard/reels");

  return (
    <div className="min-h-screen bg-[var(--background)] flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--brand-border)] bg-[var(--card-bg)]/95 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1400px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/" className="shrink-0">
            <Image src="/logo.png" alt="BazarCo" width={120} height={48} className="h-9 w-auto" priority />
          </Link>

          <nav className="hidden sm:flex items-center gap-1">
            <Link
              href="/dashboard/browse"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                browseActive
                  ? "bg-[var(--brand-blue)]/10 text-[var(--brand-blue)]"
                  : "text-[var(--brand-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <ShoppingBag className="h-4 w-4" />
              {tNav("browse")}
            </Link>
            <Link
              href="/dashboard/reels"
              className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-semibold transition-colors ${
                reelsActive
                  ? "bg-[var(--brand-red)]/10 text-[var(--brand-red)]"
                  : "text-[var(--brand-muted)] hover:text-[var(--foreground)]"
              }`}
            >
              <Play className="h-4 w-4" />
              {t("shopVideos")}
            </Link>
          </nav>

          <div className="flex items-center gap-2 sm:gap-3">
            <div className="hidden md:flex items-center gap-2">
              <LocaleSwitcher />
              <CurrencySwitcher />
              <ThemeSwitcher />
            </div>
            <Link
              href="/login"
              className="rounded-full border border-[var(--brand-border)] px-4 py-2 text-sm font-semibold hover:bg-neutral-50"
            >
              {t("signIn")}
            </Link>
            <Link href="/signup" className="clay-btn-red px-4 py-2 text-sm hidden xs:inline-flex">
              {t("signUp")}
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full mx-auto max-w-[1400px] px-4 sm:px-6 py-6 sm:py-8">{children}</main>

      <footer className="border-t border-[var(--brand-border)] py-6 text-center text-xs text-[var(--brand-muted)]">
        {t("footerHint")}
      </footer>
    </div>
  );
}
