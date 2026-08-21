"use client";

import { useQuery } from "@tanstack/react-query";
import { Avatar } from "@/components/ui/avatar";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";
import { formatRelative } from "@/lib/format";
import { listTaskActivity } from "@/lib/task-activity/api";
import type { PublicTaskActivity } from "@/lib/task-activity/types";

function describe(activity: PublicTaskActivity): string {
  const actor = activity.actor?.name ?? "Someone";
  switch (activity.action) {
    case "created":
      return `${actor} created this task`;
    case "status_changed":
      return `${actor} changed status from "${activity.oldValue}" to "${activity.newValue}"`;
    case "priority_changed":
      return `${actor} changed priority from "${activity.oldValue}" to "${activity.newValue}"`;
    case "due_date_changed":
      return `${actor} changed the due date`;
    case "assigned":
      return `${actor} changed the assignee`;
    case "commented":
      return `${actor} commented`;
    case "tag_added":
      return `${actor} added a tag`;
    case "deleted":
      return `${actor} deleted this task`;
    default:
      return `${actor} updated this task`;
  }
}

export function TaskActivityLog({ taskId }: { taskId: string }) {
  const { fetcher } = useAuth();

  const { data, isLoading } = useQuery({
    queryKey: ["tasks", taskId, "activity"],
    queryFn: () => listTaskActivity(fetcher, taskId),
  });

  if (isLoading) return <Spinner />;
  if (!data?.activities.length) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">No activity yet.</p>;
  }

  return (
    <ul className="flex flex-col gap-3">
      {data.activities.map((activity) => (
        <li key={activity.id} className="flex items-center gap-3 text-sm">
          <Avatar name={activity.actor?.name ?? "?"} src={activity.actor?.avatarUrl} size="sm" />
          <span className="min-w-0 flex-1 text-zinc-700 dark:text-zinc-300">{describe(activity)}</span>
          <span className="shrink-0 text-xs text-zinc-400">{formatRelative(activity.createdAt)}</span>
        </li>
      ))}
    </ul>
  );
}
