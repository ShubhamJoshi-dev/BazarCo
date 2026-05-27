"use client";

import { useEffect, useState } from "react";
import { adminGetDiagnostics, adminRunMaintenance } from "@/lib/adminApi";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/contexts/ToastContext";

export default function AdminSystemPage() {
  const toast = useToast();
  const [diagnostics, setDiagnostics] = useState<Record<string, unknown> | null>(null);
  const [secret, setSecret] = useState("");
  const [confirmAction, setConfirmAction] = useState<"refresh" | "rebuild" | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    void adminGetDiagnostics().then(setDiagnostics);
  }, []);

  async function runMaintenance(action: "refresh" | "rebuild") {
    setLoading(true);
    const endpoint = action === "refresh" ? "refresh-collections" : "rebuild-indexes";
    const result = await adminRunMaintenance(endpoint, { confirm: true, maintenanceSecret: secret });
    setLoading(false);
    setConfirmAction(null);
    if (result.ok) toast.success(result.message ?? "Completed");
    else toast.error(result.message ?? "Failed");
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">System tools</h2>
        <p className="text-sm text-[var(--brand-muted)] mt-1">
          Diagnostics and maintenance. Destructive actions require <code className="text-xs">ADMIN_MAINTENANCE_SECRET</code>.
        </p>
      </div>

      <div className="clay-card rounded-xl border border-[var(--brand-border)] p-5">
        <h3 className="font-semibold text-sm">Diagnostics</h3>
        <dl className="mt-3 grid gap-2 text-sm sm:grid-cols-2">
          {diagnostics &&
            Object.entries(diagnostics).map(([k, v]) => (
              <div key={k} className="flex justify-between gap-4 border-b border-[var(--brand-border)]/50 py-1">
                <dt className="text-[var(--brand-muted)]">{k}</dt>
                <dd className="font-mono text-xs">{String(v)}</dd>
              </div>
            ))}
        </dl>
      </div>

      <div className="clay-card rounded-xl border border-amber-500/30 p-5 space-y-4">
        <h3 className="font-semibold text-sm text-amber-600">Danger zone</h3>
        <input
          type="password"
          placeholder="Maintenance secret"
          value={secret}
          onChange={(e) => setSecret(e.target.value)}
          className="clay-input max-w-md"
          autoComplete="off"
        />
        <div className="flex flex-wrap gap-3">
          <button type="button" className="rounded-lg border border-amber-500/40 px-4 py-2 text-sm text-amber-700 dark:text-amber-400" onClick={() => setConfirmAction("refresh")}>
            Refresh collections (excludes products)
          </button>
          <button type="button" className="rounded-lg border border-amber-500/40 px-4 py-2 text-sm text-amber-700 dark:text-amber-400" onClick={() => setConfirmAction("rebuild")}>
            Rebuild indexes
          </button>
          <button
            type="button"
            className="clay-btn-blue px-4 py-2 text-sm"
            onClick={() =>
              void adminRunMaintenance("jobs", { job: "cart_reminder", maintenanceSecret: secret }).then((r) =>
                r.ok ? toast.success("Job ran") : toast.error(r.message ?? "Job failed")
              )
            }
          >
            Run cart reminder job
          </button>
        </div>
      </div>

      <ConfirmModal
        open={confirmAction === "refresh"}
        title="Refresh database collections?"
        message="Clears all collections except products. This is irreversible for cleared data. Products are preserved."
        confirmLabel="Refresh"
        onConfirm={() => void runMaintenance("refresh")}
        onCancel={() => setConfirmAction(null)}
        loading={loading}
      />
      <ConfirmModal
        open={confirmAction === "rebuild"}
        title="Rebuild indexes?"
        message="Attempts to rebuild indexes on all collections. Run during low traffic."
        confirmLabel="Rebuild"
        variant="default"
        onConfirm={() => void runMaintenance("rebuild")}
        onCancel={() => setConfirmAction(null)}
        loading={loading}
      />
    </div>
  );
}
