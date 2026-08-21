import type { Fetcher, PaginationMeta } from "../api/types";
import type { ListTasksQuery, PublicTask, TaskDashboard, TaskPriority, TaskStatus } from "./types";

function toQuery(query: ListTasksQuery): Record<string, string | undefined> {
  return {
    status: query.status,
    priority: query.priority,
    assigneeId: query.assigneeId,
    search: query.search || undefined,
    sortBy: query.sortBy,
    sortDir: query.sortDir,
    page: query.page?.toString(),
    limit: query.limit?.toString(),
  };
}

export function listTasks(
  fetcher: Fetcher,
  projectId: string,
  query: ListTasksQuery = {}
): Promise<{ tasks: PublicTask[]; pagination: PaginationMeta }> {
  return fetcher<{ tasks: PublicTask[]; pagination: PaginationMeta }>(`/projects/${projectId}/tasks`, {
    query: toQuery(query),
  });
}

export function getTaskDashboard(fetcher: Fetcher, projectId: string): Promise<{ dashboard: TaskDashboard }> {
  return fetcher<{ dashboard: TaskDashboard }>(`/projects/${projectId}/tasks/dashboard`);
}

export function getTask(fetcher: Fetcher, taskId: string): Promise<{ task: PublicTask }> {
  return fetcher<{ task: PublicTask }>(`/tasks/${taskId}`);
}

export function createTask(
  fetcher: Fetcher,
  projectId: string,
  input: {
    title: string;
    description?: string;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string;
    assigneeId?: string;
  }
): Promise<{ task: PublicTask }> {
  return fetcher<{ task: PublicTask }>(`/projects/${projectId}/tasks`, { method: "POST", body: input });
}

export function updateTask(
  fetcher: Fetcher,
  taskId: string,
  input: {
    title?: string;
    description?: string | null;
    status?: TaskStatus;
    priority?: TaskPriority;
    dueDate?: string | null;
    assigneeId?: string | null;
  }
): Promise<{ task: PublicTask }> {
  return fetcher<{ task: PublicTask }>(`/tasks/${taskId}`, { method: "PATCH", body: input });
}

export function deleteTask(fetcher: Fetcher, taskId: string): Promise<{ deleted: true }> {
  return fetcher<{ deleted: true }>(`/tasks/${taskId}`, { method: "DELETE" });
}
