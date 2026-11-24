import { MISSING_BACKEND } from "@/lib/constants";
import { Info } from "lucide-react";

export function DemoBanner({
  feature,
}: {
  feature: keyof typeof MISSING_BACKEND;
}) {
  return (
    <div className="mb-4 flex items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3.5 py-2.5 text-sm text-amber-800">
      <Info className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <span className="font-semibold">Demo data</span>
        <span className="mx-1">·</span>
        <span>This view uses local demo data until the backend provides: {MISSING_BACKEND[feature]}</span>
      </div>
    </div>
  );
}
