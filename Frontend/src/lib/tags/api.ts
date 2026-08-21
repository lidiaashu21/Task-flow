import type { Fetcher } from "../api/types";
import type { PublicTag } from "./types";

export async function listProjectTags(fetcher: Fetcher, projectId: string): Promise<PublicTag[]> {
  const { tags } = await fetcher<{ tags: PublicTag[] }>(`/projects/${projectId}/tags`);
  return tags;
}

export function createTag(
  fetcher: Fetcher,
  projectId: string,
  input: { name: string; color: string }
): Promise<{ tag: PublicTag }> {
  return fetcher<{ tag: PublicTag }>(`/projects/${projectId}/tags`, { method: "POST", body: input });
}

export function updateTag(
  fetcher: Fetcher,
  tagId: string,
  input: { name?: string; color?: string }
): Promise<{ tag: PublicTag }> {
  return fetcher<{ tag: PublicTag }>(`/tags/${tagId}`, { method: "PATCH", body: input });
}

export function deleteTag(fetcher: Fetcher, tagId: string): Promise<{ deleted: true }> {
  return fetcher<{ deleted: true }>(`/tags/${tagId}`, { method: "DELETE" });
}

export async function listTaskTags(fetcher: Fetcher, taskId: string): Promise<PublicTag[]> {
  const { tags } = await fetcher<{ tags: PublicTag[] }>(`/tasks/${taskId}/tags`);
  return tags;
}

export function attachTag(fetcher: Fetcher, taskId: string, tagId: string): Promise<{ attached: true }> {
  return fetcher<{ attached: true }>(`/tasks/${taskId}/tags`, { method: "POST", body: { tagId } });
}

export function detachTag(fetcher: Fetcher, taskId: string, tagId: string): Promise<{ detached: true }> {
  return fetcher<{ detached: true }>(`/tasks/${taskId}/tags/${tagId}`, { method: "DELETE" });
}
