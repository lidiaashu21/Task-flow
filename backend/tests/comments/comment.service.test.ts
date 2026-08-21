import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { commentRepository } from "../../src/module/comment/comment.repository.js";
import type { MockOf } from "../mock-types.js";

const mockCommentRepository = {
  findTaskById: jest.fn() as MockOf<typeof commentRepository.findTaskById>,
  findProjectMember: jest.fn() as MockOf<typeof commentRepository.findProjectMember>,
  listCommentsByTask: jest.fn() as MockOf<typeof commentRepository.listCommentsByTask>,
  createComment: jest.fn() as MockOf<typeof commentRepository.createComment>,
  findCommentWithAuthor: jest.fn() as MockOf<typeof commentRepository.findCommentWithAuthor>,
  findCommentById: jest.fn() as MockOf<typeof commentRepository.findCommentById>,
  updateComment: jest.fn() as MockOf<typeof commentRepository.updateComment>,
  findProjectById: jest.fn() as MockOf<typeof commentRepository.findProjectById>,
  deleteComment: jest.fn() as MockOf<typeof commentRepository.deleteComment>,
};

jest.unstable_mockModule("../../src/module/comment/comment.repository.js", () => ({
  commentRepository: mockCommentRepository,
}));

const { commentService } = await import("../../src/module/comment/comment.service.js");

const author = { id: "user-1", name: "Ada", avatarUrl: null };

function fakeComment(overrides: Record<string, unknown> = {}) {
  return {
    id: "comment-1",
    taskId: "task-1",
    body: "Looks good",
    authorId: "user-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function fakeCommentWithAuthor(overrides: Record<string, unknown> = {}) {
  return { ...fakeComment(), author, ...overrides };
}

describe("commentService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCommentRepository.findTaskById.mockResolvedValue({ id: "task-1", projectId: "project-1" });
    mockCommentRepository.findProjectMember.mockResolvedValue({ id: "member-1" });
  });

  describe("list", () => {
    it("returns paginated comments for a project member", async () => {
      mockCommentRepository.listCommentsByTask.mockResolvedValue({ rows: [fakeCommentWithAuthor()], total: 1 });

      const result = await commentService.list("task-1", "user-1", { page: 1, limit: 20 } as never);

      expect(result.comments).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });

    it("rejects an unknown task", async () => {
      mockCommentRepository.findTaskById.mockResolvedValue(undefined);

      await expect(commentService.list("ghost", "user-1", { page: 1, limit: 20 } as never)).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("rejects a non-member", async () => {
      mockCommentRepository.findProjectMember.mockResolvedValue(undefined);

      await expect(commentService.list("task-1", "outsider", { page: 1, limit: 20 } as never)).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("create", () => {
    it("creates a comment for a project member", async () => {
      mockCommentRepository.createComment.mockResolvedValue(fakeComment());
      mockCommentRepository.findCommentWithAuthor.mockResolvedValue(fakeCommentWithAuthor());

      const result = await commentService.create("task-1", "user-1", "Looks good");

      expect(mockCommentRepository.createComment).toHaveBeenCalledWith({ taskId: "task-1", authorId: "user-1", body: "Looks good" });
      expect(result.body).toBe("Looks good");
      expect(result.isEdited).toBe(false);
    });
  });

  describe("update", () => {
    it("lets the author edit their own comment", async () => {
      mockCommentRepository.findCommentById.mockResolvedValue(fakeComment());
      mockCommentRepository.updateComment.mockResolvedValue(
        fakeCommentWithAuthor({ body: "Updated", updatedAt: new Date("2026-01-02T00:00:00.000Z") })
      );

      const result = await commentService.update("comment-1", "user-1", "Updated");

      expect(result.body).toBe("Updated");
      expect(result.isEdited).toBe(true);
    });

    it("rejects an unknown comment", async () => {
      mockCommentRepository.findCommentById.mockResolvedValue(undefined);

      await expect(commentService.update("ghost", "user-1", "Updated")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("rejects editing someone else's comment", async () => {
      mockCommentRepository.findCommentById.mockResolvedValue(fakeComment({ authorId: "user-2" }));

      await expect(commentService.update("comment-1", "user-1", "Updated")).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("remove", () => {
    it("lets the author delete their own comment", async () => {
      mockCommentRepository.findCommentById.mockResolvedValue(fakeComment());

      await commentService.remove("comment-1", "user-1");

      expect(mockCommentRepository.deleteComment).toHaveBeenCalledWith("comment-1");
    });

    it("lets the project owner moderate someone else's comment", async () => {
      mockCommentRepository.findCommentById.mockResolvedValue(fakeComment({ authorId: "user-2" }));
      mockCommentRepository.findProjectById.mockResolvedValue({ id: "project-1", ownerId: "owner-1" });

      await commentService.remove("comment-1", "owner-1");

      expect(mockCommentRepository.deleteComment).toHaveBeenCalledWith("comment-1");
    });

    it("rejects a non-author, non-owner deletion", async () => {
      mockCommentRepository.findCommentById.mockResolvedValue(fakeComment({ authorId: "user-2" }));
      mockCommentRepository.findProjectById.mockResolvedValue({ id: "project-1", ownerId: "owner-1" });

      await expect(commentService.remove("comment-1", "member-3")).rejects.toMatchObject({ statusCode: 403 });
      expect(mockCommentRepository.deleteComment).not.toHaveBeenCalled();
    });

    it("rejects an unknown comment", async () => {
      mockCommentRepository.findCommentById.mockResolvedValue(undefined);

      await expect(commentService.remove("ghost", "user-1")).rejects.toMatchObject({ statusCode: 404 });
    });
  });
});
