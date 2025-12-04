"use client";

import { ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme, getDefaultConfig } from "@rainbow-me/rainbowkit";
import "@rainbow-me/rainbowkit/styles.css";
import { getAllViemChains, DEFAULT_CHAIN, FEATURED_CHAINS } from "@/config/chains";
import type { Chain } from "viem";

// Get all chains from viem
const allViemChains = getAllViemChains();

// Get the IDs of our featured chains (which may have custom overrides)
const featuredChainIds = new Set(FEATURED_CHAINS.map((c) => c.id));

// Filter out any viem chains that conflict with our featured chains
// (e.g., the original megaethTestnet if we have a custom override)
const nonFeaturedChains = allViemChains.filter((c) => !featuredChainIds.has(c.id));

// Combine: featured chains first (with custom overrides), then all other viem chains
const allChains = [...FEATURED_CHAINS, ...nonFeaturedChains];

// Ensure we have at least one chain (required by wagmi)
if (allChains.length === 0) {
  throw new Error("No chains found");
}

// Type assertion for wagmi's tuple requirement
const chains = allChains as [Chain, ...Chain[]];

// Configure wagmi with RainbowKit defaults
const config = getDefaultConfig({
  appName: "Transaction Latency Simulator",
  projectId: process.env.NEXT_PUBLIC_WALLETCONNECT_PROJECT_ID || "demo",
  chains,
  ssr: true,
});

// Create a stable query client
const queryClient = new QueryClient();

interface ProvidersProps {
  children: ReactNode;
}

export function Providers({ children }: ProvidersProps) {
  return (
    <WagmiProvider config={config}>
      <QueryClientProvider client={queryClient}>
        <RainbowKitProvider
          initialChain={DEFAULT_CHAIN}
          theme={darkTheme({
            accentColor: "#10b981",
            accentColorForeground: "white",
            borderRadius: "medium",
            fontStack: "system",
          })}
        >
          {children}
        </RainbowKitProvider>
      </QueryClientProvider>
    </WagmiProvider>
  );
}
