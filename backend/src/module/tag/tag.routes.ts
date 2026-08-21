import { Router } from "express";
import { tagController } from "./tag.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  attachTagSchema,
  createTagSchema,
  projectIdParamSchema,
  tagIdParamSchema,
  taskIdParamSchema,
  taskTagParamsSchema,
  updateTagSchema,
} from "./tag.schema.js";

const router = Router();

router.use(requireAuth);

router.post(
  "/projects/:projectId/tags",
  validate(projectIdParamSchema, "params"),
  validate(createTagSchema),
  tagController.create
);
router.get("/projects/:projectId/tags", validate(projectIdParamSchema, "params"), tagController.list);

router.patch("/tags/:tagId", validate(tagIdParamSchema, "params"), validate(updateTagSchema), tagController.update);
router.delete("/tags/:tagId", validate(tagIdParamSchema, "params"), tagController.remove);

router.get("/tasks/:taskId/tags", validate(taskIdParamSchema, "params"), tagController.listForTask);
router.post(
  "/tasks/:taskId/tags",
  validate(taskIdParamSchema, "params"),
  validate(attachTagSchema),
  tagController.attachToTask
);
router.delete(
  "/tasks/:taskId/tags/:tagId",
  validate(taskTagParamsSchema, "params"),
  tagController.detachFromTask
);

export const tagRoutes = router;
