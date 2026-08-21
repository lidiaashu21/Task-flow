import { Router } from "express";
import { userController } from "./user.controller.js";
import { requireAuth } from "../../middleware/auth.middleware.js";
import { validate } from "../../middleware/validation.middleware.js";
import {
  changePasswordSchema,
  deleteAccountSchema,
  listUsersQuerySchema,
  updateProfileSchema,
  userIdParamSchema,
} from "./user.schema.js";

const router = Router();

router.use(requireAuth);

// Order matters — "/users/me" must be registered before "/users/:userId".
router.get("/users/me", userController.getMe);
router.patch("/users/me", validate(updateProfileSchema), userController.updateMe);
router.post("/users/me/change-password", validate(changePasswordSchema), userController.changePassword);
router.delete("/users/me", validate(deleteAccountSchema), userController.deleteMe);

router.get("/users", validate(listUsersQuerySchema, "query"), userController.list);
router.get("/users/:userId", validate(userIdParamSchema, "params"), userController.getById);

export const userRoutes = router;
