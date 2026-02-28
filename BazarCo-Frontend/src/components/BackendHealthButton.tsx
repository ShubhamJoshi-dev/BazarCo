"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useHealthCheck } from "@/hooks/useHealthCheck";

function ServerIcon({ className }: { className?: string }) {
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
      <rect width="20" height="8" x="2" y="2" rx="2" ry="2" />
      <rect width="20" height="8" x="2" y="14" rx="2" ry="2" />
      <line x1="6" x2="6.01" y1="6" y2="6" />
      <line x1="6" x2="6.01" y1="18" y2="18" />
      <line x1="10" x2="10.01" y1="6" y2="6" />
      <line x1="10" x2="10.01" y1="18" y2="18" />
    </svg>
  );
}

function MongoConnectedIcon({ className }: { className?: string }) {
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
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  );
}

export function BackendHealthButton() {
  const { state, check } = useHealthCheck();
  const [open, setOpen] = useState(false);

  const handleClick = () => {
    if (state.status === "idle" || state.status === "error") check();
    setOpen((o) => !o);
  };

  return (
    <div className="fixed left-6 top-6 z-20 flex items-start gap-2">
      <motion.button
        type="button"
        onClick={handleClick}
        disabled={state.status === "loading"}
        className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-[var(--brand-blue)] bg-[var(--brand-black)] text-[var(--brand-white)] shadow-lg transition-colors hover:bg-[var(--brand-blue)] hover:text-white disabled:opacity-60"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        title="Check backend health"
      >
        <ServerIcon className="h-5 w-5" />
      </motion.button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.15 }}
            className="w-56 rounded-lg border border-[var(--brand-blue)] bg-[var(--brand-black)]/95 px-4 py-3 shadow-xl backdrop-blur"
          >
            {state.status === "idle" && (
              <p className="text-sm text-neutral-400">Click to check backend</p>
            )}
            {state.status === "loading" && (
              <p className="text-sm text-[var(--brand-blue)]">Checking...</p>
            )}
            {state.status === "success" && (
              <div className="text-sm">
                <p className="font-medium text-[var(--brand-blue)]">Backend OK</p>
                {state.data.db === "connected" ? (
                  <span className="mt-1 flex items-center gap-1.5 text-[var(--brand-blue)]">
                    <MongoConnectedIcon className="h-4 w-4 shrink-0" />
                    <span>MongoDB connected</span>
                  </span>
                ) : (
                  <p className="mt-0.5 text-neutral-400">db: {state.data.db}</p>
                )}
              </div>
            )}
            {state.status === "error" && (
              <div className="text-sm">
                <p className="font-medium text-[var(--brand-red)]">Unreachable</p>
                <p className="mt-0.5 text-neutral-400">{state.message}</p>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
