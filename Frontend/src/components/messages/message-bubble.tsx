"use client";

import { Pencil, Trash2 } from "lucide-react";
import { useState } from "react";
import { Avatar } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/cn";
import { formatMessageTime } from "@/lib/format";
import type { PublicMessage } from "@/lib/messages/types";

interface MessageBubbleProps {
  message: PublicMessage;
  isOwn: boolean;
  showSender: boolean;
  onEdit: (messageId: string, body: string) => Promise<void>;
  onDelete: (messageId: string) => Promise<void>;
}

export function MessageBubble({ message, isOwn, showSender, onEdit, onDelete }: MessageBubbleProps) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(message.body);
  const [busy, setBusy] = useState(false);

  async function handleSave() {
    const text = draft.trim();
    if (!text || text === message.body) {
      setEditing(false);
      return;
    }
    setBusy(true);
    try {
      await onEdit(message.id, text);
      setEditing(false);
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className={cn("group flex items-end gap-2", isOwn ? "flex-row-reverse" : "flex-row")}>
      {showSender ? (
        <Avatar name={message.sender.name} src={message.sender.avatarUrl} size="sm" />
      ) : (
        <span className="w-6 shrink-0" />
      )}

      <div className={cn("flex max-w-[75%] flex-col gap-1", isOwn ? "items-end" : "items-start")}>
        {showSender && !isOwn && (
          <span className="px-1 text-xs font-medium text-zinc-500 dark:text-zinc-400">{message.sender.name}</span>
        )}

        {editing ? (
          <div className="flex w-64 flex-col gap-2">
            <Textarea rows={2} value={draft} onChange={(event) => setDraft(event.target.value)} autoFocus />
            <div className="flex justify-end gap-2 text-xs">
              <button onClick={() => setEditing(false)} className="text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300">
                Cancel
              </button>
              <button onClick={handleSave} disabled={busy} className="font-medium text-blue-600 hover:underline dark:text-blue-400">
                Save
              </button>
            </div>
          </div>
        ) : (
          <div
            className={cn(
              "rounded-2xl px-3.5 py-2 text-sm",
              message.isDeleted
                ? "italic text-zinc-400 dark:text-zinc-500"
                : isOwn
                  ? "bg-blue-600 text-white"
                  : "bg-zinc-100 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
            )}
          >
            {message.isDeleted ? "This message was deleted" : message.body}
          </div>
        )}

        <div className="flex items-center gap-2 px-1 text-[11px] text-zinc-400">
          <span>{formatMessageTime(message.createdAt)}</span>
          {message.isEdited && !message.isDeleted && <span>(edited)</span>}
          {isOwn && !message.isDeleted && !editing && (
            <span className="hidden gap-2 group-hover:flex">
              <button onClick={() => setEditing(true)} aria-label="Edit message" className="hover:text-zinc-600 dark:hover:text-zinc-300">
                <Pencil className="h-3 w-3" />
              </button>
              <button onClick={() => onDelete(message.id)} aria-label="Delete message" className="hover:text-red-600 dark:hover:text-red-400">
                <Trash2 className="h-3 w-3" />
              </button>
            </span>
          )}
        </div>
      </div>
    </div>
  );
}
