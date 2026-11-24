"use client";

import { Badge } from "@/components/ui/Badge";
import { SearchInput } from "@/components/ui/SearchInput";
import { Skeleton } from "@/components/ui/Skeleton";
import { EmptyState } from "@/components/ui/EmptyState";
import { cn, formatRelativeTime, initials } from "@/lib/utils";
import type { Conversation } from "@/types";
import { Bot, MessageSquare, UserRound } from "lucide-react";

export type InboxFilter = "all" | "unread" | "ai" | "human";

const FILTERS: { id: InboxFilter; label: string }[] = [
  { id: "all", label: "All" },
  { id: "unread", label: "Unread" },
  { id: "ai", label: "AI Active" },
  { id: "human", label: "Human Assigned" },
];

export function ConversationList({
  conversations,
  selectedId,
  onSelect,
  search,
  onSearchChange,
  filter,
  onFilterChange,
  loading,
}: {
  conversations: Conversation[];
  selectedId: string | null;
  onSelect: (chatId: string) => void;
  search: string;
  onSearchChange: (value: string) => void;
  filter: InboxFilter;
  onFilterChange: (filter: InboxFilter) => void;
  loading?: boolean;
}) {
  return (
    <div className="flex h-full min-h-0 flex-col bg-white">
      <div className="shrink-0 space-y-3 border-b border-line p-3">
        <SearchInput
          value={search}
          onChange={onSearchChange}
          placeholder="Search conversations…"
        />
        <div className="flex flex-wrap gap-1.5">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              onClick={() => onFilterChange(f.id)}
              className={cn(
                "rounded-full px-2.5 py-1 text-xs font-semibold transition",
                filter === f.id
                  ? "bg-brand-navy text-white"
                  : "bg-brand-app text-ink-muted hover:text-ink"
              )}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {loading ? (
          <div className="space-y-2 p-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-[72px]" />
            ))}
          </div>
        ) : conversations.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No conversations"
            description="Messages from WhatsApp will show up here when they arrive."
            className="py-10"
          />
        ) : (
          <ul className="divide-y divide-line">
            {conversations.map((c) => {
              const selected = c.chatId === selectedId;
              return (
                <li key={c.chatId}>
                  <button
                    type="button"
                    onClick={() => onSelect(c.chatId)}
                    className={cn(
                      "flex w-full items-start gap-3 px-3 py-3 text-left transition hover:bg-brand-app",
                      selected && "bg-brand-soft/70"
                    )}
                  >
                    <div className="relative shrink-0">
                      <div className="flex h-11 w-11 items-center justify-center rounded-full bg-brand-navy text-sm font-semibold text-white">
                        {initials(c.name || c.phone || "?")}
                      </div>
                      {c.aiActive ? (
                        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5">
                          <Bot className="h-3 w-3 text-brand-secondary" />
                        </span>
                      ) : (
                        <span className="absolute -bottom-0.5 -right-0.5 rounded-full bg-white p-0.5">
                          <UserRound className="h-3 w-3 text-ink-muted" />
                        </span>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <div className="truncate text-sm font-semibold text-ink">
                          {c.name || c.phone}
                        </div>
                        <div className="shrink-0 text-[11px] text-ink-muted">
                          {formatRelativeTime(c.lastMessageAt)}
                        </div>
                      </div>
                      <div className="mt-0.5 truncate text-[11px] text-ink-muted">
                        {c.phone}
                      </div>
                      <div className="mt-1 flex items-center gap-2">
                        <p className="min-w-0 flex-1 truncate text-sm text-ink-muted">
                          {c.lastMessage || "—"}
                        </p>
                        <div className="flex shrink-0 items-center gap-1">
                          {c.status === "closed" && (
                            <Badge tone="gray">Closed</Badge>
                          )}
                          {c.unread > 0 && (
                            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-brand-green px-1.5 text-[10px] font-bold text-white">
                              {c.unread > 99 ? "99+" : c.unread}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </button>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
