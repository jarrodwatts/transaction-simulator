import { memo, useMemo } from "react";
import { BenchmarkResult } from "@/types/benchmark";
import { PartialResult } from "@/types/partial-result";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { useAnimatedCounter } from "@/hooks/use-animated-counter";
import { truncateHash } from "@/lib/format-utils";
import { getMockCalls } from "@/constants/mock-data";
import { APP_CONFIG } from "@/constants/app-config";

interface ResultCardProps {
  result: BenchmarkResult | null;
  isRunning: boolean;
  isPreparing?: boolean;
  syncMode: boolean;
  partialResult?: PartialResult | null;
  elapsedTime?: number;
}

const WaterfallBar = memo(function WaterfallBar({
  duration,
  maxDuration,
  isPending,
  isLive,
}: {
  duration: number;
  maxDuration: number;
  isPending: boolean;
  isLive: boolean;
}) {
  const widthPercent = maxDuration > 0 ? (duration / maxDuration) * 100 : 0;
  const minWidth = 4;
  const displayWidth = Math.max(widthPercent, minWidth);

  if (isPending) {
    return (
      <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.03]">
        <div className="shimmer-bar h-full w-full rounded-full" />
      </div>
    );
  }

  return (
    <div className="h-[3px] w-full overflow-hidden rounded-full bg-white/[0.03]">
      <div
        className="h-full rounded-full"
        style={{
          width: `${displayWidth}%`,
          background: isLive
            ? "linear-gradient(90deg, #00E87B, #00E87B88)"
            : "linear-gradient(90deg, rgba(255,255,255,0.2), rgba(255,255,255,0.08))",
          transition: "width 0.8s cubic-bezier(0.16, 1, 0.3, 1)",
        }}
      />
    </div>
  );
});

const RPCCallRow = memo(function RPCCallRow({
  call,
  showMockData,
  isLiveRunning,
  index,
  maxDuration,
}: {
  call: RPCCallLog;
  showMockData: boolean;
  isLiveRunning: boolean;
  index: number;
  maxDuration: number;
}) {
  const animatedDuration = useAnimatedCounter(
    call.duration,
    APP_CONFIG.COUNTER_ANIMATION_DURATION
  );
  const isPending = call.isPending === true;

  return (
    <div
      className={`flex flex-col gap-1.5 py-[7px] ${
        showMockData ? "opacity-20" : ""
      }`}
      style={
        !showMockData && isLiveRunning
          ? { animation: `fade-in-up 0.3s ease ${index * 0.05}s both` }
          : undefined
      }
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className="font-mono text-[11px] tabular-nums text-accent/40">
            {String(index + 1).padStart(2, "0")}
          </span>
          <span
            className={`font-mono text-xs ${
              isPending ? "text-amber-400" : "text-neutral-300"
            }`}
          >
            {call.method}
          </span>
        </div>
        <span
          className={`min-w-[50px] text-right font-mono text-xs tabular-nums ${
            isPending
              ? "animate-pulse text-amber-400"
              : isLiveRunning
                ? "text-accent"
                : "text-neutral-500"
          }`}
        >
          {showMockData ? "" : isPending ? "..." : `${animatedDuration}ms`}
        </span>
      </div>
      {!showMockData && (
        <WaterfallBar
          duration={call.duration}
          maxDuration={maxDuration}
          isPending={isPending}
          isLive={isLiveRunning}
        />
      )}
    </div>
  );
});

