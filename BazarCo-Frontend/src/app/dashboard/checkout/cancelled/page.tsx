"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { XCircle } from "lucide-react";
import { useTranslations } from "next-intl";

export default function CheckoutCancelledPage() {
  const t = useTranslations("checkout");
  const tCommon = useTranslations("common");
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-md mx-auto rounded-2xl bg-white/[0.04] p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
    >
      <XCircle className="mx-auto w-14 h-14 text-amber-500 mb-4" />
      <h1 className="text-xl font-bold text-[var(--brand-white)] mb-2">{t("cancelledTitle")}</h1>
      <p className="text-neutral-400 text-sm mb-6">
        {t("cancelledHint")}
      </p>
      <div className="flex flex-wrap gap-3 justify-center">
        <Link
          href="/dashboard/cart"
          className="inline-flex items-center rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-blue)]/90"
        >
          {t("backToCart")}
        </Link>
        <Link
          href="/dashboard/browse"
          className="inline-flex items-center rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-[var(--brand-white)] hover:bg-white/5"
        >
          {tCommon("continueShopping")}
        </Link>
      </div>
    </motion.div>
  );
}
