"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion } from "framer-motion";
import { CheckCircle2, ShoppingBag, Loader2, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import { confirmCheckoutSuccess, type Order } from "@/lib/api";

export default function CheckoutSuccessPage() {
  const searchParams = useSearchParams();
  const t = useTranslations("checkout");
  const tNav = useTranslations("nav");
  const tCommon = useTranslations("common");
  const sessionId = searchParams.get("session_id");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [orders, setOrders] = useState<Order[]>([]);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setStatus("error");
      setErrorMessage("Missing session. Return to cart and try again.");
      return;
    }
    let cancelled = false;
    confirmCheckoutSuccess(sessionId).then(({ orders: created, error }) => {
      if (cancelled) return;
      if (error) {
        setStatus("error");
        setErrorMessage(error);
        return;
      }
      setOrders(created);
      setStatus("success");
    });
    return () => { cancelled = true; };
  }, [sessionId]);

  if (status === "loading") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] gap-4">
        <Loader2 className="w-12 h-12 text-[var(--brand-blue)] animate-spin" />
        <p className="text-[var(--brand-white)] font-medium">{t("confirming")}</p>
      </div>
    );
  }

  if (status === "error") {
    return (
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        className="max-w-lg mx-auto rounded-2xl bg-white/[0.04] p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)]"
      >
        <p className="text-[var(--brand-red)] font-medium mb-2">{t("errorGeneric")}</p>
        <p className="text-sm text-neutral-400 mb-6">{errorMessage}</p>
        <Link
          href="/dashboard/cart"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-blue)]/90"
        >
          {t("backToCart")}
        </Link>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-2xl mx-auto space-y-8"
    >
      <div className="rounded-2xl bg-emerald-500/10 border border-emerald-500/30 p-8 text-center shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
        <CheckCircle2 className="mx-auto w-16 h-16 text-emerald-500 mb-4" />
        <h1 className="text-2xl font-bold text-[var(--brand-white)] mb-2">{t("paymentSuccess")}</h1>
        <p className="text-neutral-400">
          {t("successMessage")}
        </p>
      </div>

      {orders.length > 0 && (
        <div className="rounded-2xl bg-white/[0.04] p-6 shadow-[0_0_0_1px_rgba(255,255,255,0.06)]">
          <h2 className="flex items-center gap-2 text-lg font-semibold text-[var(--brand-white)] mb-4">
            <ShoppingBag className="w-5 h-5 text-[var(--brand-blue)]" />
            {t("yourOrders")}
          </h2>
          <ul className="space-y-4">
            {orders.map((order) => (
              <li key={order.id} className="rounded-xl bg-white/[0.03] p-4">
                <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                  <span className="text-sm text-neutral-400">Order #{order.id.slice(-8)}</span>
                  <span className="font-semibold text-[var(--brand-white)]">${Number(order.total).toFixed(2)}</span>
                </div>
                <ul className="text-sm text-neutral-400 space-y-1">
                  {order.items?.map((item, idx) => (
                    <li key={idx}>
                      {item.productName} &times; {item.quantity} — ${((Number(item.price) || 0) * (item.quantity || 0)).toFixed(2)}
                    </li>
                  ))}
                </ul>
                {order.shippingAddress && typeof order.shippingAddress === "object" && "line1" in order.shippingAddress && (
                  <p className="mt-2 text-xs text-neutral-500">
                    Ships to: {(order.shippingAddress as { line1: string; city: string; country: string }).line1},{" "}
                    {(order.shippingAddress as { city: string }).city},{" "}
                    {(order.shippingAddress as { country: string }).country}
                  </p>
                )}
                <Link
                  href={`/dashboard/orders/${order.id}`}
                  className="mt-2 inline-block text-sm text-[var(--brand-blue)] hover:underline"
                >
                  {t("viewOrderDetails")}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-wrap gap-4 justify-center">
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 rounded-xl bg-[var(--brand-blue)] px-5 py-2.5 text-sm font-medium text-white hover:bg-[var(--brand-blue)]/90"
        >
          {tNav("dashboard")}
          <ArrowRight className="w-4 h-4" />
        </Link>
        <Link
          href="/dashboard/browse"
          className="inline-flex items-center gap-2 rounded-xl border border-white/20 px-5 py-2.5 text-sm font-medium text-[var(--brand-white)] hover:bg-white/5"
        >
          {tCommon("continueShopping")}
        </Link>
      </div>
    </motion.div>
  );
}
