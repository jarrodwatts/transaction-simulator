import { RPCCallLog } from "@/lib/instrumented-transport";

export interface TransactionOptions {
  nonce: boolean;
  gasParams: boolean;
  chainId: boolean;
  syncMode: boolean;
}

export interface PrefetchedGas {
  maxFeePerGas: bigint;
  maxPriorityFeePerGas: bigint;
  gas: bigint;
}

export interface BenchmarkResult {
  startTime: number;
  endTime: number;
  duration: number;
  txHash: string;
  status: "success" | "error";
  error?: string;
  rpcCalls: RPCCallLog[];
  syncMode: boolean;
}
