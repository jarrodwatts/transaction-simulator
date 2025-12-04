"use client";

import Image from "next/image";
import { Chain } from "viem";
import { FEATURED_CHAINS, getChainUI } from "@/config/chains";

interface ChainSelectorProps {
  selectedChain: Chain;
  onChange: (chain: Chain) => void;
  disabled?: boolean;
}

export function ChainSelector({ selectedChain, onChange, disabled = false }: ChainSelectorProps) {
  return (
    <div className="w-full md:flex-1 p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
      <div className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold text-white">Select Chain</h3>

        <div className="flex flex-wrap gap-2">
          {FEATURED_CHAINS.map((chain) => {
            const ui = getChainUI(chain.id);
            const isSelected = chain.id === selectedChain.id;

            return (
              <button
                key={chain.id}
                onClick={() => onChange(chain)}
                disabled={disabled}
                className={`
                  flex items-center gap-2 px-3 py-2 rounded-lg border transition-all
                  ${disabled ? "opacity-50 cursor-not-allowed" : "cursor-pointer hover:border-zinc-600"}
                  ${isSelected ? "bg-zinc-800 border-zinc-600" : "bg-zinc-900/50 border-zinc-800"}
                `}
                style={{
                  borderColor: isSelected ? ui.accentColor : undefined,
                  boxShadow: isSelected ? `0 0 10px ${ui.accentColor}30` : undefined,
                }}
              >
                <Image src={ui.logo} alt={chain.name} width={20} height={20} className="object-contain" />
                <span className={`text-sm font-medium ${isSelected ? "text-white" : "text-zinc-400"}`}>
                  {ui.shortName}
                </span>
                {isSelected && (
                  <div className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ui.accentColor }} />
                )}
              </button>
            );
          })}
        </div>

        {/* Chain info */}
        <div className="flex items-center gap-4 text-xs text-zinc-500">
          <span>Chain ID: {selectedChain.id}</span>
        </div>
      </div>
    </div>
  );
}
