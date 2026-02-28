import { BackendHealthButton } from "@/components/BackendHealthButton";
import { ComingSoonHero } from "@/components/ComingSoonHero";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--brand-black)]">
      <BackendHealthButton />
      <ComingSoonHero />
    </main>
  );
}
