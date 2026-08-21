import { Router } from "express";
import { projectController } from "./project.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  createProjectSchema,
  projectIdParamSchema,
  projectMemberParamsSchema,
  updateMemberRoleSchema,
  updateProjectSchema,
} from "./project.schema.js";

const router = Router();

router.use(requireAuth);

router.post("/projects", validate(createProjectSchema), projectController.create);
router.get("/projects", projectController.list);
router.get("/projects/:projectId", validate(projectIdParamSchema, "params"), projectController.get);

router.patch(
  "/projects/:projectId",
  validate(projectIdParamSchema, "params"),
  validate(updateProjectSchema),
  projectController.update
);

router.delete("/projects/:projectId", validate(projectIdParamSchema, "params"), projectController.remove);

// Order matters — "/members/me" must be registered before "/members/:userId".
router.delete("/projects/:projectId/members/me", validate(projectIdParamSchema, "params"), projectController.leave);

router.patch(
  "/projects/:projectId/members/:userId",
  validate(projectMemberParamsSchema, "params"),
  validate(updateMemberRoleSchema),
  projectController.updateMemberRole
);

router.delete(
  "/projects/:projectId/members/:userId",
  validate(projectMemberParamsSchema, "params"),
  projectController.removeMember
);

export const projectRoutes = router;
