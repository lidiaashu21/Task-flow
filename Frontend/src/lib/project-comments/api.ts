import type { Fetcher, PaginationMeta } from "../api/types";
import type { PublicProjectComment } from "./types";

export function listProjectComments(
  fetcher: Fetcher,
  projectId: string
): Promise<{ comments: PublicProjectComment[]; pagination: PaginationMeta }> {
  return fetcher<{ comments: PublicProjectComment[]; pagination: PaginationMeta }>(
    `/projects/${projectId}/comments`
  );
}

export function createProjectComment(
  fetcher: Fetcher,
  projectId: string,
  body: string
): Promise<{ comment: PublicProjectComment }> {
  return fetcher<{ comment: PublicProjectComment }>(`/projects/${projectId}/comments`, {
    method: "POST",
    body: { body },
  });
}

export function updateProjectComment(
  fetcher: Fetcher,
  commentId: string,
  body: string
): Promise<{ comment: PublicProjectComment }> {
  return fetcher<{ comment: PublicProjectComment }>(`/comments/${commentId}`, {
    method: "PATCH",
    body: { body },
  });
}

export function deleteProjectComment(fetcher: Fetcher, commentId: string): Promise<{ deleted: true }> {
  return fetcher<{ deleted: true }>(`/comments/${commentId}`, { method: "DELETE" });
}
