"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, LogOut, ChevronDown, Globe } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLocale } from "@/contexts/I18nProvider";
import { locales, localeLabels, type Locale } from "@/i18n/config";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";

const navItems: { href: string; match?: (p: string) => boolean; activeVariant: "red" | "blue" }[] = [
  { href: "/dashboard",            match: (p) => p === "/dashboard",                 activeVariant: "red" },
  { href: "/dashboard/browse",     match: (p) => p === "/dashboard/browse",           activeVariant: "blue" },
  { href: "/dashboard/favourites", match: (p) => p === "/dashboard/favourites",       activeVariant: "red" },
  { href: "/dashboard/cart",       match: (p) => p === "/dashboard/cart",             activeVariant: "blue" },
  { href: "/dashboard/orders",     match: (p) => p === "/dashboard/orders",           activeVariant: "blue" },
  { href: "/dashboard/offers",     match: (p) => p === "/dashboard/offers",           activeVariant: "blue" },
  { href: "/dashboard/chat",       match: (p) => p?.startsWith("/dashboard/chat"),    activeVariant: "blue" },
];

const navKeys = ["dashboard", "browse", "favourites", "cart", "orders", "offers", "chat"] as const;

function getInitial(name?: string | null, email?: string | null) {
  if (name?.trim()) return name.trim().slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "BU";
}

export function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const { locale, setLocale } = useLocale();
  const t = useTranslations("nav");
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  function handleLogout() {
    setUserMenuOpen(false);
    logout();
    router.push("/login");
    router.refresh();
  }

  return (
    <div className="min-h-screen dashboard-bg">
      {/* Clay header */}
      <header className="sticky top-0 z-10">
        <div className="mx-4 mt-3 mb-0">
          <div
            className="clay-card px-4 py-2.5 flex items-center justify-between gap-4"
            style={{ borderRadius: "20px" }}
          >
            <Link href="/dashboard" className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] rounded-xl">
              <Image src="/logo.png" alt="BazarCo" width={100} height={42} className="h-8 w-auto" />
            </Link>

            <nav className="flex flex-1 items-center gap-1.5 overflow-x-auto scrollbar-hide min-w-0 py-0.5 px-1">
              {navItems.map((item, i) => {
                const isActive = item.match?.(pathname ?? "") ?? false;
                const label = t(navKeys[i]);
                return (
                  <motion.div key={item.href} className="shrink-0" whileHover={{ scale: 1.04 }} whileTap={{ scale: 0.96 }}>
                    <Link
                      href={item.href}
                      className={`clay-nav-pill inline-block text-sm whitespace-nowrap px-3.5 py-1.5 ${
                        isActive ? `active-${item.activeVariant}` : ""
                      }`}
                    >
                      {label}
                    </Link>
                  </motion.div>
                );
              })}
            </nav>

            <div className="flex items-center gap-2 shrink-0">
              <CurrencySwitcher />
              <ThemeSwitcher />
              <div className="relative" ref={menuRef}>
                <motion.button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-2 rounded-2xl border border-[var(--brand-border)] bg-[var(--card-bg)] pl-1.5 pr-3 py-1.5 transition-all"
                  style={{ boxShadow: "0 2px 8px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.06)" }}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  aria-expanded={userMenuOpen}
                  aria-haspopup="true"
                >
                  <span className="flex h-7 w-7 items-center justify-center rounded-full bg-[var(--brand-blue)]/25 text-[var(--brand-blue)] text-xs font-bold">
                    {getInitial(user?.name, user?.email)}
                  </span>
                  <span className="text-sm font-medium text-[var(--foreground)] max-w-[100px] truncate hidden sm:block">
                    {user?.name || user?.email}
                  </span>
                  <span className="clay-badge-blue hidden sm:inline">
                    {t("buyer")}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-[var(--brand-muted)] transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </motion.button>

                <AnimatePresence>
                  {userMenuOpen && (
                    <motion.div
                      initial={{ opacity: 0, y: -10, scale: 0.95 }}
                      animate={{ opacity: 1, y: 0, scale: 1 }}
                      exit={{ opacity: 0, y: -10, scale: 0.95 }}
                      transition={{ duration: 0.18 }}
                      className="absolute right-0 top-full mt-2 w-52 clay-card py-2 z-50"
                      style={{ borderRadius: "18px" }}
                    >
                      <div className="px-4 py-2 border-b border-[var(--brand-border)] mb-1">
                        <p className="flex items-center gap-1.5 text-xs font-semibold text-[var(--brand-muted)] mb-2">
                          <Globe className="w-3.5 h-3.5" /> Language
                        </p>
                        <div className="flex gap-1.5">
                          {locales.map((loc) => (
                            <button
                              key={loc}
                              type="button"
                              onClick={() => setLocale(loc as Locale)}
                              className={`flex-1 rounded-xl px-2.5 py-1.5 text-xs font-semibold transition-all ${
                                locale === loc
                                  ? "clay-badge-blue"
                                  : "text-[var(--foreground)] hover:bg-[var(--brand-border)] border border-transparent"
                              }`}
                            >
                              {localeLabels[loc]}
                            </button>
                          ))}
                        </div>
                      </div>
                      <Link
                        href="/dashboard/profile"
                        onClick={() => setUserMenuOpen(false)}
                        className="flex items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--foreground)] hover:bg-[var(--brand-blue)]/8 rounded-xl mx-1 transition-colors"
                      >
                        <Settings className="w-4 h-4 text-[var(--brand-blue)]" />
                        {t("profile")}
                      </Link>
                      <button
                        type="button"
                        onClick={handleLogout}
                        className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-[var(--brand-muted)] hover:text-[var(--brand-red)] hover:bg-[var(--brand-red)]/8 rounded-xl mx-1 transition-colors text-left"
                      >
                        <LogOut className="w-4 h-4" />
                        {t("logout")}
                      </button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8 w-full">{children}</main>
    </div>
  );
}
