import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { taskRepository } from "../../src/module/task/task.repository.js";
import type { taskActivityService } from "../../src/module/task-activity/task-activity.service.js";
import type { MockOf } from "../mock-types.js";

const mockTaskRepository = {
  findProjectById: jest.fn() as MockOf<typeof taskRepository.findProjectById>,
  findProjectMember: jest.fn() as MockOf<typeof taskRepository.findProjectMember>,
  createTask: jest.fn() as MockOf<typeof taskRepository.createTask>,
  findTaskWithRelations: jest.fn() as MockOf<typeof taskRepository.findTaskWithRelations>,
  findTaskById: jest.fn() as MockOf<typeof taskRepository.findTaskById>,
  listTasks: jest.fn() as MockOf<typeof taskRepository.listTasks>,
  updateTask: jest.fn() as MockOf<typeof taskRepository.updateTask>,
  deleteTask: jest.fn() as MockOf<typeof taskRepository.deleteTask>,
  countByStatus: jest.fn() as MockOf<typeof taskRepository.countByStatus>,
  listOverdueForUser: jest.fn() as MockOf<typeof taskRepository.listOverdueForUser>,
};

const mockTaskActivityService = {
  record: jest.fn(async () => {}) as MockOf<typeof taskActivityService.record>,
};

jest.unstable_mockModule("../../src/module/task/task.repository.js", () => ({
  taskRepository: mockTaskRepository,
}));
jest.unstable_mockModule("../../src/module/task-activity/task-activity.service.js", () => ({
  taskActivityService: mockTaskActivityService,
}));

const { taskService } = await import("../../src/module/task/task.service.js");

const creator = { id: "user-1", name: "Ada", avatarUrl: null };

function fakeTask(overrides: Record<string, unknown> = {}) {
  return {
    id: "task-1",
    projectId: "project-1",
    title: "Write tests",
    description: null,
    status: "todo",
    priority: "medium",
    dueDate: null,
    assigneeId: null,
    createdBy: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function fakeTaskWithRelations(overrides: Record<string, unknown> = {}) {
  return { ...fakeTask(), assignee: null, creator, ...overrides };
}

describe("taskService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTaskRepository.findProjectById.mockResolvedValue({ id: "project-1" });
    mockTaskRepository.findProjectMember.mockResolvedValue({ id: "member-1" });
  });

  describe("create", () => {
    it("creates the task and records a creation activity", async () => {
      mockTaskRepository.createTask.mockResolvedValue(fakeTask());
      mockTaskRepository.findTaskWithRelations.mockResolvedValue(fakeTaskWithRelations());

      const result = await taskService.create("project-1", "user-1", { title: "Write tests", status: "todo", priority: "medium" } as never);

      expect(mockTaskActivityService.record).toHaveBeenCalledWith("task-1", "user-1", "created", null, null, "Write tests");
      expect(result.title).toBe("Write tests");
    });

    it("rejects when the creator is not a project member", async () => {
      mockTaskRepository.findProjectMember.mockResolvedValue(undefined);

      await expect(
        taskService.create("project-1", "outsider", { title: "X", status: "todo", priority: "medium" } as never)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("rejects an assignee outside the project", async () => {
      mockTaskRepository.findProjectMember.mockImplementation(async (_projectId: string, userId: string) =>
        userId === "user-1" ? { id: "member-1" } : undefined
      );

      await expect(
        taskService.create("project-1", "user-1", {
          title: "X",
          status: "todo",
          priority: "medium",
          assigneeId: "outsider",
        } as never)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("get", () => {
    it("returns the task for a project member", async () => {
      mockTaskRepository.findTaskWithRelations.mockResolvedValue(fakeTaskWithRelations());

      const result = await taskService.get("task-1", "user-1");

      expect(result.id).toBe("task-1");
    });

    it("rejects an unknown task", async () => {
      mockTaskRepository.findTaskWithRelations.mockResolvedValue(undefined);

      await expect(taskService.get("ghost", "user-1")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("rejects a non-member", async () => {
      mockTaskRepository.findTaskWithRelations.mockResolvedValue(fakeTaskWithRelations());
      mockTaskRepository.findProjectMember.mockResolvedValue(undefined);

      await expect(taskService.get("task-1", "outsider")).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe("list", () => {
    it("returns paginated tasks for a project member", async () => {
      mockTaskRepository.listTasks.mockResolvedValue({ rows: [fakeTaskWithRelations()], total: 1 });

      const result = await taskService.list("project-1", "user-1", { page: 1, limit: 20 } as never);

      expect(result.tasks).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe("update", () => {
    it("applies the patch and records the resulting activity entries", async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(fakeTask());
      mockTaskRepository.updateTask.mockResolvedValue(fakeTaskWithRelations({ status: "in_progress" }));

      const result = await taskService.update("task-1", "user-1", { status: "in_progress" } as never);

      expect(mockTaskRepository.updateTask).toHaveBeenCalledWith("task-1", { status: "in_progress" });
      expect(mockTaskActivityService.record).toHaveBeenCalledWith(
        "task-1",
        "user-1",
        "status_changed",
        "status",
        "todo",
        "in_progress"
      );
      expect(result.status).toBe("in_progress");
    });

    it("rejects an unknown task", async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(undefined);

      await expect(taskService.update("ghost", "user-1", { status: "done" } as never)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("rejects an assignee outside the project", async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(fakeTask());
      mockTaskRepository.findProjectMember.mockImplementation(async (_projectId: string, userId: string) =>
        userId === "user-1" ? { id: "member-1" } : undefined
      );

      await expect(
        taskService.update("task-1", "user-1", { assigneeId: "outsider" } as never)
      ).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("remove", () => {
    it("deletes the task for a project member", async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(fakeTask());

      await taskService.remove("task-1", "user-1");

      expect(mockTaskRepository.deleteTask).toHaveBeenCalledWith("task-1");
    });

    it("rejects an unknown task", async () => {
      mockTaskRepository.findTaskById.mockResolvedValue(undefined);

      await expect(taskService.remove("ghost", "user-1")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("getDashboard", () => {
    it("aggregates status counts and overdue tasks", async () => {
      mockTaskRepository.countByStatus.mockResolvedValue([
        { status: "todo", count: 2 },
        { status: "done", count: 1 },
      ]);
      mockTaskRepository.listOverdueForUser.mockResolvedValue([fakeTaskWithRelations()]);

      const result = await taskService.getDashboard("project-1", "user-1");

      expect(result.totalTasks).toBe(3);
      expect(result.statusCounts).toEqual({ todo: 2, in_progress: 0, done: 1 });
      expect(result.myOverdueTasks).toHaveLength(1);
    });
  });
});
