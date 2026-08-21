import { jest, describe, it, expect, beforeEach } from "@jest/globals";
import type { messageRepository } from "../../src/module/message/message.repository.js";
import type { MockOf } from "../mock-types.js";

const mockMessageRepository = {
  findConversationById: jest.fn() as MockOf<typeof messageRepository.findConversationById>,
  findMembership: jest.fn() as MockOf<typeof messageRepository.findMembership>,
  listMessagesPage: jest.fn() as MockOf<typeof messageRepository.listMessagesPage>,
  createMessage: jest.fn() as MockOf<typeof messageRepository.createMessage>,
  touchConversation: jest.fn() as MockOf<typeof messageRepository.touchConversation>,
  findMessageWithSender: jest.fn() as MockOf<typeof messageRepository.findMessageWithSender>,
  findMessageById: jest.fn() as MockOf<typeof messageRepository.findMessageById>,
  updateMessage: jest.fn() as MockOf<typeof messageRepository.updateMessage>,
  softDeleteMessage: jest.fn() as MockOf<typeof messageRepository.softDeleteMessage>,
  findLatestMessage: jest.fn() as MockOf<typeof messageRepository.findLatestMessage>,
  updateReadCursor: jest.fn() as MockOf<typeof messageRepository.updateReadCursor>,
  recordMessageRead: jest.fn() as MockOf<typeof messageRepository.recordMessageRead>,
  findUserById: jest.fn() as MockOf<typeof messageRepository.findUserById>,
  findProjectMembership: jest.fn() as MockOf<typeof messageRepository.findProjectMembership>,
  addMembers: jest.fn() as MockOf<typeof messageRepository.addMembers>,
  removeMember: jest.fn() as MockOf<typeof messageRepository.removeMember>,
};

jest.unstable_mockModule("../../src/module/message/message.repository.js", () => ({
  messageRepository: mockMessageRepository,
}));

const { messageService } = await import("../../src/module/message/message.service.js");

const sender = { id: "user-1", name: "Ada", avatarUrl: null };

function fakeConversation(overrides: Record<string, unknown> = {}) {
  return { id: "conv-1", type: "channel", name: "general", projectId: null, createdAt: new Date(), ...overrides };
}

function fakeMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: "msg-1",
    conversationId: "conv-1",
    body: "hello",
    senderId: "user-1",
    editedAt: null,
    deletedAt: null,
    createdAt: new Date("2026-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

function fakeMessageWithSender(overrides: Record<string, unknown> = {}) {
  return { ...fakeMessage(), sender, ...overrides };
}

describe("messageService — messages", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockMessageRepository.findConversationById.mockResolvedValue(fakeConversation());
    mockMessageRepository.findMembership.mockResolvedValue({ id: "membership-1" });
  });

  describe("listMessages", () => {
    it("returns a page of messages for a participant", async () => {
      mockMessageRepository.listMessagesPage.mockResolvedValue({ messages: [fakeMessageWithSender()], hasMore: false });

      const result = await messageService.listMessages("conv-1", "user-1", { limit: 20 } as never);

      expect(result.messages).toHaveLength(1);
      expect(result.hasMore).toBe(false);
    });

    it("rejects a non-participant", async () => {
      mockMessageRepository.findMembership.mockResolvedValue(undefined);

      await expect(messageService.listMessages("conv-1", "outsider", { limit: 20 } as never)).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("sendMessage", () => {
    it("creates the message and touches the conversation", async () => {
      mockMessageRepository.createMessage.mockResolvedValue(fakeMessage());
      mockMessageRepository.findMessageWithSender.mockResolvedValue(fakeMessageWithSender());

      const result = await messageService.sendMessage("conv-1", "user-1", "hello");

      expect(mockMessageRepository.touchConversation).toHaveBeenCalledWith("conv-1", fakeMessage().createdAt);
      expect(result.body).toBe("hello");
    });

    it("rejects a non-participant", async () => {
      mockMessageRepository.findMembership.mockResolvedValue(undefined);

      await expect(messageService.sendMessage("conv-1", "outsider", "hello")).rejects.toMatchObject({
        statusCode: 403,
      });
    });
  });

  describe("editMessage", () => {
    it("lets the sender edit their own message", async () => {
      mockMessageRepository.findMessageById.mockResolvedValue(fakeMessage());
      mockMessageRepository.updateMessage.mockResolvedValue(fakeMessageWithSender({ body: "edited", editedAt: new Date() }));

      const result = await messageService.editMessage("msg-1", "user-1", "edited");

      expect(result.body).toBe("edited");
      expect(result.isEdited).toBe(true);
    });

    it("rejects editing someone else's message", async () => {
      mockMessageRepository.findMessageById.mockResolvedValue(fakeMessage({ senderId: "user-2" }));

      await expect(messageService.editMessage("msg-1", "user-1", "edited")).rejects.toMatchObject({
        statusCode: 403,
      });
    });

    it("rejects editing a deleted message", async () => {
      mockMessageRepository.findMessageById.mockResolvedValue(fakeMessage({ deletedAt: new Date() }));

      await expect(messageService.editMessage("msg-1", "user-1", "edited")).rejects.toMatchObject({
        statusCode: 404,
      });
    });
  });

  describe("deleteMessage", () => {
    it("lets the sender delete their own message", async () => {
      mockMessageRepository.findMessageById.mockResolvedValue(fakeMessage());

      await messageService.deleteMessage("msg-1", "user-1");

      expect(mockMessageRepository.softDeleteMessage).toHaveBeenCalledWith("msg-1");
    });

    it("rejects deleting someone else's message", async () => {
      mockMessageRepository.findMessageById.mockResolvedValue(fakeMessage({ senderId: "user-2" }));

      await expect(messageService.deleteMessage("msg-1", "user-1")).rejects.toMatchObject({ statusCode: 403 });
    });
  });

  describe("markRead", () => {
    it("advances the read cursor to a specific message", async () => {
      mockMessageRepository.findMessageById.mockResolvedValue(fakeMessage());

      await messageService.markRead("conv-1", "user-1", "msg-1");

      expect(mockMessageRepository.updateReadCursor).toHaveBeenCalledWith("conv-1", "user-1", fakeMessage().createdAt);
      expect(mockMessageRepository.recordMessageRead).toHaveBeenCalledWith("msg-1", "user-1");
    });

    it("rejects a message from a different conversation", async () => {
      mockMessageRepository.findMessageById.mockResolvedValue(fakeMessage({ conversationId: "conv-2" }));

      await expect(messageService.markRead("conv-1", "user-1", "msg-1")).rejects.toMatchObject({ statusCode: 404 });
    });

    it("falls back to the latest message when none is specified", async () => {
      mockMessageRepository.findLatestMessage.mockResolvedValue(fakeMessage({ id: "latest-msg" }));

      await messageService.markRead("conv-1", "user-1", undefined);

      expect(mockMessageRepository.updateReadCursor).toHaveBeenCalledWith("conv-1", "user-1", expect.any(Date));
      expect(mockMessageRepository.recordMessageRead).toHaveBeenCalledWith("latest-msg", "user-1");
    });
  });

  describe("addMember", () => {
    it("adds a user to a channel", async () => {
      mockMessageRepository.findUserById.mockResolvedValue({ id: "user-2" });

      await messageService.addMember("conv-1", "user-1", "user-2");

      expect(mockMessageRepository.addMembers).toHaveBeenCalledWith("conv-1", ["user-2"]);
    });

    it("rejects adding a member to a DM", async () => {
      mockMessageRepository.findConversationById.mockResolvedValue(fakeConversation({ type: "dm" }));

      await expect(messageService.addMember("conv-1", "user-1", "user-2")).rejects.toMatchObject({ statusCode: 400 });
    });

    it("rejects a user who isn't in the channel's project", async () => {
      mockMessageRepository.findConversationById.mockResolvedValue(fakeConversation({ projectId: "project-1" }));
      mockMessageRepository.findUserById.mockResolvedValue({ id: "user-2" });
      mockMessageRepository.findProjectMembership.mockResolvedValue(undefined);

      await expect(messageService.addMember("conv-1", "user-1", "user-2")).rejects.toMatchObject({ statusCode: 400 });
    });
  });

  describe("leaveChannel", () => {
    it("removes the user from a channel", async () => {
      await messageService.leaveChannel("conv-1", "user-1");

      expect(mockMessageRepository.removeMember).toHaveBeenCalledWith("conv-1", "user-1");
    });

    it("rejects leaving a DM", async () => {
      mockMessageRepository.findConversationById.mockResolvedValue(fakeConversation({ type: "dm" }));

      await expect(messageService.leaveChannel("conv-1", "user-1")).rejects.toMatchObject({ statusCode: 400 });
    });
  });
});
