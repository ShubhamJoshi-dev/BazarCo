"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import {
  Bell,
  ChevronDown,
  Heart,
  HelpCircle,
  LayoutDashboard,
  LogOut,
  Package,
  Play,
  Settings,
  ShoppingBag,
  ShoppingCart,
  HandCoins,
} from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";
import { SellerMenuButton } from "@/components/dashboard/SellerMenuButton";
import { getCart, listOrders } from "@/lib/api";

const SIDEBAR_WIDE = "w-[260px]";
const SIDEBAR_NARROW = "w-[4.75rem]";
const MAIN_PL_WIDE = "lg:pl-[260px]";
const MAIN_PL_NARROW = "lg:pl-[4.75rem]";

function getInitial(name?: string | null, email?: string | null) {
  if (name?.trim()) return name.trim().slice(0, 2).toUpperCase();
  if (email) return email.slice(0, 2).toUpperCase();
  return "BU";
}

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
  Icon: typeof LayoutDashboard;
  match?: (p: string) => boolean;
};

export function BuyerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { user, logout } = useAuth();
  const t = useTranslations("buyerDashboard");
  const tNav = useTranslations("nav");
  const isLg = useIsLg();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [deliveryOrder, setDeliveryOrder] = useState<{
    id: string;
    label: string;
    productName: string;
  } | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  const closeMobile = useCallback(() => setMobileOpen(false), []);

  useEffect(() => {
    closeMobile();
  }, [pathname, closeMobile]);

  useEffect(() => {
    getCart().then((c) => setCartCount(c.items.length));
  }, [pathname]);

  useEffect(() => {
    listOrders().then((orders) => {
      const active = orders.find(
        (o) => o.status === "shipped" || o.status === "in_transit" || o.status === "processing",
      );
      if (!active) {
        setDeliveryOrder(null);
        return;
      }
      const item = active.items?.[0];
      setDeliveryOrder({
        id: active.id,
        label: `#${active.id.slice(-5).toUpperCase()}`,
        productName: item?.productName ?? t("orderItems"),
      });
    });
  }, [pathname, t]);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) setUserMenuOpen(false);
    }
    document.addEventListener("click", handleClickOutside);
    return () => document.removeEventListener("click", handleClickOutside);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [mobileOpen]);

  const nav: NavItem[] = [
    { href: "/dashboard", label: t("navDashboard"), Icon: LayoutDashboard, match: (p) => p === "/dashboard" },
    { href: "/dashboard/orders", label: t("navOrders"), Icon: ShoppingBag, match: (p) => p.startsWith("/dashboard/orders") },
    { href: "/dashboard/offers", label: t("navBargains"), Icon: HandCoins, match: (p) => p.startsWith("/dashboard/offers") },
    { href: "/dashboard/favourites", label: t("navFavorites"), Icon: Heart, match: (p) => p === "/dashboard/favourites" },
    { href: "/dashboard/reels", label: t("navReels"), Icon: Play, match: (p) => p.startsWith("/dashboard/reels") },
  ];

  const tabs = [
    { href: "/dashboard/browse", label: t("tabCategories") },
    { href: "/dashboard/reels", label: t("tabShopVideos") },
    { href: "/dashboard/browse?sort=new", label: t("tabNewArrivals") },
    { href: "/dashboard/browse", label: t("tabBrands") },
  ];

  const isReelsPage = pathname.startsWith("/dashboard/reels");

  const firstName = user?.name?.split(" ")[0] ?? user?.email?.split("@")[0] ?? "";
  const sidebarClass = collapsed ? SIDEBAR_NARROW : SIDEBAR_WIDE;
  const mainPl = collapsed ? MAIN_PL_NARROW : MAIN_PL_WIDE;

  const menuLabel = mobileOpen
    ? tNav("closeMenu")
    : isLg
      ? collapsed
        ? tNav("expandMenu")
        : tNav("collapseMenu")
      : tNav("openMenu");

  function handleLogout() {
    logout();
    router.push("/login");
    router.refresh();
  }

  const showHomeChrome =
    pathname === "/dashboard" ||
    pathname === "/dashboard/browse" ||
    pathname === "/dashboard/favourites" ||
    pathname === "/dashboard/offers" ||
    pathname === "/dashboard/profile" ||
    pathname === "/dashboard/settings" ||
    pathname === "/dashboard/checkout" ||
    pathname?.startsWith("/dashboard/orders") ||
    pathname?.startsWith("/dashboard/product/");

  return (
    <div className="min-h-screen dashboard-bg flex text-[var(--foreground)]">
      <button
        type="button"
        aria-label={tNav("closeMenu")}
        onClick={closeMobile}
        className={`fixed inset-0 z-30 bg-neutral-900/40 backdrop-blur-[1px] transition-opacity lg:hidden ${
          mobileOpen ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />

      <aside
        className={`fixed inset-y-0 left-0 z-40 flex flex-col border-r border-[var(--brand-border)] bg-[var(--card-bg)] shadow-sm transition-[width,transform] duration-300 ${sidebarClass} ${
          mobileOpen ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        }`}
      >
        <div className={`border-b border-[var(--brand-border)] ${collapsed ? "px-2 py-3" : "px-4 py-4"}`}>
          <Link href="/dashboard" onClick={closeMobile} className="flex items-center gap-2">
            {collapsed ? (
              <Image src="/logo.png" alt="BazarCo" width={36} height={36} className="h-9 w-9 object-contain" />
            ) : (
              <Image src="/logo.png" alt="BazarCo" width={110} height={42} className="h-8 w-auto" />
            )}
          </Link>
        </div>

        {!collapsed && (
          <div className="px-4 py-4 border-b border-[var(--brand-border)]">
            <div className="flex items-center gap-3">
              <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[var(--brand-blue)]/15 text-sm font-bold text-[var(--brand-blue)]">
                {getInitial(user?.name, user?.email)}
              </span>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">
                  {t("greeting", { name: firstName })}
                </p>
                <span className="inline-flex mt-1 rounded-full bg-amber-50 border border-amber-200 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800">
                  {t("premiumMember")}
                </span>
              </div>
            </div>
          </div>
        )}

        <nav className="flex-1 overflow-y-auto px-2 py-3 scrollbar-hide space-y-0.5">
          {nav.map((item) => {
            const active = item.match ? item.match(pathname) : pathname === item.href;
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={closeMobile}
                title={collapsed ? item.label : undefined}
                className={`buyer-sidebar-link flex items-center gap-2.5 py-2.5 text-sm rounded-lg ${
                  collapsed ? "justify-center px-2" : "px-3"
                } ${active ? "active" : ""}`}
              >
                <Icon className="h-4 w-4 shrink-0" strokeWidth={2} />
                {!collapsed && item.label}
              </Link>
            );
          })}

          {!collapsed && deliveryOrder && (
            <div className="mt-4 mx-1 rounded-xl border border-neutral-200 bg-neutral-50/80 p-3">
              <p className="text-[10px] font-semibold uppercase tracking-wider text-neutral-500 mb-2">
                {t("ongoingDelivery")}
              </p>
              <div className="flex gap-2">
                <div className="relative h-12 w-12 shrink-0 rounded-lg bg-neutral-200 flex items-center justify-center">
                  <Package className="w-5 h-5 text-neutral-400" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-semibold truncate">{deliveryOrder.productName}</p>
                  <p className="text-[10px] text-neutral-500">{deliveryOrder.label}</p>
                </div>
              </div>
              <Link
                href={`/dashboard/orders/${deliveryOrder.id}`}
                onClick={closeMobile}
                className="mt-3 block w-full rounded-lg bg-[var(--brand-red)] py-2 text-center text-xs font-semibold text-white hover:bg-[#b71c1c]"
              >
                {t("trackPackage")}
              </Link>
            </div>
          )}
        </nav>

        <div className="border-t border-[var(--brand-border)] px-2 py-3 space-y-0.5">
          <Link
            href="/dashboard/settings"
            onClick={closeMobile}
            className={`buyer-sidebar-link flex items-center gap-2.5 py-2.5 text-sm rounded-lg ${
              collapsed ? "justify-center px-2" : "px-3"
            } ${pathname.startsWith("/dashboard/settings") ? "active" : "text-[var(--brand-muted)]"}`}
          >
            <Settings className="h-4 w-4" />
            {!collapsed && t("settings")}
          </Link>
          <Link
            href="/dashboard/chat"
            onClick={closeMobile}
            className={`buyer-sidebar-link flex items-center gap-2.5 py-2.5 text-sm text-[var(--brand-muted)] ${
              collapsed ? "justify-center px-2" : "px-3"
            }`}
          >
            <HelpCircle className="h-4 w-4" />
            {!collapsed && t("support")}
          </Link>
        </div>
      </aside>

      <div className={`flex min-h-0 min-h-screen flex-1 flex-col transition-[padding] ${mainPl} pl-0`}>
        {!isReelsPage && (
        <header className="sticky top-0 z-20 border-b border-[var(--brand-border)] bg-[var(--card-bg)]/95 backdrop-blur-md">
          <div className="flex h-14 items-center gap-3 px-4 sm:px-6">
            <SellerMenuButton
              open={mobileOpen}
              onClick={() => (isLg ? setCollapsed((c) => !c) : setMobileOpen((o) => !o))}
              label={menuLabel}
            />
            <Link href="/dashboard" className="font-black text-lg text-[var(--brand-red)] lg:hidden">
              BazarCo
            </Link>
            <div className="ml-auto flex items-center gap-2 sm:gap-3">
              <button type="button" className="relative rounded-lg p-2 hover:bg-neutral-100" aria-label={t("notifications")}>
                <Bell className="h-5 w-5 text-neutral-600" />
                <span className="absolute top-1.5 right-1.5 h-2 w-2 rounded-full bg-[var(--brand-red)]" />
              </button>
              <Link href="/dashboard/cart" className="relative rounded-lg p-2 hover:bg-neutral-100">
                <ShoppingCart className="h-5 w-5 text-neutral-600" />
                {cartCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--brand-red)] px-1 text-[10px] font-bold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </Link>
              <div className="hidden sm:flex items-center gap-1">
                <CurrencySwitcher />
                <ThemeSwitcher />
              </div>
              <div className="relative" ref={menuRef}>
                <button
                  type="button"
                  onClick={() => setUserMenuOpen((o) => !o)}
                  className="flex items-center gap-1.5 rounded-full border border-neutral-200 pl-1 pr-2 py-1 hover:bg-neutral-50"
                >
                  <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--brand-blue)]/15 text-xs font-bold text-[var(--brand-blue)]">
                    {getInitial(user?.name, user?.email)}
                  </span>
                  <ChevronDown className={`h-3.5 w-3.5 text-neutral-400 transition-transform ${userMenuOpen ? "rotate-180" : ""}`} />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-full mt-2 w-52 rounded-xl border border-neutral-200 bg-[var(--card-bg)] py-2 shadow-lg z-50">
                    <Link
                      href="/dashboard/profile"
                      onClick={() => setUserMenuOpen(false)}
                      className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-neutral-50 dark:hover:bg-neutral-800"
                    >
                      <Settings className="h-4 w-4" />
                      {tNav("profile")}
                    </Link>
                    <div className="px-4 py-2 border-t border-neutral-100 dark:border-neutral-800">
                      <LocaleSwitcher />
                    </div>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex w-full items-center gap-2 px-4 py-2 text-sm text-neutral-600 hover:text-[var(--brand-red)] border-t border-neutral-100 dark:border-neutral-800"
                    >
                      <LogOut className="h-4 w-4" />
                      {tNav("logout")}
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {showHomeChrome && (
            <div className="flex gap-1 overflow-x-auto scrollbar-hide border-t border-neutral-100 px-4 sm:px-6 py-2 bg-neutral-50/50">
              {tabs.map((tab) => (
                <Link
                  key={tab.label}
                  href={tab.href}
                  className="shrink-0 rounded-lg px-4 py-1.5 text-sm font-medium text-neutral-600 hover:bg-white hover:text-[var(--foreground)]"
                >
                  {tab.label}
                </Link>
              ))}
            </div>
          )}
        </header>
        )}

        <main
          className={
            isReelsPage
              ? "relative flex-1 min-h-0 p-0 w-full overflow-hidden"
              : "flex-1 p-4 sm:p-6 w-full"
          }
        >
          {children}
        </main>
      </div>
    </div>
  );
}
