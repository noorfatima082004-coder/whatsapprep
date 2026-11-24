"use client";

import {
  ChatThread,
  ConversationList,
  CustomerPanel,
  type InboxFilter,
} from "@/components/inbox";
import { Button } from "@/components/ui/Button";
import { DemoBanner } from "@/components/ui/DemoBanner";
import { EmptyState } from "@/components/ui/EmptyState";
import {
  fetchMessages,
  listTeam,
  sendInboxReply,
} from "@/lib/api/services";
import { POLL_INTERVAL_MS } from "@/lib/constants";
import { getTakeovers, saveTakeovers, type TakeoverMap } from "@/lib/demo/store";
import { cn, phoneFromChatId } from "@/lib/utils";
import type { Conversation, InboxMessage, TeamMember } from "@/types";
import {
  AlertCircle,
  Info,
  PanelRightClose,
  PanelRightOpen,
  RefreshCcw,
  X,
} from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";

const LAST_SEEN_KEY = "whatsrep_last_seen";
const CLOSED_KEY = "whatsrep_closed_chats";

type LastSeenMap = Record<string, string>;
type ClosedMap = Record<string, boolean>;

function readJson<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson<T>(key: string, value: T) {
  if (typeof window === "undefined") return;
  localStorage.setItem(key, JSON.stringify(value));
}

function previewText(m: InboxMessage) {
  if (m.message?.trim()) return m.message.trim();
  const t = m.message_type || "";
  if (t.includes("image")) return "📷 Image";
  if (t.includes("video")) return "🎥 Video";
  if (t.includes("audio")) return "🎤 Audio";
  if (t.includes("document")) return "📄 Document";
  if (t.includes("sticker")) return "Sticker";
  if (t.includes("location")) return "📍 Location";
  if (t.includes("contact")) return "👤 Contact";
  return "Message";
}

function buildConversations(
  messages: InboxMessage[],
  takeovers: TakeoverMap,
  lastSeen: LastSeenMap,
  closed: ClosedMap
): Conversation[] {
  const byChat = new Map<string, InboxMessage[]>();
  for (const m of messages) {
    if (!m.chat_id) continue;
    const list = byChat.get(m.chat_id) ?? [];
    list.push(m);
    byChat.set(m.chat_id, list);
  }

  const conversations: Conversation[] = [];
  Array.from(byChat.entries()).forEach(([chatId, msgs]) => {
    const sorted = [...msgs].sort(
      (a, b) =>
        new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
    );
    const last = sorted[sorted.length - 1];
    const name =
      [...sorted].reverse().find((m) => m.sender_name?.trim())?.sender_name ||
      phoneFromChatId(chatId);
    const phone = phoneFromChatId(chatId);
    const takeover = takeovers[chatId];
    const seenAt = lastSeen[chatId];
    const seenMs = seenAt ? new Date(seenAt).getTime() : 0;
    const unread = sorted.filter((m) => {
      if (m.direction === "out") return false;
      return new Date(m.received_at).getTime() > seenMs;
    }).length;

    conversations.push({
      chatId,
      name,
      phone,
      lastMessage: last ? previewText(last) : "",
      lastMessageAt: last?.received_at ?? new Date(0).toISOString(),
      unread,
      aiActive: takeover?.aiActive ?? true,
      assignedTo: takeover?.assignedTo ?? null,
      status: closed[chatId] ? "closed" : "open",
      messages: sorted,
    });
  });

  return conversations.sort(
    (a, b) =>
      new Date(b.lastMessageAt).getTime() - new Date(a.lastMessageAt).getTime()
  );
}

