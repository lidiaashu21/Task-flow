import type { Fetcher } from "../api/types";
import type { ProjectDetail, ProjectRole, ProjectSummary } from "./types";

export async function listProjects(fetcher: Fetcher): Promise<ProjectSummary[]> {
  const { projects } = await fetcher<{ projects: ProjectSummary[] }>("/projects");
  return projects;
}

export function getProject(fetcher: Fetcher, projectId: string): Promise<{ project: ProjectDetail }> {
  return fetcher<{ project: ProjectDetail }>(`/projects/${projectId}`);
}

export function createProject(
  fetcher: Fetcher,
  input: { name: string; description?: string }
): Promise<{ project: ProjectSummary }> {
  return fetcher<{ project: ProjectSummary }>("/projects", { method: "POST", body: input });
}

export function updateProject(
  fetcher: Fetcher,
  projectId: string,
  input: { name?: string; description?: string | null }
): Promise<{ project: ProjectDetail }> {
  return fetcher<{ project: ProjectDetail }>(`/projects/${projectId}`, { method: "PATCH", body: input });
}

export function deleteProject(fetcher: Fetcher, projectId: string): Promise<{ deleted: true }> {
  return fetcher<{ deleted: true }>(`/projects/${projectId}`, { method: "DELETE" });
}

export function updateMemberRole(
  fetcher: Fetcher,
  projectId: string,
  userId: string,
  role: ProjectRole
): Promise<{ updated: true }> {
  return fetcher<{ updated: true }>(`/projects/${projectId}/members/${userId}`, { method: "PATCH", body: { role } });
}

export function removeMember(fetcher: Fetcher, projectId: string, userId: string): Promise<{ removed: true }> {
  return fetcher<{ removed: true }>(`/projects/${projectId}/members/${userId}`, { method: "DELETE" });
}

export function leaveProject(fetcher: Fetcher, projectId: string): Promise<{ left: true }> {
  return fetcher<{ left: true }>(`/projects/${projectId}/members/me`, { method: "DELETE" });
}
