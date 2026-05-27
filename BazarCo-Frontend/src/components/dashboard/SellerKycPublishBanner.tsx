"use client";

import Link from "next/link";
import { ShieldAlert, ShieldCheck, Clock } from "lucide-react";
import { useTranslations } from "next-intl";
import type { KycStatusResponse } from "@/lib/api";

type Variant = "amber" | "blue";

export function SellerKycPublishBanner({
  kycVerified,
  kycStatus,
  variant = "amber",
  className = "",
}: {
  kycVerified: boolean | null;
  kycStatus?: KycStatusResponse["status"] | null;
  variant?: Variant;
  className?: string;
}) {
  const t = useTranslations("sellerKycPublish");

  if (kycVerified === true) {
    return (
      <div
        className={`flex flex-wrap items-start gap-3 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 ${className}`}
      >
        <ShieldCheck className="h-5 w-5 shrink-0 text-emerald-600 mt-0.5" />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-emerald-900">{t("verifiedTitle")}</p>
          <p className="text-xs text-emerald-800/90 mt-0.5">{t("verifiedDesc")}</p>
        </div>
      </div>
    );
  }

  if (kycVerified === null) return null;

  const isRejected = kycStatus === "rejected";
  const shell =
    variant === "blue"
      ? "border-[var(--brand-blue)]/25 bg-[var(--brand-blue)]/8"
      : "border-amber-200 bg-amber-50";
  const iconClass = isRejected ? "text-[var(--brand-red)]" : "text-amber-600";
  const titleClass = isRejected ? "text-[var(--brand-red)]" : "text-amber-900";
  const descClass = isRejected ? "text-red-800/90" : "text-amber-800/90";

  return (
    <div className={`flex flex-wrap items-start gap-3 rounded-xl border px-4 py-3.5 ${shell} ${className}`}>
      {isRejected ? (
        <ShieldAlert className={`h-5 w-5 shrink-0 mt-0.5 ${iconClass}`} />
      ) : (
        <Clock className={`h-5 w-5 shrink-0 mt-0.5 ${iconClass}`} />
      )}
      <div className="min-w-0 flex-1">
        <p className={`text-sm font-semibold ${titleClass}`}>
          {isRejected ? t("rejectedTitle") : t("pendingTitle")}
        </p>
        <p className={`text-xs mt-1 leading-relaxed ${descClass}`}>
          {isRejected ? t("rejectedDesc") : t("pendingDesc")}
        </p>
      </div>
      <Link
        href="/dashboard/kyc"
        className="shrink-0 rounded-lg bg-[var(--brand-red)] px-4 py-2 text-xs font-semibold text-white hover:bg-[#b71c1c] transition-colors"
      >
        {t("goKyc")}
      </Link>
    </div>
  );
}
