import { taskActivityRepository } from "./task-activity.repository.js";
import { AppError } from "../../shared/error/app-error.js";
import { logger } from "../../lib/logger.js";
import { getPagination, buildPaginationMeta, type PaginationMeta } from "../../shared/utils/pagination.js";
import { toPublicActivity, type PublicTaskActivity, type TaskActivityAction } from "./task-activity.types.js";
import type { ListActivityQuery } from "./task-activity.schema.js";

async function assertTaskAccess(taskId: string, userId: string): Promise<void> {
  const task = await taskActivityRepository.findTaskById(taskId);
  if (!task) {
    throw AppError.notFound("Task not found");
  }

  const membership = await taskActivityRepository.findProjectMember(task.projectId, userId);
  if (!membership) {
    throw AppError.forbidden("You are not a member of this project");
  }
}

export const taskActivityService = {
  async list(
    taskId: string,
    userId: string,
    query: ListActivityQuery
  ): Promise<{ activities: PublicTaskActivity[]; pagination: PaginationMeta }> {
    await assertTaskAccess(taskId, userId);

    const { limit, offset, page } = getPagination(query);
    const { rows, total } = await taskActivityRepository.list(taskId, limit, offset);

    return {
      activities: rows.map(toPublicActivity),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  /**
   * Called by the task module after a create/update. Deliberately never throws —
   * a logging failure shouldn't roll back or fail the task write that triggered it.
   */
  async record(
    taskId: string,
    actorId: string,
    action: TaskActivityAction,
    field: string | null,
    oldValue: string | null,
    newValue: string | null
  ): Promise<void> {
    try {
      await taskActivityRepository.record({ taskId, actorId, action, field, oldValue, newValue });
    } catch (error) {
      logger.error("Failed to record task activity", {
        taskId,
        action,
        error: error instanceof Error ? error.message : String(error),
      });
    }
  },
};
