import { Router } from "express";
import { taskController } from "./task.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  createTaskSchema,
  listTasksQuerySchema,
  projectIdParamSchema,
  taskIdParamSchema,
  updateTaskSchema,
} from "./task.schema.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/projects/:projectId/tasks",
  validate(projectIdParamSchema, "params"),
  validate(createTaskSchema),
  taskController.create
);

router.get(
  "/projects/:projectId/tasks",
  validate(projectIdParamSchema, "params"),
  validate(listTasksQuerySchema, "query"),
  taskController.list
);

router.get(
  "/projects/:projectId/tasks/dashboard",
  validate(projectIdParamSchema, "params"),
  taskController.dashboard
);

router.get("/tasks/:taskId", validate(taskIdParamSchema, "params"), taskController.get);

router.patch(
  "/tasks/:taskId",
  validate(taskIdParamSchema, "params"),
  validate(updateTaskSchema),
  taskController.update
);

router.delete("/tasks/:taskId", validate(taskIdParamSchema, "params"), taskController.remove);

export const taskRoutes = router;
