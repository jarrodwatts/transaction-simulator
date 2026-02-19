import { zeroAddress } from "viem";
import { abstractTestnet } from "viem/chains";
import { paymasterConfig } from "@/config/paymaster-config";
import { BenchmarkResult, TransactionOptions, PrefetchedGas } from "@/types/benchmark";
import { RPCCallLog } from "@/lib/instrumented-transport";
import { TransactionClientsWithAccount } from "@/types/client-types";

export async function runTransaction(
  clients: TransactionClientsWithAccount,
  nonce: number,
  rpcCalls: RPCCallLog[],
  options: TransactionOptions,
  prefetchedGas: PrefetchedGas | null = null
): Promise<BenchmarkResult> {
  const startTime = Date.now();

  try {
    const txParams = {
      to: zeroAddress,
      value: BigInt(0),
      ...paymasterConfig,
      ...(options.nonce ? { nonce } : {}),
      ...(options.gasParams && prefetchedGas ? {
        maxFeePerGas: prefetchedGas.maxFeePerGas,
        maxPriorityFeePerGas: prefetchedGas.maxPriorityFeePerGas,
        gas: prefetchedGas.gas,
      } : {}),
    };

    let hash: `0x${string}`;

    if (options.syncMode) {
      const request = await clients.walletClient.prepareTransactionRequest(txParams);
      const serializedTransaction = await clients.walletClient.signTransaction(request);

      const receipt = await clients.publicClient.sendRawTransactionSync({
        serializedTransaction,
      });

      hash = receipt.transactionHash;
    } else {
      if (options.nonce && options.gasParams && options.chainId && prefetchedGas) {
        const requestToSign = {
          ...txParams,
          from: clients.account.address,
          chainId: abstractTestnet.id,
        };

        const serializedTransaction = await clients.walletClient.signTransaction(requestToSign);
        hash = await clients.publicClient.sendRawTransaction({ serializedTransaction });
      } else {
        hash = await clients.walletClient.sendTransaction(txParams);
      }

      await clients.publicClient.waitForTransactionReceipt({ hash });
    }

    const endTime = Date.now();

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
