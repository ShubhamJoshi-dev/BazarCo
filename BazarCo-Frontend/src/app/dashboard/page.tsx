"use client";

import { useAuth } from "@/contexts/AuthContext";
import { SellerDashboardOverview } from "@/components/dashboard/SellerDashboardOverview";
import { BuyerDashboardHome } from "@/components/dashboard/BuyerDashboardHome";

export default function DashboardPage() {
  const { user } = useAuth();

  if (user?.role === "seller") {
    return <SellerDashboardOverview />;
  }

  return <BuyerDashboardHome />;
}
