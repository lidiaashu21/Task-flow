import type { TaskPriority, TaskStatus } from "./types";

export const statusLabels: Record<TaskStatus, string> = {
  todo: "To do",
  in_progress: "In progress",
  done: "Done",
};

export const statusBadgeVariant: Record<TaskStatus, "default" | "blue" | "emerald"> = {
  todo: "default",
  in_progress: "blue",
  done: "emerald",
};

export const priorityLabels: Record<TaskPriority, string> = {
  low: "Low",
  medium: "Medium",
  high: "High",
};

export const priorityBadgeVariant: Record<TaskPriority, "default" | "amber" | "red"> = {
  low: "default",
  medium: "amber",
  high: "red",
};

export const statusOrder: TaskStatus[] = ["todo", "in_progress", "done"];
export const priorityOrder: TaskPriority[] = ["low", "medium", "high"];
