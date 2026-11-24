import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Lock } from "lucide-react";
import Link from "next/link";

export function UpgradePrompt({
  feature,
  requiredPlan = "Professional",
}: {
  feature: string;
  requiredPlan?: string;
}) {
  return (
    <Card className="flex flex-col items-center py-16 text-center">
      <div className="mb-4 rounded-2xl bg-brand-soft p-3 text-brand-secondary">
        <Lock className="h-6 w-6" />
      </div>
      <h3 className="text-lg font-semibold text-ink">{feature} is a {requiredPlan} feature</h3>
      <p className="mt-2 max-w-md text-sm text-ink-muted">
        Upgrade your plan to unlock {feature.toLowerCase()} and keep growing with WhatsRep.
      </p>
      <Link href="/billing" className="mt-5">
        <Button>View plans</Button>
      </Link>
    </Card>
  );
}
