import { taskRepository } from "./task.repository.js";
import { taskActivityService } from "../task-activity/task-activity.service.js";
import type { TaskActivityAction } from "../task-activity/task-activity.types.js";
import { notificationService } from "../notification/notification.service.js";
import { AppError } from "../../shared/error/app-error.js";
import { getPagination, buildPaginationMeta, type PaginationMeta } from "../../shared/utils/pagination.js";
import { toPublicTask, type PublicTask, type TaskDashboard, type TaskStatus } from "./task.types.js";
import type { CreateTaskInput, ListTasksQuery, UpdateTaskInput } from "./task.schema.js";
import type { NewTask, Task } from "../../db/schema/task.js";

async function assertProjectMember(projectId: string, userId: string) {
  const project = await taskRepository.findProjectById(projectId);
  if (!project) {
    throw AppError.notFound("Project not found");
  }

  const membership = await taskRepository.findProjectMember(projectId, userId);
  if (!membership) {
    throw AppError.forbidden("You are not a member of this project");
  }

  return project;
}

async function assertValidAssignee(projectId: string, assigneeId: string): Promise<void> {
  const membership = await taskRepository.findProjectMember(projectId, assigneeId);
  if (!membership) {
    throw AppError.badRequest("Assignee must be a member of this project");
  }
}

function stringifyDate(value: Date | null | undefined): string | null {
  return value ? value.toISOString() : null;
}

/**
 * Diffs the pre-update task against the applied patch and logs one activity row per changed field.
 * Only fields with a matching `activity_action` value get a log entry — title/description changes
 * aren't in that enum, so they're tracked on the task row itself (updatedAt) but not in the log.
 */
async function recordTaskChanges(before: Task, patch: Partial<NewTask>, userId: string): Promise<void> {
  const entries: Array<{
    action: TaskActivityAction;
    field: string;
    oldValue: string | null;
    newValue: string | null;
  }> = [];

  if (patch.status !== undefined && patch.status !== before.status) {
    entries.push({ action: "status_changed", field: "status", oldValue: before.status, newValue: patch.status });
  }
  if (patch.priority !== undefined && patch.priority !== before.priority) {
    entries.push({
      action: "priority_changed",
      field: "priority",
      oldValue: before.priority,
      newValue: patch.priority,
    });
  }
  if (patch.dueDate !== undefined && patch.dueDate?.getTime() !== before.dueDate?.getTime()) {
    entries.push({
      action: "due_date_changed",
      field: "dueDate",
      oldValue: stringifyDate(before.dueDate),
      newValue: stringifyDate(patch.dueDate),
    });
  }
  if (patch.assigneeId !== undefined && patch.assigneeId !== before.assigneeId) {
    entries.push({
      action: "assigned",
      field: "assigneeId",
      oldValue: before.assigneeId,
      newValue: patch.assigneeId,
    });
  }

  await Promise.all(
    entries.map((entry) =>
      taskActivityService.record(before.id, userId, entry.action, entry.field, entry.oldValue, entry.newValue)
    )
  );
}

