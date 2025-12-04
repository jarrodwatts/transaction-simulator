import { Chain, WalletClient } from "viem";
import { BenchmarkResult } from "@/types/benchmark";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { BenchmarkPublicClient } from "./benchmark-clients";

/**
 * Configuration for transaction parameters (for connected wallet mode)
 */
export interface TransactionOptions {
  /** Whether to use sync mode (eth_sendRawTransactionSync) - currently not supported with connected wallets */
  syncMode: boolean;
}

/**
 * Connected wallet transaction context
 */
export interface ConnectedWalletContext {
  walletClient: WalletClient;
  publicClient: BenchmarkPublicClient;
  address: `0x${string}`;
}

/**
 * Callback to notify when user has confirmed the transaction in their wallet
 */
export type OnTransactionSubmitted = (startTime: number) => void;

/**
 * Runs a transaction with a connected wallet (user signs via wallet popup)
 *
 * Note: Most wallets (MetaMask, etc.) don't support eth_signTransaction separately.
 * They only support eth_sendTransaction which signs AND sends atomically.
 *
 * This means we can't capture eth_sendRawTransaction timing - the wallet handles
 * the send internally. We CAN capture:
 * - eth_getTransactionReceipt (polling for confirmation)
 *
 * The timer starts AFTER the wallet returns the tx hash (user confirmed + sent).
 */
export async function runConnectedWalletTransaction(
  context: ConnectedWalletContext,
  chain: Chain,
  rpcCalls: RPCCallLog[],
  onTransactionSubmitted?: OnTransactionSubmitted
): Promise<BenchmarkResult> {
  const modeLabel = "CONNECTED";
  const chainName = chain.name;

  try {
    // Build transaction params - send to self instead of zero address
    // This avoids MetaMask's "burn address" warning
    const txParams: any = {
      to: context.address, // Self-transfer
      value: BigInt(0),
      account: context.address,
      chain,
    };

    // Send transaction via connected wallet
    // The wallet will prompt the user to confirm, sign, AND send
    // We DON'T start timing until AFTER this returns (tx is in mempool)
    console.log(`⏱️  [${chainName}] [${modeLabel}] Waiting for user to confirm in wallet...`);
    const hash = await context.walletClient.sendTransaction(txParams);

    // NOW start the timer - transaction has been sent to the network
    const startTime = Date.now();
    console.log(`⏱️  [${chainName}] [${modeLabel}] Transaction sent! Timer started at:`, startTime);
    console.log(`⏱️  [${chainName}] [${modeLabel}] Transaction hash:`, hash);

    // Notify that transaction was submitted (for UI to start timer)
    if (onTransactionSubmitted) {
      onTransactionSubmitted(startTime);
    }

    // Wait for receipt through our instrumented client
    // This captures eth_getTransactionReceipt timing (the confirmation latency)
    const waitStartTime = Date.now();
    await context.publicClient.waitForTransactionReceipt({ hash });
    const waitEndTime = Date.now();
    console.log(
      `⏱️  [${chainName}] [${modeLabel}] waitForTransactionReceipt completed in:`,
      waitEndTime - waitStartTime,
      "ms"
    );

    const endTime = Date.now();
    console.log(`⏱️  [${chainName}] [${modeLabel}] Total confirmation time:`, endTime - startTime, "ms");

    return {
      startTime,
      endTime,
      duration: endTime - startTime,
      txHash: hash,
      status: "success",
      rpcCalls,
      syncMode: false, // Connected wallet mode doesn't support sync
    };
  } catch (error) {
    const endTime = Date.now();
    console.error(`⏱️  [${chainName}] [${modeLabel}] Transaction failed:`, error);
    return {
      startTime: endTime, // If we never started, use end time
      endTime,
      duration: 0,
      txHash: "",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      rpcCalls,
      syncMode: false,
    };
  }
}
