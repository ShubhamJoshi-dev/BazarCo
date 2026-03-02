"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ShoppingCart, AlertCircle } from "lucide-react";

interface ToastProps {
  message: string;
  visible: boolean;
  onDismiss: () => void;
  duration?: number;
  variant?: "success" | "error";
}

export function Toast({ message, visible, onDismiss, duration = 3000, variant = "success" }: ToastProps) {
  useEffect(() => {
    if (!visible) return;
    const t = setTimeout(onDismiss, duration);
    return () => clearTimeout(t);
  }, [visible, duration, onDismiss]);

  const isError = variant === "error";
  const borderClass = isError ? "border-[var(--brand-red)]/40" : "border-[var(--brand-blue)]/30";
  const iconBgClass = isError ? "bg-[var(--brand-red)]/20" : "bg-[var(--brand-blue)]/20";
  const iconClass = isError ? "text-[var(--brand-red)]" : "text-[var(--brand-blue)]";
  const shadowClass = isError ? "shadow-[var(--brand-red)]/10" : "shadow-[var(--brand-blue)]/10";

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, x: 24 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 12, scale: 0.95 }}
          transition={{ type: "spring", stiffness: 400, damping: 30 }}
          className={`fixed bottom-6 right-6 z-[100] flex items-center gap-3 rounded-xl border ${borderClass} bg-[var(--brand-black)]/95 backdrop-blur px-4 py-3 shadow-lg ${shadowClass}`}
        >
          <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${iconBgClass}`}>
            {isError ? <AlertCircle className={`w-5 h-5 ${iconClass}`} /> : <ShoppingCart className={`w-5 h-5 ${iconClass}`} />}
          </div>
          <p className="text-sm font-medium text-[var(--brand-white)]">{message}</p>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
