"use client";

import { motion } from "framer-motion";

const panelSpring = { type: "spring" as const, stiffness: 320, damping: 30 };

/** Slide-in panel for signup steps (role → agreement → details). */
export function SignupStepPanel({
  stepKey,
  children,
  className = "",
}: {
  stepKey: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      role="region"
      aria-live="polite"
      aria-label={stepKey}
      initial={{ opacity: 0, x: 32 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -24 }}
      transition={panelSpring}
      className={className}
    >
      {children}
    </motion.div>
  );
}
