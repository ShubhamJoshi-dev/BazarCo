"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  LayoutDashboard,
  User,
  Package,
  ShoppingBag,
  HandCoins,
  MessageCircle,
  ShieldCheck,
  TrendingUp,
  FileBarChart,
  Film,
  LogOut,
  Plus,
  Search,
  Settings,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { SellerDashboardBreadcrumb } from "@/components/dashboard/SellerDashboardBreadcrumb";
import { SellerMenuButton } from "@/components/dashboard/SellerMenuButton";

type NavItem = {
  href: string;
  label: string;
  Icon: typeof LayoutDashboard;
  match?: (pathname: string) => boolean;
};

const SIDEBAR_WIDE = "w-64";
const SIDEBAR_NARROW = "w-[4.75rem]";
const MAIN_OFFSET_WIDE = "lg:pl-64";
const MAIN_OFFSET_NARROW = "lg:pl-[4.75rem]";

function useIsLg() {
  const [isLg, setIsLg] = useState(false);
  useEffect(() => {
    const mq = window.matchMedia("(min-width: 1024px)");
    const update = () => setIsLg(mq.matches);
    update();
    mq.addEventListener("change", update);
    return () => mq.removeEventListener("change", update);
  }, []);
  return isLg;
}

export function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, logout } = useAuth();
  const t = useTranslations("nav");
  const isLg = useIsLg();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") closeMobile();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [closeMobile]);

  function handleLogout() {
    logout();
    router.push("/login");
    router.refresh();
  }

  function toggleMenu() {
    if (isLg) setCollapsed((c) => !c);
    else setMobileOpen((o) => !o);
  }

  const menuLabel = mobileOpen
    ? t("closeMenu")
    : isLg
      ? collapsed
        ? t("expandMenu")
        : t("collapseMenu")
      : t("openMenu");

  const nav: NavItem[] = [
    { href: "/dashboard", label: t("dashboard"), Icon: LayoutDashboard, match: (p) => p === "/dashboard" },
    { href: "/dashboard/analytics", label: t("analytics"), Icon: TrendingUp, match: (p) => p.startsWith("/dashboard/analytics") },
    { href: "/dashboard/report", label: t("reports"), Icon: FileBarChart, match: (p) => p.startsWith("/dashboard/report") },
    { href: "/dashboard/orders", label: t("orders"), Icon: ShoppingBag, match: (p) => p.startsWith("/dashboard/orders") },
    { href: "/dashboard/offers", label: t("offers"), Icon: HandCoins, match: (p) => p.startsWith("/dashboard/offers") },
    { href: "/dashboard/chat", label: t("chat"), Icon: MessageCircle, match: (p) => p.startsWith("/dashboard/chat") },
    { href: "/dashboard/products", label: t("products"), Icon: Package, match: (p) => p.startsWith("/dashboard/products") },
    { href: "/dashboard/videos", label: t("videos"), Icon: Film, match: (p) => p.startsWith("/dashboard/videos") },
    { href: "/dashboard/kyc", label: t("kyc"), Icon: ShieldCheck, match: (p) => p.startsWith("/dashboard/kyc") },
    { href: "/dashboard/profile", label: t("profile"), Icon: User, match: (p) => p.startsWith("/dashboard/profile") },
    { href: "/dashboard/settings", label: t("settings"), Icon: Settings, match: (p) => p.startsWith("/dashboard/settings") },
  ];

  const sidebarClass = collapsed ? SIDEBAR_NARROW : SIDEBAR_WIDE;
  const mainPl = collapsed ? MAIN_OFFSET_NARROW : MAIN_OFFSET_WIDE;

  const sidebarInner = (
    <>
      <div className={`border-b border-[var(--brand-border)] ${collapsed ? "px-2 py-3" : "px-4 py-4"}`}>
        <div className={`flex items-center ${collapsed ? "justify-center" : "justify-between gap-2"}`}>
          <Link
            href="/dashboard"
            onClick={closeMobile}
            className={`flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)] rounded-lg ${
              collapsed ? "justify-center" : "gap-2.5 min-w-0"
            }`}
          >
            {collapsed ? (
              <Image src="/logo.png" alt="BazarCo" width={36} height={36} className="h-9 w-9 object-contain" />
            ) : (
              <>
                <Image src="/logo.png" alt="BazarCo" width={100} height={42} className="h-8 w-auto shrink-0" />
                <span className="text-base font-bold tracking-tight text-[var(--brand-red)] truncate">
                  {t("brandName")}
                </span>
              </>
            )}
          </Link>
          {!collapsed && (
            <button
              type="button"
              className="hidden lg:flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-[var(--brand-border)] bg-[var(--input-bg)] text-[var(--brand-muted)] hover:text-[var(--foreground)] hover:border-[var(--brand-red)]/20 transition-colors"
              aria-label={t("searchPlaceholder")}
            >
              <Search className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      <nav className="flex flex-1 flex-col gap-0.5 overflow-y-auto px-2 py-3 scrollbar-hide">
        {nav.map((item) => {
          const active = item.match ? item.match(pathname) : pathname === item.href;
          const Icon = item.Icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              onClick={closeMobile}
              title={collapsed ? item.label : undefined}
              className={`clay-sidebar-link flex items-center gap-2.5 py-2.5 text-sm ${
                collapsed ? "justify-center px-2" : "px-3 pl-3"
              } ${active ? "active" : ""}`}
            >
              <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
              {!collapsed && <span className="truncate">{item.label}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="border-t border-[var(--brand-border)] px-2 py-3">
        <Link
          href="/dashboard/products/new"
          onClick={closeMobile}
          title={collapsed ? t("addProduct") : undefined}
          className={`clay-btn-red flex items-center justify-center gap-2 py-2.5 text-sm no-underline ${
            collapsed ? "px-2" : "w-full"
          }`}
        >
          <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          {!collapsed && t("addProduct")}
        </Link>
        {!collapsed && (
          <div className="mt-3 flex flex-wrap items-center gap-2 px-0.5">
            <LocaleSwitcher />
            <ThemeSwitcher />
            <CurrencySwitcher />
          </div>
        )}
        <button
          type="button"
          onClick={handleLogout}
          title={collapsed ? t("logout") : undefined}
          className={`clay-sidebar-link mt-1 flex w-full items-center gap-2.5 py-2.5 text-sm text-[var(--brand-muted)] hover:text-[var(--brand-red)] ${
            collapsed ? "justify-center px-2" : "px-3"
          }`}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && t("logout")}
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen dashboard-bg flex text-[var(--foreground)]">
      <button
        type="button"
        aria-label={t("closeMenu")}
        onClick={closeMobile}
        className={`fixed inset-0 z-30 bg-neutral-900/40 backdrop-blur-[2px] transition-opacity duration-300 lg:hidden ${
          mobileOpen ? "opacity-100 pointer-events-auto" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--brand-border)] bg-[var(--card-bg)] shadow-lg transition-[width,transform] duration-300 ease-out ${sidebarClass} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarInner}
      </aside>

      <div className={`flex min-h-screen flex-1 flex-col transition-[padding] duration-300 ${mainPl} pl-0`}>
        <header className="sticky top-0 z-20 border-b border-[var(--brand-border)] bg-[var(--card-bg)]/90 backdrop-blur-md supports-[backdrop-filter]:bg-[var(--card-bg)]/80">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <SellerMenuButton open={mobileOpen} onClick={toggleMenu} label={menuLabel} />
            <h1 className="hidden shrink-0 text-sm font-semibold tracking-tight text-[var(--foreground)] sm:block md:text-base">
              {t("sellerDashboard")}
            </h1>
            <div className="hidden min-w-0 flex-1 md:block md:max-w-md lg:max-w-xl">
              <label className="relative block">
                <span className="sr-only">{t("searchPlaceholder")}</span>
                <Search
                  className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--brand-muted)]"
                  aria-hidden
                />
                <input
                  type="search"
                  readOnly
                  placeholder={t("searchPlaceholder")}
                  className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--input-bg)] py-2 pl-10 pr-3 text-sm text-[var(--foreground)] placeholder:text-[var(--brand-muted)] focus:border-[var(--brand-red)] focus:outline-none focus:ring-2 focus:ring-[var(--brand-red)]/15"
                />
              </label>
            </div>
            <div className="ml-auto flex min-w-0 items-center gap-2 sm:gap-3">
              <span className="hidden items-center gap-1.5 rounded-full border border-[var(--brand-border)] bg-[var(--input-bg)] px-2.5 py-1 text-xs font-medium text-[var(--brand-muted)] sm:inline-flex">
                <span className="relative flex h-2 w-2">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-500 opacity-50" />
                  <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                {t("liveMarket")}
              </span>
              <span className="truncate text-sm font-medium text-[var(--foreground)] max-w-[100px] sm:max-w-[200px]">
                {user?.name || user?.email}
              </span>
              <span className="clay-badge-red shrink-0">{t("seller")}</span>
            </div>
          </div>
          <div className="border-t border-[var(--brand-border)]/60 bg-[var(--input-bg)]/30 px-4 py-2.5 sm:px-6">
            <SellerDashboardBreadcrumb />
          </div>
        </header>
        <main className="flex-1 p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
