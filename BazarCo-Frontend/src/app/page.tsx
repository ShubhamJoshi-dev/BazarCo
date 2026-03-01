import { BackendHealthButton } from "@/components/BackendHealthButton";
import { ComingSoonHero } from "@/components/ComingSoonHero";
import { DevAccessButton } from "@/components/DevAccessButton";
import { NotifyButton } from "@/components/NotifyButton";

export default function Home() {
  return (
    <main className="min-h-screen bg-[var(--brand-black)]">
      <BackendHealthButton />
      <NotifyButton />
      <DevAccessButton />
      <ComingSoonHero />
    </main>
  );
}
