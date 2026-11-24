"use client";

import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Modal } from "@/components/ui/Modal";
import { initials } from "@/lib/utils";
import type { Conversation, TeamMember } from "@/types";
import {
  Bot,
  ShoppingCart,
  UserRound,
  UserPlus,
  XCircle,
  Package,
  Sparkles,
} from "lucide-react";
import Link from "next/link";
import { useEffect, useState } from "react";

export function CustomerPanel({
  conversation,
  team,
  onTakeOver,
  onReturnToAI,
  onAssign,
  onCloseConversation,
  onReopenConversation,
  loadingTeam,
}: {
  conversation: Conversation | null;
  team: TeamMember[];
  onTakeOver: () => void;
  onReturnToAI: () => void;
  onAssign: (memberId: string) => void;
  onCloseConversation: () => void;
  onReopenConversation: () => void;
  loadingTeam?: boolean;
}) {
  const [assignOpen, setAssignOpen] = useState(false);

  useEffect(() => {
    setAssignOpen(false);
  }, [conversation?.chatId]);

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center bg-white">
        <EmptyState
          icon={UserRound}
          title="Customer details"
          description="Select a conversation to see customer info and actions."
          className="py-10"
        />
      </div>
    );
  }

  const assigned = team.find((t) => t.id === conversation.assignedTo);

  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 border-b border-line px-4 py-4">
        <div className="flex items-center gap-3">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-brand-navy text-sm font-semibold text-white">
            {initials(conversation.name || conversation.phone || "?")}
          </div>
          <div className="min-w-0">
            <div className="truncate font-semibold text-ink">
              {conversation.name || conversation.phone}
            </div>
            <div className="truncate text-sm text-ink-muted">
              {conversation.phone}
            </div>
          </div>
        </div>
        <div className="mt-3 flex flex-wrap gap-1.5">
          <Badge tone={conversation.status === "open" ? "green" : "gray"}>
            {conversation.status === "open" ? "Open" : "Closed"}
          </Badge>
          <Badge tone={conversation.aiActive ? "green" : "navy"}>
            {conversation.aiActive ? "AI Active" : "Human"}
          </Badge>
          {assigned && <Badge tone="blue">{assigned.name}</Badge>}
        </div>
      </div>

      <div className="min-h-0 flex-1 space-y-4 overflow-y-auto p-4">
        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <Sparkles className="h-3.5 w-3.5" />
            AI summary
          </h3>
          <div className="rounded-xl border border-dashed border-line bg-brand-app px-3 py-3 text-sm text-ink-muted">
            Summary will appear once AI conversation insights are connected.
          </div>
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <Package className="h-3.5 w-3.5" />
            Order history
          </h3>
          <div className="rounded-xl border border-line bg-white px-3 py-3">
            <p className="text-sm text-ink-muted">
              No linked orders yet. Order history will sync when the orders API is live.
            </p>
            <Link
              href="/orders"
              className="mt-2 inline-block text-sm font-medium text-brand-secondary hover:underline"
            >
              View orders →
            </Link>
          </div>
        </section>

        <section>
          <h3 className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            <ShoppingCart className="h-3.5 w-3.5" />
            Cart info
          </h3>
          <div className="rounded-xl border border-line bg-brand-app px-3 py-3 text-sm text-ink-muted">
            Cart recovery data will show here when available for this customer.
          </div>
        </section>

        <section>
          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-ink-muted">
            Actions
          </h3>
          <div className="space-y-2">
            {conversation.aiActive ? (
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={onTakeOver}
              >
                <UserRound className="h-4 w-4" />
                Take Over
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={onReturnToAI}
              >
                <Bot className="h-4 w-4" />
                Return to AI
              </Button>
            )}

            <Button
              variant="secondary"
              className="w-full justify-start"
              onClick={() => setAssignOpen(true)}
            >
              <UserPlus className="h-4 w-4" />
              Assign to agent
            </Button>

            {conversation.status === "open" ? (
              <Button
                variant="danger"
                className="w-full justify-start"
                onClick={onCloseConversation}
              >
                <XCircle className="h-4 w-4" />
                Close conversation
              </Button>
            ) : (
              <Button
                variant="secondary"
                className="w-full justify-start"
                onClick={onReopenConversation}
              >
                Reopen conversation
              </Button>
            )}
          </div>
        </section>
      </div>

      <Modal
        open={assignOpen}
        onClose={() => setAssignOpen(false)}
        title="Assign to agent"
      >
        {loadingTeam ? (
          <p className="text-sm text-ink-muted">Loading team…</p>
        ) : team.length === 0 ? (
          <p className="text-sm text-ink-muted">No team members found.</p>
        ) : (
          <ul className="space-y-2">
            {team.map((member) => (
              <li key={member.id}>
                <button
                  type="button"
                  onClick={() => {
                    onAssign(member.id);
                    setAssignOpen(false);
                  }}
                  className="flex w-full items-center gap-3 rounded-xl border border-line px-3 py-2.5 text-left transition hover:bg-brand-app"
                >
                  <div className="flex h-9 w-9 items-center justify-center rounded-full bg-brand-soft text-xs font-semibold text-brand-secondary">
                    {initials(member.name)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="truncate text-sm font-medium text-ink">
                      {member.name}
                    </div>
                    <div className="truncate text-xs text-ink-muted">
                      {member.email} · {member.role}
                    </div>
                  </div>
                  {conversation.assignedTo === member.id && (
                    <Badge tone="green">Assigned</Badge>
                  )}
                </button>
              </li>
            ))}
          </ul>
        )}
      </Modal>
    </div>
  );
}
