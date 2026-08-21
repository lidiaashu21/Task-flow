export type TaskStatus = "todo" | "in_progress" | "done";
export type TaskPriority = "low" | "medium" | "high";

export interface TaskParticipant {
  id: string;
  name: string;
  avatarUrl: string | null;
}

export interface PublicTask {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: string | null;
  isOverdue: boolean;
  assignee: TaskParticipant | null;
  creator: TaskParticipant;
  createdAt: string;
  updatedAt: string;
}

export interface TaskDashboard {
  statusCounts: Record<TaskStatus, number>;
  totalTasks: number;
  myOverdueTasks: PublicTask[];
}

export interface ListTasksQuery {
  status?: TaskStatus;
  priority?: TaskPriority;
  assigneeId?: string;
  search?: string;
  sortBy?: "dueDate" | "priority" | "status" | "createdAt" | "title";
  sortDir?: "asc" | "desc";
  page?: number;
  limit?: number;
}
