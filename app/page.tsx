import { BackgroundEffects } from "@/components/BackgroundEffects";
import { TransactionBenchmark } from "@/components/TransactionBenchmark";

export default function Home() {
  return (
    <div className="min-h-screen relative">
      <BackgroundEffects />

      <main className="relative z-10 px-4">
        <TransactionBenchmark />
      </main>
    </div>
  );
}
