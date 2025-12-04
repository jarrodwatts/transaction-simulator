import { Chain, defineChain } from "viem";
import {
  abstractTestnet,
  megaethTestnet as baseMegaethTestnet,
  monadTestnet,
  baseSepolia,
  sepolia,
} from "viem/chains";
import * as allViemChains from "viem/chains";

// Override megaethTestnet with custom RPC URL and chain ID
const megaethTestnet = defineChain({
  ...baseMegaethTestnet,
  id: 6343,
  rpcUrls: {
    default: {
      http: ["https://timothy.megaeth.com/rpc"],
    },
  },
});

/**
 * Featured chains shown in the chain selector
 */
export const FEATURED_CHAINS: Chain[] = [
  abstractTestnet,
  monadTestnet,
  megaethTestnet,
  baseSepolia,
  sepolia,
];

/**
 * UI metadata for chains (logo, accent color, short name)
 */
export interface ChainUI {
  logo: string;
  accentColor: string;
  shortName: string;
}

const CHAIN_UI_MAP: Record<number, ChainUI> = {
  [abstractTestnet.id]: { logo: "/abs.png", accentColor: "#10b981", shortName: "Abstract Sepolia" },
  [monadTestnet.id]: { logo: "/monad.png", accentColor: "#a855f7", shortName: "Monad Testnet" },
  [megaethTestnet.id]: { logo: "/megaeth.png", accentColor: "#f59e0b", shortName: "MegaETH Testnet" },
  [baseSepolia.id]: { logo: "/base.svg", accentColor: "#0052FF", shortName: "Base Sepolia" },
  [sepolia.id]: { logo: "/eth.svg", accentColor: "#627EEA", shortName: "Sepolia" },
};

const DEFAULT_UI: ChainUI = {
  logo: "/custom-chain.svg",
  accentColor: "#6366f1",
  shortName: "Unknown",
};

/**
 * Get UI metadata for a chain
 */
export function getChainUI(chainId: number): ChainUI {
  return CHAIN_UI_MAP[chainId] ?? { ...DEFAULT_UI, shortName: `Chain ${chainId}` };
}

/**
 * Known zkSync stack chain IDs that need special transaction handling
 * Source: https://github.com/wevm/viem
 */
const ZKSYNC_CHAIN_IDS: Set<number> = new Set([
  324,       // zkSync Era Mainnet
  300,       // zkSync Sepolia
  302,       // zkSync Goerli
  11124,     // Abstract Testnet
  282,       // Cronos zkEVM
  388,       // Cronos zkEVM Mainnet
  4654,      // Gold Chain
  333271,    // Camp Testnet
  37111,     // Lens Testnet
  978658,    // Treasure Ruby
  531050104, // Sophon
  4457845,   // Zero Network
  2741,      // Abstract Mainnet
  240,       // Blast zkEVM
  555271,    // Xsolla zkEVM
  61166,     // Treasure
  555272,    // Xsolla zkEVM Mainnet
]);

// Local dev chain IDs that should never be treated as zkSync
const LOCAL_CHAIN_IDS: Set<number> = new Set([1337, 31337]);

export function isZkSyncChain(chainId: number): boolean {
  if (LOCAL_CHAIN_IDS.has(chainId)) return false;
  return ZKSYNC_CHAIN_IDS.has(chainId);
}

/**
 * Default chain
 */
export const DEFAULT_CHAIN = abstractTestnet;

/**
 * Get all viem chains as an array
 */
export function getAllViemChains(): Chain[] {
  return (Object.values(allViemChains) as unknown[]).filter(
    (chain): chain is Chain =>
      typeof chain === "object" &&
      chain !== null &&
      "id" in chain &&
      "name" in chain &&
      typeof chain.id === "number"
  );
}

/**
 * Find a chain by ID from viem's definitions or our featured chains
 */
export function getChainById(chainId: number): Chain | undefined {
  // Check featured chains first (includes our overrides like megaETH)
  const featured = FEATURED_CHAINS.find((c) => c.id === chainId);
  if (featured) return featured;

  // Fall back to all viem chains
  return getAllViemChains().find((c) => c.id === chainId);
}

// Re-export the custom megaethTestnet for direct use
export { megaethTestnet };
