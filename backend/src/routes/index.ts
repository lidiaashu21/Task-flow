import { Router } from "express";
import { authRoutes } from "../module/auth/auth.routes.js";
import { commentRoutes } from "../module/comment/comment.routes.js";
import { conversationRoutes } from "../module/conversation/conversation.routes.js";
import { invitationRoutes } from "../module/invitation/invitation.routes.js";
import { messageRoutes } from "../module/message/message.routes.js";
import { userRoutes } from "../module/user/user.routes.js";
import { taskRoutes } from "../module/task/task.routes.js";
import { projectRoutes } from "../module/project/project.routes.js";
import { tagRoutes } from "../module/tag/tag.routes.js";
import { taskActivityRoutes } from "../module/task-activity/task-activity.routes.js";

const router = Router();

router.use("/auth", authRoutes);
router.use(invitationRoutes);
router.use(commentRoutes);
router.use(conversationRoutes);
router.use(messageRoutes);
router.use(userRoutes);
router.use(taskRoutes);
router.use(projectRoutes);
router.use(tagRoutes);
router.use(taskActivityRoutes);

export const apiRoutes = router;
