import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { invitationRepository } from "../../src/module/invitation/invitation.repository.js";
import type * as emailLib from "../../src/lib/email.js";
import type { MockOf } from "../mock-types.js";

const mockInvitationRepository = {
  findProjectById: jest.fn() as MockOf<typeof invitationRepository.findProjectById>,
  findMembership: jest.fn() as MockOf<typeof invitationRepository.findMembership>,
  findMemberByEmail: jest.fn() as MockOf<typeof invitationRepository.findMemberByEmail>,
  findPendingInvitation: jest.fn() as MockOf<typeof invitationRepository.findPendingInvitation>,
  refresh: jest.fn() as MockOf<typeof invitationRepository.refresh>,
  createInvitation: jest.fn() as MockOf<typeof invitationRepository.createInvitation>,
  findInvitationWithInviter: jest.fn() as MockOf<typeof invitationRepository.findInvitationWithInviter>,
  listByProject: jest.fn() as MockOf<typeof invitationRepository.listByProject>,
  findInvitationById: jest.fn() as MockOf<typeof invitationRepository.findInvitationById>,
  revoke: jest.fn() as MockOf<typeof invitationRepository.revoke>,
  findInvitationByTokenHash: jest.fn() as MockOf<typeof invitationRepository.findInvitationByTokenHash>,
  addMember: jest.fn() as MockOf<typeof invitationRepository.addMember>,
  markAccepted: jest.fn() as MockOf<typeof invitationRepository.markAccepted>,
  markExpired: jest.fn() as MockOf<typeof invitationRepository.markExpired>,
};

const mockEmail = {
  sendProjectInvitationEmail: jest.fn(async () => {}) as MockOf<typeof emailLib.sendProjectInvitationEmail>,
};

jest.unstable_mockModule("../../src/module/invitation/invitation.repository.js", () => ({
  invitationRepository: mockInvitationRepository,
}));
jest.unstable_mockModule("../../src/lib/email.js", () => mockEmail);

const { invitationService } = await import("../../src/module/invitation/invitation.service.js");

function fakeProject(overrides: Record<string, unknown> = {}) {
  return { id: "project-1", name: "Launch", ownerId: "owner-1", ...overrides };
}

function fakeInvitation(overrides: Record<string, unknown> = {}) {
  return {
    id: "invite-1",
    projectId: "project-1",
    email: "new@example.com",
    role: "member",
    status: "pending",
    expiresAt: new Date(Date.now() + 60_000),
    acceptedAt: null,
    createdAt: new Date(),
    invitedByUser: { id: "owner-1", name: "Owner" },
    ...overrides,
  };
}

