export function BackgroundEffects() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10" aria-hidden="true">
      <div
        className="absolute inset-0"
        style={{
          background: [
            "radial-gradient(ellipse 80% 60% at 20% 20%, oklch(0.14 0.01 30) 0%, transparent 70%)",
            "radial-gradient(ellipse 60% 80% at 80% 80%, oklch(0.12 0.008 30) 0%, transparent 65%)",
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
        className="absolute inset-0 opacity-[0.045]"
        style={{ filter: "url(#grain)", mixBlendMode: "overlay" }}
      />
    </div>
  );
}