export function ResultCard({
  result,
  isRunning,
  isPreparing = false,
  syncMode,
  partialResult,
  elapsedTime = 0,
}: ResultCardProps) {
  const subtitle = syncMode
    ? "eth_sendRawTransactionSync"
    : "sendTransaction + waitForTransactionReceipt";

  const isLiveRunning = isRunning && partialResult;
  const displayCalls =
    result?.rpcCalls || partialResult?.rpcCalls || getMockCalls(syncMode);
  const showMockData = !result && !isRunning && !partialResult && !isPreparing;
  const displayElapsedTime = isLiveRunning ? elapsedTime : result?.duration;

  const maxDuration = useMemo(
    () => Math.max(...displayCalls.map((c) => c.duration), 1),
    [displayCalls]
  );

  const animatedDuration = useAnimatedCounter(
    displayElapsedTime || 0,
    APP_CONFIG.COUNTER_ANIMATION_DURATION
  );

  return (
    <div
      className="glass-card flex min-h-[calc(100vh-10rem)] w-full flex-col rounded-xl border border-white/[0.06] backdrop-blur-md"
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-accent/60">
            Result
          </h3>
          <span className="font-mono text-[11px] text-neutral-600">
            {subtitle}
          </span>
        </div>

        {isPreparing && (
          <span className="flex items-center gap-1.5 rounded-md bg-white/[0.04] px-2 py-0.5 font-mono text-[11px] text-neutral-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-neutral-400" />
            Preparing
          </span>
        )}
        {result && (
          <span
            className={`rounded-md px-2 py-0.5 font-mono text-[11px] ${
              result.status === "success"
                ? "bg-accent/10 text-accent"
                : "bg-red-500/10 text-red-400"
            }`}
          >
            {result.status === "success" ? "Success" : "Error"}
          </span>
        )}
        {isLiveRunning && (
          <span className="flex items-center gap-1.5 rounded-md bg-amber-500/10 px-2 py-0.5 font-mono text-[11px] text-amber-400">
            <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
            Live
          </span>
        )}
      </div>

      {isPreparing && (
        <div className="flex flex-1 items-center justify-center py-16">
          <p className="animate-pulse font-mono text-xs text-neutral-500">
            Setting up wallet and fetching parameters...
          </p>
        </div>
      )}

      {!isPreparing && (result || showMockData || isLiveRunning) && (
        <>
          {showMockData || result?.status === "success" || isLiveRunning ? (
            <div className="flex flex-1 flex-col">
              <div className="flex items-baseline gap-3 border-b border-white/[0.06] px-5 py-4">
                {showMockData ? (
                  <span className="font-mono text-3xl font-bold text-neutral-700">
                    &mdash;
                  </span>
                ) : (
                  <>
                    <p
                      className={`font-mono text-3xl font-bold tabular-nums ${
                        isLiveRunning ? "text-amber-400" : "text-white"
                      }`}
                    >
                      {animatedDuration}
                    </p>
                    <span className="text-sm text-neutral-600">ms</span>
                    {result && (
                      <span className="ml-auto font-mono text-xs text-neutral-500">
                        {displayCalls.length} calls
                      </span>
                    )}
                  </>
                )}
              </div>

              <div className="px-5 py-2">
                <div className="mb-1 flex items-center justify-between py-1">
                  <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-600">
                    RPC Calls
                  </span>
                  <span className="font-mono text-[11px] uppercase tracking-widest text-neutral-600">
                    Duration
                  </span>
                </div>
                <div className="divide-y divide-white/[0.03]">
                  {displayCalls.map((call, index) => (
                    <RPCCallRow
                      key={`${call.method}-${index}`}
                      call={call}
                      showMockData={showMockData}
                      isLiveRunning={!!isLiveRunning}
                      index={index}
                      maxDuration={maxDuration}
                    />
                  ))}
                </div>
              </div>

              {showMockData && (
                <div className="flex flex-1 items-end justify-center px-5 pb-6 pt-4">
                  <p className="font-mono text-[11px] text-neutral-600">
                    Run a transaction to see the RPC trace
                  </p>
                </div>
              )}

              {!showMockData && result && (
                <div className="mt-auto flex items-center gap-2 border-t border-white/[0.06] px-5 py-3">
                  <span className="text-xs text-neutral-500">Tx Hash</span>
                  <a
                    href={`${APP_CONFIG.BLOCK_EXPLORER_URL}/tx/${result.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-neutral-400 transition-colors hover:text-accent"
                  >
                    {truncateHash(result.txHash)} ↗
                  </a>
                </div>
              )}
            </div>
          ) : result?.status === "error" ? (
            <div className="px-5 py-4">
              <p className="mb-1 text-xs text-neutral-500">Error</p>
              <p className="break-words text-sm text-red-400">
                {result.error}
              </p>
            </div>
          ) : null}
        </>
      )}
    </div>
  );
}
