"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CalendarDays, Pencil, Trash2, UserRound } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { toast } from "sonner";
import { EditTaskDialog } from "@/components/tasks/edit-task-dialog";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { ApiError } from "@/lib/api/error";
import { useAuth } from "@/lib/auth/auth-context";
import { formatDate } from "@/lib/format";
import type { ProjectMemberSummary } from "@/lib/projects/types";
import { listTaskTags } from "@/lib/tags/api";
import { deleteTask } from "@/lib/tasks/api";
import { priorityBadgeVariant, priorityLabels, statusBadgeVariant, statusLabels } from "@/lib/tasks/display";
import type { PublicTask } from "@/lib/tasks/types";

/** One task in the list: every task field at a glance, plus edit and delete. */
export function TaskRow({ task, members }: { task: PublicTask; members: ProjectMemberSummary[] }) {
  const { fetcher } = useAuth();
  const queryClient = useQueryClient();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const tagsQuery = useQuery({
    queryKey: ["tasks", task.id, "tags"],
    queryFn: () => listTaskTags(fetcher, task.id),
  });

  const deleteMutation = useMutation({
    mutationFn: () => deleteTask(fetcher, task.id),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ["projects", task.projectId, "tasks"] });
      await queryClient.invalidateQueries({ queryKey: ["projects", task.projectId, "dashboard"] });
      toast.success("Task deleted");
    },
    onError: (error) => toast.error(error instanceof ApiError ? error.message : "Couldn't delete the task"),
  });

  return (
    <div className="solid-white flex flex-col gap-3 rounded-xl border border-zinc-200 bg-white px-5 py-4 text-sm">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0 flex-1">
          <Link href={`/tasks/${task.id}`} className="break-words text-base font-semibold text-zinc-900 hover:underline">
            {task.title}
          </Link>
          {task.description && <p className="mt-1 line-clamp-2 text-zinc-500">{task.description}</p>}
        </div>

        <div className="flex shrink-0 items-center gap-1">
          <button
            onClick={() => setEditOpen(true)}
            aria-label={`Edit ${task.title}`}
            title="Edit task"
            className="rounded-md p-2 hover:bg-zinc-100"
          >
            <Pencil className="h-5 w-5" aria-hidden="true" />
          </button>
          <button
            onClick={() => setDeleteOpen(true)}
            aria-label={`Delete ${task.title}`}
            title="Delete task"
            className="rounded-md p-2 hover:bg-zinc-100"
          >
            <Trash2 className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Badge variant={statusBadgeVariant[task.status]}>{statusLabels[task.status]}</Badge>
        <Badge variant={priorityBadgeVariant[task.priority]}>{priorityLabels[task.priority]}</Badge>

        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          <CalendarDays className="h-4 w-4" aria-hidden="true" />
          {task.dueDate ? `Due ${formatDate(task.dueDate)}` : "No due date"}
          {task.isOverdue && <Badge variant="zinc">Overdue</Badge>}
        </span>

        <span className="flex items-center gap-1.5 text-xs text-zinc-500">
          {task.assignee ? (
            <>
              <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="sm" />
              {task.assignee.name}
            </>
          ) : (
            <>
              <UserRound className="h-4 w-4" aria-hidden="true" />
              Unassigned
            </>
          )}
        </span>

        <span className="text-xs text-zinc-500">
          Created by {task.creator.name} · {formatDate(task.createdAt)}
        </span>
      </div>

      {!!tagsQuery.data?.length && (
        <div className="flex flex-wrap gap-2">
          {tagsQuery.data.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2.5 py-0.5 text-xs font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      <EditTaskDialog task={task} members={members} open={editOpen} onClose={() => setEditOpen(false)} />
      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={async () => {
          try {
            await deleteMutation.mutateAsync();
          } catch {
            // Already reported by the mutation's onError toast.
          }
        }}
        title="Delete this task?"
        description="This permanently deletes the task, its comments, and its activity log."
        confirmLabel="Delete task"
      />
    </div>
  );
}
