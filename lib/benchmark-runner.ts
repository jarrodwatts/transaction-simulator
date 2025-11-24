import { zeroAddress } from "viem";
import { abstractTestnet } from "viem/chains";
import { paymasterConfig } from "@/config/paymaster-config";
import { BenchmarkResult } from "@/types/benchmark";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { TransactionClientsWithAccount, TransactionParams } from "@/types/client-types";

/**
 * Configuration for transaction parameters
 */
export interface TransactionOptions {
  /** Whether to pre-fetch the nonce */
  nonce: boolean;
  /** Whether to pre-fetch gas parameters (maxFeePerGas, maxPriorityFeePerGas, gas) */
  gasParams: boolean;
  /** Whether to pre-fetch the chain ID */
  chainId: boolean;
  /** Whether to use sync mode (eth_sendRawTransactionSync) */
  syncMode: boolean;
}

/**
 * Pre-fetched gas parameters for transactions
 */
export interface PrefetchedGas {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gas: bigint;
}

/**
 * Runs a transaction with the given options
 * 
 * @param clients - Wallet and public clients with account
 * @param nonce - Starting nonce for the transaction
 * @param rpcCalls - Array to collect RPC call logs
 * @param options - Configuration for transaction parameters
 * @param prefetchedGas - Pre-fetched gas parameters if available
 * @returns Benchmark result with timing and RPC call data
 */
export async function runTransaction(
  clients: TransactionClientsWithAccount,
  nonce: number,
  rpcCalls: RPCCallLog[],
  options: TransactionOptions,
  prefetchedGas: PrefetchedGas | null = null
): Promise<BenchmarkResult> {
  const startTime = Date.now();
  const modeLabel = options.syncMode ? "SYNC" : "ASYNC";
  console.log(`⏱️  [${modeLabel}] Transaction started at:`, startTime);
  
  try {
    const paramsStartTime = Date.now();
    const txParams: TransactionParams = {
      to: zeroAddress,
      value: BigInt(0),
      ...paymasterConfig,
    };

    // Add pre-fetched nonce if enabled
    if (options.nonce) {
      txParams.nonce = nonce;
    }

    // Add pre-fetched gas parameters if enabled
    if (options.gasParams && prefetchedGas) {
      txParams.maxFeePerGas = prefetchedGas.maxFeePerGas;
      txParams.maxPriorityFeePerGas = prefetchedGas.maxPriorityFeePerGas;
      txParams.gas = prefetchedGas.gas;
    }
    const paramsEndTime = Date.now();
    console.log(`⏱️  [${modeLabel}] Params prepared in:`, paramsEndTime - paramsStartTime, "ms");

    let hash: string;

    if (options.syncMode) {
      // SYNC MODE: Use eth_sendRawTransactionSync
      const prepareStartTime = Date.now();
      const request = await clients.walletClient.prepareTransactionRequest(txParams);
      const prepareEndTime = Date.now();
      console.log(`⏱️  [${modeLabel}] prepareTransactionRequest completed in:`, prepareEndTime - prepareStartTime, "ms");

      const signStartTime = Date.now();
      const serializedTransaction = await clients.walletClient.signTransaction(request);
      const signEndTime = Date.now();
      console.log(`⏱️  [${modeLabel}] Transaction signed in:`, signEndTime - signStartTime, "ms");
      
      const sendStartTime = Date.now();
      const receipt = await clients.publicClient.sendRawTransactionSync({
        serializedTransaction,
      });
      const sendEndTime = Date.now();
      console.log(`⏱️  [${modeLabel}] sendRawTransactionSync completed in:`, sendEndTime - sendStartTime, "ms");
      console.log(`⏱️  [${modeLabel}] Transaction hash:`, receipt.transactionHash);

      hash = receipt.transactionHash;
    } else {
      // ASYNC MODE: Use sendTransaction + waitForTransactionReceipt
      // When all params are prefetched, skip prepareTransactionRequest to avoid re-estimation
      if (options.nonce && options.gasParams && options.chainId && prefetchedGas) {
        const requestStartTime = Date.now();
        // Add account and chain directly since we're skipping prepare
        const requestToSign = {
          ...txParams,
          from: clients.account.address,
          chainId: abstractTestnet.id,
        };
        const requestEndTime = Date.now();
        console.log(`⏱️  [${modeLabel}] Request prepared in:`, requestEndTime - requestStartTime, "ms");
        
        const signStartTime = Date.now();
        const serializedTransaction = await clients.walletClient.signTransaction(requestToSign);
        const signEndTime = Date.now();
        console.log(`⏱️  [${modeLabel}] Transaction signed in:`, signEndTime - signStartTime, "ms");
        
        const sendStartTime = Date.now();
        hash = await clients.publicClient.sendRawTransaction({ serializedTransaction });
        const sendEndTime = Date.now();
        console.log(`⏱️  [${modeLabel}] sendRawTransaction completed in:`, sendEndTime - sendStartTime, "ms");
        console.log(`⏱️  [${modeLabel}] Transaction hash:`, hash);
      } else {
        // Use normal flow when some params aren't prefetched
        const sendTxStartTime = Date.now();
        hash = await clients.walletClient.sendTransaction(txParams);
        const sendTxEndTime = Date.now();
        console.log(`⏱️  [${modeLabel}] sendTransaction completed in:`, sendTxEndTime - sendTxStartTime, "ms");
        console.log(`⏱️  [${modeLabel}] Transaction hash:`, hash);
      }

      const waitStartTime = Date.now();
      await clients.publicClient.waitForTransactionReceipt({ hash });
      const waitEndTime = Date.now();
      console.log(`⏱️  [${modeLabel}] waitForTransactionReceipt completed in:`, waitEndTime - waitStartTime, "ms");
    }

    const endTime = Date.now();
    console.log(`⏱️  [${modeLabel}] Total transaction time:`, endTime - startTime, "ms");

    return {
      startTime,
      endTime,
      duration: endTime - startTime,
      txHash: hash,
      status: "success",
      rpcCalls,
      syncMode: options.syncMode,
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      startTime,
      endTime,
      duration: endTime - startTime,
      txHash: "",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      rpcCalls,
      syncMode: options.syncMode,
    };
  }
}
