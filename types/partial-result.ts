import { RPCCallLog } from "@/lib/instrumented-transport";

export interface PartialResult {
  startTime: number;
  rpcCalls: RPCCallLog[];
  isComplete: boolean;
  syncMode: boolean;
}
