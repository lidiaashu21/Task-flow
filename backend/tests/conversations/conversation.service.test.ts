import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { conversationRepository } from "../../src/module/conversation/conversation.repository.js";
import type { MockOf } from "../mock-types.js";

const mockConversationRepository = {
  listMyConversationRows: jest.fn() as MockOf<typeof conversationRepository.listMyConversationRows>,
  listOtherParticipants: jest.fn() as MockOf<typeof conversationRepository.listOtherParticipants>,
  listLastMessages: jest.fn() as MockOf<typeof conversationRepository.listLastMessages>,
  listUnreadCounts: jest.fn() as MockOf<typeof conversationRepository.listUnreadCounts>,
  findConversationById: jest.fn() as MockOf<typeof conversationRepository.findConversationById>,
  findConversationByDmKey: jest.fn() as MockOf<typeof conversationRepository.findConversationByDmKey>,
  findMembership: jest.fn() as MockOf<typeof conversationRepository.findMembership>,
  listMembers: jest.fn() as MockOf<typeof conversationRepository.listMembers>,
  findUserById: jest.fn() as MockOf<typeof conversationRepository.findUserById>,
  createConversation: jest.fn() as MockOf<typeof conversationRepository.createConversation>,
  addMembers: jest.fn() as MockOf<typeof conversationRepository.addMembers>,
  findProjectMembership: jest.fn() as MockOf<typeof conversationRepository.findProjectMembership>,
  findProjectMemberUserIds: jest.fn() as MockOf<typeof conversationRepository.findProjectMemberUserIds>,
  findExistingUserIds: jest.fn() as MockOf<typeof conversationRepository.findExistingUserIds>,
};

jest.unstable_mockModule("../../src/module/conversation/conversation.repository.js", () => ({
  conversationRepository: mockConversationRepository,
}));

const { conversationService } = await import("../../src/module/conversation/conversation.service.js");

