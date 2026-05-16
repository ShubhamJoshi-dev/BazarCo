"use client";

import Link from "next/link";
import { Package } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { SellerInventoryView } from "@/components/dashboard/SellerInventoryView";

export default function ProductsPage() {
  const { user, loading } = useAuth();
  const t = useTranslations("sellerInventory");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-neutral-500 text-sm">
        {t("loading")}
      </div>
    );
  }

  if (user?.role === "seller") {
    return <SellerInventoryView />;
  }

  return (
    <div className="rounded-2xl border border-[var(--brand-border)] bg-[var(--card-bg)] p-12 text-center max-w-lg mx-auto">
      <Package className="mx-auto w-12 h-12 text-neutral-400 mb-4" />
      <h1 className="text-lg font-bold text-[var(--foreground)]">{t("buyerOnlyTitle")}</h1>
      <p className="text-sm text-neutral-500 mt-2">{t("buyerOnlyDesc")}</p>
      <Link
        href="/dashboard/browse"
        className="inline-block mt-6 text-sm font-medium text-[var(--brand-blue)] hover:underline"
      >
        {t("goBrowse")}
      </Link>
    </div>
  );
}
