"use client";

import {
  AiHumanPie,
  MessagesAreaChart,
  OrdersBarChart,
  RevenueLineChart,
} from "@/components/charts/SimpleCharts";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { KpiCard } from "@/components/ui/KpiCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Toggle } from "@/components/ui/Toggle";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/context/AuthContext";
import { fetchMessages, getDashboardOverview } from "@/lib/api/services";
import { formatPKR, formatRelativeTime } from "@/lib/utils";
import type { DashboardOverview } from "@/types";
import {
  Bot,
  MessageSquare,
  RefreshCcw,
  ShoppingBag,
  Sparkles,
  Wallet,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";
import { toast } from "sonner";

export default function OverviewPage() {
  const { user, patchUser } = useAuth();
  const { waStatus } = useApp();
  const [data, setData] = useState<DashboardOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [range, setRange] = useState("14d");

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        let liveCount: number | undefined;
        let liveChats: number | undefined;
        try {
          const messages = await fetchMessages();
          liveCount = messages.count;
          liveChats = new Set(messages.messages.map((m) => m.chat_id)).size;
        } catch {
          // Backend may be offline; overview still shows demo KPIs.
        }
        const overview = await getDashboardOverview(liveCount, liveChats);
        if (!cancelled) setData(overview);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [range]);

  if (!user) return null;

  return (
    <div className="space-y-5 animate-fade-in">
      <DemoBanner feature="analytics" />

      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-ink">
            Welcome back, {user.businessName}
          </h2>
          <p className="mt-1 text-sm text-ink-muted">
            Here&apos;s how your WhatsApp operations are performing.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <select
            className="input-field w-auto"
            value={range}
            onChange={(e) => setRange(e.target.value)}
          >
            <option value="7d">Last 7 days</option>
            <option value="14d">Last 14 days</option>
            <option value="30d">Last 30 days</option>
          </select>
          <Badge tone={waStatus?.connected ? "green" : "red"}>
            WhatsApp {waStatus?.connected ? "Connected" : "Offline"}
          </Badge>
          <Toggle
            checked={user.botEnabled}
            onChange={(next) => {
              patchUser({ botEnabled: next });
              toast.success(next ? "AI bot enabled" : "AI bot paused");
            }}
            label="AI Bot"
          />
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
            <KpiCard label="Total Messages" value={data.totalMessages} icon={MessageSquare} hint={data.liveInbox ? "Includes live inbox count" : undefined} />
            <KpiCard label="AI Handled" value={data.aiHandled} icon={Bot} />
            <KpiCard label="Active Chats" value={data.activeChats} icon={Sparkles} />
            <KpiCard label="Total Orders" value={data.totalOrders} icon={ShoppingBag} />
            <KpiCard label="Verified Payments" value={data.verifiedPayments} icon={Wallet} />
            <KpiCard label="Recovered Revenue" value={formatPKR(data.recoveredRevenue)} icon={RefreshCcw} />
          </div>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader title="Messages activity" description="Conversation volume over time" />
              <MessagesAreaChart data={data.messagesActivity} />
            </Card>
            <Card>
              <CardHeader title="Orders overview" description="Orders created per day" />
              <OrdersBarChart data={data.ordersOverview} />
            </Card>
            <Card>
              <CardHeader title="Revenue performance" description="Estimated PKR revenue" />
              <RevenueLineChart data={data.revenuePerformance} />
            </Card>
            <Card>
              <CardHeader title="AI vs Human handled" description="Conversation ownership mix" />
              <AiHumanPie data={data.aiVsHuman} />
            </Card>
          </div>

          <div className="grid gap-4 xl:grid-cols-3">
            <Card>
              <CardHeader
                title="Recent conversations"
                action={
                  <Link href="/inbox">
                    <Button variant="ghost">Open inbox</Button>
                  </Link>
                }
              />
              <div className="space-y-3">
                {data.recentConversations.map((c) => (
                  <div key={c.name + c.at} className="rounded-xl border border-line px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-ink">{c.name}</div>
                      <div className="text-xs text-ink-muted">{formatRelativeTime(c.at)}</div>
                    </div>
                    <div className="mt-1 truncate text-sm text-ink-muted">{c.preview}</div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader
                title="Recent orders"
                action={
                  <Link href="/orders">
                    <Button variant="ghost">View all</Button>
                  </Link>
                }
              />
              <div className="space-y-3">
                {data.recentOrders.map((o) => (
                  <div key={o.id} className="rounded-xl border border-line px-3 py-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <div className="font-medium text-ink">{o.id}</div>
                      <Badge tone={o.orderStatus === "verified" || o.orderStatus === "delivered" ? "green" : "yellow"}>
                        {o.orderStatus}
                      </Badge>
                    </div>
                    <div className="mt-1 text-sm text-ink-muted">
                      {o.customerName} · {formatPKR(o.totalAmount)}
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            <Card>
              <CardHeader title="AI performance" />
              <div className="space-y-3">
                {data.aiPerformance.map((item) => (
                  <div key={item.label} className="flex items-center justify-between rounded-xl bg-brand-app px-3 py-2.5">
                    <span className="text-sm text-ink-muted">{item.label}</span>
                    <span className="text-sm font-semibold text-ink">{item.value}</span>
                  </div>
                ))}
              </div>
              <div className="mt-5">
                <div className="mb-2 flex items-center justify-between text-sm">
                  <span className="text-ink-muted">AI call usage</span>
                  <span className="font-medium">
                    {data.usage.aiCallsUsed}/{data.usage.aiCallsLimit}
                  </span>
                </div>
                <div className="h-2 overflow-hidden rounded-full bg-brand-app">
                  <div
                    className="h-full rounded-full bg-brand-green"
                    style={{
                      width: `${Math.min(100, (data.usage.aiCallsUsed / data.usage.aiCallsLimit) * 100)}%`,
                    }}
                  />
                </div>
                <div className="mt-4 flex gap-2">
                  <Link href="/inbox">
                    <Button>Open inbox</Button>
                  </Link>
                  <Link href="/catalog">
                    <Button variant="secondary">Upload catalog</Button>
                  </Link>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}
    </div>
  );
}
