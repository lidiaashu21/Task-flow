import Link from "next/link";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { formatDate } from "@/lib/format";
import { priorityBadgeVariant, priorityLabels, statusBadgeVariant, statusLabels } from "@/lib/tasks/display";
import type { PublicTask } from "@/lib/tasks/types";

export function TaskRow({ task }: { task: PublicTask }) {
  return (
    <Link
      href={`/tasks/${task.id}`}
      className="flex items-center gap-4 border-b border-zinc-100 px-4 py-3 text-sm last:border-b-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900/50"
    >
      <span className="min-w-0 flex-1 truncate font-medium text-zinc-900 dark:text-zinc-100">{task.title}</span>
      <Badge variant={statusBadgeVariant[task.status]}>{statusLabels[task.status]}</Badge>
      <Badge variant={priorityBadgeVariant[task.priority]}>{priorityLabels[task.priority]}</Badge>
      <span
        className={
          task.isOverdue
            ? "hidden shrink-0 text-xs font-medium text-red-600 dark:text-red-400 sm:block"
            : "hidden shrink-0 text-xs text-zinc-400 sm:block"
        }
      >
        {task.dueDate ? formatDate(task.dueDate) : "No due date"}
      </span>
      {task.assignee ? (
        <Avatar name={task.assignee.name} src={task.assignee.avatarUrl} size="sm" />
      ) : (
        <span className="h-6 w-6 shrink-0 rounded-full border border-dashed border-zinc-300 dark:border-zinc-700" />
      )}
    </Link>
  );
}
