"use client";

import { Fragment, useEffect, useState } from "react";

const TOTAL_BLOCKS = 12;
const BLOCK_SIZE = 8;
const ADVANCE_MS = 100;

export function BlockTimeCard() {
  const [activeIndex, setActiveIndex] = useState(7);

  useEffect(() => {
    const id = setInterval(() => {
      setActiveIndex(prev => (prev >= TOTAL_BLOCKS - 1 ? 0 : prev + 1));
    }, ADVANCE_MS);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="group relative overflow-hidden rounded-xl border border-accent/20 p-4 backdrop-blur-md">
      <div
        className="absolute inset-0 -z-10"
        style={{
          background:
            "radial-gradient(ellipse 120% 80% at 50% 120%, rgba(0, 232, 123, 0.08) 0%, transparent 70%)",
        }}
      />
      <div className="glass-card absolute inset-0 -z-20" />

      <div className="flex items-baseline gap-1">
        <span className="font-mono text-3xl font-bold tracking-tight text-accent">
          100
        </span>
        <span className="font-mono text-sm font-medium text-accent/50">
          ms
        </span>
      </div>

      <p className="mt-1 font-mono text-[11px] uppercase tracking-widest text-accent/40">
        Block times
      </p>

      <div className="mt-3 flex items-center py-1">
        {Array.from({ length: TOTAL_BLOCKS }).map((_, i) => {
          const confirmed = i < activeIndex;
          const active = i === activeIndex;

          return (
            <Fragment key={i}>
              {i > 0 && (
                <div
                  className="h-[1.5px] flex-1 transition-colors duration-300"
                  style={{
                    backgroundColor:
                      i <= activeIndex
                        ? "rgba(0, 232, 123, 0.25)"
                        : "rgba(255, 255, 255, 0.07)",
                  }}
                />
              )}
              <div
                className="shrink-0"
                style={{
                  width: BLOCK_SIZE,
                  height: BLOCK_SIZE,
                  borderRadius: 2,
                  backgroundColor: active
                    ? "#00E87B"
                    : confirmed
                      ? "rgba(0, 232, 123, 0.55)"
                      : "rgba(255, 255, 255, 0.1)",
                  boxShadow: active
                    ? "0 0 8px rgba(0, 232, 123, 0.6), 0 0 20px rgba(0, 232, 123, 0.3)"
                    : "none",
                }}
              />
            </Fragment>
          );
        })}
      </div>

      <p className="mt-3 text-[11px] text-neutral-600">
        Abstract produces blocks every 100ms, enabling near-instant
        confirmation for transactions.
      </p>
    </div>
  );
}
