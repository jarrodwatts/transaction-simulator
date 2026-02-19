"use client";

import { HelpCircle } from "lucide-react";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  TooltipProvider,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@/components/ui/tooltip";
import { TransactionOptions } from "@/types/benchmark";

interface SettingsControlPanelProps {
  options: TransactionOptions;
  onChange: (options: TransactionOptions) => void;
  disabled?: boolean;
  onRun: () => void;
  isRunning: boolean;
  buttonLabel: string;
}

const TOGGLE_DESCRIPTIONS: Record<keyof TransactionOptions, string> = {
  syncMode:
    "Uses eth_sendRawTransactionSync to send and confirm in a single RPC call instead of polling for the receipt.",
  nonce:
    "Fetches the account nonce before the timed run so it doesn't count toward the total duration.",
  gasParams:
    "Pre-fetches gas estimate, base fee, and priority fee before the timed run.",
  chainId:
    "Caches the chain ID locally so eth_chainId calls are resolved instantly without an RPC round-trip.",
};

const PREFETCH_ITEMS: { key: keyof TransactionOptions; label: string }[] = [
  { key: "nonce", label: "Pre-fetch Nonce" },
  { key: "gasParams", label: "Pre-fetch Gas" },
  { key: "chainId", label: "Pre-fetch Chain ID" },
];

function ToggleRow({
  id,
  label,
  tooltip,
  checked,
  onCheckedChange,
  disabled,
  labelClassName,
}: {
  id: string;
  label: string;
  tooltip: string;
  checked: boolean;
  onCheckedChange: () => void;
  disabled: boolean;
  labelClassName?: string;
}) {
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-1.5">
        <Label
          htmlFor={id}
          className={labelClassName ?? "cursor-pointer text-xs text-neutral-400"}
        >
          {label}
        </Label>
        <Tooltip>
          <TooltipTrigger asChild>
            <button type="button" className="text-neutral-600 transition-colors hover:text-neutral-400">
              <HelpCircle size={13} />
            </button>
          </TooltipTrigger>
          <TooltipContent side="top">{tooltip}</TooltipContent>
        </Tooltip>
      </div>
      <Switch
        id={id}
        checked={checked}
        onCheckedChange={onCheckedChange}
        disabled={disabled}
      />
    </div>
  );
}

export function SettingsControlPanel({
  options,
  onChange,
  disabled = false,
  onRun,
  isRunning,
  buttonLabel,
}: SettingsControlPanelProps) {
  const handleToggle = (key: keyof TransactionOptions) => {
    onChange({ ...options, [key]: !options[key] });
  };

  return (
    <TooltipProvider>
      <div
        className="glass-card w-full rounded-xl border border-white/[0.06] p-4 backdrop-blur-md"
      >
        <div className="mb-3">
          <ToggleRow
            id="syncMode-toggle"
            label="Sync Mode"
            tooltip={TOGGLE_DESCRIPTIONS.syncMode}
            checked={options.syncMode}
            onCheckedChange={() => handleToggle("syncMode")}
            disabled={disabled}
            labelClassName="cursor-pointer text-xs text-neutral-300"
          />
        </div>

        <div className="mb-3 h-px bg-white/[0.06]" />

        <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-neutral-600">
          Pre-fetch
        </h3>

        <div className="flex flex-col gap-3">
          {PREFETCH_ITEMS.map(({ key, label }) => (
            <ToggleRow
              key={key}
              id={`${key}-toggle`}
              label={label}
              tooltip={TOGGLE_DESCRIPTIONS[key]}
              checked={options[key]}
              onCheckedChange={() => handleToggle(key)}
              disabled={disabled}
            />
          ))}
        </div>

        <button
          onClick={onRun}
          disabled={isRunning}
          className="mt-4 w-full rounded-lg bg-accent px-4 py-2.5 text-sm font-semibold text-neutral-900 transition-all hover:brightness-110 disabled:opacity-40 disabled:cursor-not-allowed"
          style={{
            boxShadow: isRunning
              ? "none"
              : "0 0 0 1px rgba(0, 0, 0, 0.3), 0 0 20px 0 rgba(0, 232, 123, 0.15), inset 0 1px 0.4px 0 rgba(255, 255, 255, 0.25), inset 0 -1px 0.4px 0 rgba(0, 0, 0, 0.15)",
          }}
        >
          {buttonLabel}
        </button>
      </div>
    </TooltipProvider>
  );
}
