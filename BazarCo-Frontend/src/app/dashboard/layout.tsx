"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
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

  useEffect(() => {
    if (loading) return;
    if (!user) {
      router.replace("/login");
      return;
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--brand-black)] flex items-center justify-center">
        <p className="text-neutral-400">Loading...</p>
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