export const taskService = {
  async create(projectId: string, creatorId: string, input: CreateTaskInput): Promise<PublicTask> {
    await assertProjectMember(projectId, creatorId);

    if (input.assigneeId) {
      await assertValidAssignee(projectId, input.assigneeId);
    }

    const payload: NewTask = {
      projectId,
      title: input.title,
      status: input.status,
      priority: input.priority,
      createdBy: creatorId,
      description: input.description ?? null,
      dueDate: input.dueDate ?? null,
      assigneeId: input.assigneeId ?? null,
    };

    const task = await taskRepository.createTask(payload);
    await taskActivityService.record(task.id, creatorId, "created", null, null, task.title);

    const project = await taskRepository.findProjectById(projectId);
    const creatorName = await notificationService.actorName(creatorId);
    const link = `/tasks/${task.id}`;
    await notificationService.notify([task.assigneeId], creatorId, {
      type: "task_assigned",
      title: "New task assigned to you",
      body: `${creatorName} assigned you "${task.title}"`,
      link,
    });
    // The owner hears about new work too, unless they were just told it's theirs.
    await notificationService.notify([task.assigneeId === project?.ownerId ? null : project?.ownerId], creatorId, {
      type: "task_updated",
      title: "New task created",
      body: `${creatorName} created "${task.title}"`,
      link,
    });

    const withRelations = await taskRepository.findTaskWithRelations(task.id);
    return toPublicTask(withRelations!);
  },

  async get(taskId: string, userId: string): Promise<PublicTask> {
    const task = await taskRepository.findTaskWithRelations(taskId);
    if (!task) {
      throw AppError.notFound("Task not found");
    }

    await assertProjectMember(task.projectId, userId);
    return toPublicTask(task);
  },

  async list(
    projectId: string,
    userId: string,
    query: ListTasksQuery
  ): Promise<{ tasks: PublicTask[]; pagination: PaginationMeta }> {
    await assertProjectMember(projectId, userId);

    const { limit, offset, page } = getPagination(query);
    const { rows, total } = await taskRepository.listTasks(projectId, query, limit, offset);

    return {
      tasks: rows.map(toPublicTask),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async update(taskId: string, userId: string, input: UpdateTaskInput): Promise<PublicTask> {
    const task = await taskRepository.findTaskById(taskId);
    if (!task) {
      throw AppError.notFound("Task not found");
    }

    await assertProjectMember(task.projectId, userId);

    if (input.assigneeId) {
      await assertValidAssignee(task.projectId, input.assigneeId);
    }

    const patch: Partial<NewTask> = {};
    if (input.title !== undefined) patch.title = input.title;
    if (input.description !== undefined) patch.description = input.description;
    if (input.status !== undefined) patch.status = input.status;
    if (input.priority !== undefined) patch.priority = input.priority;
    if (input.dueDate !== undefined) patch.dueDate = input.dueDate;
    if (input.assigneeId !== undefined) patch.assigneeId = input.assigneeId;

    const updated = await taskRepository.updateTask(taskId, patch);
    await recordTaskChanges(task, patch, userId);

    const project = await taskRepository.findProjectById(task.projectId);
    const actorName = await notificationService.actorName(userId);
    const link = `/tasks/${taskId}`;
    const newlyAssigned = patch.assigneeId !== undefined && patch.assigneeId !== task.assigneeId ? patch.assigneeId : null;
    await notificationService.notify([newlyAssigned], userId, {
      type: "task_assigned",
      title: "New task assigned to you",
      body: `${actorName} assigned you "${updated!.title}"`,
      link,
    });

    const changed = (Object.keys(patch) as Array<keyof NewTask>).filter((key) => {
      const before = task[key as keyof Task];
      const after = patch[key];
      return before instanceof Date || after instanceof Date
        ? (before as Date | null)?.getTime() !== (after as Date | null | undefined)?.getTime()
        : before !== after;
    });
    if (changed.length > 0) {
      await notificationService.notify([project?.ownerId, task.assigneeId].filter((id) => id !== newlyAssigned), userId, {
        type: "task_updated",
        title: "Task updated",
        body: `${actorName} changed ${changed.join(", ")} on "${updated!.title}"`,
        link,
      });
    }
    return toPublicTask(updated!);
  },

  async remove(taskId: string, userId: string): Promise<void> {
    const task = await taskRepository.findTaskById(taskId);
    if (!task) {
      throw AppError.notFound("Task not found");
    }

    await assertProjectMember(task.projectId, userId);
    await taskRepository.deleteTask(taskId);
  },

  async getDashboard(projectId: string, userId: string): Promise<TaskDashboard> {
    await assertProjectMember(projectId, userId);

    const [statusRows, overdueRows] = await Promise.all([
      taskRepository.countByStatus(projectId),
      taskRepository.listOverdueForUser(projectId, userId),
    ]);

    const statusCounts: Record<TaskStatus, number> = { todo: 0, in_progress: 0, done: 0 };
    let totalTasks = 0;
    for (const row of statusRows) {
      const value = Number(row.count);
      statusCounts[row.status] = value;
      totalTasks += value;
    }

    return {
      statusCounts,
      totalTasks,
      myOverdueTasks: overdueRows.map(toPublicTask),
    };
  },
};
