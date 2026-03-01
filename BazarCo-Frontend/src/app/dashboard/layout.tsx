"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { BuyerDashboardLayout } from "@/components/dashboard/BuyerDashboardLayout";
import { SellerDashboardLayout } from "@/components/dashboard/SellerDashboardLayout";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const t = useTranslations("dashboard");

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-[var(--brand-muted)]">{t("loading")}</p>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  if (user.role === "seller") {
    return <SellerDashboardLayout>{children}</SellerDashboardLayout>;
  }

  return <BuyerDashboardLayout>{children}</BuyerDashboardLayout>;
}
