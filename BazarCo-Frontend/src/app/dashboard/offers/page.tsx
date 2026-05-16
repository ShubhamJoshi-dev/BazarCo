"use client";

import { useAuth } from "@/contexts/AuthContext";
import { SellerBargainCenterView } from "@/components/dashboard/SellerBargainCenterView";
import { BuyerBargainsView } from "@/components/marketplace/BuyerBargainsView";

export default function OffersPage() {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[40vh] text-neutral-500 text-sm">
        Loading…
      </div>
    );
  }
  if (user?.role === "seller") {
    return <SellerBargainCenterView />;
  }
  return <BuyerBargainsView />;
}
