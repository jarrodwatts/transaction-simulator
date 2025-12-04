import { Chain, createPublicClient, PublicClient } from "viem";
import { PublicActionsL2, publicActionsL2 } from "viem/zksync";
import { createInstrumentedTransport, RPCCallLog } from "@/lib/instrumented-transport";
import { isZkSyncChain } from "@/config/chains";

/**
 * Extended public client type that may include zkSync extensions
 */
export type BenchmarkPublicClient = PublicClient & Partial<PublicActionsL2>;

/**
 * Creates instrumented public client for use with a connected wallet
 * The wallet client comes from wagmi, we just create an instrumented public client
 */
export function createInstrumentedPublicClient(
  chain: Chain,
  rpcCallLogger: (log: RPCCallLog) => void,
  rpcStartLogger?: (log: Omit<RPCCallLog, "endTime" | "duration">) => void
): BenchmarkPublicClient {
  const rpcUrl = chain.rpcUrls.default.http[0];

  if (isZkSyncChain(chain.id)) {
    return createPublicClient({
      chain,
      transport: createInstrumentedTransport(rpcUrl, rpcCallLogger, rpcStartLogger),
    }).extend(publicActionsL2());
  }

  return createPublicClient({
    chain,
    transport: createInstrumentedTransport(rpcUrl, rpcCallLogger, rpcStartLogger),
  });
}
