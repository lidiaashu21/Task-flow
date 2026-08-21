"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Plus, X } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Select } from "@/components/ui/select";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/auth-context";
import { attachTag, detachTag, listProjectTags, listTaskTags } from "@/lib/tags/api";

export function TaskTags({ taskId, projectId }: { taskId: string; projectId: string }) {
  const { fetcher } = useAuth();
  const queryClient = useQueryClient();
  const [adding, setAdding] = useState(false);
  const [selected, setSelected] = useState("");

  const taskTagsQuery = useQuery({
    queryKey: ["tasks", taskId, "tags"],
    queryFn: () => listTaskTags(fetcher, taskId),
  });

  const projectTagsQuery = useQuery({
    queryKey: ["projects", projectId, "tags"],
    queryFn: () => listProjectTags(fetcher, projectId),
    enabled: adding,
  });

  const attachMutation = useMutation({
    mutationFn: (tagId: string) => attachTag(fetcher, taskId, tagId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "tags"] });
      setAdding(false);
      setSelected("");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't attach the tag"),
  });

  const detachMutation = useMutation({
    mutationFn: (tagId: string) => detachTag(fetcher, taskId, tagId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["tasks", taskId, "tags"] }),
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't remove the tag"),
  });

  const attachedIds = new Set((taskTagsQuery.data ?? []).map((tag) => tag.id));
  const availableTags = (projectTagsQuery.data ?? []).filter((tag) => !attachedIds.has(tag.id));

  return (
    <div className="flex flex-wrap items-center gap-2">
      {(taskTagsQuery.data ?? []).map((tag) => (
        <span
          key={tag.id}
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium text-white"
          style={{ backgroundColor: tag.color }}
        >
          {tag.name}
          <button onClick={() => detachMutation.mutate(tag.id)} aria-label={`Remove ${tag.name}`} className="hover:opacity-75">
            <X className="h-3 w-3" />
          </button>
        </span>
      ))}

      {adding ? (
        <div className="flex items-center gap-2">
          <Select className="h-8 w-40 text-xs" value={selected} onChange={(event) => setSelected(event.target.value)}>
            <option value="">Choose a tag…</option>
            {availableTags.map((tag) => (
              <option key={tag.id} value={tag.id}>
                {tag.name}
              </option>
            ))}
          </Select>
          <Button
            variant="ghost"
            className="w-auto px-2 text-xs"
            disabled={!selected}
            onClick={() => selected && attachMutation.mutate(selected)}
          >
            Add
          </Button>
          <Button variant="ghost" className="w-auto px-2 text-xs" onClick={() => setAdding(false)}>
            Cancel
          </Button>
        </div>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1 rounded-full border border-dashed border-zinc-300 px-2.5 py-1 text-xs text-zinc-500 hover:border-zinc-400 hover:text-zinc-700 dark:border-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          <Plus className="h-3 w-3" />
          Tag
        </button>
      )}
    </div>
  );
}
