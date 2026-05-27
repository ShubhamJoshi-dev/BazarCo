"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AdminAuthProvider, useAdminAuth } from "@/contexts/AdminAuthContext";
import { AdminDashboardLayout } from "@/components/admin/AdminDashboardLayout";

function AdminShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() ?? "";
  const router = useRouter();
  const { admin, loading } = useAdminAuth();
  const isLogin = pathname === "/admin/login";

  useEffect(() => {
    if (loading) return;
    if (!admin && !isLogin) {
      router.replace("/admin/login");
      return;
    }
    if (admin && isLogin) {
      router.replace("/admin");
    }
  }, [admin, loading, isLogin, router]);

  if (loading) {
    return (
      <div className="dashboard-bg flex min-h-screen items-center justify-center">
        <p className="text-sm text-[var(--brand-muted)]">Loading admin session…</p>
      </div>
    );
  }

  if (isLogin) return <>{children}</>;

  if (!admin) return null;

  return <AdminDashboardLayout>{children}</AdminDashboardLayout>;
}

export default function AdminRootLayout({ children }: { children: React.ReactNode }) {
  return (
    <AdminAuthProvider>
      <AdminShell>{children}</AdminShell>
    </AdminAuthProvider>
  );
}
