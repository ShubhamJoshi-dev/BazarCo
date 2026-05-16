"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function RedirectIfAuthed({
  children,
  redirectTo = "/dashboard",
}: {
  children: React.ReactNode;
  /** Where to send users who are already signed in (e.g. after login returnUrl). */
  redirectTo?: string;
}) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace(redirectTo);
    }
  }, [user, loading, router, redirectTo]);

  if (loading || user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--background)]">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)]" />
      </div>
    );
  }

  return <>{children}</>;
}
