"use client";

import { cn } from "@/lib/utils";

export function Toggle({
  checked,
  onChange,
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  label?: string;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={cn(
        "inline-flex items-center gap-3 disabled:opacity-50",
        disabled ? "cursor-not-allowed" : "cursor-pointer"
      )}
    >
      <span
        className={cn(
          "relative h-6 w-11 rounded-full transition",
          checked ? "bg-brand-green" : "bg-[#c9d4cf]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition",
            checked ? "left-[22px]" : "left-0.5"
          )}
        />
      </span>
      {label && <span className="text-sm font-medium text-ink">{label}</span>}
    </button>
  );
}
