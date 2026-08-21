import { commentRepository } from "./comment.repository.js";
import { AppError } from "../../shared/error/app-error.js";
import { getPagination, buildPaginationMeta, type PaginationMeta } from "../../shared/utils/pagination.js";
import {
  toPublicComment,
  toPublicProjectComment,
  type PublicComment,
  type PublicProjectComment,
} from "./comment.types.js";
import type { ListCommentsQuery, ListTaskCommentsQuery } from "./comment.schema.js";

/** A task's project membership gates who can comment on it. */
async function assertTaskCommentAccess(taskId: string, userId: string) {
  const task = await commentRepository.findTaskById(taskId);
  if (!task) {
    throw AppError.notFound("Task not found");
  }

  const membership = await commentRepository.findProjectMember(task.projectId, userId);
  if (!membership) {
    throw AppError.forbidden("You must be a member of this project to comment");
  }

  return task;
}

async function assertProjectMember(projectId: string, userId: string) {
  const project = await commentRepository.findProjectById(projectId);
  if (!project) {
    throw AppError.notFound("Project not found");
  }

  if (project.ownerId === userId) return project;

  const membership = await commentRepository.findProjectMember(projectId, userId);
  if (!membership) {
    throw AppError.forbidden("You must be a member of this project to comment");
  }

  return project;
}

export const commentService = {
  // ---- Task comments ----

  async create(taskId: string, userId: string, body: string): Promise<PublicComment> {
    await assertTaskCommentAccess(taskId, userId);

    const created = await commentRepository.createComment({ taskId, authorId: userId, body });
    const comment = await commentRepository.findCommentWithAuthor(created.id);
    return toPublicComment(comment!);
  },

  async list(
    taskId: string,
    userId: string,
    query: ListTaskCommentsQuery
  ): Promise<{ comments: PublicComment[]; pagination: PaginationMeta }> {
    await assertTaskCommentAccess(taskId, userId);

    const { limit, offset, page } = getPagination(query);
    const { rows, total } = await commentRepository.listCommentsByTask(taskId, limit, offset);

    return {
      comments: rows.map(toPublicComment),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async update(commentId: string, userId: string, body: string): Promise<PublicComment> {
    const comment = await commentRepository.findCommentById(commentId);
    if (!comment) {
      throw AppError.notFound("Comment not found");
    }
    if (comment.authorId !== userId) {
      throw AppError.forbidden("You can only edit your own comments");
    }

    const updated = await commentRepository.updateComment(commentId, body);
    return toPublicComment(updated!);
  },

  /** The comment's author can always remove it; a project owner can also moderate others'. */
  async remove(commentId: string, userId: string): Promise<void> {
    const comment = await commentRepository.findCommentById(commentId);
    if (!comment) {
      throw AppError.notFound("Comment not found");
    }

    if (comment.authorId === userId) {
      await commentRepository.deleteComment(commentId);
      return;
    }

    const task = await commentRepository.findTaskById(comment.taskId);
    const project = task ? await commentRepository.findProjectById(task.projectId) : undefined;
    if (project && project.ownerId === userId) {
      await commentRepository.deleteComment(commentId);
      return;
    }

    throw AppError.forbidden("You can only delete your own comments");
  },

  // ---- Project comments (a discussion thread scoped to the whole project) ----

  async createProjectComment(projectId: string, userId: string, body: string): Promise<PublicProjectComment> {
    await assertProjectMember(projectId, userId);

    const created = await commentRepository.createProjectComment({ projectId, authorId: userId, body });
    const comment = await commentRepository.findProjectCommentWithAuthor(created.id);
    return toPublicProjectComment(comment!);
  },

  async listProjectComments(
    projectId: string,
    userId: string,
    query: ListCommentsQuery
  ): Promise<{ comments: PublicProjectComment[]; pagination: PaginationMeta }> {
    await assertProjectMember(projectId, userId);

    const { limit, offset, page } = getPagination(query);
    const { rows, total } = await commentRepository.listProjectComments(projectId, limit, offset);

    return {
      comments: rows.map(toPublicProjectComment),
      pagination: buildPaginationMeta(page, limit, total),
    };
  },

  async updateProjectComment(commentId: string, userId: string, body: string): Promise<PublicProjectComment> {
    const comment = await commentRepository.findProjectCommentById(commentId);
    if (!comment) {
      throw AppError.notFound("Comment not found");
    }
    if (comment.authorId !== userId) {
      throw AppError.forbidden("You can only edit your own comments");
    }

    const updated = await commentRepository.updateProjectComment(commentId, body);
    return toPublicProjectComment(updated!);
  },

  async deleteProjectComment(commentId: string, userId: string): Promise<void> {
    const comment = await commentRepository.findProjectCommentById(commentId);
    if (!comment) {
      throw AppError.notFound("Comment not found");
    }

    if (comment.authorId === userId) {
      await commentRepository.deleteProjectComment(commentId);
      return;
    }

    const project = await commentRepository.findProjectById(comment.projectId);
    if (project && project.ownerId === userId) {
      await commentRepository.deleteProjectComment(commentId);
      return;
    }

    throw AppError.forbidden("You can only delete your own comments");
  },
};
