"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useEffect, useRef, useState, type ReactNode } from "react";
import { toast } from "sonner";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/auth-context";
import { deleteMessage, editMessage, listMessages, markConversationRead, sendMessage } from "@/lib/messages/api";
import type { PublicMessage } from "@/lib/messages/types";
import { useSocket } from "@/lib/socket/socket-provider";
import { MessageBubble } from "./message-bubble";
import { MessageComposer } from "./message-composer";

function mergeMessage(current: PublicMessage[], incoming: PublicMessage): PublicMessage[] {
  const index = current.findIndex((message) => message.id === incoming.id);
  if (index === -1) return [...current, incoming];
  const next = current.slice();
  next[index] = incoming;
  return next;
}

export function ConversationThread({ conversationId, header }: { conversationId: string; header: ReactNode }) {
  const { fetcher, user } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();

  const [messages, setMessages] = useState<PublicMessage[] | null>(null);
  const [hasMore, setHasMore] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const isNearBottomRef = useRef(true);

  // Cold-start load. The parent mounts this component with `key={conversationId}`, so switching
  // conversations remounts it fresh rather than needing an in-place reset here.
  useEffect(() => {
    let cancelled = false;

    listMessages(fetcher, conversationId).then(
      (page) => {
        if (cancelled) return;
        setMessages(page.messages);
        setHasMore(page.hasMore);
      },
      () => {
        if (!cancelled) setMessages([]);
      }
    );

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Mark read whenever the thread is opened.
  useEffect(() => {
    markConversationRead(fetcher, conversationId).catch(() => {});
    queryClient.invalidateQueries({ queryKey: ["conversations"] });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  useEffect(() => {
    if (isNearBottomRef.current) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages?.length]);

  useEffect(() => {
    if (!socket) return;

    socket.emit("conversation:join", { conversationId });

    function handleNew(message: PublicMessage) {
      if (message.conversationId !== conversationId) return;
      setMessages((current) => (current ? mergeMessage(current, message) : current));
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
      if (message.sender.id !== user?.id) {
        markConversationRead(fetcher, conversationId, message.id).catch(() => {});
      }
    }

    function handleUpdated(message: PublicMessage) {
      if (message.conversationId !== conversationId) return;
      setMessages((current) => (current ? mergeMessage(current, message) : current));
    }

    function handleDeleted(payload: { conversationId: string; messageId: string }) {
      if (payload.conversationId !== conversationId) return;
      setMessages((current) =>
        current
          ? current.map((message) =>
              message.id === payload.messageId ? { ...message, isDeleted: true, body: "" } : message
            )
          : current
      );
    }

    socket.on("message:new", handleNew);
    socket.on("message:updated", handleUpdated);
    socket.on("message:deleted", handleDeleted);

    return () => {
      socket.emit("conversation:leave", { conversationId });
      socket.off("message:new", handleNew);
      socket.off("message:updated", handleUpdated);
      socket.off("message:deleted", handleDeleted);
    };
  }, [socket, conversationId, fetcher, user?.id, queryClient]);

  async function handleLoadMore() {
    if (!messages?.length) return;
    setLoadingMore(true);
    isNearBottomRef.current = false;
    try {
      const page = await listMessages(fetcher, conversationId, messages[0]!.id);
      setMessages((current) => [...page.messages, ...(current ?? [])]);
      setHasMore(page.hasMore);
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't load older messages");
    } finally {
      setLoadingMore(false);
    }
  }

  async function handleSend(body: string) {
    isNearBottomRef.current = true;
    try {
      const { message } = await sendMessage(fetcher, conversationId, body);
      setMessages((current) => (current ? mergeMessage(current, message) : current));
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't send the message");
      throw error;
    }
  }

  async function handleEdit(messageId: string, body: string) {
    try {
      const { message } = await editMessage(fetcher, messageId, body);
      setMessages((current) => (current ? mergeMessage(current, message) : current));
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't edit the message");
    }
  }

  async function handleDelete(messageId: string) {
    try {
      await deleteMessage(fetcher, messageId);
      setMessages((current) =>
        current ? current.map((m) => (m.id === messageId ? { ...m, isDeleted: true, body: "" } : m)) : current
      );
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't delete the message");
    }
  }

  return (
    <div className="flex h-[calc(100vh-8.5rem)] flex-col overflow-hidden rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950 md:h-[calc(100vh-6rem)]">
      {header}

      <div
        className="flex-1 overflow-y-auto px-4 py-4"
        onScroll={(event) => {
          const el = event.currentTarget;
          isNearBottomRef.current = el.scrollHeight - el.scrollTop - el.clientHeight < 120;
        }}
      >
        {messages === null ? (
          <Spinner />
        ) : (
          <div className="flex flex-col gap-3">
            {hasMore && (
              <button
                onClick={handleLoadMore}
                disabled={loadingMore}
                className="mx-auto rounded-full border border-zinc-200 px-3 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-50 disabled:opacity-60 dark:border-zinc-800 dark:text-zinc-400 dark:hover:bg-zinc-900"
              >
                {loadingMore ? "Loading…" : "Load older messages"}
              </button>
            )}

            {messages.map((message, index) => {
              const previous = messages[index - 1];
              const showSender = !previous || previous.sender.id !== message.sender.id;
              return (
                <MessageBubble
                  key={message.id}
                  message={message}
                  isOwn={message.sender.id === user?.id}
                  showSender={showSender}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                />
              );
            })}
            <div ref={bottomRef} />
          </div>
        )}
      </div>

      <MessageComposer onSend={handleSend} />
    </div>
  );
}
