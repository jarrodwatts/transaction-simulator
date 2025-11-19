"use client";

import { useState, useEffect, useRef } from "react";
import { generatePrivateKey, privateKeyToAccount } from "viem/accounts";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { createBenchmarkClients } from "@/lib/benchmark-clients";
import { runAsyncTransaction, runSyncTransaction } from "@/lib/benchmark-runner";
import { BenchmarkResult } from "@/types/benchmark";
import { ResultCard } from "./ResultCard";
import { ShimmerButton } from "./ui/shimmer-button";

// Partial result that updates in real-time
interface PartialResult {
  type: "async" | "sync";
  startTime: number;
  rpcCalls: RPCCallLog[];
  isComplete: boolean;
}

export function TransactionBenchmark() {
  const [isRunning, setIsRunning] = useState(false);
  const [asyncResult, setAsyncResult] = useState<BenchmarkResult | null>(null);
  const [syncResult, setSyncResult] = useState<BenchmarkResult | null>(null);
  const [asyncPartial, setAsyncPartial] = useState<PartialResult | null>(null);
  const [syncPartial, setSyncPartial] = useState<PartialResult | null>(null);
  const [asyncElapsed, setAsyncElapsed] = useState(0);
  const [syncElapsed, setSyncElapsed] = useState(0);
  
  const asyncTimerRef = useRef<NodeJS.Timeout>();
  const syncTimerRef = useRef<NodeJS.Timeout>();

  const runBenchmark = async () => {
    setIsRunning(true);
    setAsyncResult(null);
    setSyncResult(null);
    setAsyncElapsed(0);
    setSyncElapsed(0);

    // Generate two separate accounts for a fair parallel benchmark
    const asyncAccount = privateKeyToAccount(generatePrivateKey());
    const syncAccount = privateKeyToAccount(generatePrivateKey());

    // Create separate RPC call logs for each transaction type
    const asyncRPCCalls: RPCCallLog[] = [];
    const syncRPCCalls: RPCCallLog[] = [];
    
    const asyncStartTime = Date.now();
    const syncStartTime = Date.now();

    // Initialize partial results
    setAsyncPartial({
      type: "async",
      startTime: asyncStartTime,
      rpcCalls: [],
      isComplete: false,
    });
    setSyncPartial({
      type: "sync",
      startTime: syncStartTime,
      rpcCalls: [],
      isComplete: false,
    });

    // Start timers for elapsed time
    asyncTimerRef.current = setInterval(() => {
      setAsyncElapsed(Date.now() - asyncStartTime);
    }, 50);
    
    syncTimerRef.current = setInterval(() => {
      setSyncElapsed(Date.now() - syncStartTime);
    }, 50);

    // Create clients for async transaction with its own account
    const asyncClients = createBenchmarkClients(asyncAccount, (log) => {
      asyncRPCCalls.push(log);
      setAsyncPartial(prev => prev ? { ...prev, rpcCalls: [...asyncRPCCalls] } : null);
    });
    
    // Create clients for sync transaction with its own account
    const syncClients = createBenchmarkClients(syncAccount, (log) => {
      syncRPCCalls.push(log);
      setSyncPartial(prev => prev ? { ...prev, rpcCalls: [...syncRPCCalls] } : null);
    });

    // Get starting nonces for each account independently
    const [asyncNonce, syncNonce] = await Promise.all([
      asyncClients.publicClient.getTransactionCount({
        address: asyncAccount.address,
      }),
      syncClients.publicClient.getTransactionCount({
        address: syncAccount.address,
      }),
    ]);

    // Run both transactions in parallel with no dependencies
    // Track completion time for each individually and stop their timers
    const asyncPromise = runAsyncTransaction(
      { ...asyncClients, account: asyncAccount },
      asyncNonce,
      asyncRPCCalls
    ).then(res => {
      const duration = Date.now() - asyncStartTime;
      const finalResult = { ...res, duration };
      // Stop async timer and set result immediately when this transaction completes
      if (asyncTimerRef.current) clearInterval(asyncTimerRef.current);
      setAsyncElapsed(duration);
      setAsyncPartial(null);
      setAsyncResult(finalResult); // Set result immediately!
      return finalResult;
    });

    const syncPromise = runSyncTransaction(
      { ...syncClients, account: syncAccount },
      syncNonce,
      syncRPCCalls
    ).then(res => {
      const duration = Date.now() - syncStartTime;
      const finalResult = { ...res, duration };
      // Stop sync timer and set result immediately when this transaction completes
      if (syncTimerRef.current) clearInterval(syncTimerRef.current);
      setSyncElapsed(duration);
      setSyncPartial(null);
      setSyncResult(finalResult); // Set result immediately!
      return finalResult;
    });

    // Wait for both to complete
    await Promise.all([asyncPromise, syncPromise]);

    // Both are done, no longer running
    setIsRunning(false);
  };

  return (
    <div className="w-full max-w-6xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center gap-8">
        <div className="grid md:grid-cols-2 gap-6 w-full">
          <ResultCard 
            result={asyncResult} 
            isRunning={isRunning} 
            type="async"
            partialResult={asyncPartial}
            elapsedTime={asyncElapsed}
          />
          <ResultCard 
            result={syncResult} 
            isRunning={isRunning} 
            type="sync"
            partialResult={syncPartial}
            elapsedTime={syncElapsed}
          />
        </div>

        <ShimmerButton
          onClick={runBenchmark}
          disabled={isRunning}
          shimmerColor="#10b981"
          shimmerSize="0.1em"
          shimmerDuration="2s"
          borderRadius="0.75rem"
          background="linear-gradient(135deg, #059669 0%, #10b981 50%, #34d399 100%)"
          className="w-full px-8 py-3 text-base font-bold disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_40px_rgba(16,185,129,0.3)] hover:shadow-[0_0_60px_rgba(16,185,129,0.5)] transition-shadow"
        >
          {isRunning ? "Running Benchmark..." : "Run Benchmark"}
        </ShimmerButton>
      </div>
    </div>
  );
}
