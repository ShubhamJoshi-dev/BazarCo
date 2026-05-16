"use client";

import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Heart, LogIn } from "lucide-react";

export function SignInPromptModal({
  open,
  title,
  message,
  confirmLabel,
  cancelLabel,
  signUpLabel,
  signInHref,
  signUpHref = "/signup",
  onClose,
}: {
  open: boolean;
  title: string;
  message: string;
  confirmLabel: string;
  cancelLabel: string;
  signUpLabel?: string;
  signInHref: string;
  signUpHref?: string;
  onClose: () => void;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm"
          onClick={onClose}
          role="presentation"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 12 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 8 }}
            transition={{ type: "spring", stiffness: 420, damping: 28 }}
            className="w-full max-w-sm overflow-hidden rounded-2xl border border-white/10 bg-[var(--card-bg)] shadow-2xl"
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
            aria-labelledby="sign-in-prompt-title"
          >
            <div className="h-1 w-full bg-gradient-to-r from-[var(--brand-red)] to-[var(--brand-blue)]" />

            <div className="p-6 text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 500, damping: 22, delay: 0.05 }}
                className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand-red)]/15 text-[var(--brand-red)] ring-4 ring-[var(--brand-red)]/20"
              >
                <Heart className="h-8 w-8 fill-[var(--brand-red)]" />
              </motion.div>

              <h3 id="sign-in-prompt-title" className="text-lg font-bold text-[var(--foreground)] mb-2">
                {title}
              </h3>
              <p className="text-sm text-[var(--brand-muted)] leading-relaxed mb-6">{message}</p>

              <div className="flex flex-col gap-2">
                <Link
                  href={signInHref}
                  className="clay-btn-red flex w-full items-center justify-center gap-2 py-3 text-sm font-bold"
                  onClick={onClose}
                >
                  <LogIn className="h-4 w-4" />
                  {confirmLabel}
                </Link>
                {signUpLabel && signUpHref ? (
                  <Link
                    href={signUpHref}
                    className="w-full rounded-xl border border-[var(--brand-border)] py-3 text-sm font-semibold hover:bg-neutral-50"
                    onClick={onClose}
                  >
                    {signUpLabel}
                  </Link>
                ) : null}
                <button
                  type="button"
                  onClick={onClose}
                  className="w-full py-2.5 text-sm font-medium text-[var(--brand-muted)] hover:text-[var(--foreground)]"
                >
                  {cancelLabel}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
