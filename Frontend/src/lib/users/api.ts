import type { Fetcher, PaginationMeta } from "../api/types";
import type { MyProfile, PublicProfile } from "./types";

export function getMyProfile(fetcher: Fetcher): Promise<{ user: MyProfile }> {
  return fetcher<{ user: MyProfile }>("/users/me");
}

export function getUserProfile(fetcher: Fetcher, userId: string): Promise<{ user: PublicProfile }> {
  return fetcher<{ user: PublicProfile }>(`/users/${userId}`);
}

export function searchUsers(
  fetcher: Fetcher,
  search: string,
  limit = 10
): Promise<{ users: PublicProfile[]; pagination: PaginationMeta }> {
  return fetcher<{ users: PublicProfile[]; pagination: PaginationMeta }>("/users", {
    query: { search: search || undefined, limit: limit.toString() },
  });
}
