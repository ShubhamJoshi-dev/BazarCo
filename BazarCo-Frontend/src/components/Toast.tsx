"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export type ToastType = "success" | "error";

export interface ToastItem {
  id: number;
  type: ToastType;
  message: string;
}

interface ToastProps {
  toasts: ToastItem[];
  onDismiss: (id: number) => void;
  autoDismissMs?: number;
}

function CheckIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d="M20 6 9 17l-5-5" />
    </svg>
  );
}

function XCircleIcon({ className }: { className?: string }) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <circle cx="12" cy="12" r="10" />
      <path d="m15 9-6 6M9 9l6 6" />
    </svg>
  );
}

export function Toast({ toasts, onDismiss, autoDismissMs = 4500 }: ToastProps) {
  return (
    <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex flex-col gap-2 sm:bottom-8 sm:right-8">
      <AnimatePresence>
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onDismiss={onDismiss} autoDismissMs={autoDismissMs} />
        ))}
      </AnimatePresence>
    </div>
  );
}

function ToastItem({
  item,
  onDismiss,
  autoDismissMs,
}: {
  item: ToastItem;
  onDismiss: (id: number) => void;
  autoDismissMs: number;
}) {
  useEffect(() => {
    const t = setTimeout(() => onDismiss(item.id), autoDismissMs);
    return () => clearTimeout(t);
  }, [item.id, onDismiss, autoDismissMs]);

  const isSuccess = item.type === "success";
  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 16, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, x: 24, scale: 0.96 }}
      transition={{ type: "spring", stiffness: 400, damping: 30 }}
      className="pointer-events-auto flex min-w-[280px] max-w-[90vw] items-center gap-3 rounded-xl border px-4 py-3 shadow-xl backdrop-blur-sm"
      style={{
        borderColor: isSuccess ? "rgba(34, 197, 94, 0.5)" : "rgba(229, 115, 115, 0.6)",
        background: isSuccess ? "rgba(10, 10, 10, 0.92)" : "rgba(10, 10, 10, 0.92)",
        boxShadow: isSuccess ? "0 0 0 1px rgba(34, 197, 94, 0.2)" : "0 0 0 1px rgba(229, 115, 115, 0.2)",
      }}
    >
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full">
        {isSuccess ? (
          <CheckIcon className="h-5 w-5 text-green-500" />
        ) : (
          <XCircleIcon className="h-5 w-5 text-[var(--brand-red)]" />
        )}
      </span>
      <p className={`flex-1 text-sm font-medium ${isSuccess ? "text-green-400" : "text-[var(--brand-red)]"}`}>
        {item.message}
      </p>
    </motion.div>
  );
}
