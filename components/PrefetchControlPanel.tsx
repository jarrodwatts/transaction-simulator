"use client";

import { useState, useRef, useEffect, useMemo } from "react";
import Image from "next/image";
import { Chain } from "viem";
import { ChevronDown, Loader2, Globe, Search } from "lucide-react";
import { FEATURED_CHAINS, getChainUI, getAllViemChains } from "@/config/chains";

// Get all chains from viem for search
const viemChains = getAllViemChains();

interface SettingsControlPanelProps {
  disabled?: boolean;
  selectedChain: Chain;
  onChainChange: (chain: Chain) => Promise<void> | void;
  isWalletConnected: boolean;
  walletAddress?: `0x${string}`;
  onConnectWallet: () => void;
  onManageWallet: () => void;
  // Transaction button props
  onSendTransaction: () => void;
  canSendTransaction: boolean;
  buttonText: string;
  isLoading: boolean;
}

export function SettingsControlPanel({
  disabled = false,
  selectedChain,
  onChainChange,
  isWalletConnected,
  walletAddress,
  onConnectWallet,
  onManageWallet,
  onSendTransaction,
  canSendTransaction,
  buttonText,
  isLoading,
}: SettingsControlPanelProps) {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const ui = getChainUI(selectedChain.id);

  // Filter viem chains based on search, excluding our featured chains
  const featuredChainIds = new Set(FEATURED_CHAINS.map((c) => c.id));
  const searchResults = useMemo(() => {
    if (!searchQuery.trim()) return [];
    const query = searchQuery.toLowerCase();
    return viemChains
      .filter(
        (chain) =>
          !featuredChainIds.has(chain.id) && // Exclude featured chains
          (chain.name.toLowerCase().includes(query) ||
            chain.id.toString().includes(query) ||
            chain.nativeCurrency?.symbol?.toLowerCase().includes(query))
      )
      .slice(0, 10); // Limit results
  }, [searchQuery]);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setSearchQuery(""); // Clear search on close
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const [isSwitchingChain, setIsSwitchingChain] = useState(false);

  const handleChainSelect = async (chain: Chain) => {
    setIsDropdownOpen(false);
    setSearchQuery("");

    if (isWalletConnected) {
      setIsSwitchingChain(true);
    }
    try {
      await onChainChange(chain);
    } finally {
      setIsSwitchingChain(false);
    }
  };

  // Handle selection from the chain search (non-featured chains)
  const handleSearchChainSelect = async (chain: Chain) => {
    setIsDropdownOpen(false);
    setSearchQuery("");
    setIsSwitchingChain(true);

    try {
      // If wallet is connected, add the network and switch to it
      if (isWalletConnected && typeof window !== "undefined" && window.ethereum) {
        try {
          const chainMetadata = {
            chainId: `0x${chain.id.toString(16)}`,
            chainName: chain.name,
            nativeCurrency: chain.nativeCurrency || {
              name: "Ether",
              symbol: "ETH",
              decimals: 18,
            },
            rpcUrls: [chain.rpcUrls.default.http[0]],
            blockExplorerUrls: chain.blockExplorers?.default?.url
              ? [chain.blockExplorers.default.url]
              : undefined,
          };
          await window.ethereum.request({
            method: "wallet_addEthereumChain",
            params: [chainMetadata],
          });
        } catch (addError: any) {
          if (addError.code === 4001) {
            throw new Error("User rejected adding the network");
          }
          // Chain might already exist, continue anyway
          console.log("Chain might already exist, continuing...", addError);
        }
      }

      await onChainChange(chain);
    } catch (error) {
      console.error("Failed to switch chain:", error);
    } finally {
      setIsSwitchingChain(false);
    }
  };

  // Check if user needs to connect wallet
  const needsWalletConnection = !isWalletConnected;

  // Check if selected chain is a featured chain (has a logo)
  const isFeaturedChain = featuredChainIds.has(selectedChain.id);

  return (
    <div className="w-full bg-zinc-900/80 backdrop-blur-sm border border-zinc-800 rounded-xl">
      <div className="p-5 space-y-6">
        {/* Header: Network & Send Button */}
        <div className="flex flex-row items-center justify-between gap-3">
          {/* Left: Network Selector */}
          <div className="flex-1 min-w-0">
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={() => !disabled && !isSwitchingChain && setIsDropdownOpen(!isDropdownOpen)}
                disabled={disabled || isSwitchingChain}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border transition-all w-full md:w-auto md:min-w-[200px]
                  ${disabled || isSwitchingChain ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-zinc-600"}
                  bg-zinc-800 border-zinc-700
                `}
              >
                {isSwitchingChain ? (
                  <Loader2 className="w-5 h-5 text-zinc-400 animate-spin" />
                ) : isFeaturedChain ? (
                  <Image src={ui.logo} alt={selectedChain.name} width={20} height={20} className="object-contain shrink-0" />
                ) : (
                  <Globe className="w-5 h-5 text-indigo-400 shrink-0" />
                )}
                <span className="text-sm font-medium text-white flex-1 text-left truncate">
                  {isSwitchingChain ? "Switching..." : isFeaturedChain ? ui.shortName : selectedChain.name}
                </span>
                {!isSwitchingChain && (
                  <ChevronDown
                    className={`w-4 h-4 text-zinc-400 transition-transform shrink-0 ${isDropdownOpen ? "rotate-180" : ""}`}
                  />
                )}
              </button>

              {/* Dropdown menu */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 mt-1 w-full min-w-[280px] bg-zinc-800 border border-zinc-700 rounded-lg shadow-xl z-20 overflow-hidden">
                    {/* Featured Chains */}
                    <div className="py-1">
                      {FEATURED_CHAINS.map((chain) => {
                        const chainUI = getChainUI(chain.id);
                        const isSelected = chain.id === selectedChain.id;

                        return (
                          <button
                            key={chain.id}
                            onClick={() => handleChainSelect(chain)}
                            className={`
                              w-full flex items-center gap-2 px-3 py-2 transition-colors text-left
                              ${isSelected ? "bg-zinc-700" : "hover:bg-zinc-700/50"}
                            `}
                          >
                            <Image
                              src={chainUI.logo}
                              alt={chain.name}
                              width={18}
                              height={18}
                              className="object-contain"
                            />
                            <span className={`text-sm flex-1 ${isSelected ? "text-white font-medium" : "text-zinc-300"}`}>
                              {chainUI.shortName}
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {/* Search Section - only show when connected */}
                    {isWalletConnected && (
                      <>
                        <div className="border-t border-zinc-700 px-2 py-2">
                          <div className="relative">
                            <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500" />
                            <input
                              ref={searchInputRef}
                              type="text"
                              value={searchQuery}
                              onChange={(e) => setSearchQuery(e.target.value)}
                              placeholder="Search 500+ chains..."
                              className="w-full pl-8 pr-3 py-1.5 text-sm bg-zinc-900 border border-zinc-700 rounded text-white placeholder-zinc-500 focus:outline-none focus:border-zinc-600"
                              onClick={(e) => e.stopPropagation()}
                            />
                          </div>
                        </div>

                        {/* Search Results */}
                        {searchResults.length > 0 && (
                          <div className="border-t border-zinc-700 py-1 max-h-[200px] overflow-y-auto">
                            {searchResults.map((chain) => {
                              const isTestnet =
                                chain.testnet === true ||
                                chain.name.toLowerCase().includes("testnet") ||
                                chain.name.toLowerCase().includes("sepolia");

                              return (
                                <button
                                  key={chain.id}
                                  onClick={() => handleSearchChainSelect(chain)}
                                  className="w-full flex items-center gap-2 px-3 py-2 transition-colors text-left hover:bg-zinc-700/50"
                                >
                                  <Globe className="w-[18px] h-[18px] text-indigo-400 shrink-0" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="text-sm text-zinc-300 truncate">{chain.name}</span>
                                      {isTestnet && (
                                        <span className="text-[9px] px-1 py-0.5 rounded bg-blue-500/20 text-blue-400 shrink-0">
                                          Testnet
                                        </span>
                                      )}
                                    </div>
                                    <span className="text-[10px] text-zinc-500">
                                      ID: {chain.id} • {chain.nativeCurrency?.symbol || "ETH"}
                                    </span>
                                  </div>
                                </button>
                              );
                            })}
                          </div>
                        )}

                        {/* No results message */}
                        {searchQuery && searchResults.length === 0 && (
                          <div className="border-t border-zinc-700 px-3 py-3 text-center">
                            <span className="text-xs text-zinc-500">No chains found for "{searchQuery}"</span>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
          </div>

          {/* Right: Send Button */}
          <div className="shrink-0 flex flex-col gap-2 items-end">
            <button
              onClick={() => {
                if (needsWalletConnection) {
                  onConnectWallet();
                } else {
                  onSendTransaction();
                }
              }}
              disabled={!needsWalletConnection && (!canSendTransaction || isLoading)}
              className={`
                  px-4 md:px-6 py-2 rounded-lg font-semibold text-base transition-all
                  flex items-center justify-center gap-2
                  ${
                    (canSendTransaction || needsWalletConnection) && !isLoading
                      ? "bg-white text-zinc-900 hover:bg-zinc-200 shadow-lg shadow-white/5"
                      : "bg-zinc-800 text-zinc-500 cursor-not-allowed"
                  }
                `}
            >
              {isLoading && <Loader2 className="w-4 h-4 animate-spin" />}
              {buttonText}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
