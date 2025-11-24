"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Info } from "lucide-react";

export interface TransactionOptions {
  nonce: boolean;
  gasParams: boolean;
  chainId: boolean;
  syncMode: boolean;
}

interface SettingsControlPanelProps {
  options: TransactionOptions;
  onChange: (options: TransactionOptions) => void;
  disabled?: boolean;
}

export function SettingsControlPanel({ 
  options, 
  onChange, 
  disabled = false 
}: SettingsControlPanelProps) {
  const handleToggle = (key: keyof TransactionOptions) => {
    onChange({ ...options, [key]: !options[key] });
  };

  return (
    <div className="w-full p-4 bg-zinc-900/50 border border-zinc-800 rounded-lg">
      <div className="flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-white">Transaction Settings</h3>
          <div className="group relative">
            <Info className="w-3.5 h-3.5 text-zinc-500 cursor-help hover:text-zinc-400 transition-colors" />
            <div className="absolute left-0 top-6 w-80 p-3 bg-zinc-800 border border-zinc-700 rounded-lg text-xs text-zinc-300 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all pointer-events-none z-10 shadow-xl">
              <p className="mb-2 font-semibold text-white">How does this work?</p>
              <p className="mb-2">
                Toggle settings to see how different configurations affect the RPC calls made during a transaction.
              </p>
              <p className="mb-2">
                <span className="text-emerald-400 font-semibold">Pre-fetch options:</span> When enabled, parameters are fetched before sending, reducing RPC calls during execution.
              </p>
              <p>
                <span className="text-emerald-400 font-semibold">Sync Mode:</span> Uses <code className="bg-zinc-700 px-1 rounded">eth_sendRawTransactionSync</code> which waits for inclusion instead of polling.
              </p>
            </div>
          </div>
        </div>
        
        {/* Toggle Controls */}
        <div className="flex flex-wrap items-center gap-x-6 gap-y-3">
          {/* Sync Mode Toggle */}
          <div className="flex items-center gap-2">
            <Label 
              htmlFor="sync-toggle" 
              className="text-xs text-zinc-400 cursor-pointer whitespace-nowrap"
            >
              Sync Mode
            </Label>
            <Switch 
              id="sync-toggle"
              checked={options.syncMode}
              onCheckedChange={() => handleToggle("syncMode")}
              disabled={disabled}
            />
          </div>

          <div className="hidden sm:block w-px h-4 bg-zinc-700" />

          {/* Nonce Toggle */}
          <div className="flex items-center gap-2">
            <Label 
              htmlFor="nonce-toggle" 
              className="text-xs text-zinc-400 cursor-pointer whitespace-nowrap"
            >
              Pre-fetch Nonce
            </Label>
            <Switch 
              id="nonce-toggle"
              checked={options.nonce}
              onCheckedChange={() => handleToggle("nonce")}
              disabled={disabled}
            />
          </div>

          {/* Gas Parameters Toggle */}
          <div className="flex items-center gap-2">
            <Label 
              htmlFor="gas-toggle" 
              className="text-xs text-zinc-400 cursor-pointer whitespace-nowrap"
            >
              Pre-fetch Gas
            </Label>
            <Switch 
              id="gas-toggle"
              checked={options.gasParams}
              onCheckedChange={() => handleToggle("gasParams")}
              disabled={disabled}
            />
          </div>

          {/* Chain ID Toggle */}
          <div className="flex items-center gap-2">
            <Label 
              htmlFor="chain-toggle" 
              className="text-xs text-zinc-400 cursor-pointer whitespace-nowrap"
            >
              Pre-fetch Chain ID
            </Label>
            <Switch 
              id="chain-toggle"
              checked={options.chainId}
              onCheckedChange={() => handleToggle("chainId")}
              disabled={disabled}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