function InboxPageInner() {
  const searchParams = useSearchParams();
  const qParam = searchParams.get("q") ?? "";

  const [messages, setMessages] = useState<InboxMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mobileView, setMobileView] = useState<"list" | "chat">("list");
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [search, setSearch] = useState(qParam);
  const [filter, setFilter] = useState<InboxFilter>("all");
  const [takeovers, setTakeovers] = useState<TakeoverMap>({});
  const [lastSeen, setLastSeen] = useState<LastSeenMap>({});
  const [closed, setClosed] = useState<ClosedMap>({});
  const [team, setTeam] = useState<TeamMember[]>([]);
  const [loadingTeam, setLoadingTeam] = useState(false);

  useEffect(() => {
    setSearch(qParam);
  }, [qParam]);

  useEffect(() => {
    setTakeovers(getTakeovers());
    setLastSeen(readJson<LastSeenMap>(LAST_SEEN_KEY, {}));
    setClosed(readJson<ClosedMap>(CLOSED_KEY, {}));
  }, []);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      setLoadingTeam(true);
      try {
        const members = await listTeam();
        if (!cancelled) setTeam(members);
      } catch {
        if (!cancelled) setTeam([]);
      } finally {
        if (!cancelled) setLoadingTeam(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const loadMessages = useCallback(async (opts?: { silent?: boolean }) => {
    if (!opts?.silent) setLoading(true);
    try {
      const res = await fetchMessages();
      setMessages(res.messages ?? []);
      setError(null);
    } catch (err) {
      const msg =
        err instanceof Error ? err.message : "Failed to load messages";
      setError(msg);
      if (!opts?.silent) {
        setMessages([]);
      }
    } finally {
      if (!opts?.silent) setLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadMessages();
  }, [loadMessages]);

  useEffect(() => {
    const id = window.setInterval(() => {
      void loadMessages({ silent: true });
    }, POLL_INTERVAL_MS);
    return () => window.clearInterval(id);
  }, [loadMessages]);

  const conversations = useMemo(
    () => buildConversations(messages, takeovers, lastSeen, closed),
    [messages, takeovers, lastSeen, closed]
  );

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return conversations.filter((c) => {
      if (filter === "unread" && c.unread === 0) return false;
      if (filter === "ai" && !c.aiActive) return false;
      if (filter === "human" && (c.aiActive || !c.assignedTo)) return false;
      if (!q) return true;
      return (
        c.name.toLowerCase().includes(q) ||
        c.phone.toLowerCase().includes(q) ||
        c.lastMessage.toLowerCase().includes(q)
      );
    });
  }, [conversations, filter, search]);

  const selected =
    conversations.find((c) => c.chatId === selectedId) ?? null;

  const markSeen = useCallback((chatId: string) => {
    const now = new Date().toISOString();
    setLastSeen((prev) => {
      const next = { ...prev, [chatId]: now };
      writeJson(LAST_SEEN_KEY, next);
      return next;
    });
  }, []);

  useEffect(() => {
    if (!selectedId || !selected) return;
    if (selected.unread > 0) markSeen(selectedId);
  }, [selectedId, selected?.unread, selected?.lastMessageAt, markSeen, selected]);

  const selectChat = useCallback(
    (chatId: string) => {
      setSelectedId(chatId);
      setMobileView("chat");
      markSeen(chatId);
    },
    [markSeen]
  );

  const patchTakeover = useCallback(
    (chatId: string, patch: { aiActive?: boolean; assignedTo?: string | null }) => {
      setTakeovers((prev) => {
        const current = prev[chatId] ?? { aiActive: true, assignedTo: null };
        const next = {
          ...prev,
          [chatId]: {
            aiActive: patch.aiActive ?? current.aiActive,
            assignedTo:
              patch.assignedTo !== undefined
                ? patch.assignedTo
                : current.assignedTo,
          },
        };
        saveTakeovers(next);
        return next;
      });
    },
    []
  );

  const setClosedState = useCallback((chatId: string, isClosed: boolean) => {
    setClosed((prev) => {
      const next = { ...prev };
      if (isClosed) next[chatId] = true;
      else delete next[chatId];
      writeJson(CLOSED_KEY, next);
      return next;
    });
  }, []);

  const handleSend = async (text: string) => {
    if (!selectedId) return;
    setSending(true);
    try {
      await sendInboxReply(selectedId, text);
      toast.success("Message sent");
      markSeen(selectedId);
      await loadMessages({ silent: true });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Failed to send message";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="flex h-[calc(100dvh-7.5rem)] min-h-[480px] flex-col animate-fade-in md:h-[calc(100dvh-8.5rem)]">
      <div className="mb-3 shrink-0">
        <DemoBanner feature="takeover" />
        <div className="mt-2 flex items-start gap-2 rounded-xl border border-sky-200 bg-sky-50 px-3.5 py-2.5 text-sm text-sky-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <span>
            Inbox messages are live from your WhatsApp backend. Takeover, assign,
            and close actions are stored locally until those APIs ship.
          </span>
        </div>
      </div>

      {error && !loading && messages.length === 0 ? (
        <div className="flex flex-1 items-center justify-center rounded-card border border-line bg-white">
          <EmptyState
            icon={AlertCircle}
            title="Couldn’t load inbox"
            description={error}
            action={
              <Button onClick={() => void loadMessages()}>
                <RefreshCcw className="h-4 w-4" />
                Retry
              </Button>
            }
          />
        </div>
      ) : (
        <div className="relative flex min-h-0 flex-1 overflow-hidden rounded-card border border-line bg-white shadow-card">
          {/* Left: conversation list */}
          <div
            className={cn(
              "w-full shrink-0 border-r border-line lg:w-[320px] xl:w-[360px]",
              mobileView === "chat" ? "hidden lg:flex lg:flex-col" : "flex flex-col"
            )}
          >
            <ConversationList
              conversations={filtered}
              selectedId={selectedId}
              onSelect={selectChat}
              search={search}
              onSearchChange={setSearch}
              filter={filter}
              onFilterChange={setFilter}
              loading={loading && messages.length === 0}
            />
          </div>

          {/* Middle: chat thread */}
          <div
            className={cn(
              "min-w-0 flex-1 flex-col",
              mobileView === "list" ? "hidden lg:flex" : "flex"
            )}
          >
            <div className="relative flex min-h-0 flex-1 flex-col">
              <ChatThread
                conversation={selected}
                onBack={() => setMobileView("list")}
                onSend={handleSend}
                sending={sending}
              />
              {selected && (
                <button
                  type="button"
                  onClick={() => setDetailsOpen(true)}
                  className="absolute right-3 top-3 z-10 rounded-xl border border-line bg-white p-2 text-ink-muted shadow-sm hover:bg-brand-app xl:hidden"
                  aria-label="Open customer details"
                >
                  <PanelRightOpen className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>

          {/* Right: customer panel (desktop) */}
          <div className="hidden w-[300px] shrink-0 border-l border-line xl:flex xl:flex-col">
            <CustomerPanel
              conversation={selected}
              team={team}
              loadingTeam={loadingTeam}
              onTakeOver={() => {
                if (!selected) return;
                patchTakeover(selected.chatId, { aiActive: false });
                toast.success("You took over this chat");
              }}
              onReturnToAI={() => {
                if (!selected) return;
                patchTakeover(selected.chatId, { aiActive: true });
                toast.success("Returned to AI");
              }}
              onAssign={(memberId) => {
                if (!selected) return;
                patchTakeover(selected.chatId, {
                  aiActive: false,
                  assignedTo: memberId,
                });
                const name = team.find((t) => t.id === memberId)?.name ?? "agent";
                toast.success(`Assigned to ${name}`);
              }}
              onCloseConversation={() => {
                if (!selected) return;
                setClosedState(selected.chatId, true);
                toast.success("Conversation closed");
              }}
              onReopenConversation={() => {
                if (!selected) return;
                setClosedState(selected.chatId, false);
                toast.success("Conversation reopened");
              }}
            />
          </div>

          {/* Mobile / tablet details drawer */}
          {detailsOpen && selected && (
            <div className="absolute inset-0 z-20 flex xl:hidden">
              <button
                type="button"
                className="flex-1 bg-brand-navy/40"
                aria-label="Close details"
                onClick={() => setDetailsOpen(false)}
              />
              <div className="relative flex h-full w-full max-w-sm flex-col border-l border-line bg-white shadow-soft animate-slide-in">
                <button
                  type="button"
                  onClick={() => setDetailsOpen(false)}
                  className="absolute right-3 top-3 z-10 rounded-lg p-1.5 text-ink-muted hover:bg-brand-app"
                  aria-label="Close panel"
                >
                  <X className="h-4 w-4" />
                </button>
                <div className="flex items-center gap-2 border-b border-line px-4 py-3 pr-12">
                  <PanelRightClose className="h-4 w-4 text-ink-muted" />
                  <span className="text-sm font-semibold text-ink">Details</span>
                </div>
                <div className="min-h-0 flex-1">
                  <CustomerPanel
                    conversation={selected}
                    team={team}
                    loadingTeam={loadingTeam}
                    onTakeOver={() => {
                      patchTakeover(selected.chatId, { aiActive: false });
                      toast.success("You took over this chat");
                      setDetailsOpen(false);
                    }}
                    onReturnToAI={() => {
                      patchTakeover(selected.chatId, { aiActive: true });
                      toast.success("Returned to AI");
                      setDetailsOpen(false);
                    }}
                    onAssign={(memberId) => {
                      patchTakeover(selected.chatId, {
                        aiActive: false,
                        assignedTo: memberId,
                      });
                      const name =
                        team.find((t) => t.id === memberId)?.name ?? "agent";
                      toast.success(`Assigned to ${name}`);
                      setDetailsOpen(false);
                    }}
                    onCloseConversation={() => {
                      setClosedState(selected.chatId, true);
                      toast.success("Conversation closed");
                      setDetailsOpen(false);
                    }}
                    onReopenConversation={() => {
                      setClosedState(selected.chatId, false);
                      toast.success("Conversation reopened");
                      setDetailsOpen(false);
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function InboxPage() {
  return (
    <Suspense
      fallback={
        <div className="flex h-[calc(100dvh-7.5rem)] min-h-[480px] items-center justify-center rounded-card border border-line bg-white">
          <EmptyState
            icon={RefreshCcw}
            title="Loading inbox…"
            description="Fetching your WhatsApp conversations."
          />
        </div>
      }
    >
      <InboxPageInner />
    </Suspense>
  );
}
