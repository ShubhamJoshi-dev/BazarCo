"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { ChatSocketProvider } from "@/contexts/ChatSocketContext";
import { BuyerDashboardLayout } from "@/components/dashboard/BuyerDashboardLayout";
import { SellerDashboardLayout } from "@/components/dashboard/SellerDashboardLayout";
import { PublicMarketplaceLayout } from "@/components/marketplace/PublicMarketplaceLayout";
import { BazarCoBot } from "@/components/BazarCoBot";
import { isPublicMarketplacePath, isReelsPath } from "@/lib/marketplacePublic";
import { getLoginHref } from "@/lib/loginRedirect";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const t = useTranslations("dashboard");

  const isPublicGuest = !user && isPublicMarketplacePath(pathname);
  const guestReels = isPublicGuest && isReelsPath(pathname);

  useEffect(() => {
    if (loading) return;
    if (!user && !isPublicMarketplacePath(pathname)) {
      router.replace(getLoginHref(pathname ?? "/dashboard"));
    }
  }, [user, loading, router, pathname]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <p className="text-[var(--brand-muted)]">{t("loading")}</p>
      </div>
    );
  }

  if (!user) {
    if (!isPublicGuest) return null;
    if (guestReels) return <>{children}</>;
    return <PublicMarketplaceLayout>{children}</PublicMarketplaceLayout>;
  }

  if (user.role === "seller") {
    const isVideoWorkspace = pathname?.startsWith("/dashboard/videos");
    return (
      <ChatSocketProvider>
        {isVideoWorkspace ? children : <SellerDashboardLayout>{children}</SellerDashboardLayout>}
      </ChatSocketProvider>
    );
  }

  return (
    <ChatSocketProvider>
      <BuyerDashboardLayout>{children}</BuyerDashboardLayout>
      <BazarCoBot />
    </ChatSocketProvider>
  );
}
