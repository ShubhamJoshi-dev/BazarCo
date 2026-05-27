"use client";

export function AdminStatCard({
  label,
  value,
  hint,
  accent = "blue",
}: {
  label: string;
  value: string | number;
  hint?: string;
  accent?: "blue" | "red" | "amber";
}) {
  const border =
    accent === "red"
      ? "border-[var(--brand-red)]/30"
      : accent === "amber"
        ? "border-amber-500/30"
        : "border-[var(--brand-blue)]/30";
  return (
    <div className={`clay-card rounded-xl border p-4 ${border}`}>
      <p className="text-xs font-medium uppercase tracking-wide text-[var(--brand-muted)]">{label}</p>
      <p className="mt-1 text-2xl font-semibold text-[var(--foreground)]">{value}</p>
      {hint && <p className="mt-1 text-xs text-[var(--brand-muted)]">{hint}</p>}
    </div>
  );
}
