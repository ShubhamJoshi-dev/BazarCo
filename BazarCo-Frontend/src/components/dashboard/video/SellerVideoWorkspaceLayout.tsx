"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Clapperboard,
  Film,
  LayoutDashboard,
  LineChart,
  LogOut,
  Plus,
  Send,
  User,
  Video,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { SellerDashboardBreadcrumb } from "@/components/dashboard/SellerDashboardBreadcrumb";
import { SellerMenuButton } from "@/components/dashboard/SellerMenuButton";

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

type NavItem = {
  href: string;
  label: string;
  Icon: typeof Video;
  match?: (p: string) => boolean;
};

export function SellerVideoWorkspaceLayout({
  children,
  onUploadClick,
}: {
  children: React.ReactNode;
  onUploadClick?: () => void;
}) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, logout } = useAuth();
  const t = useTranslations("sellerVideos");
  const tNav = useTranslations("nav");
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

  function handleLogout() {
    logout();
    router.push("/login");
    router.refresh();
  }

  const nav: NavItem[] = [
    { href: "/dashboard", label: t("navDashboard"), Icon: LayoutDashboard, match: (p) => p === "/dashboard" },
    { href: "/dashboard/videos", label: t("navGallery"), Icon: Video, match: (p) => p === "/dashboard/videos" },
    {
      href: "/dashboard/videos/editor",
      label: t("navEditor"),
      Icon: Clapperboard,
      match: (p) => p.startsWith("/dashboard/videos/editor"),
    },
    {
      href: "/dashboard/videos/publish",
      label: t("navPublishing"),
      Icon: Send,
      match: (p) => p.startsWith("/dashboard/videos/publish"),
    },
    {
      href: "/dashboard/videos/performance",
      label: t("navPerformance"),
      Icon: LineChart,
      match: (p) => p.startsWith("/dashboard/videos/performance"),
    },
  ];

  const sidebarClass = collapsed ? SIDEBAR_NARROW : SIDEBAR_WIDE;
  const mainPl = collapsed ? MAIN_OFFSET_NARROW : MAIN_OFFSET_WIDE;

  const menuLabel = mobileOpen
    ? tNav("closeMenu")
    : isLg
      ? collapsed
        ? tNav("expandMenu")
        : tNav("collapseMenu")
      : tNav("openMenu");

  return (
    <div className="min-h-screen dashboard-bg flex text-[var(--foreground)]">
      <button
        type="button"
        aria-label={tNav("closeMenu")}
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
        <div className={`border-b border-[var(--brand-border)] ${collapsed ? "px-2 py-3" : "px-4 py-4"}`}>
          <Link
            href="/dashboard/videos"
            onClick={closeMobile}
            className={`flex items-center ${collapsed ? "justify-center" : "gap-2.5"}`}
          >
            {collapsed ? (
              <Film className="h-8 w-8 text-[var(--brand-red)]" />
            ) : (
              <div className="min-w-0">
                <p className="text-base font-bold text-[var(--brand-red)] leading-tight">Bazaarco Pro</p>
                <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-neutral-500">
                  {t("workspace")}
                </p>
              </div>
            )}
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
        <div className="border-t border-[var(--brand-border)] px-2 py-3 space-y-1">
          <button
            type="button"
            onClick={() => {
              closeMobile();
              onUploadClick?.();
            }}
            title={collapsed ? t("uploadVideo") : undefined}
            className={`clay-btn-red flex items-center justify-center gap-2 py-2.5 text-sm w-full ${
              collapsed ? "px-2" : ""
            }`}
          >
            <Plus className="h-4 w-4 shrink-0" strokeWidth={2.5} />
            {!collapsed && t("uploadVideo")}
          </button>
          <Link
            href="/dashboard/profile"
            onClick={closeMobile}
            className={`clay-sidebar-link flex items-center gap-2.5 py-2.5 text-sm text-[var(--brand-muted)] ${
              collapsed ? "justify-center px-2" : "px-3"
            }`}
          >
            <User className="h-4 w-4 shrink-0" />
            {!collapsed && t("account")}
          </Link>
          <button
            type="button"
            onClick={handleLogout}
            className={`clay-sidebar-link flex w-full items-center gap-2.5 py-2.5 text-sm text-[var(--brand-muted)] hover:text-[var(--brand-red)] ${
              collapsed ? "justify-center px-2" : "px-3"
            }`}
          >
            <LogOut className="h-4 w-4 shrink-0" />
            {!collapsed && tNav("logout")}
          </button>
        </div>
      </aside>

      <div className={`flex min-h-screen flex-1 flex-col transition-[padding] duration-300 ${mainPl} pl-0`}>
        <header className="sticky top-0 z-20 border-b border-[var(--brand-border)] bg-[var(--card-bg)]/90 backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <SellerMenuButton open={mobileOpen} onClick={() => (isLg ? setCollapsed((c) => !c) : setMobileOpen((o) => !o))} label={menuLabel} />
            <Image src="/logo.png" alt="" width={72} height={30} className="h-7 w-auto lg:hidden" />
            <div className="hidden min-w-0 flex-1 md:block md:max-w-lg">
              <input
                type="search"
                placeholder={t("searchPlaceholder")}
                className="w-full rounded-xl border border-[var(--brand-border)] bg-[var(--input-bg)] py-2 px-4 text-sm"
                readOnly
              />
            </div>
            <span className="ml-auto truncate text-sm font-medium">{user?.name || user?.email}</span>
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
