"use client";

import { useQuery } from "@tanstack/react-query";
import { ListTodo, Plus } from "lucide-react";
import { use, useState } from "react";
import { CreateTaskDialog } from "@/components/tasks/create-task-dialog";
import { TaskRow } from "@/components/tasks/task-row";
import { ProjectTabs } from "@/components/projects/project-tabs";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { EmptyState } from "@/components/ui/empty-state";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";
import { getProject } from "@/lib/projects/api";
import { listTasks } from "@/lib/tasks/api";
import { priorityLabels, statusLabels } from "@/lib/tasks/display";
import type { ListTasksQuery } from "@/lib/tasks/types";

export default function ProjectTasksPage({ params }: { params: Promise<{ projectId: string }> }) {
  const { projectId } = use(params);
  const { fetcher } = useAuth();
  const [createOpen, setCreateOpen] = useState(false);
  const [filters, setFilters] = useState<ListTasksQuery>({ sortBy: "createdAt", sortDir: "desc" });

  const projectQuery = useQuery({
    queryKey: ["projects", projectId],
    queryFn: () => getProject(fetcher, projectId),
  });

  const tasksQuery = useQuery({
    queryKey: ["projects", projectId, "tasks", filters],
    queryFn: () => listTasks(fetcher, projectId, filters),
  });

  const members = projectQuery.data?.project.members ?? [];

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">{projectQuery.data?.project.name ?? "Tasks"}</h1>
          <Button className="w-auto px-4" onClick={() => setCreateOpen(true)}>
            <Plus className="h-4 w-4" aria-hidden="true" />
            New task
          </Button>
        </div>
      </div>

      <ProjectTabs projectId={projectId} />

      <div className="flex flex-wrap gap-3">
        <Input
          placeholder="Search tasks…"
          className="max-w-xs"
          value={filters.search ?? ""}
          onChange={(event) => setFilters((current) => ({ ...current, search: event.target.value }))}
        />
        <Select
          className="w-auto max-w-[9rem]"
          value={filters.status ?? ""}
          onChange={(event) =>
            setFilters((current) => ({ ...current, status: (event.target.value || undefined) as never }))
          }
        >
          <option value="">All statuses</option>
          {(["todo", "in_progress", "done"] as const).map((status) => (
            <option key={status} value={status}>
              {statusLabels[status]}
            </option>
          ))}
        </Select>
        <Select
          className="w-auto max-w-[9rem]"
          value={filters.priority ?? ""}
          onChange={(event) =>
            setFilters((current) => ({ ...current, priority: (event.target.value || undefined) as never }))
          }
        >
          <option value="">All priorities</option>
          {(["low", "medium", "high"] as const).map((priority) => (
            <option key={priority} value={priority}>
              {priorityLabels[priority]}
            </option>
          ))}
        </Select>
      </div>

      {tasksQuery.isLoading ? (
        <Spinner />
      ) : !tasksQuery.data?.tasks.length ? (
        <EmptyState
          icon={ListTodo}
          title="No tasks match these filters"
          description="Try clearing the filters, or create a new task."
          action={
            <Button className="w-auto px-4" onClick={() => setCreateOpen(true)}>
              New task
            </Button>
          }
        />
      ) : (
        <Card className="overflow-hidden py-0">
          {tasksQuery.data.tasks.map((task) => (
            <TaskRow key={task.id} task={task} />
          ))}
        </Card>
      )}

      <CreateTaskDialog projectId={projectId} members={members} open={createOpen} onClose={() => setCreateOpen(false)} />
    </div>
  );
}
