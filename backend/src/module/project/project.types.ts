export type ProjectRole = "owner" | "member";

export interface ProjectMemberSummary {
  id: string;
  name: string;
  avatarUrl: string | null;
  role: ProjectRole;
  joinedAt: Date;
}

export interface ProjectSummary {
  id: string;
  name: string;
  description: string | null;
  myRole: ProjectRole;
  memberCount: number;
  taskCount: number;
  createdAt: Date;
}

export interface ProjectDetail {
  id: string;
  name: string;
  description: string | null;
  ownerId: string;
  myRole: ProjectRole;
  members: ProjectMemberSummary[];
  createdAt: Date;
  updatedAt: Date;
}
