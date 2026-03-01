"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { LayoutDashboard, User, Package } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function SellerDashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, logout } = useAuth();

  function handleLogout() {
    logout();
    router.push("/login");
    router.refresh();
  }

  const nav = [
    { href: "/dashboard", label: "Dashboard", Icon: LayoutDashboard },
    { href: "/dashboard/products", label: "Products", Icon: Package },
    { href: "/dashboard/profile", label: "Profile", Icon: User },
  ];

  return (
    <div className="min-h-screen dashboard-bg flex">
      <aside className="w-56 border-r border-white/10 flex flex-col fixed h-full bg-[var(--brand-black)]/80 backdrop-blur">
        <div className="p-4 border-b border-white/10">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="BazarCo" width={100} height={42} className="h-8 w-auto" />
          </Link>
        </div>
        <nav className="p-3 flex flex-col gap-1">
          {nav.map((item) => {
            const active = pathname === item.href;
            const Icon = item.Icon;
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex items-center gap-2 rounded-lg px-3 py-2.5 text-sm font-medium transition-all ${
                  active
                    ? "bg-[var(--brand-red)]/20 text-[var(--brand-red)] border border-[var(--brand-red)]/40"
                    : "text-neutral-400 hover:bg-white/5 hover:text-[var(--brand-white)]"
                }`}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" strokeWidth={2} />
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="mt-auto p-3 border-t border-white/10">
          <p className="text-xs text-neutral-500 px-3 mb-2">Seller account</p>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center gap-2 rounded-lg px-3 py-2.5 text-sm text-neutral-400 hover:bg-[var(--brand-red)]/10 hover:text-[var(--brand-red)] transition-colors"
          >
            Logout
          </button>
        </div>
      </aside>
      <main className="flex-1 ml-56">
        <header className="sticky top-0 z-10 border-b border-white/10 bg-[var(--brand-black)]/80 backdrop-blur px-6 py-4 flex items-center justify-between">
          <h1 className="text-lg font-semibold text-[var(--brand-white)]">
            Seller Dashboard
          </h1>
          <div className="flex items-center gap-3">
            <span className="text-sm text-[var(--brand-white)]">
              {user?.name || user?.email}
            </span>
            <span className="rounded-full bg-[var(--brand-red)]/20 text-[var(--brand-red)] border border-[var(--brand-red)]/40 px-2.5 py-0.5 text-xs font-medium">
              Seller
            </span>
          </div>
        </header>
        <div className="p-6">{children}</div>
      </main>
    </div>
  );
}
