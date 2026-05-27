"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname, useRouter } from "next/navigation";
import {
  LayoutDashboard,
  Users,
  Package,
  ShieldCheck,
  Film,
  MessageSquare,
  Settings,
  ScrollText,
  LogOut,
  Menu,
} from "lucide-react";
import { useAdminAuth } from "@/contexts/AdminAuthContext";
import { ThemeSwitcher } from "@/components/ThemeSwitcher";

const NAV = [
  { href: "/admin", label: "Overview", Icon: LayoutDashboard, exact: true },
  { href: "/admin/users", label: "Users", Icon: Users },
  { href: "/admin/products", label: "Products", Icon: Package },
  { href: "/admin/kyc", label: "KYC", Icon: ShieldCheck },
  { href: "/admin/videos", label: "Videos", Icon: Film },
  { href: "/admin/chat", label: "Chat", Icon: MessageSquare },
  { href: "/admin/audit", label: "Audit log", Icon: ScrollText },
  { href: "/admin/system", label: "System", Icon: Settings },
];

export function AdminDashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { admin, logout } = useAdminAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const closeMobile = useCallback(() => setMobileOpen(false), []);
  useEffect(() => closeMobile(), [pathname, closeMobile]);

  function isActive(href: string, exact?: boolean) {
    if (exact) return pathname === href;
    return pathname === href || pathname.startsWith(`${href}/`);
  }

  function handleLogout() {
    logout();
    router.push("/admin/login");
    router.refresh();
  }

  const sidebar = (
  <aside className="flex h-full flex-col border-r border-[var(--brand-border)] bg-[var(--brand-black)]">
    <div className="border-b border-[var(--brand-border)] px-4 py-6">
      <Link href="/admin" className="mx-auto flex justify-center">
        <Image
          src="/logo.png"
          alt="BazarCo Admin"
          width={200}
          height={64}
          className="h-[3.5rem] w-auto max-w-[12rem] object-contain"
          priority
        />
      </Link>
      <p className="mt-2 text-center text-[10px] font-semibold uppercase tracking-widest text-[var(--brand-muted)]">
        Enterprise Admin
      </p>
    </div>
    <nav className="flex-1 space-y-0.5 p-3 overflow-y-auto">
      {NAV.map(({ href, label, Icon, exact }) => (
        <Link
          key={href}
          href={href}
          onClick={closeMobile}
          className={`clay-sidebar-link flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm ${
            isActive(href, exact) ? "clay-sidebar-link-active" : ""
          }`}
        >
          <Icon className="h-4 w-4 shrink-0" />
          {label}
        </Link>
      ))}
    </nav>
    <div className="border-t border-[var(--brand-border)] p-3 space-y-2">
      <div className="flex items-center justify-between px-2">
        <ThemeSwitcher />
      </div>
      <p className="truncate px-2 text-xs text-[var(--brand-muted)]">
        {admin?.name ?? admin?.username} · {admin?.role?.replace("_", " ")}
      </p>
      <button
        type="button"
        onClick={handleLogout}
        className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-[var(--brand-muted)] hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]"
      >
        <LogOut className="h-4 w-4" />
        Sign out
      </button>
    </div>
  </aside>
  );

  return (
    <div className="dashboard-bg min-h-screen">
      <div className="lg:hidden sticky top-0 z-40 flex items-center gap-3 border-b border-[var(--brand-border)] bg-[var(--brand-black)]/95 px-4 py-3 backdrop-blur">
        <button type="button" onClick={() => setMobileOpen(true)} className="rounded-lg border border-[var(--brand-border)] p-2" aria-label="Open menu">
          <Menu className="h-5 w-5" />
        </button>
        <span className="font-semibold text-sm">BazarCo Admin</span>
      </div>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/60" onClick={closeMobile} aria-label="Close overlay" />
          <div className="absolute left-0 top-0 h-full w-64 shadow-xl">{sidebar}</div>
        </div>
      )}

      <div className="flex min-h-screen lg:min-h-[calc(100vh)]">
        <div className="hidden lg:block w-64 shrink-0 fixed inset-y-0 left-0 z-30">{sidebar}</div>
        <main className="flex-1 lg:pl-64 min-w-0">
          <header className="sticky top-0 z-20 hidden lg:flex items-center justify-between border-b border-[var(--brand-border)] bg-[var(--brand-black)]/80 px-6 py-4 backdrop-blur">
            <h1 className="text-lg font-semibold text-[var(--foreground)]">Administration</h1>
            <span className="text-xs text-[var(--brand-muted)]">RBAC · Audit trail enabled</span>
          </header>
          <div className="p-4 sm:p-6 lg:p-8 max-w-7xl mx-auto">{children}</div>
        </main>
      </div>
    </div>
  );
}
