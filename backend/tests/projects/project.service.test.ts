import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { projectRepository } from "../../src/module/project/project.repository.js";
import type { MockOf } from "../mock-types.js";

const mockProjectRepository = {
  findProjectById: jest.fn() as MockOf<typeof projectRepository.findProjectById>,
  findMembership: jest.fn() as MockOf<typeof projectRepository.findMembership>,
  listMembers: jest.fn() as MockOf<typeof projectRepository.listMembers>,
  createProject: jest.fn() as MockOf<typeof projectRepository.createProject>,
  addMember: jest.fn() as MockOf<typeof projectRepository.addMember>,
  listMyProjects: jest.fn() as MockOf<typeof projectRepository.listMyProjects>,
  updateProject: jest.fn() as MockOf<typeof projectRepository.updateProject>,
  deleteProject: jest.fn() as MockOf<typeof projectRepository.deleteProject>,
  countOwners: jest.fn() as MockOf<typeof projectRepository.countOwners>,
  updateMemberRole: jest.fn() as MockOf<typeof projectRepository.updateMemberRole>,
  removeMember: jest.fn() as MockOf<typeof projectRepository.removeMember>,
};

jest.unstable_mockModule("../../src/module/project/project.repository.js", () => ({
  projectRepository: mockProjectRepository,
}));

const { projectService } = await import("../../src/module/project/project.service.js");

