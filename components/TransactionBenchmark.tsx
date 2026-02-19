"use client";

import { useState, useRef } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { createBenchmarkClients } from "@/lib/benchmark-clients";
import { runTransaction } from "@/lib/benchmark-runner";
import { BenchmarkResult, TransactionOptions } from "@/types/benchmark";
import { PartialResult } from "@/types/partial-result";
import { ResultCard } from "./ResultCard";
import { SettingsControlPanel } from "./PrefetchControlPanel";
import { BlockTimeCard } from "./block-time-card";
import { APP_CONFIG } from "@/constants/app-config";

export function TransactionBenchmark() {
  const [isRunning, setIsRunning] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [partialResult, setPartialResult] = useState<PartialResult | null>(
    null
  );
  const [elapsedTime, setElapsedTime] = useState(0);
  const [options, setOptions] = useState<TransactionOptions>({
    nonce: false,
    gasParams: false,
    chainId: false,
    syncMode: false,
  });

  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);

  const runBenchmark = async () => {
    setIsPreparing(true);
    setIsRunning(false);
    setResult(null);
    setElapsedTime(0);

    const account = privateKeyToAccount(generatePrivateKey());
    const rpcCalls: RPCCallLog[] = [];

    let prefetchedGas = null;
    if (options.gasParams) {
      const prefetchClients = createBenchmarkClients(
        account,
        () => {},
        undefined,
        options.chainId
      );

      const [block, maxPriorityFee, gasEstimate] = await Promise.all([
        prefetchClients.publicClient.getBlock({ blockTag: "latest" }),
        prefetchClients.publicClient.request({
          method: "eth_maxPriorityFeePerGas",
        }),
        prefetchClients.publicClient.estimateGas({
          account: account.address,
          to: "0x0000000000000000000000000000000000000000",
          value: BigInt(0),
        }),
      ]);

      prefetchedGas = {
        maxFeePerGas: block.baseFeePerGas
          ? block.baseFeePerGas + BigInt(maxPriorityFee)
          : BigInt(maxPriorityFee),
        maxPriorityFeePerGas: BigInt(maxPriorityFee),
        gas: gasEstimate,
      };
    }

    const clients = createBenchmarkClients(
      account,
      (log) => {
        const pendingIndex = rpcCalls.findIndex(
          (call) =>
            call.method === log.method &&
            call.isPending &&
            call.startTime === log.startTime
        );
        if (pendingIndex >= 0) {
          rpcCalls[pendingIndex] = { ...log, isPending: false };
        } else {
          rpcCalls.push({ ...log, isPending: false });
        }
        setPartialResult((prev) =>
          prev ? { ...prev, rpcCalls: [...rpcCalls] } : null
        );
      },
      (log) => {
        rpcCalls.push({ ...log, endTime: 0, duration: 0, isPending: true });
        setPartialResult((prev) =>
          prev ? { ...prev, rpcCalls: [...rpcCalls] } : null
        );
      },
      options.chainId
    );

    let nonce = 0;
    if (!options.nonce) {
      const tempClient = createBenchmarkClients(
        account,
        () => {},
        undefined,
        options.chainId
      );
      nonce = await tempClient.publicClient.getTransactionCount({
        address: account.address,
      });
    }

    const startTime = Date.now();

    setIsPreparing(false);
    setIsRunning(true);

    setPartialResult({
      startTime,
      rpcCalls: [],
      isComplete: false,
      syncMode: options.syncMode,
    });

    timerRef.current = setInterval(() => {
      setElapsedTime(Date.now() - startTime);
    }, APP_CONFIG.TIMER_UPDATE_INTERVAL);

    const txResult = await runTransaction(
      { ...clients, account },
      nonce,
      rpcCalls,
      options,
      prefetchedGas
    );

    if (timerRef.current) clearInterval(timerRef.current);
    setElapsedTime(txResult.duration);
    setPartialResult(null);
    setResult(txResult);
    setIsRunning(false);
  };

  const buttonLabel = isPreparing
    ? "Preparing..."
    : isRunning
      ? "Sending..."
      : "Send Transaction";

  return (
    <div className="w-full pb-8">
      <div className="grid grid-cols-1 gap-5 lg:grid-cols-[300px_1fr] lg:gap-6">
        <div className="contents lg:sticky lg:top-28 lg:flex lg:flex-col lg:gap-5 lg:self-start">
          <div className="animate-enter-left" style={{ animationDelay: "0.1s" }}>
            <h1 className="text-2xl font-semibold tracking-tight text-white">
              Transaction Simulator
            </h1>
            <p className="mt-1.5 text-xs text-neutral-500">
              Explore the RPC calls when sending a transaction on Abstract
            </p>
          </div>

          <div className="animate-enter-left" style={{ animationDelay: "0.2s" }}>
            <SettingsControlPanel
              options={options}
              onChange={setOptions}
              disabled={isRunning}
              onRun={runBenchmark}
              isRunning={isRunning || isPreparing}
              buttonLabel={buttonLabel}
            />
          </div>

          <div className="order-1 animate-enter-left lg:order-none" style={{ animationDelay: "0.3s" }}>
            <BlockTimeCard />
          </div>

          <a
            href="https://docs.abs.xyz"
            target="_blank"
            rel="noopener noreferrer"
            className="group relative order-1 block animate-enter-left overflow-hidden rounded-xl border border-accent/20 p-4 backdrop-blur-md transition-colors hover:border-accent/40 lg:order-none"
            style={{ animationDelay: "0.4s" }}
          >
            <div className="absolute inset-0 -z-10 opacity-0 transition-opacity group-hover:opacity-100" style={{ background: "radial-gradient(ellipse 120% 80% at 50% 120%, rgba(0, 232, 123, 0.06) 0%, transparent 70%)" }} />
            <div className="glass-card absolute inset-0 -z-20" />
            <p className="font-mono text-[11px] uppercase tracking-widest text-accent/40">
              Start building
            </p>
            <p className="mt-1 text-sm text-neutral-300">
              Build on Abstract
              <span className="ml-1.5 inline-block transition-transform group-hover:translate-x-0.5">&rarr;</span>
            </p>
            <p className="mt-1 text-[11px] text-neutral-600">
              docs.abs.xyz
            </p>
          </a>
        </div>

        <div className="animate-enter-right" style={{ animationDelay: "0.3s" }}>
          <ResultCard
            result={result}
            isRunning={isRunning}
            isPreparing={isPreparing}
            syncMode={options.syncMode}
            partialResult={partialResult}
            elapsedTime={elapsedTime}
          />
        </div>
      </div>
    </div>
  );
}
