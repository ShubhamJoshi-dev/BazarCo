"use client";

import { useEffect, useState } from "react";
import { adminGetOverview } from "@/lib/adminApi";
import type { AdminOverviewStats } from "@/types/admin";
import { AdminStatCard } from "@/components/admin/AdminStatCard";

export default function AdminOverviewPage() {
  const [stats, setStats] = useState<AdminOverviewStats | null>(null);

  useEffect(() => {
    void adminGetOverview().then(setStats);
  }, []);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold">Overview</h2>
        <p className="text-sm text-[var(--brand-muted)] mt-1">Platform health and moderation queue at a glance.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <AdminStatCard label="Total users" value={stats?.totalUsers ?? "—"} />
        <AdminStatCard label="Active sellers" value={stats?.activeSellers ?? "—"} accent="blue" />
        <AdminStatCard label="Pending KYC" value={stats?.pendingKyc ?? "—"} accent="amber" />
        <AdminStatCard label="Flagged products" value={stats?.flaggedProducts ?? "—"} accent="red" />
        <AdminStatCard label="Suspended users" value={stats?.suspendedUsers ?? "—"} accent="red" />
        <AdminStatCard label="Active products" value={stats?.activeProducts ?? "—"} />
        <AdminStatCard label="Flagged messages" value={stats?.flaggedMessages ?? "—"} accent="amber" />
        <AdminStatCard label="Audit (24h)" value={stats?.recentAuditCount ?? "—"} hint="Admin actions logged" />
      </div>
    </div>
  );
}