function fakeProject(overrides: Record<string, unknown> = {}) {
  return {
    id: "project-1",
    name: "Launch",
    description: "Ship it",
    ownerId: "owner-1",
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    updatedAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function fakeMembership(overrides: Record<string, unknown> = {}) {
  return { id: "member-1", projectId: "project-1", userId: "owner-1", role: "owner", joinedAt: new Date(), ...overrides };
}

describe("projectService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockProjectRepository.listMembers.mockResolvedValue([]);
  });

  describe("create", () => {
    it("creates the project and adds the creator as owner", async () => {
      mockProjectRepository.createProject.mockResolvedValue(fakeProject());

      const result = await projectService.create("owner-1", { name: "Launch", description: "Ship it" } as never);

      expect(mockProjectRepository.addMember).toHaveBeenCalledWith("project-1", "owner-1", "owner");
      expect(result).toMatchObject({ id: "project-1", myRole: "owner", memberCount: 1, taskCount: 0 });
    });
  });

  describe("list", () => {
    it("returns an empty list without querying counts", async () => {
      mockProjectRepository.listMyProjects.mockResolvedValue({ rows: [], memberCounts: [], taskCounts: [] });

      const result = await projectService.list("owner-1");

      expect(result).toEqual([]);
    });

    it("merges member and task counts per project", async () => {
      mockProjectRepository.listMyProjects.mockResolvedValue({
        rows: [{ id: "project-1", name: "Launch", description: null, myRole: "owner", createdAt: new Date() }],
        memberCounts: [{ projectId: "project-1", count: 3 }],
        taskCounts: [{ projectId: "project-1", count: 5 }],
      });

      const result = await projectService.list("owner-1");

      expect(result[0]).toMatchObject({ memberCount: 3, taskCount: 5 });
    });
  });

  describe("get", () => {
    it("returns project detail for a member", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject());
      mockProjectRepository.findMembership.mockResolvedValue(fakeMembership({ role: "member" }));

      const result = await projectService.get("project-1", "owner-1");

      expect(result.myRole).toBe("member");
    });

    it("rejects for a missing project", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(undefined);

      await expect(projectService.get("ghost", "owner-1")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("rejects for a non-member", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject());
      mockProjectRepository.findMembership.mockResolvedValue(undefined);

      await expect(projectService.get("project-1", "stranger")).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe("update", () => {
    it("lets an owner update the project", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject());
      mockProjectRepository.findMembership.mockResolvedValue(fakeMembership());
      mockProjectRepository.updateProject.mockResolvedValue(fakeProject({ name: "Launch v2" }));

      const result = await projectService.update("project-1", "owner-1", { name: "Launch v2" } as never);

      expect(mockProjectRepository.updateProject).toHaveBeenCalledWith("project-1", { name: "Launch v2" });
      expect(result.name).toBe("Launch v2");
    });

    it("rejects a non-owner", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject());
      mockProjectRepository.findMembership.mockResolvedValue(fakeMembership({ userId: "member-2", role: "member" }));

      await expect(
        projectService.update("project-1", "member-2", { name: "Nope" } as never)
      ).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe("remove", () => {
    it("lets an owner delete the project", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject());
      mockProjectRepository.findMembership.mockResolvedValue(fakeMembership());

      await projectService.remove("project-1", "owner-1");

      expect(mockProjectRepository.deleteProject).toHaveBeenCalledWith("project-1");
    });
  });

  describe("updateMemberRole", () => {
    it("promotes a member to owner", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject());
      mockProjectRepository.findMembership
        .mockResolvedValueOnce(fakeMembership())
        .mockResolvedValueOnce(fakeMembership({ userId: "member-2", role: "member" }));

      await projectService.updateMemberRole("project-1", "owner-1", "member-2", "owner");

      expect(mockProjectRepository.updateMemberRole).toHaveBeenCalledWith("project-1", "member-2", "owner");
    });

    it("rejects demoting the last owner", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject());
      mockProjectRepository.findMembership
        .mockResolvedValueOnce(fakeMembership())
        .mockResolvedValueOnce(fakeMembership({ userId: "owner-1", role: "owner" }));
      mockProjectRepository.countOwners.mockResolvedValue(1);

      await expect(
        projectService.updateMemberRole("project-1", "owner-1", "owner-1", "member")
      ).rejects.toMatchObject({ statusCode: 400 });
      expect(mockProjectRepository.updateMemberRole).not.toHaveBeenCalled();
    });

    it("rejects when the target is not a member", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject());
      mockProjectRepository.findMembership.mockResolvedValueOnce(fakeMembership()).mockResolvedValueOnce(undefined);

      await expect(
        projectService.updateMemberRole("project-1", "owner-1", "ghost", "owner")
      ).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("removeMember", () => {
    it("removes a regular member", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject());
      mockProjectRepository.findMembership
        .mockResolvedValueOnce(fakeMembership())
        .mockResolvedValueOnce(fakeMembership({ userId: "member-2", role: "member" }));

      await projectService.removeMember("project-1", "owner-1", "member-2");

      expect(mockProjectRepository.removeMember).toHaveBeenCalledWith("project-1", "member-2");
    });

    it("rejects removing the project creator", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject({ ownerId: "owner-1" }));
      mockProjectRepository.findMembership.mockResolvedValueOnce(fakeMembership());

      await expect(projectService.removeMember("project-1", "owner-1", "owner-1")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("rejects removing the last owner", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject({ ownerId: "owner-1" }));
      mockProjectRepository.findMembership
        .mockResolvedValueOnce(fakeMembership())
        .mockResolvedValueOnce(fakeMembership({ userId: "owner-2", role: "owner" }));
      mockProjectRepository.countOwners.mockResolvedValue(1);

      await expect(projectService.removeMember("project-1", "owner-1", "owner-2")).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("leave", () => {
    it("lets a regular member leave", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject({ ownerId: "owner-1" }));
      mockProjectRepository.findMembership.mockResolvedValue(fakeMembership({ userId: "member-2", role: "member" }));

      await projectService.leave("project-1", "member-2");

      expect(mockProjectRepository.removeMember).toHaveBeenCalledWith("project-1", "member-2");
    });

    it("rejects the creator leaving without a transfer", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject({ ownerId: "owner-1" }));
      mockProjectRepository.findMembership.mockResolvedValue(fakeMembership());

      await expect(projectService.leave("project-1", "owner-1")).rejects.toMatchObject({ statusCode: 400 });
    });

    it("rejects the last owner leaving", async () => {
      mockProjectRepository.findProjectById.mockResolvedValue(fakeProject({ ownerId: "owner-1" }));
      mockProjectRepository.findMembership.mockResolvedValue(fakeMembership({ userId: "owner-2", role: "owner" }));
      mockProjectRepository.countOwners.mockResolvedValue(1);

      await expect(projectService.leave("project-1", "owner-2")).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
