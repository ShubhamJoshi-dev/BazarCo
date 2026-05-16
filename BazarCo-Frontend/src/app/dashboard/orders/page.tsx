"use client";

import dynamic from "next/dynamic";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";

function PageLoading() {
  const t = useTranslations("sellerOrders");
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-neutral-500 text-sm">
      {t("loading")}
    </div>
  );
}

const SellerOrdersView = dynamic(
  () => import("@/components/dashboard/SellerOrdersView").then((m) => m.SellerOrdersView),
  { loading: () => <PageLoading /> },
);

const BuyerOrdersPage = dynamic(
  () => import("@/components/dashboard/BuyerOrdersPage").then((m) => m.BuyerOrdersPage),
  { loading: () => <PageLoading /> },
);

export default function OrdersPage() {
  const { user, loading } = useAuth();

  if (loading) {
    return <PageLoading />;
  }

  if (user?.role === "seller") {
    return <SellerOrdersView />;
  }

  return <BuyerOrdersPage />;
}
