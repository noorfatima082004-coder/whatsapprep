import { Card } from "@/components/ui/Card";
import { cn } from "@/lib/utils";
import type { LucideIcon } from "lucide-react";

export function KpiCard({
  label,
  value,
  hint,
  icon: Icon,
  trend,
}: {
  label: string;
  value: string | number;
  hint?: string;
  icon?: LucideIcon;
  trend?: string;
}) {
  return (
    <Card className="animate-fade-in">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm text-ink-muted">{label}</p>
          <p className="mt-2 text-2xl font-semibold tracking-tight text-ink">{value}</p>
          {(hint || trend) && (
            <p className={cn("mt-2 text-xs", trend ? "text-success" : "text-ink-muted")}>
              {trend || hint}
            </p>
          )}
        </div>
        {Icon && (
          <div className="rounded-xl bg-brand-soft p-2.5 text-brand-secondary">
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </Card>
  );
}
