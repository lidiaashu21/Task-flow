import { z } from "zod";

export const taskStatusValues = ["todo", "in_progress", "done"] as const;
export const taskPriorityValues = ["low", "medium", "high"] as const;

export const createTaskSchema = z.object({
  title: z.string().trim().min(1, "Title is required").max(255),
  description: z.string().trim().max(10000).optional(),
  status: z.enum(taskStatusValues).default("todo"),
  priority: z.enum(taskPriorityValues).default("medium"),
  dueDate: z.coerce.date().optional(),
  assigneeId: z.uuid("Invalid assignee id").optional(),
});

export const updateTaskSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(255).optional(),
    description: z.string().trim().max(10000).nullable().optional(),
    status: z.enum(taskStatusValues).optional(),
    priority: z.enum(taskPriorityValues).optional(),
    /** Explicit null clears the due date / unassigns; omitting a field leaves it untouched. */
    dueDate: z.coerce.date().nullable().optional(),
    assigneeId: z.uuid("Invalid assignee id").nullable().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, { message: "Provide at least one field to update" });

export const projectIdParamSchema = z.object({
  projectId: z.uuid("Invalid project id"),
});

export const taskIdParamSchema = z.object({
  taskId: z.uuid("Invalid task id"),
});

export const listTasksQuerySchema = z.object({
  status: z.enum(taskStatusValues).optional(),
  priority: z.enum(taskPriorityValues).optional(),
  assigneeId: z.uuid("Invalid assignee id").optional(),
  search: z.string().trim().max(255).optional(),
  sortBy: z.enum(["dueDate", "priority", "status", "createdAt", "title"]).default("createdAt"),
  sortDir: z.enum(["asc", "desc"]).default("desc"),
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(20),
});

export type CreateTaskInput = z.infer<typeof createTaskSchema>;
export type UpdateTaskInput = z.infer<typeof updateTaskSchema>;
export type ProjectIdParam = z.infer<typeof projectIdParamSchema>;
export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
export type ListTasksQuery = z.infer<typeof listTasksQuerySchema>;
