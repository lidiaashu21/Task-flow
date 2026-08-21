import { Hash } from "lucide-react";
import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/cn";
import { formatMessageTime } from "@/lib/format";
import type { ConversationSummary } from "@/lib/messages/types";

export function ConversationListItem({ conversation, active }: { conversation: ConversationSummary; active: boolean }) {
  const href =
    conversation.type === "dm"
      ? `/messages/dm/${conversation.id}`
      : `/messages/channels/${conversation.id}`;

  const title = conversation.type === "dm" ? (conversation.otherParticipant?.name ?? "Unknown") : (conversation.name ?? "Channel");

  return (
    <Link
      href={href}
      className={cn(
        "flex items-center gap-3 rounded-lg px-3 py-2.5 transition-colors",
        active ? "bg-blue-50 dark:bg-blue-950/40" : "hover:bg-zinc-100 dark:hover:bg-zinc-900"
      )}
    >
      {conversation.type === "dm" ? (
        <Avatar name={title} src={conversation.otherParticipant?.avatarUrl} size="md" />
      ) : (
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
          <Hash className="h-4 w-4" aria-hidden="true" />
        </span>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-sm font-medium text-zinc-900 dark:text-zinc-100">{title}</span>
          {conversation.lastMessage && (
            <span className="shrink-0 text-xs text-zinc-400">{formatMessageTime(conversation.lastMessage.createdAt)}</span>
          )}
        </div>
        <div className="flex items-center justify-between gap-2">
          <span className="truncate text-xs text-zinc-500 dark:text-zinc-400">
            {conversation.lastMessage ? conversation.lastMessage.body : "No messages yet"}
          </span>
          {conversation.unreadCount > 0 && <Badge variant="blue">{conversation.unreadCount}</Badge>}
        </div>
      </div>
    </Link>
  );
}
