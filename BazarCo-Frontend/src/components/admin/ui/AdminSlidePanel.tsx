"use client";

import { AnimatePresence, motion } from "framer-motion";
import { X } from "lucide-react";

export function AdminSlidePanel({
  open,
  title,
  subtitle,
  onClose,
  children,
  footer,
}: {
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.button
            type="button"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/50 backdrop-blur-sm"
            onClick={onClose}
            aria-label="Close panel"
          />
          <motion.aside
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", stiffness: 380, damping: 36 }}
            className="fixed right-0 top-0 z-[71] flex h-full w-full max-w-lg flex-col border-l border-[var(--brand-border)] bg-[var(--card-bg)] shadow-2xl"
          >
            <header className="flex items-start justify-between gap-3 border-b border-[var(--brand-border)] px-5 py-4">
              <div>
                <h3 className="text-lg font-bold text-[var(--foreground)]">{title}</h3>
                {subtitle && <p className="mt-0.5 text-sm text-[var(--brand-muted)]">{subtitle}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="rounded-xl border border-[var(--brand-border)] p-2 text-[var(--brand-muted)] transition hover:bg-[var(--input-bg)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </header>
            <div className="flex-1 overflow-y-auto px-5 py-5">{children}</div>
            {footer && (
              <footer className="border-t border-[var(--brand-border)] bg-[var(--input-bg)]/40 px-5 py-4">{footer}</footer>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}
