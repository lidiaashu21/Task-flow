import { drizzle } from "drizzle-orm/postgres-js";
import { client } from "../config/database.js";
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
import * as relations from "./relation.js";

export const schema = {
  users,
  authIdentities,
  emailVerificationTokens,
  passwordResetTokens,
  sessions,
  projects,
  projectMembers,
  tasks,
  comments,
  projectComments,
  invitations,
  conversations,
  conversationParticipants,
  messages,
  messageReads,
  tags,
  taskTags,
  taskActivity,
  ...relations,
};

export const db = drizzle(client, { schema });
