"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, User, Package, ShoppingBag, HandCoins, MessageCircle, ShieldCheck, TrendingUp, FileBarChart, LogOut } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { LocaleSwitcher } from "@/components/LocaleSwitcher";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";
import { CurrencySwitcher } from "@/components/CurrencySwitcher";

export function SellerDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();
  const t = useTranslations("nav");

  function handleLogout() {
    logout();
    router.push("/login");
    router.refresh();
  }

  const nav = [
    { href: "/dashboard",           label: t("dashboard"), Icon: LayoutDashboard },
    { href: "/dashboard/analytics", label: t("analytics"), Icon: TrendingUp },
    { href: "/dashboard/report",    label: t("reports"),   Icon: FileBarChart },
    { href: "/dashboard/orders",    label: t("orders"),    Icon: ShoppingBag },
    { href: "/dashboard/offers",    label: t("offers"),    Icon: HandCoins },
    { href: "/dashboard/chat",      label: t("chat"),      Icon: MessageCircle },
    { href: "/dashboard/products",  label: t("products"),  Icon: Package },
    { href: "/dashboard/kyc",       label: t("kyc"),       Icon: ShieldCheck },
    { href: "/dashboard/profile",   label: t("profile"),   Icon: User },
  ];

  return (
    <div className="min-h-screen dashboard-bg flex">
      {/* Clay sidebar */}
      <aside className="w-60 fixed h-full flex flex-col" style={{ padding: "12px" }}>
        <div
          className="clay-card flex flex-col h-full overflow-hidden"
          style={{ borderRadius: "22px" }}
        >
          {/* Logo area */}
          <div className="p-4 pb-3 border-b border-[var(--brand-border)]">
            <Link href="/dashboard" className="flex items-center gap-2">
              <Image src="/logo.png" alt="BazarCo" width={100} height={42} className="h-8 w-auto" />
            </Link>
            {/* Seller badge */}
            <div className="mt-3 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-[var(--brand-red)] shadow-[0_0_6px_var(--brand-red)]" />
              <span className="text-xs font-semibold text-[var(--brand-muted)]">{t("sellerAccount")}</span>
            </div>
          </div>

          {/* Nav */}
          <nav className="flex-1 p-3 flex flex-col gap-1 overflow-y-auto scrollbar-hide">
            {nav.map((item) => {
              const active = pathname === item.href;
              const Icon = item.Icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`clay-sidebar-link flex items-center gap-2.5 px-3 py-2.5 text-sm transition-all ${active ? "active" : ""}`}
                >
                  <Icon className="w-4 h-4 shrink-0" strokeWidth={2} />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div className="p-3 border-t border-[var(--brand-border)] space-y-3">
            <div className="flex items-center gap-2 px-1 flex-wrap">
              <LocaleSwitcher />
              <ThemeSwitcher />
              <CurrencySwitcher />
            </div>
            <button
              type="button"
              onClick={handleLogout}
              className="clay-sidebar-link flex w-full items-center gap-2.5 px-3 py-2.5 text-sm text-[var(--brand-muted)] hover:text-[var(--brand-red)]"
            >
              <LogOut className="w-4 h-4 shrink-0" />
              {t("logout")}
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 ml-[72px]" style={{ marginLeft: "252px" }}>
        {/* Clay top bar */}
        <div className="sticky top-0 z-10 px-4 pt-3">
          <div
            className="clay-card px-6 py-4 flex items-center justify-between"
            style={{ borderRadius: "18px" }}
          >
            <h1 className="text-base font-bold text-[var(--foreground)]">
              {t("sellerDashboard")}
            </h1>
            <div className="flex items-center gap-3">
              <span className="text-sm text-[var(--foreground)] font-medium">
                {user?.name || user?.email}
              </span>
              <span className="clay-badge-red">{t("seller")}</span>
            </div>
          </div>
        </div>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
