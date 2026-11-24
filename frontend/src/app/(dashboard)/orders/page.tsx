"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader } from "@/components/ui/Card";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import { KpiCard } from "@/components/ui/KpiCard";
import { Modal } from "@/components/ui/Modal";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { listOrders, updateOrder } from "@/lib/api/services";
import { cn, formatDate, formatPKR } from "@/lib/utils";
import type { Order, OrderStatus, PaymentStatus } from "@/types";
import {
  CheckCircle2,
  ClipboardList,
  PackageCheck,
  ShoppingBag,
  Truck,
  XCircle,
} from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

type StatusFilter = "all" | OrderStatus;

function orderBadgeTone(
  status: OrderStatus | PaymentStatus
): "green" | "yellow" | "red" | "gray" | "blue" | "navy" {
  switch (status) {
    case "verified":
    case "delivered":
      return "green";
    case "manual_review":
    case "pending":
    case "awaiting_payment":
    case "payment_submitted":
    case "submitted":
    case "unpaid":
      return "yellow";
    case "rejected":
    case "failed":
      return "red";
    case "shipped":
      return "blue";
    default:
      return "gray";
  }
}

function labelStatus(status: string) {
  return status.replace(/_/g, " ");
}

export default function OrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [selected, setSelected] = useState<Order | null>(null);
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const data = await listOrders();
      setOrders(data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const kpis = useMemo(() => {
    const count = (s: OrderStatus) => orders.filter((o) => o.orderStatus === s).length;
    return {
      total: orders.length,
      pending: count("pending") + count("payment_submitted") + count("manual_review"),
      awaiting: count("awaiting_payment"),
      verified: count("verified"),
      shipped: count("shipped"),
      delivered: count("delivered"),
    };
  }, [orders]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return orders.filter((o) => {
      const matchesStatus = statusFilter === "all" || o.orderStatus === statusFilter;
      const matchesQuery =
        !q ||
        o.id.toLowerCase().includes(q) ||
        o.customerName.toLowerCase().includes(q) ||
        o.customerPhone.includes(q) ||
        o.items.some((i) => i.productName.toLowerCase().includes(q));
      return matchesStatus && matchesQuery;
    });
  }, [orders, query, statusFilter]);

  const patchSelected = async (patch: Partial<Order>, message: string) => {
    if (!selected) return;
    setBusy(true);
    try {
      const next = await updateOrder(selected.id, patch);
      setOrders((prev) => prev.map((o) => (o.id === next.id ? next : o)));
      setSelected(next);
      toast.success(message);
    } catch {
      toast.error("Could not update order");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-5 animate-fade-in">
      <DemoBanner feature="orders" />

      <div>
        <h2 className="text-2xl font-semibold text-ink">Orders</h2>
        <p className="mt-1 text-sm text-ink-muted">
          Track payments, verification, and fulfillment from one place.
        </p>
      </div>

      {loading ? (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-28" />
          ))}
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-3 xl:grid-cols-6">
          <KpiCard label="Total" value={kpis.total} icon={ShoppingBag} />
          <KpiCard label="Pending review" value={kpis.pending} icon={ClipboardList} />
          <KpiCard label="Awaiting payment" value={kpis.awaiting} icon={XCircle} />
          <KpiCard label="Verified" value={kpis.verified} icon={CheckCircle2} />
          <KpiCard label="Shipped" value={kpis.shipped} icon={Truck} />
          <KpiCard label="Delivered" value={kpis.delivered} icon={PackageCheck} />
        </div>
      )}

      <Card>
        <CardHeader
          title="Order list"
          description="Search by customer, phone, or order ID"
          action={
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <SearchInput
                value={query}
                onChange={setQuery}
                placeholder="Search orders…"
                className="w-full sm:w-64"
              />
              <select
                className="input-field w-full sm:w-48"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value as StatusFilter)}
              >
                <option value="all">All statuses</option>
                <option value="pending">Pending</option>
                <option value="awaiting_payment">Awaiting payment</option>
                <option value="payment_submitted">Payment submitted</option>
                <option value="manual_review">Manual review</option>
                <option value="verified">Verified</option>
                <option value="rejected">Rejected</option>
                <option value="failed">Failed</option>
                <option value="shipped">Shipped</option>
                <option value="delivered">Delivered</option>
              </select>
            </div>
          }
        />

        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} className="h-14" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <EmptyState
            icon={ShoppingBag}
            title="No orders found"
            description="Try a different search or status filter."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full text-left text-sm">
              <thead>
                <tr className="border-b border-line text-xs uppercase tracking-wide text-ink-muted">
                  <th className="px-3 py-2 font-semibold">Order</th>
                  <th className="px-3 py-2 font-semibold">Customer</th>
                  <th className="px-3 py-2 font-semibold">Amount</th>
                  <th className="px-3 py-2 font-semibold">Payment</th>
                  <th className="px-3 py-2 font-semibold">Status</th>
                  <th className="px-3 py-2 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((order) => (
                  <tr
                    key={order.id}
                    onClick={() => setSelected(order)}
                    className={cn(
                      "cursor-pointer border-b border-line/70 transition hover:bg-brand-app/70",
                      selected?.id === order.id && "bg-brand-app"
                    )}
                  >
                    <td className="px-3 py-3 font-medium text-ink">{order.id}</td>
                    <td className="px-3 py-3">
                      <div className="font-medium text-ink">{order.customerName}</div>
                      <div className="text-xs text-ink-muted">{order.customerPhone}</div>
                    </td>
                    <td className="px-3 py-3">{formatPKR(order.totalAmount)}</td>
                    <td className="px-3 py-3">
                      <Badge tone={orderBadgeTone(order.paymentStatus)}>
                        {labelStatus(order.paymentStatus)}
                      </Badge>
                    </td>
                    <td className="px-3 py-3">
                      <Badge tone={orderBadgeTone(order.orderStatus)}>
                        {labelStatus(order.orderStatus)}
                      </Badge>
                    </td>
                    <td className="px-3 py-3 text-ink-muted">{formatDate(order.createdAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <Modal
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected ? `Order ${selected.id}` : "Order details"}
        wide
      >
        {selected && (
          <div className="space-y-5">
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="rounded-xl border border-line bg-brand-app/50 p-3">
                <p className="text-xs text-ink-muted">Customer</p>
                <p className="mt-1 font-medium text-ink">{selected.customerName}</p>
                <p className="text-sm text-ink-muted">{selected.customerPhone}</p>
              </div>
              <div className="rounded-xl border border-line bg-brand-app/50 p-3">
                <p className="text-xs text-ink-muted">Totals</p>
                <p className="mt-1 font-medium text-ink">{formatPKR(selected.totalAmount)}</p>
                <p className="text-sm text-ink-muted">Created {formatDate(selected.createdAt)}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Badge tone={orderBadgeTone(selected.orderStatus)}>
                Order: {labelStatus(selected.orderStatus)}
              </Badge>
              <Badge tone={orderBadgeTone(selected.paymentStatus)}>
                Payment: {labelStatus(selected.paymentStatus)}
              </Badge>
            </div>

            <div>
              <h4 className="mb-2 text-sm font-semibold text-ink">Items</h4>
              <div className="space-y-2">
                {selected.items.map((item) => (
                  <div
                    key={`${item.productName}-${item.quantity}`}
                    className="flex items-center justify-between rounded-xl border border-line px-3 py-2"
                  >
                    <span className="text-sm text-ink">
                      {item.productName} × {item.quantity}
                    </span>
                    <span className="text-sm font-medium">{formatPKR(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
            </div>

            {(selected.ocrTransactionId ||
              selected.ocrAmount != null ||
              selected.ocrConfidence != null ||
              selected.verificationReasons?.length) && (
              <div className="rounded-xl border border-line p-3">
                <h4 className="mb-2 text-sm font-semibold text-ink">Payment verification</h4>
                <div className="grid gap-2 text-sm sm:grid-cols-2">
                  {selected.ocrTransactionId && (
                    <p>
                      <span className="text-ink-muted">Txn ID: </span>
                      {selected.ocrTransactionId}
                    </p>
                  )}
                  {selected.ocrAmount != null && (
                    <p>
                      <span className="text-ink-muted">OCR amount: </span>
                      {formatPKR(selected.ocrAmount)}
                    </p>
                  )}
                  {selected.receiverAccount && (
                    <p>
                      <span className="text-ink-muted">Receiver: </span>
                      {selected.receiverAccount}
                    </p>
                  )}
                  {selected.ocrConfidence != null && (
                    <p>
                      <span className="text-ink-muted">Confidence: </span>
                      {Math.round(selected.ocrConfidence * 100)}%
                    </p>
                  )}
                </div>
                {selected.verificationReasons?.length ? (
                  <ul className="mt-2 list-disc space-y-1 pl-5 text-sm text-ink-muted">
                    {selected.verificationReasons.map((r) => (
                      <li key={r}>{r}</li>
                    ))}
                  </ul>
                ) : null}
              </div>
            )}

            <div className="flex flex-wrap gap-2 border-t border-line pt-4">
              <Button
                loading={busy}
                onClick={() =>
                  patchSelected(
                    { orderStatus: "verified", paymentStatus: "verified" },
                    "Payment approved"
                  )
                }
                disabled={
                  selected.orderStatus === "verified" ||
                  selected.orderStatus === "delivered" ||
                  selected.orderStatus === "shipped"
                }
              >
                Approve payment
              </Button>
              <Button
                variant="danger"
                loading={busy}
                onClick={() =>
                  patchSelected(
                    { orderStatus: "rejected", paymentStatus: "rejected" },
                    "Payment rejected"
                  )
                }
                disabled={selected.orderStatus === "rejected" || selected.orderStatus === "delivered"}
              >
                Reject
              </Button>
              <Button
                variant="secondary"
                loading={busy}
                onClick={() => patchSelected({ orderStatus: "shipped" }, "Marked as shipped")}
                disabled={
                  selected.orderStatus !== "verified" && selected.orderStatus !== "shipped"
                }
              >
                Mark shipped
              </Button>
              <Button
                variant="secondary"
                loading={busy}
                onClick={() => patchSelected({ orderStatus: "delivered" }, "Marked as delivered")}
                disabled={selected.orderStatus !== "shipped" && selected.orderStatus !== "verified"}
              >
                Mark delivered
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
