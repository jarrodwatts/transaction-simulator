import Image from "next/image";
import Link from "next/link";

const NAV_LINKS = [
  { label: "Docs", href: "https://docs.abs.xyz" },
  { label: "GitHub", href: "https://github.com/Abstract-Foundation" },
];

export function FloatingNav() {
  return (
    <header className="fixed top-0 left-1/2 z-50 flex w-full -translate-x-1/2 justify-center px-4 pt-4">
      <div
        className="flex w-full max-w-5xl items-center justify-between rounded-2xl border border-white/[0.06] px-6 py-3 backdrop-blur-md"
        style={{
          background:
            "linear-gradient(137deg, rgba(17, 18, 20, 0.75) 5%, rgba(12, 13, 15, 0.9) 76%)",
          boxShadow:
            "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 4px 24px rgba(0, 0, 0, 0.4)",
        }}
      >
        <Link href="/" className="flex items-center gap-2.5">
          <Image
            src="/abs.png"
            alt="Abstract"
            width={22}
            height={22}
            className="opacity-90"
          />
          <span className="font-mono text-sm text-neutral-400">
            <span className="text-neutral-600">~/</span>abs
          </span>
        </Link>

        <nav className="flex items-center gap-1">
          {NAV_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="rounded-lg px-3 py-1.5 text-sm font-medium tracking-wide text-neutral-400 transition-colors hover:text-white"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <a
          href="https://x.com/abstractchain"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-2 rounded-lg bg-neutral-200 px-3 py-1.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-white"
          style={{
            boxShadow:
              "0 0 0 2px rgba(0, 0, 0, 0.5), 0 0 14px 0 rgba(255, 255, 255, 0.19), inset 0 -1px 0.4px 0 rgba(0, 0, 0, 0.2), inset 0 1px 0.4px 0 #fff",
          }}
        >
          <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
          </svg>
          Follow
        </a>
      </div>
    </header>
  );
}
