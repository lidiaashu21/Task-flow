import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { tagRepository } from "../../src/module/tag/tag.repository.js";
import type { MockOf } from "../mock-types.js";

const mockTagRepository = {
  findProjectMember: jest.fn() as MockOf<typeof tagRepository.findProjectMember>,
  findByProjectAndName: jest.fn() as MockOf<typeof tagRepository.findByProjectAndName>,
  createTag: jest.fn() as MockOf<typeof tagRepository.createTag>,
  listByProject: jest.fn() as MockOf<typeof tagRepository.listByProject>,
  findTagById: jest.fn() as MockOf<typeof tagRepository.findTagById>,
  updateTag: jest.fn() as MockOf<typeof tagRepository.updateTag>,
  deleteTag: jest.fn() as MockOf<typeof tagRepository.deleteTag>,
  findTaskById: jest.fn() as MockOf<typeof tagRepository.findTaskById>,
  attachToTask: jest.fn() as MockOf<typeof tagRepository.attachToTask>,
  detachFromTask: jest.fn() as MockOf<typeof tagRepository.detachFromTask>,
  listByTask: jest.fn() as MockOf<typeof tagRepository.listByTask>,
};

jest.unstable_mockModule("../../src/module/tag/tag.repository.js", () => ({
  tagRepository: mockTagRepository,
}));

const { tagService } = await import("../../src/module/tag/tag.service.js");

function fakeTag(overrides: Record<string, unknown> = {}) {
  return {
    id: "tag-1",
    projectId: "project-1",
    name: "bug",
    color: "#ff0000",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("tagService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockTagRepository.findProjectMember.mockResolvedValue({ id: "member-1" });
  });

  describe("create", () => {
    it("creates a tag when the name is unused", async () => {
      mockTagRepository.findByProjectAndName.mockResolvedValue(undefined);
      mockTagRepository.createTag.mockResolvedValue(fakeTag());

      const result = await tagService.create("project-1", "user-1", { name: "bug", color: "#ff0000" } as never);

      expect(result.name).toBe("bug");
    });

    it("rejects a duplicate tag name", async () => {
      mockTagRepository.findByProjectAndName.mockResolvedValue(fakeTag());

      await expect(
        tagService.create("project-1", "user-1", { name: "bug", color: "#ff0000" } as never)
      ).rejects.toMatchObject({ statusCode: 409 });
    });

    it("rejects a non-member", async () => {
      mockTagRepository.findProjectMember.mockResolvedValue(undefined);

      await expect(
        tagService.create("project-1", "outsider", { name: "bug", color: "#ff0000" } as never)
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe("list", () => {
    it("returns tags for a project member", async () => {
      mockTagRepository.listByProject.mockResolvedValue([fakeTag()]);

      const result = await tagService.list("project-1", "user-1");

      expect(result).toHaveLength(1);
    });
  });

  describe("update", () => {
    it("renames a tag when the new name is free", async () => {
      mockTagRepository.findTagById.mockResolvedValue(fakeTag());
      mockTagRepository.findByProjectAndName.mockResolvedValue(undefined);
      mockTagRepository.updateTag.mockResolvedValue(fakeTag({ name: "feature" }));

      const result = await tagService.update("tag-1", "user-1", { name: "feature" } as never);

      expect(result.name).toBe("feature");
    });

    it("rejects renaming to a name already in use", async () => {
      mockTagRepository.findTagById.mockResolvedValue(fakeTag());
      mockTagRepository.findByProjectAndName.mockResolvedValue(fakeTag({ id: "tag-2", name: "feature" }));

      await expect(tagService.update("tag-1", "user-1", { name: "feature" } as never)).rejects.toMatchObject({
        statusCode: 409,
      });
    });

    it("rejects an unknown tag", async () => {
      mockTagRepository.findTagById.mockResolvedValue(undefined);

      await expect(tagService.update("ghost", "user-1", { name: "feature" } as never)).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("remove", () => {
    it("deletes a tag for a project member", async () => {
      mockTagRepository.findTagById.mockResolvedValue(fakeTag());

      await tagService.remove("tag-1", "user-1");

      expect(mockTagRepository.deleteTag).toHaveBeenCalledWith("tag-1");
    });

    it("rejects an unknown tag", async () => {
      mockTagRepository.findTagById.mockResolvedValue(undefined);

      await expect(tagService.remove("ghost", "user-1")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("attachToTask", () => {
    it("attaches a tag that belongs to the task's project", async () => {
      mockTagRepository.findTaskById.mockResolvedValue({ id: "task-1", projectId: "project-1" });
      mockTagRepository.findTagById.mockResolvedValue(fakeTag());

      await tagService.attachToTask("task-1", "tag-1", "user-1");

      expect(mockTagRepository.attachToTask).toHaveBeenCalledWith("task-1", "tag-1");
    });

    it("rejects a tag from a different project", async () => {
      mockTagRepository.findTaskById.mockResolvedValue({ id: "task-1", projectId: "project-1" });
      mockTagRepository.findTagById.mockResolvedValue(fakeTag({ projectId: "project-2" }));

      await expect(tagService.attachToTask("task-1", "tag-1", "user-1")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("rejects an unknown task", async () => {
      mockTagRepository.findTaskById.mockResolvedValue(undefined);

      await expect(tagService.attachToTask("ghost", "tag-1", "user-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("detachFromTask", () => {
    it("detaches a tag from a task", async () => {
      mockTagRepository.findTaskById.mockResolvedValue({ id: "task-1", projectId: "project-1" });

      await tagService.detachFromTask("task-1", "tag-1", "user-1");

      expect(mockTagRepository.detachFromTask).toHaveBeenCalledWith("task-1", "tag-1");
    });
  });

  describe("listForTask", () => {
    it("returns the tags attached to a task", async () => {
      mockTagRepository.findTaskById.mockResolvedValue({ id: "task-1", projectId: "project-1" });
      mockTagRepository.listByTask.mockResolvedValue([fakeTag()]);

      const result = await tagService.listForTask("task-1", "user-1");

      expect(result).toHaveLength(1);
    });
  });
});