describe("invitationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("create", () => {
    it("creates a new invitation and emails the invitee", async () => {
      mockInvitationRepository.findProjectById.mockResolvedValue(fakeProject());
      mockInvitationRepository.findMemberByEmail.mockResolvedValue(undefined);
      mockInvitationRepository.findPendingInvitation.mockResolvedValue(undefined);
      mockInvitationRepository.createInvitation.mockResolvedValue({ id: "invite-1" });
      mockInvitationRepository.findInvitationWithInviter.mockResolvedValue(fakeInvitation());

      const result = await invitationService.create("project-1", "owner-1", {
        email: "new@example.com",
        role: "member",
      } as never);

      expect(mockInvitationRepository.createInvitation).toHaveBeenCalled();
      expect(mockEmail.sendProjectInvitationEmail).toHaveBeenCalledWith("new@example.com", "Launch", expect.any(String));
      expect(result.email).toBe("new@example.com");
    });

    it("rotates the token instead of duplicating a pending invitation", async () => {
      mockInvitationRepository.findProjectById.mockResolvedValue(fakeProject());
      mockInvitationRepository.findMemberByEmail.mockResolvedValue(undefined);
      mockInvitationRepository.findPendingInvitation.mockResolvedValue(fakeInvitation());
      mockInvitationRepository.findInvitationWithInviter.mockResolvedValue(fakeInvitation());

      await invitationService.create("project-1", "owner-1", { email: "new@example.com", role: "member" } as never);

      expect(mockInvitationRepository.refresh).toHaveBeenCalledWith("invite-1", expect.any(String), expect.any(Date));
      expect(mockInvitationRepository.createInvitation).not.toHaveBeenCalled();
    });

    it("rejects a non-owner", async () => {
      mockInvitationRepository.findProjectById.mockResolvedValue(fakeProject());
      mockInvitationRepository.findMembership.mockResolvedValue({ role: "member" });

      await expect(
        invitationService.create("project-1", "member-1", { email: "new@example.com", role: "member" } as never)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("rejects inviting an existing member", async () => {
      mockInvitationRepository.findProjectById.mockResolvedValue(fakeProject());
      mockInvitationRepository.findMemberByEmail.mockResolvedValue({ id: "member-1" });

      await expect(
        invitationService.create("project-1", "owner-1", { email: "existing@example.com", role: "member" } as never)
      ).rejects.toMatchObject({ statusCode: 409 });
    });
  });

  describe("list", () => {
    it("returns paginated invitations for an owner", async () => {
      mockInvitationRepository.findProjectById.mockResolvedValue(fakeProject());
      mockInvitationRepository.listByProject.mockResolvedValue({ rows: [fakeInvitation()], total: 1 });

      const result = await invitationService.list("project-1", "owner-1", { page: 1, limit: 20 } as never);

      expect(result.invitations).toHaveLength(1);
      expect(result.pagination.total).toBe(1);
    });
  });

  describe("resend", () => {
    it("rotates the token for a pending invitation", async () => {
      mockInvitationRepository.findProjectById.mockResolvedValue(fakeProject());
      mockInvitationRepository.findInvitationById.mockResolvedValue(fakeInvitation());
      mockInvitationRepository.findInvitationWithInviter.mockResolvedValue(fakeInvitation());

      await invitationService.resend("project-1", "invite-1", "owner-1");

      expect(mockInvitationRepository.refresh).toHaveBeenCalled();
      expect(mockEmail.sendProjectInvitationEmail).toHaveBeenCalled();
    });

    it("rejects resending an already-accepted invitation", async () => {
      mockInvitationRepository.findProjectById.mockResolvedValue(fakeProject());
      mockInvitationRepository.findInvitationById.mockResolvedValue(fakeInvitation({ status: "accepted" }));

      await expect(invitationService.resend("project-1", "invite-1", "owner-1")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("rejects an unknown invitation", async () => {
      mockInvitationRepository.findProjectById.mockResolvedValue(fakeProject());
      mockInvitationRepository.findInvitationById.mockResolvedValue(undefined);

      await expect(invitationService.resend("project-1", "ghost", "owner-1")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("revoke", () => {
    it("revokes a pending invitation", async () => {
      mockInvitationRepository.findProjectById.mockResolvedValue(fakeProject());
      mockInvitationRepository.findInvitationById.mockResolvedValue(fakeInvitation());

      await invitationService.revoke("project-1", "invite-1", "owner-1");

      expect(mockInvitationRepository.revoke).toHaveBeenCalledWith("invite-1");
    });

    it("rejects revoking a non-pending invitation", async () => {
      mockInvitationRepository.findProjectById.mockResolvedValue(fakeProject());
      mockInvitationRepository.findInvitationById.mockResolvedValue(fakeInvitation({ status: "revoked" }));

      await expect(invitationService.revoke("project-1", "invite-1", "owner-1")).rejects.toMatchObject({
        statusCode: 400,
      });
    });
  });

  describe("preview", () => {
    it("returns a summary for a valid token", async () => {
      mockInvitationRepository.findInvitationByTokenHash.mockResolvedValue({
        ...fakeInvitation(),
        project: { name: "Launch" },
        invitedBy: { name: "Owner" },
      });

      const result = await invitationService.preview("raw-token");

      expect(result).toMatchObject({ projectName: "Launch", invitedByName: "Owner", isExpired: false });
    });

    it("rejects an invalid token", async () => {
      mockInvitationRepository.findInvitationByTokenHash.mockResolvedValue(undefined);

      await expect(invitationService.preview("bad-token")).rejects.toMatchObject({ statusCode: 404 });
    });
  });

  describe("accept", () => {
    it("adds the user as a member and marks the invitation accepted", async () => {
      mockInvitationRepository.findInvitationByTokenHash.mockResolvedValue(fakeInvitation({ email: "new@example.com" }));
      mockInvitationRepository.findInvitationWithInviter.mockResolvedValue(fakeInvitation({ status: "accepted" }));

      const result = await invitationService.accept("raw-token", "user-2", "new@example.com");

      expect(mockInvitationRepository.addMember).toHaveBeenCalledWith("project-1", "user-2");
      expect(mockInvitationRepository.markAccepted).toHaveBeenCalledWith("invite-1");
      expect(result.status).toBe("accepted");
    });

    it("rejects an invalid token", async () => {
      mockInvitationRepository.findInvitationByTokenHash.mockResolvedValue(undefined);

      await expect(invitationService.accept("bad-token", "user-2", "new@example.com")).rejects.toMatchObject({
        statusCode: 404,
      });
    });

    it("rejects an already-used invitation", async () => {
      mockInvitationRepository.findInvitationByTokenHash.mockResolvedValue(fakeInvitation({ status: "accepted" }));

      await expect(invitationService.accept("raw-token", "user-2", "new@example.com")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("rejects an expired invitation", async () => {
      mockInvitationRepository.findInvitationByTokenHash.mockResolvedValue(
        fakeInvitation({ expiresAt: new Date(Date.now() - 60_000) })
      );

      await expect(invitationService.accept("raw-token", "user-2", "new@example.com")).rejects.toMatchObject({
        statusCode: 400,
      });
    });

    it("rejects a mismatched email", async () => {
      mockInvitationRepository.findInvitationByTokenHash.mockResolvedValue(fakeInvitation({ email: "new@example.com" }));

      await expect(invitationService.accept("raw-token", "user-2", "someone-else@example.com")).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });
});
