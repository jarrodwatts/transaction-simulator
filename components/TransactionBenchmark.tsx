"use client";

import { useState, useRef } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { createBenchmarkClients } from "@/lib/benchmark-clients";
import { runTransaction, TransactionOptions } from "@/lib/benchmark-runner";
import { BenchmarkResult } from "@/types/benchmark";
import { PartialResult } from "@/types/partial-result";
import { ResultCard } from "./ResultCard";
import { SettingsControlPanel } from "./PrefetchControlPanel";
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
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[280px_1fr]">
        <div className="flex flex-col gap-4 lg:sticky lg:top-6 lg:self-start">
          <div>
            <h1 className="text-base font-semibold tracking-tight text-white">
              Transaction Simulator
            </h1>
            <p className="mt-1 text-xs text-neutral-500">
              Explore the RPC calls when sending a transaction on Abstract
            </p>
          </div>

          <SettingsControlPanel
            options={options}
            onChange={setOptions}
            disabled={isRunning}
            onRun={runBenchmark}
            isRunning={isRunning || isPreparing}
            buttonLabel={buttonLabel}
          />
        </div>

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
  );
}
