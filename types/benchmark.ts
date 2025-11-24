import { RPCCallLog } from "@/lib/instrumented-transport";

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
