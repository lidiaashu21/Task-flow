import type { Fetcher, PaginationMeta } from "../api/types";
import type { PublicComment } from "./types";

export function listComments(
  fetcher: Fetcher,
  taskId: string,
  page = 1,
  limit = 20
): Promise<{ comments: PublicComment[]; pagination: PaginationMeta }> {
  return fetcher<{ comments: PublicComment[]; pagination: PaginationMeta }>(`/tasks/${taskId}/comments`, {
    query: { page: page.toString(), limit: limit.toString() },
  });
}

export function createComment(fetcher: Fetcher, taskId: string, body: string): Promise<{ comment: PublicComment }> {
  return fetcher<{ comment: PublicComment }>(`/tasks/${taskId}/comments`, { method: "POST", body: { body } });
}

export function updateComment(
  fetcher: Fetcher,
  commentId: string,
  body: string
): Promise<{ comment: PublicComment }> {
  return fetcher<{ comment: PublicComment }>(`/comments/${commentId}`, { method: "PATCH", body: { body } });
}

export function deleteComment(fetcher: Fetcher, commentId: string): Promise<{ deleted: true }> {
  return fetcher<{ deleted: true }>(`/comments/${commentId}`, { method: "DELETE" });
}
