export type ProjectRole = "owner" | "member";

export interface ProjectMemberSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: ProjectRole;
  joinedAt: string;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  myRole: ProjectRole;
  memberCount: number;
  taskCount: number;
  createdAt: string;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  myRole: ProjectRole;
  members: ProjectMemberSummary[];
  createdAt: string;
  updatedAt: string;
}
