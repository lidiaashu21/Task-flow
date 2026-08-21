import { Router } from "express";
import { taskActivityController } from "./task-activity.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import { listActivityQuerySchema, taskIdParamSchema } from "./task-activity.schema.js";

const router = Router();

router.use(requireAuth);

router.get(
  "/tasks/:taskId/activity",
  validate(taskIdParamSchema, "params"),
  validate(listActivityQuerySchema, "query"),
  taskActivityController.list
);

export const taskActivityRoutes = router;
