import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { taskActivityRepository } from "../../src/module/task-activity/task-activity.repository.js";
import type { logger } from "../../src/lib/logger.js";
import type { MockOf } from "../mock-types.js";

const mockTaskActivityRepository = {
  findTaskById: jest.fn() as MockOf<typeof taskActivityRepository.findTaskById>,
  findProjectMember: jest.fn() as MockOf<typeof taskActivityRepository.findProjectMember>,
  list: jest.fn() as MockOf<typeof taskActivityRepository.list>,
  record: jest.fn() as MockOf<typeof taskActivityRepository.record>,
};

const mockLogger = {
  info: jest.fn() as MockOf<typeof logger.info>,
  warn: jest.fn() as MockOf<typeof logger.warn>,
  error: jest.fn() as MockOf<typeof logger.error>,
  debug: jest.fn() as MockOf<typeof logger.debug>,
};

jest.unstable_mockModule("../../src/module/task-activity/task-activity.repository.js", () => ({
  taskActivityRepository: mockTaskActivityRepository,
}));
jest.unstable_mockModule("../../src/lib/logger.js", () => ({ logger: mockLogger }));

const { taskActivityService } = await import("../../src/module/task-activity/task-activity.service.js");

function fakeActivity(overrides: Record<string, unknown> = {}) {
  return {
    id: "activity-1",
    taskId: "task-1",
    action: "status_changed",
    field: null,
    oldValue: "todo",
    newValue: "in_progress",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    actor: { id: "user-1", name: "Ada", avatarUrl: null },
    ...overrides,
  };
}

describe("taskActivityService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTaskActivityRepository.findTaskById.mockResolvedValue({ id: "task-1", projectId: "project-1" });
    mockTaskActivityRepository.findProjectMember.mockResolvedValue({ id: "member-1" });
  });

  describe("list", () => {
    it("returns paginated activity for a project member", async () => {
      mockTaskActivityRepository.list.mockResolvedValue({ rows: [fakeActivity()], total: 1 });

      const result = await taskActivityService.list("task-1", "user-1", { page: 1, limit: 20 } as never);

      expect(result.activities).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("rejects an unknown task", async () => {
      mockTaskActivityRepository.findTaskById.mockResolvedValue(undefined);

      await expect(
        taskActivityService.list("ghost", "user-1", { page: 1, limit: 20 } as never)
      ).rejects.toMatchObject({ statusCode: 404 });
    });

    it("rejects a non-member", async () => {
      mockTaskActivityRepository.findProjectMember.mockResolvedValue(undefined);

      await expect(
        taskActivityService.list("task-1", "outsider", { page: 1, limit: 20 } as never)
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe("record", () => {
    it("writes an activity row", async () => {
      await taskActivityService.record("task-1", "user-1", "status_changed", "status", "todo", "in_progress");

      expect(mockTaskActivityRepository.record).toHaveBeenCalledWith({
        taskId: "task-1",
        actorId: "user-1",
        action: "status_changed",
        field: "status",
        oldValue: "todo",
        newValue: "in_progress",
      });
    });

    it("swallows repository failures instead of throwing", async () => {
      mockTaskActivityRepository.record.mockRejectedValue(new Error("db down"));

      await expect(
        taskActivityService.record("task-1", "user-1", "status_changed", "status", "todo", "in_progress")
      ).resolves.toBeUndefined();
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });
});
