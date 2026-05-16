"use client";

import { Suspense } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { useTranslations } from "next-intl";
import { useAuth } from "@/contexts/AuthContext";
import { SellerKycView } from "@/components/dashboard/SellerKycView";

function KycFallback() {
  const t = useTranslations("sellerKyc");
  return (
    <div className="flex items-center justify-center min-h-[40vh] text-neutral-500 text-sm">
      {t("loading")}
    </div>
  );
}

function KycPageContent() {
  const { user } = useAuth();
  const t = useTranslations("sellerKyc");

  if (user?.role !== "seller") {
    return (
      <div className="rounded-xl border border-neutral-200 bg-white p-12 text-center max-w-lg mx-auto">
        <ShieldCheck className="mx-auto w-12 h-12 text-neutral-300 mb-4" />
        <h1 className="text-lg font-bold text-[var(--foreground)]">{t("buyerTitle")}</h1>
        <p className="text-sm text-neutral-500 mt-2">{t("buyerDesc")}</p>
        <Link href="/dashboard/browse" className="inline-block mt-6 text-sm font-medium text-[var(--brand-blue)] hover:underline">
          {t("goBrowse")}
        </Link>
      </div>
    );
  }

  return <SellerKycView />;
}

export default function KycPage() {
  return (
    <Suspense fallback={<KycFallback />}>
      <KycPageContent />
    </Suspense>
  );
}
