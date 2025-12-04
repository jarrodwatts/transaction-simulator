"use client";

import { useState, useRef } from "react";
import { Chain } from "viem";
import { useAccount, useWalletClient, useSwitchChain } from "wagmi";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { createInstrumentedPublicClient } from "@/lib/benchmark-clients";
import { runConnectedWalletTransaction, ConnectedWalletContext } from "@/lib/benchmark-runner";
import { BenchmarkResult } from "@/types/benchmark";
import { PartialResult } from "@/types/partial-result";
import { ResultCard } from "./ResultCard";
import { SettingsControlPanel } from "./PrefetchControlPanel";
import { APP_CONFIG } from "@/constants/app-config";
import { DEFAULT_CHAIN, getChainUI } from "@/config/chains";
import { ConnectButton } from "@rainbow-me/rainbowkit";

export function TransactionBenchmark() {
  const [selectedChain, setSelectedChain] = useState<Chain>(DEFAULT_CHAIN);
  const [isRunning, setIsRunning] = useState(false);
  const [isWaitingForWallet, setIsWaitingForWallet] = useState(false);
  const [result, setResult] = useState<BenchmarkResult | null>(null);
  const [partialResult, setPartialResult] = useState<PartialResult | null>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  const timerRef = useRef<NodeJS.Timeout | undefined>(undefined);
  const startTimeRef = useRef<number>(0);

  // Wagmi hooks for wallet connection
  const { address, isConnected } = useAccount();
  const { data: walletClient } = useWalletClient();
  const { switchChainAsync } = useSwitchChain();

  const ui = getChainUI(selectedChain.id);

  // Clear results when switching chains, and switch wallet chain if connected
  const handleChainChange = async (chain: Chain) => {
    setSelectedChain(chain);
    setResult(null);
    setPartialResult(null);
    setElapsedTime(0);

    // If wallet is connected, switch to the new chain
    if (isConnected) {
      try {
        await switchChainAsync({ chainId: chain.id });
      } catch (error) {
        // User might reject the switch, that's okay
        console.log("Chain switch cancelled or failed:", error);
      }
    }
  };

  // User must be connected to run a transaction
  const canRunTransaction = isConnected;

  const runBenchmark = async () => {
    if (!canRunTransaction || !walletClient || !address) return;

    setIsRunning(false);
    setResult(null);
    setElapsedTime(0);

    // Create RPC call log array
    const rpcCalls: RPCCallLog[] = [];

    // Create instrumented public client for monitoring confirmation RPC calls
    const publicClient = createInstrumentedPublicClient(
      selectedChain,
      (log) => {
        const pendingIndex = rpcCalls.findIndex(
          (call) => call.method === log.method && call.isPending && call.startTime === log.startTime
        );
        if (pendingIndex >= 0) {
          rpcCalls[pendingIndex] = { ...log, isPending: false };
        } else {
          rpcCalls.push({ ...log, isPending: false });
        }
        setPartialResult((prev) => (prev ? { ...prev, rpcCalls: [...rpcCalls] } : null));
      },
      (log) => {
        rpcCalls.push({ ...log, endTime: 0, duration: 0, isPending: true });
        setPartialResult((prev) => (prev ? { ...prev, rpcCalls: [...rpcCalls] } : null));
      }
    );

    // Show "waiting for wallet" state immediately
    setIsWaitingForWallet(true);

    // Create context for connected wallet transaction
    const context: ConnectedWalletContext = {
      walletClient,
      publicClient,
      address,
    };

    // Run the transaction - timer starts AFTER user confirms in wallet
    const txResult = await runConnectedWalletTransaction(
      context,
      selectedChain,
      rpcCalls,
      // Callback when user confirms in wallet - NOW start the timer
      (startTime: number) => {
        startTimeRef.current = startTime;
        setIsWaitingForWallet(false);
        setIsRunning(true);

        setPartialResult({
          startTime,
          rpcCalls: [],
          isComplete: false,
          syncMode: false,
        });

        timerRef.current = setInterval(() => {
          setElapsedTime(Date.now() - startTimeRef.current);
        }, APP_CONFIG.TIMER_UPDATE_INTERVAL);
      }
    );

    // Stop timer and set final result
    if (timerRef.current) clearInterval(timerRef.current);
    setElapsedTime(txResult.duration);
    setPartialResult(null);
    setResult(txResult);
    setIsRunning(false);
    setIsWaitingForWallet(false);
  };

  // Determine button state
  const buttonDisabled = isRunning || isWaitingForWallet || !canRunTransaction;
  const buttonText = isWaitingForWallet
    ? "Confirm in Wallet..."
    : isRunning
      ? "Sending Transaction..."
      : !canRunTransaction
        ? "Connect Wallet to Continue"
        : "Send Transaction";

  return (
    <div className="w-full max-w-3xl mx-auto px-4 py-8">
      <div className="flex flex-col items-center gap-6">
        <ConnectButton.Custom>
          {({ openConnectModal, openAccountModal }) => (
            <SettingsControlPanel
              disabled={isRunning}
              selectedChain={selectedChain}
              onChainChange={handleChainChange}
              isWalletConnected={isConnected}
              walletAddress={address}
              onConnectWallet={openConnectModal}
              onManageWallet={openAccountModal}
              onSendTransaction={runBenchmark}
              canSendTransaction={canRunTransaction}
              buttonText={buttonText}
              isLoading={isRunning || isWaitingForWallet}
            />
          )}
        </ConnectButton.Custom>

        <ResultCard
          result={result}
          isRunning={isRunning}
          isPreparing={false}
          isWaitingForWallet={isWaitingForWallet}
          isConnectedWallet={true}
          syncMode={false}
          partialResult={partialResult}
          elapsedTime={elapsedTime}
          chain={selectedChain}
        />
      </div>
    </div>
  );
}
