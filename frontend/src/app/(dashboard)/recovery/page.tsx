"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { Input } from "@/components/ui/Input";
import { KpiCard } from "@/components/ui/KpiCard";
import { Skeleton } from "@/components/ui/Skeleton";
import { Textarea } from "@/components/ui/Textarea";
import { Toggle } from "@/components/ui/Toggle";
import { UpgradePrompt } from "@/components/ui/UpgradePrompt";
import { useAuth } from "@/context/AuthContext";
import {
  getRecoveryConfig,
  listRecoveryCarts,
  saveRecoveryConfig,
  updateRecoveryCart,
} from "@/lib/api/services";
import { PLAN_RANK } from "@/lib/constants";
import { formatDate, formatPKR, formatRelativeTime } from "@/lib/utils";
import type { RecoveryCart, RecoverySettings } from "@/types";
import { Info, RefreshCcw, Send } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

function cartTone(
  status: RecoveryCart["status"]
): "green" | "yellow" | "gray" | "red" | "blue" {
  switch (status) {
    case "recovered":
      return "green";
    case "messaged":
      return "blue";
    case "eligible":
      return "yellow";
    case "opted_out":
    case "expired":
      return "red";
    default:
      return "gray";
  }
}

const defaultSettings: RecoverySettings = {
  enabled: true,
  maxDiscountPct: 10,
  thresholdAmount: 1500,
  maxMessagesPerCustomer: 2,
  template1: "",
  template2: "",
};

