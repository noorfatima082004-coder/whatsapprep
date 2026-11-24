"use client";

import { Button } from "@/components/ui/Button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Skeleton } from "@/components/ui/Skeleton";
import { cn, formatTime, initials } from "@/lib/utils";
import type { Conversation, InboxMessage, MessageType } from "@/types";
import {
  ArrowLeft,
  FileText,
  Image as ImageIcon,
  MapPin,
  MessageSquare,
  Mic,
  Send,
  Sticker,
  UserRound,
  Video,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";

function mediaLabel(type: MessageType): string | null {
  switch (type) {
    case "imageMessage":
      return "Image";
    case "videoMessage":
      return "Video";
    case "audioMessage":
      return "Audio";
    case "documentMessage":
      return "Document";
    case "stickerMessage":
      return "Sticker";
    case "locationMessage":
      return "Location";
    case "contactMessage":
      return "Contact";
    case "textMessage":
      return null;
    default:
      if (!type || type === "text") return null;
      return type.replace(/Message$/i, "") || "Media";
  }
}

function MediaIcon({ type }: { type: MessageType }) {
  const cls = "h-3.5 w-3.5 shrink-0";
  switch (type) {
    case "imageMessage":
      return <ImageIcon className={cls} />;
    case "videoMessage":
      return <Video className={cls} />;
    case "audioMessage":
      return <Mic className={cls} />;
    case "documentMessage":
      return <FileText className={cls} />;
    case "stickerMessage":
      return <Sticker className={cls} />;
    case "locationMessage":
      return <MapPin className={cls} />;
    case "contactMessage":
      return <UserRound className={cls} />;
    default:
      return <FileText className={cls} />;
  }
}

function dayKey(iso: string) {
  const d = new Date(iso);
  return `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
}

function dayLabel(iso: string) {
  const d = new Date(iso);
  const today = new Date();
  const yesterday = new Date();
  yesterday.setDate(today.getDate() - 1);
  if (dayKey(iso) === dayKey(today.toISOString())) return "Today";
  if (dayKey(iso) === dayKey(yesterday.toISOString())) return "Yesterday";
  return d.toLocaleDateString([], {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

type ThreadItem =
  | { kind: "day"; id: string; label: string }
  | { kind: "message"; id: string; message: InboxMessage };

function buildThreadItems(messages: InboxMessage[]): ThreadItem[] {
  const sorted = [...messages].sort(
    (a, b) =>
      new Date(a.received_at).getTime() - new Date(b.received_at).getTime()
  );
  const items: ThreadItem[] = [];
  let lastDay = "";
  for (const m of sorted) {
    const key = dayKey(m.received_at);
    if (key !== lastDay) {
      lastDay = key;
      items.push({
        kind: "day",
        id: `day-${key}`,
        label: dayLabel(m.received_at),
      });
    }
    items.push({
      kind: "message",
      id: m.id ?? `${m.chat_id}-${m.received_at}-${m.message}`,
      message: m,
    });
  }
  return items;
}

export function ChatThread({
  conversation,
  onBack,
  onSend,
  sending,
  loading,
}: {
  conversation: Conversation | null;
  onBack?: () => void;
  onSend: (message: string) => Promise<void> | void;
  sending?: boolean;
  loading?: boolean;
}) {
  const [draft, setDraft] = useState("");
  const bottomRef = useRef<HTMLDivElement>(null);
  const items = useMemo(
    () => (conversation ? buildThreadItems(conversation.messages) : []),
    [conversation]
  );

  useEffect(() => {
    setDraft("");
  }, [conversation?.chatId]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [items.length, conversation?.chatId]);

  if (loading) {
    return (
      <div className="flex h-full flex-col bg-[#f0f4f2]">
        <div className="border-b border-line bg-white p-4">
          <Skeleton className="h-10 w-48" />
        </div>
        <div className="flex-1 space-y-3 p-4">
          <Skeleton className="ml-auto h-12 w-2/3" />
          <Skeleton className="h-12 w-1/2" />
          <Skeleton className="ml-auto h-16 w-3/5" />
        </div>
      </div>
    );
  }

  if (!conversation) {
    return (
      <div className="flex h-full items-center justify-center bg-[#f0f4f2]">
        <EmptyState
          icon={MessageSquare}
          title="Select a conversation"
          description="Choose a chat from the left to view messages and reply."
        />
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const text = draft.trim();
    if (!text || sending) return;
    await onSend(text);
    setDraft("");
  };

  return (
    <div className="flex h-full min-h-0 flex-col bg-[#f0f4f2]">
      <div className="flex shrink-0 items-center gap-3 border-b border-line bg-white px-3 py-3">
        {onBack && (
          <button
            type="button"
            onClick={onBack}
            className="rounded-xl p-2 text-ink-muted hover:bg-brand-app lg:hidden"
            aria-label="Back to conversations"
          >
            <ArrowLeft className="h-5 w-5" />
          </button>
        )}
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-brand-navy text-sm font-semibold text-white">
          {initials(conversation.name || conversation.phone || "?")}
        </div>
        <div className="min-w-0 flex-1">
          <div className="truncate text-sm font-semibold text-ink">
            {conversation.name || conversation.phone}
          </div>
          <div className="truncate text-xs text-ink-muted">
            {conversation.phone}
            {conversation.aiActive ? " · AI active" : " · Human handling"}
            {conversation.status === "closed" ? " · Closed" : ""}
          </div>
        </div>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto px-3 py-4 sm:px-5">
        {conversation.messages.length === 0 ? (
          <EmptyState
            icon={MessageSquare}
            title="No messages yet"
            description="Send a reply to start the conversation."
            className="py-16"
          />
        ) : (
          <div className="mx-auto flex max-w-3xl flex-col gap-2">
            {items.map((item) => {
              if (item.kind === "day") {
                return (
                  <div key={item.id} className="my-2 flex justify-center">
                    <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-medium text-ink-muted shadow-sm">
                      {item.label}
                    </span>
                  </div>
                );
              }

              const m = item.message;
              const outbound = m.direction === "out";
              const label = mediaLabel(m.message_type);

              return (
                <div
                  key={item.id}
                  className={cn(
                    "flex",
                    outbound ? "justify-end" : "justify-start"
                  )}
                >
                  <div
                    className={cn(
                      "max-w-[85%] rounded-2xl px-3 py-2 shadow-sm sm:max-w-[70%]",
                      outbound
                        ? "rounded-br-md bg-[#DCF8C6] text-ink"
                        : "rounded-bl-md bg-white text-ink"
                    )}
                  >
                    {label && (
                      <div className="mb-1 flex items-center gap-1.5 text-xs font-medium text-ink-muted">
                        <MediaIcon type={m.message_type} />
                        <span>{label}</span>
                      </div>
                    )}
                    {m.message ? (
                      <p className="whitespace-pre-wrap break-words text-sm leading-relaxed">
                        {m.message}
                      </p>
                    ) : label ? null : (
                      <p className="text-sm italic text-ink-muted">Empty message</p>
                    )}
                    <div
                      className={cn(
                        "mt-1 text-right text-[10px] text-ink-muted",
                        outbound && "text-[#5a6b62]"
                      )}
                    >
                      {formatTime(m.received_at)}
                    </div>
                  </div>
                </div>
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <form
        onSubmit={handleSubmit}
        className="shrink-0 border-t border-line bg-white p-3"
      >
        <div className="mx-auto flex max-w-3xl items-end gap-2">
          <textarea
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSubmit(e);
              }
            }}
            rows={1}
            placeholder={
              conversation.status === "closed"
                ? "Conversation closed — reopen from the side panel to reply"
                : "Type a message…"
            }
            disabled={sending || conversation.status === "closed"}
            className="input-field max-h-32 min-h-[44px] flex-1 resize-none py-2.5"
          />
          <Button
            type="submit"
            loading={sending}
            disabled={!draft.trim() || conversation.status === "closed"}
            className="h-11 shrink-0 px-4"
            aria-label="Send message"
          >
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </form>
    </div>
  );
}
