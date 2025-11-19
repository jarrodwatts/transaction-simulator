import { zeroAddress } from "viem";
import { Account } from "viem/accounts";
import { abstractTestnet } from "viem/chains";
import { paymasterConfig } from "@/config/paymaster-config";
import { BenchmarkResult } from "@/types/benchmark";
import { RPCCallLog } from "@/lib/instrumented-transport";

interface TransactionClients {
  walletClient: any; // Extended with eip712WalletActions
  publicClient: any; // Extended with publicActionsL2
}

export interface PrefetchOptions {
  nonce: boolean;
  gasParams: boolean;
  chainId: boolean;
}

export async function runAsyncTransaction(
  clients: TransactionClients & { account: Account },
  nonce: number,
  rpcCalls: RPCCallLog[],
  prefetchOptions: PrefetchOptions
): Promise<BenchmarkResult> {
  const startTime = Date.now();
  
  try {
    const txParams: any = {
      to: zeroAddress,
      value: BigInt(0),
      ...paymasterConfig,
    };

    // Add pre-fetched nonce if enabled
    if (prefetchOptions.nonce) {
      txParams.nonce = nonce;
    }

    // Note: chainId is controlled at client creation level
    // When prefetchChainId is true, chain is set on wallet client
    // When false, viem will call eth_chainId during transaction preparation

    const hash = await clients.walletClient.sendTransaction(txParams);

    await clients.publicClient.waitForTransactionReceipt({ hash });
    const endTime = Date.now();

    return {
      type: "async",
      startTime,
      endTime,
      duration: endTime - startTime,
      txHash: hash,
      status: "success",
      rpcCalls,
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      type: "async",
      startTime,
      endTime,
      duration: endTime - startTime,
      txHash: "",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      rpcCalls,
    };
  }
}

export async function runSyncTransaction(
  clients: TransactionClients & { account: Account },
  nonce: number,
  rpcCalls: RPCCallLog[],
  prefetchOptions: PrefetchOptions
): Promise<BenchmarkResult> {
  const startTime = Date.now();
  
  try {
    const txParams: any = {
      to: zeroAddress,
      value: BigInt(0),
      ...paymasterConfig,
    };

    // Add pre-fetched nonce if enabled
    if (prefetchOptions.nonce) {
      txParams.nonce = nonce;
    }

    // Note: chainId is controlled at client creation level
    // When prefetchChainId is true, chain is set on wallet client
    // When false, viem will call eth_chainId during transaction preparation

    const request = await clients.walletClient.prepareTransactionRequest(txParams);

    const serializedTransaction = await clients.walletClient.signTransaction(request);
    
    const receipt = await clients.publicClient.sendRawTransactionSync({
      serializedTransaction,
    });

    const endTime = Date.now();

    return {
      type: "sync",
      startTime,
      endTime,
      duration: endTime - startTime,
      txHash: receipt.transactionHash,
      status: "success",
      rpcCalls,
    };
  } catch (error) {
    const endTime = Date.now();
    return {
      type: "sync",
      startTime,
      endTime,
      duration: endTime - startTime,
      txHash: "",
      status: "error",
      error: error instanceof Error ? error.message : "Unknown error",
      rpcCalls,
    };
  }
}

