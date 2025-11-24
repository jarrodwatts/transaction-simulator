"use client";

import { useState, useRef } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { createBenchmarkClients } from "@/lib/benchmark-clients";
import { runTransaction, TransactionOptions } from "@/lib/benchmark-runner";
import { BenchmarkResult } from "@/types/benchmark";
import { PartialResult } from "@/types/partial-result";
import { ResultCard } from "./ResultCard";
import { ShimmerButton } from "./ui/shimmer-button";
import { SettingsControlPanel } from "./PrefetchControlPanel";
import { APP_CONFIG } from "@/constants/app-config";

export function TransactionBenchmark() {
  const [isRunning, setIsRunning] = useState(false);
  const [isPreparing, setIsPreparing] = useState(false);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [partialResult, setPartialResult] = useState<PartialResult | null>(null);
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

    // Generate a fresh account for the transaction
    const account = privateKeyToAccount(generatePrivateKey());

    // Create RPC call log array
    const rpcCalls: RPCCallLog[] = [];

    // Pre-fetch gas parameters if enabled (before creating transaction clients)
    let prefetchedGas = null;
    if (options.gasParams) {
      // Create a temporary client just for pre-fetching (doesn't log to RPC arrays)
      const prefetchClients = createBenchmarkClients(
        account, 
        () => {}, // Empty logger - don't track these calls
        undefined,
        options.chainId
      );
      
      const [block, maxPriorityFee, gasEstimate] = await Promise.all([
        prefetchClients.publicClient.getBlock({ blockTag: 'latest' }),
        prefetchClients.publicClient.request({ method: 'eth_maxPriorityFeePerGas' }),
        prefetchClients.publicClient.estimateGas({
          account: account.address,
          to: "0x0000000000000000000000000000000000000000",
          value: BigInt(0),
        }),
      ]);
      
      prefetchedGas = {
        maxFeePerGas: block.baseFeePerGas ? block.baseFeePerGas + BigInt(maxPriorityFee) : BigInt(maxPriorityFee),
        maxPriorityFeePerGas: BigInt(maxPriorityFee),
        gas: gasEstimate,
      };
    }

    // Create clients for the transaction
    const clients = createBenchmarkClients(
      account, 
      (log) => {
        // When a call completes, find and update the pending entry or add if not found
        const pendingIndex = rpcCalls.findIndex(
          call => call.method === log.method && call.isPending && call.startTime === log.startTime
        );
        if (pendingIndex >= 0) {
          rpcCalls[pendingIndex] = { ...log, isPending: false };
        } else {
          rpcCalls.push({ ...log, isPending: false });
        }
        setPartialResult(prev => prev ? { ...prev, rpcCalls: [...rpcCalls] } : null);
      },
      (log) => {
        // When a call starts, add it as pending
        rpcCalls.push({ ...log, endTime: 0, duration: 0, isPending: true });
        setPartialResult(prev => prev ? { ...prev, rpcCalls: [...rpcCalls] } : null);
      },
      options.chainId
    );

    // Get starting nonce (only if pre-fetch is disabled)
    // When prefetch is enabled, we use nonce 0 since these are fresh accounts
    let nonce = 0;
    
    if (!options.nonce) {
      // Fetch nonce from the network using temporary client that doesn't log
      const tempClient = createBenchmarkClients(
        account,
        () => {}, // Don't log these setup calls
        undefined,
        options.chainId
      );
      
      nonce = await tempClient.publicClient.getTransactionCount({
        address: account.address,
      });
    }

    // NOW start the timer and partial result - right before transaction begins
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

    // Run the transaction
    const txResult = await runTransaction(
      { ...clients, account },
      nonce,
      rpcCalls,
      options,
      prefetchedGas
    );

    // Stop timer and set final result
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsedTime(txResult.duration);
    setPartialResult(null);
    setResult(txResult);
    setIsRunning(false);
  };

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center gap-8">
        <SettingsControlPanel
          options={options}
          onChange={setOptions}
          disabled={isRunning}
        />
        
        <ResultCard 
          result={result} 
          isRunning={isRunning}
          isPreparing={isPreparing}
          syncMode={options.syncMode}
          partialResult={partialResult}
          elapsedTime={elapsedTime}
        />

        <ShimmerButton
          onClick={runBenchmark}
          disabled={isRunning || isPreparing}
          shimmerColor="#10b981"
          shimmerSize="0.1em"
          shimmerDuration="2s"
          borderRadius="0.75rem"
          background="linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)"
          className="w-full px-8 py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] transition-shadow"
        >
          {isPreparing ? "Preparing..." : isRunning ? "Sending Transaction..." : "Send Transaction"}
        </ShimmerButton>
      </div>
    </div>
  );
}
