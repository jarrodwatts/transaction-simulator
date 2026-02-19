"use client";

import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

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
  onRun: () => void;
  isRunning: boolean;
  buttonLabel: string;
}

const TOGGLE_ITEMS: { key: keyof TransactionOptions; label: string }[] = [
  { key: "syncMode", label: "Sync Mode" },
  { key: "nonce", label: "Pre-fetch Nonce" },
  { key: "gasParams", label: "Pre-fetch Gas" },
  { key: "chainId", label: "Pre-fetch Chain ID" },
];

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
    <div
      className="w-full rounded-xl border border-white/[0.06] p-4 backdrop-blur-md"
      style={{
        background:
          "linear-gradient(137deg, rgba(17, 18, 20, 0.75) 5%, rgba(12, 13, 15, 0.9) 76%)",
        boxShadow:
          "inset 0 1px 1px 0 rgba(255, 255, 255, 0.15), 0 4px 24px rgba(0, 0, 0, 0.4)",
      }}
    >
      <h3 className="mb-3 font-mono text-[11px] uppercase tracking-widest text-neutral-500">
        Settings
      </h3>

      <div className="flex flex-col gap-3">
        {TOGGLE_ITEMS.map(({ key, label }) => (
          <div key={key} className="flex items-center justify-between">
            <Label
              htmlFor={`${key}-toggle`}
              className="cursor-pointer text-xs text-neutral-400"
            >
              {label}
            </Label>
            <Switch
              id={`${key}-toggle`}
              checked={options[key]}
              onCheckedChange={() => handleToggle(key)}
              disabled={disabled}
            />
          </div>
        ))}
      </div>

      <button
        onClick={onRun}
        disabled={isRunning}
        className="mt-4 w-full rounded-lg bg-neutral-200 px-4 py-2.5 text-sm font-medium text-neutral-800 transition-colors hover:bg-white disabled:opacity-40 disabled:cursor-not-allowed"
        style={{
          boxShadow:
            "0 0 0 1px rgba(0, 0, 0, 0.5), 0 0 12px 0 rgba(255, 255, 255, 0.08), inset 0 -1px 0.4px 0 rgba(0, 0, 0, 0.2), inset 0 1px 0.4px 0 #fff",
        }}
      >
        {buttonLabel}
      </button>
    </div>
  );
}
