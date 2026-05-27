"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Sparkles, X } from "lucide-react";
import { useTranslations } from "next-intl";
import {
  SELLER_ONBOARDING_STEPS,
  SELLER_ONBOARDING_STORAGE_KEY,
} from "@/content/sellerOnboardingSteps";

const slideSpring = { type: "spring" as const, stiffness: 320, damping: 32 };

export function SellerOnboardingBanner() {
  const t = useTranslations("sellerOnboarding");
  const [visible, setVisible] = useState(false);
  const [step, setStep] = useState(0);

  useEffect(() => {
    try {
      if (localStorage.getItem(SELLER_ONBOARDING_STORAGE_KEY) === "1") return;
    } catch {
      /* ignore */
    }
    setVisible(true);
  }, []);

  const dismiss = useCallback(() => {
    try {
      localStorage.setItem(SELLER_ONBOARDING_STORAGE_KEY, "1");
    } catch {
      /* ignore */
    }
    setVisible(false);
  }, []);

  const total = SELLER_ONBOARDING_STEPS.length;
  const current = SELLER_ONBOARDING_STEPS[step];
  const isLast = step === total - 1;

  if (!visible || !current) return null;

  function goNext() {
    if (isLast) dismiss();
    else setStep((s) => Math.min(s + 1, total - 1));
  }

  function goPrev() {
    setStep((s) => Math.max(s - 1, 0));
  }

  return (
    <section
      className="relative overflow-hidden rounded-2xl border border-[var(--brand-border)] bg-[var(--card-bg)] shadow-md"
      aria-label={t("ariaLabel")}
    >
      <div className="absolute right-3 top-3 z-20 flex items-center gap-2">
        <span className="rounded-full border border-[var(--brand-border)] bg-[var(--card-bg)]/95 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-muted)] shadow-sm backdrop-blur-sm">
          {t("stepCounter", { current: step + 1, total })}
        </span>
        <button
          type="button"
          onClick={dismiss}
          className="rounded-full border border-[var(--brand-border)] bg-[var(--card-bg)]/95 p-2 text-[var(--brand-muted)] shadow-sm backdrop-blur-sm transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]"
          aria-label={t("skip")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex flex-col lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        {/* Image panel — full photo visible, no crop */}
        <div className="border-b border-[var(--brand-border)] bg-[var(--input-bg)]/60 p-4 pt-12 sm:p-5 sm:pt-14 lg:border-b-0 lg:border-r lg:pt-5">
          <AnimatePresence mode="wait">
            <motion.div
              key={current.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -6 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex min-h-[180px] items-center justify-center sm:min-h-[220px] lg:min-h-[260px]"
            >
              <div className="relative w-full max-w-md mx-auto">
                <div className="rounded-xl border border-[var(--brand-border)]/80 bg-[var(--card-bg)] p-2 sm:p-3 shadow-inner">
                  <Image
                    src={current.image}
                    alt={t(current.titleKey)}
                    width={800}
                    height={600}
                    className="mx-auto h-auto max-h-[160px] w-full object-contain sm:max-h-[200px] lg:max-h-[240px]"
                    sizes="(max-width: 1024px) 90vw, 420px"
                    priority={step === 0}
                  />
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="mt-3 flex justify-center gap-1.5 lg:hidden">
            {SELLER_ONBOARDING_STEPS.map((_, i) => (
              <span
                key={i}
                className={`h-1 w-8 rounded-full transition-colors ${
                  i === step ? "bg-[var(--brand-red)]" : "bg-[var(--brand-border)]"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Copy + actions */}
        <div className="flex flex-col justify-between gap-5 p-5 sm:p-6 lg:p-7">
          <div>
            <p className="inline-flex items-center gap-1.5 rounded-full border border-[var(--brand-red)]/30 bg-[var(--brand-red)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-[var(--brand-red)]">
              <Sparkles className="h-3 w-3" />
              {t("badge")}
            </p>
            <AnimatePresence mode="wait">
              <motion.div
                key={current.id}
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
                transition={slideSpring}
              >
                <h3 className="mt-3 text-xl font-bold text-[var(--foreground)] sm:text-2xl">
                  {t(current.titleKey)}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-[var(--brand-muted)] sm:text-[15px]">
                  {t(current.descKey)}
                </p>
              </motion.div>
            </AnimatePresence>

            <div className="mt-4 flex flex-wrap gap-2">
              {SELLER_ONBOARDING_STEPS.map((s, i) => (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setStep(i)}
                  className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-colors ${
                    i === step
                      ? "bg-[var(--brand-red)] text-white"
                      : "bg-[var(--input-bg)] text-[var(--brand-muted)] hover:text-[var(--foreground)]"
                  }`}
                >
                  {t(`stepLabel_${s.id}`)}
                </button>
              ))}
            </div>
          </div>

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={dismiss}
              className="text-sm font-semibold text-[var(--brand-muted)] hover:text-[var(--foreground)] transition-colors"
            >
              {t("skip")}
            </button>
            <div className="flex flex-wrap gap-2">
              {step > 0 && (
                <button
                  type="button"
                  onClick={goPrev}
                  className="inline-flex items-center gap-1 rounded-xl border border-[var(--brand-border)] px-4 py-2.5 text-sm font-semibold hover:bg-[var(--input-bg)]"
                >
                  <ChevronLeft className="h-4 w-4" />
                  {t("back")}
                </button>
              )}
              {!isLast ? (
                <>
                  <Link
                    href={current.href}
                    onClick={dismiss}
                    className="inline-flex items-center justify-center rounded-xl border border-[var(--brand-blue)]/40 px-4 py-2.5 text-sm font-semibold text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10"
                  >
                    {t(current.ctaKey)}
                  </Link>
                  <button
                    type="button"
                    onClick={goNext}
                    className="clay-btn-red inline-flex items-center gap-1 px-5 py-2.5 text-sm"
                  >
                    {t("next")}
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              ) : (
                <button
                  type="button"
                  onClick={dismiss}
                  className="clay-btn-red inline-flex items-center gap-1 px-5 py-2.5 text-sm"
                >
                  {t("finish")}
                  <ChevronRight className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="hidden gap-1 border-t border-[var(--brand-border)] bg-[var(--input-bg)]/50 px-5 py-2.5 lg:flex">
        {SELLER_ONBOARDING_STEPS.map((_, i) => (
          <span
            key={i}
            className={`h-1 flex-1 rounded-full transition-colors ${
              i === step ? "bg-[var(--brand-red)]" : "bg-[var(--brand-border)]"
            }`}
          />
        ))}
      </div>
    </section>
  );
}
