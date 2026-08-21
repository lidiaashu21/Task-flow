"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { Avatar } from "@/components/ui/avatar";
import { Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Spinner } from "@/components/ui/spinner";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/auth-context";
import { startDm } from "@/lib/messages/api";
import { useDebouncedValue } from "@/lib/use-debounced-value";
import { searchUsers } from "@/lib/users/api";

export function StartDmDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { fetcher } = useAuth();
  const router = useRouter();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebouncedValue(search);

  const usersQuery = useQuery({
    queryKey: ["users", "search", debouncedSearch],
    queryFn: () => searchUsers(fetcher, debouncedSearch),
    enabled: open,
  });

  const mutation = useMutation({
    mutationFn: (userId: string) => startDm(fetcher, userId),
    onSuccess: async ({ conversation }) => {
      await queryClient.invalidateQueries({ queryKey: ["conversations"] });
      onClose();
      setSearch("");
      router.push(`/messages/dm/${conversation.id}`);
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't start the conversation"),
  });

  return (
    <Dialog open={open} onClose={onClose} title="New message" description="Search for someone to message directly">
      <Input placeholder="Search people…" value={search} onChange={(event) => setSearch(event.target.value)} autoFocus />

      <div className="mt-3 max-h-72 overflow-y-auto">
        {usersQuery.isLoading ? (
          <Spinner />
        ) : !usersQuery.data?.users.length ? (
          <p className="py-6 text-center text-sm text-zinc-500 dark:text-zinc-400">No one found.</p>
        ) : (
          <div className="flex flex-col gap-1">
            {usersQuery.data.users.map((person) => (
              <button
                key={person.id}
                onClick={() => mutation.mutate(person.id)}
                disabled={mutation.isPending}
                className="flex items-center gap-3 rounded-lg px-2 py-2 text-left text-sm hover:bg-zinc-50 disabled:opacity-60 dark:hover:bg-zinc-900"
              >
                <Avatar name={person.name} src={person.avatarUrl} size="sm" />
                <span className="text-zinc-800 dark:text-zinc-200">{person.name}</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </Dialog>
  );
}
