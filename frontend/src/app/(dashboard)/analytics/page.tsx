"use client";

import {
  DualLineChart,
  FunnelBars,
  IntentBars,
  MessagesAreaChart,
  OrdersBarChart,
  RevenueLineChart,
} from "@/components/charts/SimpleCharts";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { Input } from "@/components/ui/Input";
import { KpiCard } from "@/components/ui/KpiCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { getAnalytics } from "@/lib/api/services";
import { formatPKR } from "@/lib/utils";
import type { AnalyticsSnapshot } from "@/types";
import {
  Bot,
  Clock3,
  MessageSquare,
  RefreshCcw,
  ShoppingBag,
  Wallet,
} from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type RangePreset = "7" | "30" | "90" | "custom";

function daysBetween(start: string, end: string) {
  const a = new Date(start);
  const b = new Date(end);
  const diff = Math.round((b.getTime() - a.getTime()) / 86400000) + 1;
  return Math.max(1, Math.min(180, diff));
}

export default function AnalyticsPage() {
  const [preset, setPreset] = useState<RangePreset>("30");
  const [customStart, setCustomStart] = useState("");
  const [customEnd, setCustomEnd] = useState("");
  const [data, setData] = useState<AnalyticsSnapshot | null>(null);
  const [loading, setLoading] = useState(true);

  const days = useMemo(() => {
    if (preset === "custom") {
      if (!customStart || !customEnd) return 30;
      return daysBetween(customStart, customEnd);
    }
    return Number(preset);
  }, [preset, customStart, customEnd]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (preset === "custom" && (!customStart || !customEnd)) return;
      if (preset === "custom" && new Date(customStart) > new Date(customEnd)) {
        toast.error("Start date must be before end date");
        return;
      }
      setLoading(true);
      try {
        const snapshot = await getAnalytics(days);
        if (!cancelled) setData(snapshot);
      } catch {
        if (!cancelled) toast.error("Failed to load analytics");
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [days, preset, customStart, customEnd]);

  return (
    <div className="space-y-5 animate-fade-in">
      <DemoBanner feature="analytics" />

      <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">Analytics</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Conversation quality, orders, revenue, and recovery performance.
          </p>
        </div>
        <div className="flex flex-wrap items-end gap-2">
          {(["7", "30", "90"] as const).map((p) => (
            <Button
              key={p}
              variant={preset === p ? "primary" : "secondary"}
              onClick={() => setPreset(p)}
            >
              {p} days
            </Button>
          ))}
          <Button
            variant={preset === "custom" ? "primary" : "secondary"}
            onClick={() => setPreset("custom")}
          >
            Custom
          </Button>
          {preset === "custom" && (
            <>
              <Input
                type="date"
                label="From"
                value={customStart}
                onChange={(e) => setCustomStart(e.target.value)}
                className="w-auto"
              />
              <Input
                type="date"
                label="To"
                value={customEnd}
                onChange={(e) => setCustomEnd(e.target.value)}
                className="w-auto"
              />
            </>
          )}
        </div>
      </div>

      {loading || !data ? (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
            <KpiCard label="Total messages" value={data.totalMessages} icon={MessageSquare} />
            <KpiCard
              label="AI response rate"
              value={`${data.aiResponsePct}%`}
              icon={Bot}
            />
            <KpiCard
              label="Avg response"
              value={`${data.avgResponseTimeSec}s`}
              icon={Clock3}
            />
            <KpiCard label="Orders" value={data.totalOrders} icon={ShoppingBag} />
            <KpiCard label="Verified payments" value={data.verifiedPayments} icon={Wallet} />
            <KpiCard
              label="Recovered carts"
              value={data.recoveredCarts}
              icon={RefreshCcw}
              hint={formatPKR(data.totalRevenue)}
            />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title="Message volume" description={`Last ${days} days`} />
              <MessagesAreaChart data={data.dailyMessages} />
            </Card>
            <Card>
              <CardHeader title="AI vs human replies" description="Daily ownership mix" />
              <DualLineChart data={data.dailyMessages} />
            </Card>
            <Card>
              <CardHeader title="Orders over time" />
              <OrdersBarChart data={data.ordersOverTime} />
            </Card>
            <Card>
              <CardHeader title="Revenue over time" description="Estimated PKR" />
              <RevenueLineChart data={data.revenueOverTime} />
            </Card>
            <Card>
              <CardHeader title="Intent distribution" />
              <IntentBars data={data.intentDistribution} />
            </Card>
            <Card>
              <CardHeader title="Cart recovery funnel" />
              <FunnelBars data={data.cartRecoveryConversion} />
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
