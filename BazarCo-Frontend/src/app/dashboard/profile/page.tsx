"use client";

import { useAuth } from "@/contexts/AuthContext";
import { SellerProfileView } from "@/components/dashboard/SellerProfileView";
import { BuyerProfileMarketView } from "@/components/marketplace/BuyerProfileMarketView";

export default function ProfilePage() {
  const { user } = useAuth();
  if (user?.role === "seller") return <SellerProfileView />;
  return <BuyerProfileMarketView />;
}
