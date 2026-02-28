"use client";

import { motion } from "framer-motion";
import { useHealthCheck } from "@/hooks/useHealthCheck";

export function HealthCheckButton() {
  const { state, check } = useHealthCheck();

  return (
    <div className="flex flex-col items-center gap-4">
      <motion.button
        type="button"
        onClick={check}
        disabled={state.status === "loading"}
        className="rounded-xl border-2 border-[var(--brand-blue)] bg-[var(--brand-black)] px-8 py-4 text-[var(--brand-white)] transition-colors hover:bg-[var(--brand-blue)] hover:text-white disabled:opacity-60 disabled:cursor-not-allowed font-medium"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {state.status === "loading" ? "Checking..." : "Check the health status"}
      </motion.button>

      {state.status === "success" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-[var(--brand-blue)] bg-[var(--brand-black)]/80 px-6 py-4 text-left text-sm text-[var(--brand-white)]"
        >
          <p className="font-medium text-[var(--brand-blue)]">Backend is working</p>
          <p className="mt-1 text-neutral-400">status: {state.data.status}</p>
          <p className="text-neutral-400">db: {state.data.db}</p>
          <p className="text-neutral-400">environment: {state.data.environment}</p>
        </motion.div>
      )}

      {state.status === "error" && (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-lg border border-[var(--brand-red)] bg-[var(--brand-black)]/80 px-6 py-4 text-sm text-[var(--brand-red)]"
        >
          <p className="font-medium">Backend unreachable</p>
          <p className="mt-1 text-neutral-400">{state.message}</p>
        </motion.div>
      )}
    </div>
  );
}
