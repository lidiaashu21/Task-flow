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
  dueDate: Date | null;
  isOverdue: boolean;
  assignee: TaskParticipant | null;
  creator: TaskParticipant;
  createdAt: Date;
  updatedAt: Date;
}

interface TaskWithRelations {
  id: string;
  projectId: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  priority: TaskPriority;
  dueDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  assignee: TaskParticipant | null;
  creator: TaskParticipant;
}

export function toPublicTask(task: TaskWithRelations): PublicTask {
  return {
    id: task.id,
    projectId: task.projectId,
    title: task.title,
    description: task.description,
    status: task.status,
    priority: task.priority,
    dueDate: task.dueDate,
    isOverdue: task.status !== "done" && task.dueDate !== null && task.dueDate.getTime() < Date.now(),
    assignee: task.assignee,
    creator: task.creator,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
  };
}

export interface TaskDashboard {
  statusCounts: Record<TaskStatus, number>;
  totalTasks: number;
  myOverdueTasks: PublicTask[];
}
