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

const navItems: { href: string; match?: (p: string) => boolean; activeClass: string }[] = [
  { href: "/dashboard", match: (p) => p === "/dashboard", activeClass: "bg-[var(--brand-red)]/20 text-[var(--brand-red)] border-[var(--brand-red)]/40" },
  { href: "/dashboard/browse", match: (p) => p === "/dashboard/browse", activeClass: "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border-[var(--brand-blue)]/40" },
  { href: "/dashboard/favourites", match: (p) => p === "/dashboard/favourites", activeClass: "bg-[var(--brand-red)]/20 text-[var(--brand-red)] border-[var(--brand-red)]/40" },
  { href: "/dashboard/cart", match: (p) => p === "/dashboard/cart", activeClass: "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border-[var(--brand-blue)]/40" },
  { href: "/dashboard/orders", match: (p) => p === "/dashboard/orders", activeClass: "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border-[var(--brand-blue)]/40" },
  { href: "/dashboard/offers", match: (p) => p === "/dashboard/offers", activeClass: "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border-[var(--brand-blue)]/40" },
  { href: "/dashboard/chat", match: (p) => p?.startsWith("/dashboard/chat"), activeClass: "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border-[var(--brand-blue)]/40" },
];

const navKeys: (keyof IntlMessages["nav"])[] = ["dashboard", "browse", "favourites", "cart", "orders", "offers", "chat"];

function getInitial(name?: string | null, email?: string | null) {
  if (name?.trim()) return name.trim().slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "BU";
}

export function BuyerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
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
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[var(--brand-black)]/90 backdrop-blur-md shadow-[0_4px_24px_-4px_rgba(0,0,0,0.4)]">
        <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-4">
          <Link href="/dashboard" className="shrink-0 focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] rounded-lg">
            <Image src="/logo.png" alt="BazarCo" width={100} height={42} className="h-8 w-auto" />
          </Link>
          <nav className="flex flex-1 items-center gap-2 overflow-x-auto scrollbar-hide min-w-0 min-h-[2.25rem] py-0.5 px-1">
            {navItems.map((item, i) => {
              const isActive = item.match?.(pathname ?? "") ?? false;
              const label = t(navKeys[i]);
              return (
                <motion.div key={item.href} className="shrink-0" whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Link
                    href={item.href}
                    className={`inline-block text-sm font-medium whitespace-nowrap rounded-full border px-3 py-1.5 transition-all duration-200 ${
                      isActive ? item.activeClass : "border-transparent text-neutral-400 hover:text-[var(--brand-white)] hover:bg-white/5"
                    }`}
                  >
                    {label}
                  </Link>
                </motion.div>
              );
            })}
          </nav>
          <div className="flex items-center gap-2 shrink-0 border-l border-white/10 pl-3">
            <ThemeSwitcher />
            <div className="relative" ref={menuRef}>
            <motion.button
              type="button"
              onClick={() => setUserMenuOpen((o) => !o)}
              className="flex items-center gap-2 rounded-full border border-white/10 bg-white/5 pl-1 pr-2 py-1 hover:bg-white/[0.08] transition-colors"
              whileHover={{ backgroundColor: "rgba(255,255,255,0.08)" }}
              whileTap={{ scale: 0.98 }}
              aria-expanded={userMenuOpen}
              aria-haspopup="true"
            >
              <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-blue)]/30 text-[var(--brand-blue)] text-sm font-semibold">
                {getInitial(user?.name, user?.email)}
              </span>
              <span className="text-sm font-medium text-[var(--brand-white)] max-w-[120px] truncate">{user?.name || user?.email}</span>
              <span className="rounded-full bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40 px-2 py-0.5 text-xs font-medium hidden sm:inline">
                {t("buyer")}
              </span>
              <ChevronDown className={`w-4 h-4 text-neutral-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
            </motion.button>
            <AnimatePresence>
              {userMenuOpen && (
                <motion.div
                  initial={{ opacity: 0, y: -8, scale: 0.96 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: -8, scale: 0.96 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-white/10 bg-[var(--brand-black)] shadow-xl py-1 z-50"
                >
                  <div className="px-4 py-2 border-b border-white/10">
                    <p className="flex items-center gap-2 text-xs font-medium text-neutral-500 mb-1.5">
                      <Globe className="w-3.5 h-3.5" />
                      Language
                    </p>
                    <div className="flex gap-1">
                      {locales.map((loc) => (
                        <button
                          key={loc}
                          type="button"
                          onClick={() => {
                            setLocale(loc as Locale);
                          }}
                          className={`flex-1 rounded-lg px-2.5 py-1.5 text-xs font-medium transition-colors ${
                            locale === loc
                              ? "bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40"
                              : "text-[var(--brand-white)] hover:bg-white/10 border border-transparent"
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
                    className="flex items-center gap-2 px-4 py-2.5 text-sm text-[var(--brand-white)] hover:bg-white/10 transition-colors"
                  >
                    <Settings className="w-4 h-4 text-[var(--brand-blue)]" />
                    {t("profile")}
                  </Link>
                  <button
                    type="button"
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-sm text-neutral-400 hover:text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10 transition-colors text-left"
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
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8 w-full">{children}</main>
    </div>
  );
}