function fakeConversation(overrides: Record<string, unknown> = {}) {
  return {
    id: "conv-1",
    type: "dm",
    name: null,
    projectId: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("conversationService", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockConversationRepository.listOtherParticipants.mockResolvedValue([]);
    mockConversationRepository.listLastMessages.mockResolvedValue([]);
    mockConversationRepository.listUnreadCounts.mockResolvedValue([]);
  });

  describe("listConversations", () => {
    it("returns an empty list without extra queries when the user has none", async () => {
      mockConversationRepository.listMyConversationRows.mockResolvedValue([]);

      const result = await conversationService.listConversations("user-1");

      expect(result).toEqual([]);
      expect(mockConversationRepository.listOtherParticipants).not.toHaveBeenCalled();
    });

    it("merges the other participant, last message, and unread count per conversation", async () => {
      mockConversationRepository.listMyConversationRows.mockResolvedValue([fakeConversation()]);
      mockConversationRepository.listOtherParticipants.mockResolvedValue([
        { conversationId: "conv-1", userId: "user-2", name: "Bob", avatarUrl: null },
      ]);
      mockConversationRepository.listLastMessages.mockResolvedValue([
        { conversationId: "conv-1", id: "msg-1", body: "hi", senderId: "user-2", createdAt: new Date(), deletedAt: null },
      ]);
      mockConversationRepository.listUnreadCounts.mockResolvedValue([{ conversationId: "conv-1", unreadCount: 2 }]);

      const result = await conversationService.listConversations("user-1");

      expect(result[0]).toMatchObject({
        otherParticipant: { id: "user-2", name: "Bob" },
        lastMessage: { body: "hi", isDeleted: false },
        unreadCount: 2,
      });
    });
  });

  describe("getConversation", () => {
    it("returns conversation detail for a participant", async () => {
      mockConversationRepository.findConversationById.mockResolvedValue(fakeConversation());
      mockConversationRepository.findMembership.mockResolvedValue({ conversationId: "conv-1", userId: "user-1" });
      mockConversationRepository.listMembers.mockResolvedValue([]);

      const result = await conversationService.getConversation("conv-1", "user-1");

      expect(result.id).toBe("conv-1");
    });

    it("rejects an unknown conversation", async () => {
      mockConversationRepository.findConversationById.mockResolvedValue(undefined);

      await expect(conversationService.getConversation("ghost", "user-1")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("rejects a non-participant", async () => {
      mockConversationRepository.findConversationById.mockResolvedValue(fakeConversation());
      mockConversationRepository.findMembership.mockResolvedValue(undefined);

      await expect(conversationService.getConversation("conv-1", "outsider")).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("startDm", () => {
    it("rejects starting a conversation with yourself", async () => {
      await expect(conversationService.startDm("user-1", "user-1")).rejects.toMatchObject({ statusCode: 400 });
    });

    it("rejects an unknown recipient", async () => {
      mockConversationRepository.findUserById.mockResolvedValue(undefined);

      await expect(conversationService.startDm("user-1", "ghost")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("returns the existing DM instead of creating a duplicate", async () => {
      mockConversationRepository.findUserById.mockResolvedValue({ id: "user-2", name: "Bob", avatarUrl: null });
      mockConversationRepository.findConversationByDmKey.mockResolvedValue(fakeConversation({ id: "conv-existing" }));

      const result = await conversationService.startDm("user-1", "user-2");

      expect(result.id).toBe("conv-existing");
      expect(mockConversationRepository.createConversation).not.toHaveBeenCalled();
    });

    it("creates a new DM when none exists", async () => {
      mockConversationRepository.findUserById.mockResolvedValue({ id: "user-2", name: "Bob", avatarUrl: null });
      mockConversationRepository.findConversationByDmKey.mockResolvedValue(undefined);
      mockConversationRepository.createConversation.mockResolvedValue(fakeConversation({ id: "conv-new" }));

      const result = await conversationService.startDm("user-1", "user-2");

      expect(mockConversationRepository.addMembers).toHaveBeenCalledWith("conv-new", ["user-1", "user-2"]);
      expect(result.otherParticipant).toEqual({ id: "user-2", name: "Bob", avatarUrl: null });
    });
  });

  describe("createChannel", () => {
    it("creates a project-scoped channel restricted to project members", async () => {
      mockConversationRepository.findProjectMembership.mockResolvedValue({ projectId: "project-1", userId: "user-1" });
      mockConversationRepository.findProjectMemberUserIds.mockResolvedValue(["user-1", "user-2"]);
      mockConversationRepository.createConversation.mockResolvedValue(
        fakeConversation({ id: "conv-channel", type: "channel", name: "general", projectId: "project-1" })
      );

      const result = await conversationService.createChannel("user-1", {
        name: "general",
        projectId: "project-1",
        memberIds: ["user-2"],
      } as never);

      expect(mockConversationRepository.addMembers).toHaveBeenCalledWith("conv-channel", ["user-1", "user-2"]);
      expect(result.type).toBe("channel");
    });

    it("rejects creating a channel in a project the creator doesn't belong to", async () => {
      mockConversationRepository.findProjectMembership.mockResolvedValue(undefined);

      await expect(
        conversationService.createChannel("outsider", {
          name: "general",
          projectId: "project-1",
          memberIds: [],
        } as never)
      ).rejects.toMatchObject({ statusCode: 403 });
    });

    it("creates a projectless channel from any existing users", async () => {
      mockConversationRepository.findExistingUserIds.mockResolvedValue(["user-1", "user-2"]);
      mockConversationRepository.createConversation.mockResolvedValue(
        fakeConversation({ id: "conv-channel", type: "channel", name: "random" })
      );

      await conversationService.createChannel("user-1", { name: "random", memberIds: ["user-2"] } as never);

      expect(mockConversationRepository.findProjectMembership).not.toHaveBeenCalled();
      expect(mockConversationRepository.addMembers).toHaveBeenCalledWith("conv-channel", ["user-1", "user-2"]);
    });
  });
});
