"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { SellerProductFormPage } from "@/components/dashboard/SellerProductFormPage";

export default function NewProductPage() {
  const { user, loading } = useAuth();
  const t = useTranslations("sellerProductForm");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-neutral-500 text-sm">
        {t("loading")}
      </div>
    );
  }

  if (user?.role !== "seller") {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-10 text-center max-w-md mx-auto">
        <p className="text-sm text-neutral-600">{t("sellerOnly")}</p>
        <Link href="/dashboard/browse" className="inline-block mt-4 text-sm font-medium text-[var(--brand-blue)] hover:underline">
          {t("goBrowse")}
        </Link>
      </div>
    );
  }

  return <SellerProductFormPage mode="create" />;
}
