import { z } from "zod";

export const taskIdParamSchema = z.object({
  taskId: z.uuid("Invalid task id"),
});

export const listActivityQuerySchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().positive().max(100).default(30),
});

export type TaskIdParam = z.infer<typeof taskIdParamSchema>;
export type ListActivityQuery = z.infer<typeof listActivityQuerySchema>;
