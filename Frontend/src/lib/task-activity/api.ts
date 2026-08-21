import type { Fetcher, PaginationMeta } from "../api/types";
import type { PublicTaskActivity } from "./types";

export function listTaskActivity(
  fetcher: Fetcher,
  taskId: string,
  page = 1,
  limit = 30
): Promise<{ activities: PublicTaskActivity[]; pagination: PaginationMeta }> {
  return fetcher<{ activities: PublicTaskActivity[]; pagination: PaginationMeta }>(`/tasks/${taskId}/activity`, {
    query: { page: page.toString(), limit: limit.toString() },
  });
}
