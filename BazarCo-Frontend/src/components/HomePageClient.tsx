"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { WelcomeHero } from "@/components/WelcomeHero";

export function HomePageClient() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.replace("/dashboard");
    }
  }, [user, loading, router]);

  if (loading || user) {
    return (
      <main className="min-h-screen bg-[var(--background)] flex items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-[var(--brand-red)]" />
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[var(--background)]">
      <WelcomeHero />
    </main>
  );
}
