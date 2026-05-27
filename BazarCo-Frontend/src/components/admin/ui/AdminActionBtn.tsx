"use client";

import type { LucideIcon } from "lucide-react";

const variants = {
  default: "border-[var(--brand-border)] text-[var(--foreground)] hover:bg-[var(--input-bg)]",
  primary: "border-[var(--brand-blue)]/40 text-[var(--brand-blue)] hover:bg-[var(--brand-blue)]/10",
  danger: "border-[var(--brand-red)]/40 text-[var(--brand-red)] hover:bg-[var(--brand-red)]/10",
  success: "border-emerald-500/40 text-emerald-600 hover:bg-emerald-500/10",
  warn: "border-amber-500/40 text-amber-600 hover:bg-amber-500/10",
};

export function AdminActionBtn({
  icon: Icon,
  label,
  onClick,
  variant = "default",
  disabled,
}: {
  icon?: LucideIcon;
  label: string;
  onClick: () => void;
  variant?: keyof typeof variants;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1.5 text-xs font-semibold transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50 ${variants[variant]}`}
    >
      {Icon && <Icon className="h-3.5 w-3.5" />}
      {label}
    </button>
  );
}
