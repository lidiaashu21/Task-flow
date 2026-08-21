"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Hash, LogOut, UserPlus } from "lucide-react";
import { use, useState } from "react";
import { toast } from "sonner";
import { AddChannelMemberDialog } from "@/components/messages/add-channel-member-dialog";
import { ConversationThread } from "@/components/messages/conversation-thread";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/auth-context";
import { getConversation, leaveConversation } from "@/lib/messages/api";

export default function ChannelConversationPage({ params }: { params: Promise<{ conversationId: string }> }) {
  const { conversationId } = use(params);
  const { fetcher } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [addOpen, setAddOpen] = useState(false);
  const [leaveOpen, setLeaveOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["conversations", conversationId],
    queryFn: () => getConversation(fetcher, conversationId),
  });

  if (isLoading || !data) return <Spinner />;

  const { conversation } = data;

  async function handleLeave() {
    try {
      await leaveConversation(fetcher, conversationId);
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      toast.success("You left the channel");
      router.push("/messages");
    } catch (error) {
      toast.error(error instanceof ApiError ? error.message : "Couldn't leave the channel");
    }
  }

  return (
    <ConversationThread
      key={conversationId}
      conversationId={conversationId}
      header={
        <div className="flex items-center justify-between gap-3 border-b border-zinc-200 px-4 py-3 dark:border-zinc-800">
          <div className="flex items-center gap-2 min-w-0">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-zinc-200 text-zinc-600 dark:bg-zinc-800 dark:text-zinc-300">
              <Hash className="h-4 w-4" aria-hidden="true" />
            </span>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold text-zinc-900 dark:text-zinc-50">{conversation.name}</p>
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{conversation.members.length} members</p>
            </div>
          </div>
          <div className="flex shrink-0 gap-1">
            <button
              onClick={() => setAddOpen(true)}
              title="Add member"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              <UserPlus className="h-4 w-4" />
            </button>
            <button
              onClick={() => setLeaveOpen(true)}
              title="Leave channel"
              className="rounded-md p-1.5 text-zinc-500 hover:bg-red-50 hover:text-red-600 dark:text-zinc-400 dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <LogOut className="h-4 w-4" />
            </button>
          </div>

          <AddChannelMemberDialog conversationId={conversationId} open={addOpen} onClose={() => setAddOpen(false)} />
          <ConfirmDialog
            open={leaveOpen}
            onClose={() => setLeaveOpen(false)}
            onConfirm={handleLeave}
            title="Leave this channel?"
            confirmLabel="Leave"
          />
        </div>
      }
    />
  );
}
