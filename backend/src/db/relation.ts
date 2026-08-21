import { relations } from "drizzle-orm";
import { users } from "./schema/user.js";
import { authIdentities } from "./schema/auth-identitie.js";
import { emailVerificationTokens } from "./schema/email-verification.js";
import { passwordResetTokens } from "./schema/password-reset.js";
import { sessions } from "./schema/session.js";
import { projects } from "./schema/project.js";
import { projectMembers } from "./schema/project-member.js";
import { tasks } from "./schema/task.js";
import { comments } from "./schema/comment.js";
import { projectComments } from "./schema/project-comment.js";
import { invitations } from "./schema/invitation.js";
import { conversations } from "./schema/conversation.js";
import { conversationParticipants } from "./schema/conversation-participant.js";
import { messages } from "./schema/message.js";
import { messageReads } from "./schema/message-read.js";
import { tags } from "./schema/tag.js";
import { taskTags } from "./schema/task-tag.js";
import { taskActivity } from "./schema/task-activity.js";

export const usersRelations = relations(users, ({ many }) => ({
  authIdentities: many(authIdentities),
  emailVerificationTokens: many(emailVerificationTokens),
  passwordResetTokens: many(passwordResetTokens),
  sessions: many(sessions),
  ownedProjects: many(projects),
  projectMemberships: many(projectMembers),
  createdTasks: many(tasks, { relationName: "taskCreator" }),
  assignedTasks: many(tasks, { relationName: "taskAssignee" }),
  comments: many(comments),
  projectComments: many(projectComments),
  sentInvitations: many(invitations),
  createdConversations: many(conversations),
  conversationParticipations: many(conversationParticipants),
  sentMessages: many(messages),
  messageReads: many(messageReads),
  taskActivityEntries: many(taskActivity),
}));

export const authIdentitiesRelations = relations(authIdentities, ({ one }) => ({
  user: one(users, { fields: [authIdentities.userId], references: [users.id] }),
}));

export const emailVerificationTokensRelations = relations(emailVerificationTokens, ({ one }) => ({
  user: one(users, { fields: [emailVerificationTokens.userId], references: [users.id] }),
}));

export const passwordResetTokensRelations = relations(passwordResetTokens, ({ one }) => ({
  user: one(users, { fields: [passwordResetTokens.userId], references: [users.id] }),
}));

export const sessionsRelations = relations(sessions, ({ one }) => ({
  user: one(users, { fields: [sessions.userId], references: [users.id] }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
  owner: one(users, { fields: [projects.ownerId], references: [users.id] }),
  members: many(projectMembers),
  tasks: many(tasks),
  invitations: many(invitations),
  conversations: many(conversations),
  tags: many(tags),
  projectComments: many(projectComments),
}));

export const projectMembersRelations = relations(projectMembers, ({ one }) => ({
  project: one(projects, { fields: [projectMembers.projectId], references: [projects.id] }),
  user: one(users, { fields: [projectMembers.userId], references: [users.id] }),
}));

export const tasksRelations = relations(tasks, ({ one, many }) => ({
  project: one(projects, { fields: [tasks.projectId], references: [projects.id] }),
  assignee: one(users, {
    fields: [tasks.assigneeId],
    references: [users.id],
    relationName: "taskAssignee",
  }),
  creator: one(users, {
    fields: [tasks.createdBy],
    references: [users.id],
    relationName: "taskCreator",
  }),
  comments: many(comments),
  taskTags: many(taskTags),
  activity: many(taskActivity),
}));

export const commentsRelations = relations(comments, ({ one }) => ({
  task: one(tasks, { fields: [comments.taskId], references: [tasks.id] }),
  author: one(users, { fields: [comments.authorId], references: [users.id] }),
}));

export const invitationsRelations = relations(invitations, ({ one }) => ({
  project: one(projects, { fields: [invitations.projectId], references: [projects.id] }),
  invitedByUser: one(users, { fields: [invitations.invitedBy], references: [users.id] }),
}));

export const conversationsRelations = relations(conversations, ({ one, many }) => ({
  project: one(projects, { fields: [conversations.projectId], references: [projects.id] }),
  creator: one(users, { fields: [conversations.createdBy], references: [users.id] }),
  participants: many(conversationParticipants),
  messages: many(messages),
}));

export const conversationParticipantsRelations = relations(conversationParticipants, ({ one }) => ({
  conversation: one(conversations, {
    fields: [conversationParticipants.conversationId],
    references: [conversations.id],
  }),
  user: one(users, { fields: [conversationParticipants.userId], references: [users.id] }),
}));

export const messagesRelations = relations(messages, ({ one, many }) => ({
  conversation: one(conversations, { fields: [messages.conversationId], references: [conversations.id] }),
  sender: one(users, { fields: [messages.senderId], references: [users.id] }),
  reads: many(messageReads),
}));

export const messageReadsRelations = relations(messageReads, ({ one }) => ({
  message: one(messages, { fields: [messageReads.messageId], references: [messages.id] }),
  user: one(users, { fields: [messageReads.userId], references: [users.id] }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
  project: one(projects, { fields: [tags.projectId], references: [projects.id] }),
  taskTags: many(taskTags),
}));

export const taskTagsRelations = relations(taskTags, ({ one }) => ({
  task: one(tasks, { fields: [taskTags.taskId], references: [tasks.id] }),
  tag: one(tags, { fields: [taskTags.tagId], references: [tags.id] }),
}));

export const taskActivityRelations = relations(taskActivity, ({ one }) => ({
  task: one(tasks, { fields: [taskActivity.taskId], references: [tasks.id] }),
  actor: one(users, { fields: [taskActivity.actorId], references: [users.id] }),
}));

export const projectCommentsRelations = relations(projectComments, ({ one }) => ({
  project: one(projects, { fields: [projectComments.projectId], references: [projects.id] }),
  author: one(users, { fields: [projectComments.authorId], references: [users.id] }),
}));
