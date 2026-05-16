"use client";

import { Suspense } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslations } from "next-intl";
import { SellerSettingsView } from "@/components/dashboard/SellerSettingsView";
import { BuyerSettingsMarketView } from "@/components/marketplace/BuyerSettingsMarketView";

function SettingsFallback() {
  const t = useTranslations("buyerSettings");
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-sm text-neutral-500">
      {t("loading")}
    </div>
  );
}

export default function SettingsPage() {
  const { user, loading } = useAuth();
  const t = useTranslations("sellerSettings");

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-sm text-neutral-500">
        {t("loading")}
      </div>
    );
  }

  if (user?.role === "seller") {
    return <SellerSettingsView />;
  }

  return (
    <Suspense fallback={<SettingsFallback />}>
      <BuyerSettingsMarketView />
    </Suspense>
  );
}
