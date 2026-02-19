export function BackgroundEffects() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <div className="dot-grid absolute inset-0" />

      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 80% 50% at 50% 0%, rgba(0, 232, 123, 0.04) 0%, transparent 60%)",
            "radial-gradient(ellipse 60% 60% at 20% 30%, oklch(0.16 0.015 160) 0%, transparent 70%)",
            "radial-gradient(ellipse 50% 70% at 80% 70%, oklch(0.13 0.01 30) 0%, transparent 65%)",
          ].join(", "),
        }}
      />

      <svg className="absolute inset-0 size-0">
        <filter id="grain">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.65"
            numOctaves="3"
            stitchTiles="stitch"
          />
        </filter>
      </svg>
      <div
        className="absolute inset-0 opacity-[0.05]"
        style={{ filter: "url(#grain)", mixBlendMode: "overlay" }}
      />
    </div>
  );
}
