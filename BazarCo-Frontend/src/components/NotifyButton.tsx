"use client";

import { useState, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { notifySignUp } from "@/lib/api";
import { Toast, type ToastItem } from "@/components/Toast";

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function BellIcon({ className }: { className?: string }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
    >
      <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9" />
      <path d="M10.3 21a1.94 1.94 0 0 0 3.4 0" />
    </svg>
  );
}

function CloseIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

let toastId = 0;
function nextToastId() {
  return ++toastId;
}

export function NotifyButton() {
  const [popupOpen, setPopupOpen] = useState(false);
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const addToast = useCallback((type: "success" | "error", message: string) => {
    const id = nextToastId();
    setToasts((prev) => [...prev, { id, type, message }]);
  }, []);

  const dismissToast = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const openPopup = () => setPopupOpen(true);
  const closePopup = () => {
    if (!submitting) setPopupOpen(false);
    setEmail("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = email.trim();
    if (!EMAIL_REGEX.test(trimmed)) {
      addToast("error", "Please enter a valid email address.");
      return;
    }
    setSubmitting(true);
    try {
      const result = await notifySignUp(trimmed);
      if (result.status === "success") {
        addToast("success", result.message);
        closePopup();
      } else {
        addToast("error", result.message);
      }
    } catch {
      addToast("error", "Could not reach the server. Try again later.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="fixed left-6 top-20 z-20">
        <motion.button
          type="button"
          onClick={openPopup}
          className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[var(--brand-red)] bg-[var(--brand-black)] text-[var(--brand-white)] shadow-lg transition-colors hover:bg-[var(--brand-red)] hover:text-white"
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          title="Get notified at launch"
        >
          <BellIcon className="h-5 w-5" />
        </motion.button>
      </div>

      <AnimatePresence>
        {popupOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-sm"
              onClick={closePopup}
              aria-hidden
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="fixed left-1/2 top-1/2 z-50 w-full max-w-sm -translate-x-1/2 -translate-y-1/2 px-4"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="rounded-2xl bg-[var(--brand-black)]/95 py-5 px-5 shadow-2xl backdrop-blur-sm sm:px-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-[var(--brand-white)]">Get notified</h2>
                  <button
                    type="button"
                    onClick={closePopup}
                    disabled={submitting}
                    className="rounded-lg p-1.5 text-neutral-400 transition-colors hover:bg-neutral-800 hover:text-white disabled:opacity-50"
                    aria-label="Close"
                  >
                    <CloseIcon className="h-5 w-5" />
                  </button>
                </div>
                <p className="mb-4 text-sm text-neutral-400">
                  We&apos;ll email you when BazarCo launches.
                </p>
                <form onSubmit={handleSubmit} className="flex flex-col gap-3">
                  <input
                    id="notify-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="you@example.com"
                    disabled={submitting}
                    autoComplete="email"
                    className="w-full rounded-xl border border-neutral-700 bg-neutral-900/80 px-4 py-2.5 text-sm text-[var(--brand-white)] placeholder:text-neutral-500 focus:border-[var(--brand-blue)] focus:outline-none focus:ring-1 focus:ring-[var(--brand-blue)]/30 disabled:opacity-60"
                  />
                  <motion.button
                    type="submit"
                    disabled={submitting}
                    className="rounded-xl bg-[var(--brand-red)] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[var(--brand-red)]/90 disabled:opacity-60"
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                  >
                    {submitting ? "Sending…" : "Notify me"}
                  </motion.button>
                </form>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      <Toast toasts={toasts} onDismiss={dismissToast} />
    </>
  );
}
