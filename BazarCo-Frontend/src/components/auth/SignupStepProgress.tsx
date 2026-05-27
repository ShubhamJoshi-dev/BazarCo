"use client";

import { motion } from "framer-motion";

const STEPS = ["role", "agreement", "details"] as const;

export type SignupProgressStep = (typeof STEPS)[number];

export function SignupStepProgress({
  current,
  accent = "red",
}: {
  current: SignupProgressStep;
  accent?: "red" | "blue";
}) {
  const index = STEPS.indexOf(current);
  const fill =
    accent === "red" ? "var(--brand-red)" : "var(--brand-blue)";

  return (
    <div className="mb-0 flex items-center justify-center gap-2" aria-hidden>
      {STEPS.map((step, i) => (
        <motion.span
          key={step}
          layout
          className="h-1.5 rounded-full"
          initial={false}
          animate={{
            width: i <= index ? (i === index ? 32 : 20) : 8,
            opacity: i <= index ? 1 : 0.35,
            background:
              i <= index
                ? fill
                : "var(--brand-border)",
          }}
          transition={{ type: "spring", stiffness: 380, damping: 32 }}
        />
      ))}
    </div>
  );
}
