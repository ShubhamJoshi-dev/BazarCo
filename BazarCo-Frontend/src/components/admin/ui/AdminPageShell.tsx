"use client";

import { motion } from "framer-motion";
import type { LucideIcon } from "lucide-react";

export function AdminPageShell({
  title,
  description,
  icon: Icon,
  actions,
  toolbar,
  children,
}: {
  title: string;
  description: string;
  icon?: LucideIcon;
  actions?: React.ReactNode;
  toolbar?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="space-y-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex gap-4">
          {Icon && (
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br from-[var(--brand-blue)]/15 to-[var(--brand-red)]/10 text-[var(--brand-blue)] ring-1 ring-[var(--brand-border)]">
              <Icon className="h-6 w-6" />
            </div>
          )}
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-[var(--foreground)]">{title}</h2>
            <p className="mt-1 max-w-2xl text-sm text-[var(--brand-muted)]">{description}</p>
          </div>
        </div>
        {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
      </div>

      {toolbar && (
        <motion.div
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05, duration: 0.3 }}
          className="rounded-2xl border border-[var(--brand-border)] bg-[var(--card-bg)]/80 p-4 shadow-sm backdrop-blur-sm"
        >
          {toolbar}
        </motion.div>
      )}

      {children}
    </motion.div>
  );
}
