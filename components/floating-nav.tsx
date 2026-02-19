import Image from "next/image";
import Link from "next/link";

export function FloatingNav() {
  return (
    <header className="animate-slide-down fixed top-0 left-1/2 z-50 flex w-full -translate-x-1/2 justify-center px-4 pt-4">
      <div
        className="glass-card flex w-full max-w-5xl items-center justify-between rounded-2xl border border-white/[0.06] px-6 py-3 backdrop-blur-md"
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/abs.png"
            alt="Abstract"
            width={22}
            height={22}
            className="opacity-90"
          />
          <span
            className="inline-block h-2 w-2 rounded-full bg-accent"
            style={{ boxShadow: "0 0 6px rgba(0, 232, 123, 0.6), 0 0 12px rgba(0, 232, 123, 0.25)" }}
          />
          <span className="text-xs text-neutral-400">
            Connected to Abstract Testnet
          </span>
        </Link>

        <a
          href="https://github.com/jarrodwatts/transaction-simulator"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-white"
          style={{
            boxShadow:
              "0 0 0 2px rgba(0, 0, 0, 0.5), 0 0 14px 0 rgba(255, 255, 255, 0.19), inset 0 -1px 0.4px 0 rgba(0, 0, 0, 0.2), inset 0 1px 0.4px 0 #fff",
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0024 12c0-6.63-5.37-12-12-12z" />
          </svg>
          View Source
        </a>
      </div>
    </header>
  );
}
