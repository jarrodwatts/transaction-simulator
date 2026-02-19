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

function RPCCallRow({
  call,
  showMockData,
  isLiveRunning,
  index,
}: {
  call: RPCCallLog;
  showMockData: boolean;
  isLiveRunning: boolean;
  index: number;
}) {
  const animatedDuration = useAnimatedCounter(
    call.duration,
    APP_CONFIG.COUNTER_ANIMATION_DURATION
  );
  const isPending = call.isPending === true;

  return (
    <div
      className={`flex items-center justify-between py-[5px] ${
        showMockData ? "opacity-30" : ""
      }`}
      style={
        !showMockData && isLiveRunning
          ? { animation: `fade-in-up 0.3s ease ${index * 0.05}s both` }
          : undefined
      }
    >
      <div className="flex items-center gap-2">
        <span className="font-mono text-[11px] tabular-nums text-neutral-600">
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
              ? "text-emerald-400"
              : "text-neutral-500"
        }`}
      >
        {showMockData ? "" : isPending ? "..." : `${animatedDuration}ms`}
      </span>
    </div>
  );
}

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

  const animatedDuration = useAnimatedCounter(
    displayElapsedTime || 0,
    APP_CONFIG.COUNTER_ANIMATION_DURATION
  );

  return (
    <div
      className="flex w-full flex-col rounded-xl border border-white/[0.06] backdrop-blur-md"
      style={{
        background:
          "linear-gradient(137deg, rgba(17, 18, 20, 0.75) 5%, rgba(12, 13, 15, 0.9) 76%)",
        boxShadow:
          "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 4px 24px rgba(0, 0, 0, 0.4)",
      }}
    >
      <div className="flex items-center justify-between border-b border-white/[0.06] px-5 py-3">
        <div className="flex items-center gap-3">
          <h3 className="font-mono text-[11px] uppercase tracking-widest text-neutral-500">
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
                ? "bg-emerald-500/10 text-emerald-400"
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
            <div className="flex flex-col">
              <div className="flex items-baseline gap-3 border-b border-white/[0.06] px-5 py-4">
                <p
                  className={`font-mono text-3xl font-bold tabular-nums ${
                    showMockData
                      ? "text-neutral-700"
                      : isLiveRunning
                        ? "text-amber-400"
                        : "text-white"
                  }`}
                >
                  {showMockData ? "--" : animatedDuration}
                </p>
                <span className="text-sm text-neutral-600">ms</span>
                {!showMockData && result && (
                  <span className="ml-auto font-mono text-xs text-neutral-500">
                    {displayCalls.length} calls
                  </span>
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
                    />
                  ))}
                </div>
              </div>

              {!showMockData && result && (
                <div className="flex items-center gap-2 border-t border-white/[0.06] px-5 py-3">
                  <span className="text-xs text-neutral-500">Tx Hash</span>
                  <a
                    href={`${APP_CONFIG.BLOCK_EXPLORER_URL}/tx/${result.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="font-mono text-xs text-neutral-400 transition-colors hover:text-white"
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