export default function RecoveryPage() {
  const { user } = useAuth();
  const locked = !user || PLAN_RANK[user.plan] < PLAN_RANK.professional;

  const [carts, setCarts] = useState<RecoveryCart[]>([]);
  const [settings, setSettings] = useState<RecoverySettings>(defaultSettings);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (locked) {
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const [cartList, config] = await Promise.all([
        listRecoveryCarts(),
        getRecoveryConfig(),
      ]);
      setCarts(cartList);
      setSettings(config);
    } finally {
      setLoading(false);
    }
  }, [locked]);

  useEffect(() => {
    load();
  }, [load]);

  const stats = useMemo(() => {
    const eligible = carts.filter((c) => c.status === "eligible").length;
    const messaged = carts.filter((c) => c.status === "messaged").length;
    const recovered = carts.filter((c) => c.status === "recovered").length;
    const revenue = carts
      .filter((c) => c.status === "recovered")
      .reduce((s, c) => s + c.cartValue, 0);
    return { eligible, messaged, recovered, revenue };
  }, [carts]);

  const saveSettings = async () => {
    if (settings.maxMessagesPerCustomer > 2) {
      toast.error("WhatsApp recovery allows a maximum of 2 messages per customer");
      return;
    }
    if (settings.maxDiscountPct < 0 || settings.maxDiscountPct > 50) {
      toast.error("Discount should be between 0 and 50%");
      return;
    }
    setSaving(true);
    try {
      const next = await saveRecoveryConfig({
        ...settings,
        maxMessagesPerCustomer: Math.min(2, Math.max(1, settings.maxMessagesPerCustomer)),
      });
      setSettings(next);
      toast.success("Recovery settings saved");
    } catch {
      toast.error("Could not save settings");
    } finally {
      setSaving(false);
    }
  };

  const sendRecovery = async (cart: RecoveryCart) => {
    if (cart.messagesSent >= 2) {
      toast.error("Max 2 recovery messages already sent");
      return;
    }
    setBusyId(cart.id);
    try {
      const next = await updateRecoveryCart(cart.id, {
        messagesSent: cart.messagesSent + 1,
        status: "messaged",
      });
      setCarts((prev) => prev.map((c) => (c.id === next.id ? next : c)));
      toast.success(`Recovery message queued for ${cart.customerName}`);
    } catch {
      toast.error("Failed to update cart");
    } finally {
      setBusyId(null);
    }
  };

  if (!user) return null;

  if (locked) {
    return (
      <div className="space-y-5 animate-fade-in">
        <DemoBanner feature="recovery" />
        <div>
          <h2 className="text-2xl font-semibold text-ink">Cart recovery</h2>
          <p className="mt-1 text-sm text-ink-muted">
            Re-engage shoppers who abandoned carts on WhatsApp.
          </p>
        </div>
        <UpgradePrompt feature="Cart Recovery" requiredPlan="Professional" />
      </div>
    );
  }

  return (
    <div className="space-y-5 animate-fade-in">
      <DemoBanner feature="recovery" />

      <div>
        <h2 className="text-2xl font-semibold text-ink">Cart recovery</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Automate follow-ups for abandoned carts within the WhatsApp messaging window.
        </p>
      </div>

      <div className="flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-sm text-sky-800">
        <Info className="mt-0.5 h-4 w-4 shrink-0" />
        <p>
          Recovery messages can only be sent inside the{" "}
          <span className="font-semibold">24-hour WhatsApp customer care window</span>. After
          that, carts expire until the customer messages again.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          <KpiCard label="Eligible carts" value={stats.eligible} icon={RefreshCcw} />
          <KpiCard label="Messaged" value={stats.messaged} icon={Send} />
          <KpiCard label="Recovered" value={stats.recovered} />
          <KpiCard label="Recovered revenue" value={formatPKR(stats.revenue)} />
        </div>
      )}

      <div className="grid gap-4 xl:grid-cols-3">
        <Card className="xl:col-span-2">
          <CardHeader title="Abandoned carts" description="Priority sorted by recovery score" />
          {loading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14" />
              ))}
            </div>
          ) : carts.length === 0 ? (
            <EmptyState
              icon={RefreshCcw}
              title="No recoverable carts"
              description="Abandoned carts will appear here when customers drop off."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full text-left text-sm">
                <thead>
                  <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                    <th className="px-3 py-2 font-semibold">Customer</th>
                    <th className="px-3 py-2 font-semibold">Product</th>
                    <th className="px-3 py-2 font-semibold">Value</th>
                    <th className="px-3 py-2 font-semibold">Score</th>
                    <th className="px-3 py-2 font-semibold">Status</th>
                    <th className="px-3 py-2 font-semibold">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {carts.map((cart) => (
                    <tr key={cart.id} className="border-b border-line/70">
                      <td className="px-3 py-3">
                        <div className="font-medium text-ink">{cart.customerName}</div>
                        <div className="text-xs text-ink-muted">
                          {cart.customerPhone} · {formatRelativeTime(cart.lastActivityAt)}
                        </div>
                      </td>
                      <td className="px-3 py-3">{cart.productName}</td>
                      <td className="px-3 py-3">{formatPKR(cart.cartValue)}</td>
                      <td className="px-3 py-3">{cart.recoveryScore}</td>
                      <td className="px-3 py-3">
                        <Badge tone={cartTone(cart.status)}>{cart.status}</Badge>
                      </td>
                      <td className="px-3 py-3">
                        <Button
                          variant="secondary"
                          loading={busyId === cart.id}
                          disabled={
                            cart.status === "recovered" ||
                            cart.status === "opted_out" ||
                            cart.status === "expired" ||
                            cart.messagesSent >= 2 ||
                            !settings.enabled
                          }
                          onClick={() => sendRecovery(cart)}
                        >
                          Send ({cart.messagesSent}/2)
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </Card>

        <Card>
          <CardHeader title="Recovery settings" description="Max 2 messages per customer" />
          <div className="space-y-4">
            <Toggle
              checked={settings.enabled}
              onChange={(enabled) => setSettings((s) => ({ ...s, enabled }))}
              label="Enable cart recovery"
            />
            <Input
              type="number"
              label="Max discount (%)"
              value={settings.maxDiscountPct}
              min={0}
              max={50}
              onChange={(e) =>
                setSettings((s) => ({ ...s, maxDiscountPct: Number(e.target.value) }))
              }
            />
            <Input
              type="number"
              label="Cart value threshold (PKR)"
              value={settings.thresholdAmount}
              min={0}
              onChange={(e) =>
                setSettings((s) => ({ ...s, thresholdAmount: Number(e.target.value) }))
              }
            />
            <Input
              type="number"
              label="Max messages per customer"
              value={settings.maxMessagesPerCustomer}
              min={1}
              max={2}
              hint="Hard capped at 2 for WhatsApp compliance"
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  maxMessagesPerCustomer: Number(e.target.value),
                }))
              }
            />
            <Textarea
              label="Template 1"
              value={settings.template1}
              onChange={(e) => setSettings((s) => ({ ...s, template1: e.target.value }))}
            />
            <Textarea
              label="Template 2"
              value={settings.template2}
              onChange={(e) => setSettings((s) => ({ ...s, template2: e.target.value }))}
            />
            <p className="text-xs text-ink-muted">
              Placeholders: {"{{name}}"}, {"{{product}}"}, {"{{discount}}"}. Last updated{" "}
              {formatDate(new Date().toISOString())}.
            </p>
            <Button loading={saving} onClick={saveSettings} className="w-full">
              Save settings
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
