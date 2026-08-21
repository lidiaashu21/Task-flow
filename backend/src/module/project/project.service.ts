import { projectRepository } from "./project.repository.js";
import { AppError } from "../../shared/error/app-error.js";
import type { ProjectDetail, ProjectMemberSummary, ProjectRole, ProjectSummary } from "./project.types.js";
import type { CreateProjectInput, UpdateProjectInput } from "./project.schema.js";
import type { NewProject } from "../../db/schema/project.js";
import type { ProjectMember } from "../../db/schema/project-member.js";
import type { Project } from "../../db/schema/project.js";

/** Confirms the project exists and the user belongs to it. */
async function assertMember(projectId: string, userId: string): Promise<{ project: Project; membership: ProjectMember }> {
  const project = await projectRepository.findProjectById(projectId);
  if (!project) {
    throw AppError.notFound("Project not found");
  }

  const membership = await projectRepository.findMembership(projectId, userId);
  if (!membership) {
    throw AppError.forbidden("You are not a member of this project");
  }

  return { project, membership };
}

/** Owners are either the project's creator or hold an "owner" row in project_members. */
async function assertOwner(projectId: string, userId: string): Promise<Project> {
  const { project, membership } = await assertMember(projectId, userId);
  if (project.ownerId !== userId && membership.role !== "owner") {
    throw AppError.forbidden("Only project owners can do this");
  }
  return project;
}

async function buildDetail(project: Project, myRole: ProjectRole): Promise<ProjectDetail> {
  const members = await projectRepository.listMembers(project.id);

  return {
    id: project.id,
    name: project.name,
    description: project.description,
    ownerId: project.ownerId,
    myRole,
    members: members.map(
      (member): ProjectMemberSummary => ({
        id: member.id,
        name: member.name,
        avatarUrl: member.avatarUrl,
        role: member.role,
        joinedAt: member.joinedAt,
      })
    ),
    createdAt: project.createdAt,
    updatedAt: project.updatedAt,
  };
}

export const projectService = {
  async create(userId: string, input: CreateProjectInput): Promise<ProjectSummary> {
    const project = await projectRepository.createProject(input.name, input.description ?? null, userId);
    await projectRepository.addMember(project.id, userId, "owner");

    return {
      id: project.id,
      name: project.name,
      description: project.description,
      myRole: "owner",
      memberCount: 1,
      taskCount: 0,
      createdAt: project.createdAt,
    };
  },

  async list(userId: string): Promise<ProjectSummary[]> {
    const { rows, memberCounts, taskCounts } = await projectRepository.listMyProjects(userId);
    if (!rows.length) return [];

    const memberCountByProject = new Map(memberCounts.map((row) => [row.projectId, Number(row.count)]));
    const taskCountByProject = new Map(taskCounts.map((row) => [row.projectId, Number(row.count)]));

    return rows.map((row) => ({
      id: row.id,
      name: row.name,
      description: row.description,
      myRole: row.myRole,
      memberCount: memberCountByProject.get(row.id) ?? 0,
      taskCount: taskCountByProject.get(row.id) ?? 0,
      createdAt: row.createdAt,
    }));
  },

  async get(projectId: string, userId: string): Promise<ProjectDetail> {
    const { project, membership } = await assertMember(projectId, userId);
    return buildDetail(project, membership.role);
  },

  async update(projectId: string, userId: string, input: UpdateProjectInput): Promise<ProjectDetail> {
    await assertOwner(projectId, userId);

    const patch: Partial<NewProject> = {};
    if (input.name !== undefined) patch.name = input.name;
    if (input.description !== undefined) patch.description = input.description;

    const project = await projectRepository.updateProject(projectId, patch);
    return buildDetail(project, "owner");
  },

  async remove(projectId: string, userId: string): Promise<void> {
    await assertOwner(projectId, userId);
    await projectRepository.deleteProject(projectId);
  },

  async updateMemberRole(
    projectId: string,
    actingUserId: string,
    targetUserId: string,
    role: ProjectRole
  ): Promise<void> {
    await assertOwner(projectId, actingUserId);

    const membership = await projectRepository.findMembership(projectId, targetUserId);
    if (!membership) {
      throw AppError.notFound("This user is not a member of the project");
    }

    if (membership.role === "owner" && role === "member") {
      const ownerCount = await projectRepository.countOwners(projectId);
      if (ownerCount <= 1) {
        throw AppError.badRequest("A project must have at least one owner");
      }
    }

    await projectRepository.updateMemberRole(projectId, targetUserId, role);
  },

  async removeMember(projectId: string, actingUserId: string, targetUserId: string): Promise<void> {
    const project = await assertOwner(projectId, actingUserId);

    if (project.ownerId === targetUserId) {
      throw AppError.badRequest("The project creator can't be removed");
    }

    const membership = await projectRepository.findMembership(projectId, targetUserId);
    if (!membership) {
      throw AppError.notFound("This user is not a member of the project");
    }

    if (membership.role === "owner") {
      const ownerCount = await projectRepository.countOwners(projectId);
      if (ownerCount <= 1) {
        throw AppError.badRequest("A project must have at least one owner");
      }
    }

    await projectRepository.removeMember(projectId, targetUserId);
  },

  async leave(projectId: string, userId: string): Promise<void> {
    const { project, membership } = await assertMember(projectId, userId);

    if (project.ownerId === userId) {
      throw AppError.badRequest("Transfer ownership before leaving a project you created");
    }

    if (membership.role === "owner") {
      const ownerCount = await projectRepository.countOwners(projectId);
      if (ownerCount <= 1) {
        throw AppError.badRequest("A project must have at least one owner");
      }
    }

    await projectRepository.removeMember(projectId, userId);
  },
};
