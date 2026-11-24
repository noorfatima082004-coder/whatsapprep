import { cn } from "@/lib/utils";

const tones = {
  green: "bg-brand-soft text-brand-secondary",
  gray: "bg-brand-app text-ink-muted",
  yellow: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-600",
  blue: "bg-sky-50 text-sky-700",
  navy: "bg-[#142D2B]/10 text-brand-navy",
} as const;

export function Badge({
  children,
  tone = "gray",
  className,
}: {
  children: React.ReactNode;
  tone?: keyof typeof tones;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold",
        tones[tone],
        className
      )}
    >
      {children}
    </span>
  );
}
