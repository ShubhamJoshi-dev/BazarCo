"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

function LockIcon({ className }: { className?: string }) {
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
      <rect width="18" height="11" x="3" y="11" rx="2" ry="2" />
      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
    </svg>
  );
}

export function DevAccessButton() {
  const [open, setOpen] = useState(false);

  return (
    <div className="fixed left-6 top-36 z-20 flex items-start gap-2">
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-amber-500/70 bg-[var(--brand-black)] text-amber-400 shadow-lg transition-colors hover:bg-amber-500/20 hover:border-amber-500"
        title="Dev access (login)"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <LockIcon className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="w-56 rounded-lg border border-amber-500/50 bg-[var(--brand-black)]/95 px-4 py-3 shadow-xl backdrop-blur"
          >
            <p className="text-sm font-medium text-amber-400/90">Login as dev for now</p>
            <Link
              href="/login"
              onClick={() => setOpen(false)}
              className="mt-3 flex w-full justify-center rounded-lg bg-amber-500/80 py-2 text-xs font-medium text-[var(--brand-black)] hover:bg-amber-500"
            >
              Continue as dev
            </Link>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
