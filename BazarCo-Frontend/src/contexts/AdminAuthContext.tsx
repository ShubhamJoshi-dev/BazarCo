"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { AdminUser } from "@/types/admin";
import { adminGetMe, clearAdminToken, getAdminToken } from "@/lib/adminApi";

type AdminAuthContextValue = {
  admin: AdminUser | null;
  loading: boolean;
  setAdmin: (admin: AdminUser | null) => void;
  logout: () => void;
  refreshAdmin: () => Promise<void>;
};

const AdminAuthContext = createContext<AdminAuthContextValue | null>(null);

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [admin, setAdmin] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshAdmin = useCallback(async () => {
    const token = getAdminToken();
    if (!token) {
      setAdmin(null);
      setLoading(false);
      return;
    }
    const result = await adminGetMe();
    setAdmin(result?.admin ?? null);
    if (!result?.admin) clearAdminToken();
    setLoading(false);
  }, []);

  useEffect(() => {
    void refreshAdmin();
  }, [refreshAdmin]);

  const logout = useCallback(() => {
    clearAdminToken();
    setAdmin(null);
  }, []);

  const value = useMemo(
    () => ({ admin, loading, setAdmin, logout, refreshAdmin }),
    [admin, loading, logout, refreshAdmin]
  );

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth(): AdminAuthContextValue {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}
