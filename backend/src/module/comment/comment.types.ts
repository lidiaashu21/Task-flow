import type { Comment } from "../../db/schema/comment.js";
import type { ProjectComment } from "../../db/schema/project-comment.js";

type CommentAuthor = { id: string; name: string; avatarUrl: string | null };

export type PublicComment = Omit<Comment, "updatedAt"> & {
  author: CommentAuthor;
  isEdited: boolean;
};

export function toPublicComment(comment: Comment & { author: CommentAuthor }): PublicComment {
  const { updatedAt, createdAt, ...rest } = comment;
  return { ...rest, createdAt, isEdited: updatedAt.getTime() !== createdAt.getTime() };
}

export type PublicProjectComment = Omit<ProjectComment, "updatedAt"> & {
  author: CommentAuthor;
  isEdited: boolean;
};

export function toPublicProjectComment(comment: ProjectComment & { author: CommentAuthor }): PublicProjectComment {
  const { updatedAt, createdAt, ...rest } = comment;
  return { ...rest, createdAt, isEdited: updatedAt.getTime() !== createdAt.getTime() };
}
