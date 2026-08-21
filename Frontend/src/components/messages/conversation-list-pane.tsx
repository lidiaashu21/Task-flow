"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { MessageSquarePlus, Plus } from "lucide-react";
import { useEffect, useState } from "react";
import { ConversationListItem } from "@/components/messages/conversation-list-item";
import { CreateChannelDialog } from "@/components/messages/create-channel-dialog";
import { StartDmDialog } from "@/components/messages/start-dm-dialog";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";
import { listConversations } from "@/lib/messages/api";
import { useSocket } from "@/lib/socket/socket-provider";

export function ConversationListPane({ activeId }: { activeId?: string }) {
  const { fetcher } = useAuth();
  const socket = useSocket();
  const queryClient = useQueryClient();
  const [dmOpen, setDmOpen] = useState(false);
  const [channelOpen, setChannelOpen] = useState(false);

  const { data: conversations, isLoading } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => listConversations(fetcher),
  });

  useEffect(() => {
    if (!socket) return;

    function refresh() {
      queryClient.invalidateQueries({ queryKey: ["conversations"] });
    }

    socket.on("conversation:new", refresh);
    socket.on("message:new", refresh);
    return () => {
      socket.off("conversation:new", refresh);
      socket.off("message:new", refresh);
    };
  }, [socket, queryClient]);

  return (
    <Card className="flex h-full flex-col overflow-hidden py-0">
      <div className="flex items-center justify-between gap-2 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
        <h1 className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Messages</h1>
        <div className="flex gap-1">
          <button
            onClick={() => setDmOpen(true)}
            title="New direct message"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <MessageSquarePlus className="h-4 w-4" />
          </button>
          <button
            onClick={() => setChannelOpen(true)}
            title="New channel"
            className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
          >
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
        {isLoading ? (
          <Spinner />
        ) : !conversations?.length ? (
          <EmptyState
            icon={MessageSquarePlus}
            title="No conversations yet"
            description="Start a DM or create a channel to begin chatting."
          />
        ) : (
          <div className="flex flex-col gap-0.5">
            {conversations.map((conversation) => (
              <ConversationListItem key={conversation.id} conversation={conversation} active={conversation.id === activeId} />
            ))}
          </div>
        )}
      </div>

      <StartDmDialog open={dmOpen} onClose={() => setDmOpen(false)} />
      <CreateChannelDialog open={channelOpen} onClose={() => setChannelOpen(false)} />
    </Card>
  );
}
