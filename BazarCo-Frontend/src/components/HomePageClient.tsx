"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

export function HomePageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;
    router.replace(user ? "/dashboard" : "/dashboard/browse");
  }, [user, loading, router]);

  return (
    <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)]" />
    </main>
  );
}
