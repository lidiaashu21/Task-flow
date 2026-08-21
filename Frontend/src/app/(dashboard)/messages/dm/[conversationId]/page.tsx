"use client";

import { useQuery } from "@tanstack/react-query";
import { use } from "react";
import { ConversationThread } from "@/components/messages/conversation-thread";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";
import { getConversation } from "@/lib/messages/api";

export default function DmConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  const { fetcher, user } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["conversations", conversationId],
    queryFn: () => getConversation(fetcher, conversationId),
  });

  if (isLoading || !data) return <Spinner />;

  const other = data.conversation.members.find((member) => member.id !== user?.id) ?? data.conversation.members[0];

  return (
    <ConversationThread
      key={conversationId}
      conversationId={conversationId}
      header={
        <div className="flex items-center gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <Avatar name={other?.name ?? "Unknown"} src={other?.avatarUrl} size="sm" />
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{other?.name ?? "Unknown"}</span>
        </div>
      }
    />
  );
}
