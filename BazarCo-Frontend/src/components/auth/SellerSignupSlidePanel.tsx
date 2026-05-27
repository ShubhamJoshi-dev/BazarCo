"use client";

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, ArrowRight, FileText, ChevronLeft } from "lucide-react";
import { useTranslations } from "next-intl";
import { SellerAgreementDocument } from "@/components/auth/SellerAgreementDocument";
import { SignupStepProgress } from "@/components/auth/SignupStepProgress";

const backdropTransition = { duration: 0.28, ease: [0.22, 1, 0.36, 1] as const };
const panelSpring = { type: "spring" as const, stiffness: 300, damping: 30 };

type SellerSignupSlidePanelProps = {
  open: boolean;
  onClose: () => void;
  agreedToSellerTerms: boolean;
  onAgreedChange: (v: boolean) => void;
  onAgreementContinue: () => void;
  error: string;
};

export function SellerSignupSlidePanel({
  open,
  onClose,
  agreedToSellerTerms,
  onAgreedChange,
  onAgreementContinue,
  error,
}: SellerSignupSlidePanelProps) {
  const t = useTranslations("auth");
  const [mounted, setMounted] = useState(false);

  useEffect(() => setMounted(true), []);

  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [open]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!mounted) return null;

  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-[200]">
          <motion.button
            type="button"
            aria-label={t("back")}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={backdropTransition}
            onClick={onClose}
            className="absolute inset-0 bg-black/20 backdrop-blur-[3px]"
          />

          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="seller-signup-panel-title"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={panelSpring}
            className="absolute inset-y-0 right-0 flex w-full max-w-md flex-col sm:max-w-lg"
          >
            <div className="relative flex h-full min-h-0 flex-col overflow-hidden rounded-tl-2xl rounded-bl-2xl border-l border-[var(--brand-border)] bg-[var(--card-bg)] shadow-[-12px_0_32px_rgba(0,0,0,0.12)]">
              <div className="h-1 shrink-0 bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)]" />

              <header className="shrink-0 border-b border-[var(--brand-border)] px-4 py-4 sm:px-5">
                <div className="mb-3 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-[var(--brand-border)] text-[var(--brand-muted)] hover:bg-neutral-50"
                    aria-label={t("back")}
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <div className="flex-1">
                    <SignupStepProgress current="agreement" accent="red" />
                  </div>
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-[var(--brand-muted)] hover:bg-neutral-50"
                    aria-label={t("back")}
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <h2
                  id="seller-signup-panel-title"
                  className="text-lg font-bold text-[var(--foreground)] sm:text-xl"
                >
                  {t("sellerAgreementTitle")}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[var(--brand-muted)] sm:text-sm">
                  {t("sellerAgreementSubtitle")}
                </p>
              </header>

              <div className="flex min-h-0 flex-1 flex-col">
                <div className="flex min-h-0 flex-1 flex-col px-4 sm:px-5">
                  <div className="mb-3 flex flex-wrap items-center gap-2 pt-3">
                    <span className="clay-badge-red inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[11px] font-bold">
                      <FileText className="h-3.5 w-3.5" />
                      {t("sellerAgreementStep")}
                    </span>
                    <span className="text-[11px] font-medium text-[var(--brand-muted)]">
                      {t("sellerAgreementScrollHint")}
                    </span>
                  </div>

                  {error ? (
                    <div className="mb-3 rounded-xl border border-[var(--brand-red)]/35 bg-[var(--brand-red)]/10 px-3 py-2 text-sm text-[var(--brand-red)]">
                      {error}
                    </div>
                  ) : null}

                  <div className="min-h-[200px] flex-1 overflow-y-auto rounded-xl border border-[var(--brand-border)] bg-neutral-50/80 p-4 scrollbar-hide sm:p-5">
                    <SellerAgreementDocument />
                  </div>
                </div>

                <div className="shrink-0 space-y-3 border-t border-[var(--brand-border)] bg-[var(--card-bg)] px-4 py-4 sm:px-5">
                  <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-[var(--brand-border)] bg-white p-3.5 text-left transition-colors hover:border-[var(--brand-red)]/40 dark:bg-[var(--card-bg)]">
                    <input
                      type="checkbox"
                      checked={agreedToSellerTerms}
                      onChange={(e) => onAgreedChange(e.target.checked)}
                      className="mt-0.5 h-4 w-4 shrink-0 rounded border-neutral-300 text-[var(--brand-red)] focus:ring-[var(--brand-red)]"
                    />
                    <span className="text-xs leading-relaxed text-[var(--foreground)] sm:text-sm">
                      {t("agreeLabel")}
                    </span>
                  </label>
                  <button
                    type="button"
                    disabled={!agreedToSellerTerms}
                    onClick={onAgreementContinue}
                    className="flex w-full items-center justify-center gap-2 rounded-xl py-3.5 text-sm font-semibold text-white transition-all enabled:bg-[var(--brand-red)] enabled:shadow-md enabled:hover:bg-[#b71c1c] disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500 sm:text-base"
                  >
                    {t("continueToCreate")} <ArrowRight className="h-4 w-4" />
                  </button>
                </div>
              </div>
            </div>
          </motion.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}
