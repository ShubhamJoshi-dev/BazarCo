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
      <div
        className={`border-b border-[var(--brand-border)] ${
          collapsed ? "px-2 py-4" : "px-4 py-6"
        }`}
      >
        <Link
          href="/dashboard"
          onClick={closeMobile}
          className="mx-auto flex w-full max-w-full items-center justify-center rounded-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-[var(--brand-red)]"
        >
          <Image
            src="/logo.png"
            alt="BazarCo"
            width={collapsed ? 56 : 240}
            height={collapsed ? 56 : 80}
            className={
              collapsed
                ? "h-12 w-12 object-contain"
                : "h-[4.25rem] w-auto max-w-[13.5rem] object-contain object-center sm:h-[4.75rem] sm:max-w-[14.5rem]"
            }
            priority
          />
        </Link>
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

      <div className="relative z-10 min-w-0 shrink-0 border-t border-[var(--brand-border)] px-2 py-3">
        <Link
          href="/dashboard/products/new"
          onClick={closeMobile}
          title={collapsed ? t("addProduct") : undefined}
          className={`clay-btn-red box-border flex max-w-full items-center justify-center gap-2 py-2.5 text-sm no-underline ${
            collapsed ? "px-2" : "w-full min-w-0 px-3"
          }`}
        >
          <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
          {!collapsed && <span className="truncate">{t("addProduct")}</span>}
        </Link>
        {!collapsed && (
          <div className="mt-3 min-w-0 space-y-2">
            <div className="min-w-0">
              <LocaleSwitcher menuPlacement="top" alignMenu="start" className="w-full" />
            </div>
            <div className="flex min-w-0 items-center justify-between gap-1.5">
              <ThemeSwitcher menuPlacement="top" alignMenu="start" />
              <CurrencySwitcher compact menuPlacement="top" alignMenu="end" />
            </div>
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
        className={`fixed inset-y-0 left-0 z-50 flex flex-col overflow-x-hidden border-r border-[var(--brand-border)] bg-[var(--card-bg)] shadow-lg transition-[width,transform] duration-300 ease-out ${sidebarClass} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        {sidebarInner}
      </aside>

      <div
        className={`relative z-0 flex min-h-screen min-w-0 w-full flex-1 flex-col transition-[padding] duration-300 ${mainPl} max-lg:pl-0`}
      >
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
            <div className="ml-auto flex min-w-0 items-center">
              <span className="truncate text-sm font-medium text-[var(--foreground)] max-w-[140px] sm:max-w-[240px]">
                {user?.name || user?.email}
              </span>
            </div>
          </div>
          <div className="border-t border-[var(--brand-border)]/60 bg-[var(--input-bg)]/30 px-4 py-2.5 sm:px-6">
            <SellerDashboardBreadcrumb />
          </div>
        </header>
        <main className="min-w-0 max-w-full flex-1 overflow-x-hidden p-4 sm:p-6">{children}</main>
      </div>
    </div>
  );
}
