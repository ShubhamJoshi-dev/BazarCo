"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import Image from "next/image";
import { useAuth } from "@/contexts/AuthContext";

export function BuyerDashboardLayout({
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

  return (
    <div className="min-h-screen dashboard-bg">
      <header className="sticky top-0 z-10 border-b border-white/10 bg-[var(--brand-black)]/80 backdrop-blur">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <Link href="/dashboard" className="flex items-center gap-2">
            <Image src="/logo.png" alt="BazarCo" width={100} height={42} className="h-8 w-auto" />
          </Link>
          <nav className="flex items-center gap-4">
            <Link
              href="/dashboard"
              className={`text-sm font-medium transition-colors ${
                pathname === "/dashboard"
                  ? "text-[var(--brand-red)]"
                  : "text-neutral-400 hover:text-[var(--brand-white)]"
              }`}
            >
              Dashboard
            </Link>
            <Link
              href="/dashboard/browse"
              className={`text-sm font-medium transition-colors ${
                pathname === "/dashboard/browse"
                  ? "text-[var(--brand-blue)]"
                  : "text-neutral-400 hover:text-[var(--brand-white)]"
              }`}
            >
              Browse
            </Link>
            <Link
              href="/dashboard/favourites"
              className={`text-sm font-medium transition-colors ${
                pathname === "/dashboard/favourites"
                  ? "text-[var(--brand-red)]"
                  : "text-neutral-400 hover:text-[var(--brand-white)]"
              }`}
            >
              Favourites
            </Link>
            <Link
              href="/dashboard/profile"
              className={`text-sm font-medium transition-colors ${
                pathname === "/dashboard/profile"
                  ? "text-[var(--brand-blue)]"
                  : "text-neutral-400 hover:text-[var(--brand-white)]"
              }`}
            >
              Profile
            </Link>
            <span className="text-sm text-neutral-600">|</span>
            <span className="text-sm text-[var(--brand-white)]">{user?.name || user?.email}</span>
            <span className="rounded-full bg-[var(--brand-blue)]/20 text-[var(--brand-blue)] border border-[var(--brand-blue)]/40 px-2.5 py-0.5 text-xs font-medium">
              Buyer
            </span>
            <button
              type="button"
              onClick={handleLogout}
              className="text-sm text-neutral-400 hover:text-[var(--brand-red)] transition-colors"
            >
              Logout
            </button>
          </nav>
        </div>
      </header>
      <main className="max-w-6xl mx-auto px-4 py-8 w-full">{children}</main>
    </div>
  );
}
