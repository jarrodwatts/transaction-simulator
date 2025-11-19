import { createWalletClient, createPublicClient } from "viem";
import { Account } from "viem/accounts";
import { abstractTestnet } from "viem/chains";
import { eip712WalletActions, publicActionsL2 } from "viem/zksync";
import { createInstrumentedTransport, RPCCallLog } from "@/lib/instrumented-transport";

export function createBenchmarkClients(
  account: Account,
  rpcCallLogger: (log: RPCCallLog) => void,
  prefetchChainId: boolean = false
) {
  // Get the RPC URL from the abstractTestnet chain
  const rpcUrl = abstractTestnet.rpcUrls.default.http[0];

  console.log("🏗️ Creating clients with prefetchChainId:", prefetchChainId);

  // Always set the chain on the client (required for proper functioning)
  // The transport will intercept eth_chainId calls when prefetch is enabled
  const walletClient = createWalletClient({
    account,
    chain: abstractTestnet,
    transport: createInstrumentedTransport(rpcUrl, rpcCallLogger, prefetchChainId, abstractTestnet.id),
  }).extend(eip712WalletActions());

  console.log("✅ WalletClient created, chain:", walletClient.chain?.id ?? "undefined");

  const publicClient = createPublicClient({
    chain: abstractTestnet,
    transport: createInstrumentedTransport(rpcUrl, rpcCallLogger),
  }).extend(publicActionsL2());

  return { walletClient, publicClient };
}


