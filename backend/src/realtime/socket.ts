import type { Server as HttpServer } from "node:http";
import { Server, type Socket } from "socket.io";
import { verifyAccessToken } from "../lib/jwt.js";
import { logger } from "../lib/logger.js";
import { env } from "../config/env.js";
import { conversationRepository } from "../module/conversation/conversation.repository.js";
import type { PublicMessage } from "../module/conversation/conversation.types.js";

interface SocketData {
  userId: string;
}

let io: Server<Record<string, never>, Record<string, never>, Record<string, never>, SocketData> | null = null;

export function userRoom(userId: string): string {
  return `user:${userId}`;
}

export function conversationRoom(conversationId: string): string {
  return `conversation:${conversationId}`;
}

/**
 * Wires up Socket.IO on the same HTTP server as the REST API. Auth happens once at the handshake
 * (`socket.handshake.auth.token`, the same short-lived access token used for Bearer auth) rather
 * than per-event, since a socket connection is long-lived.
 */
export function initSocketServer(httpServer: HttpServer): void {
  io = new Server(httpServer, {
    cors: { origin: env.FRONTEND_URL, credentials: true },
  });

  io.use((socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;
    if (!token) {
      next(new Error("Missing access token"));
      return;
    }

    try {
      const payload = verifyAccessToken(token);
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("Invalid or expired access token"));
    }
  });

  io.on("connection", (socket) => {
    const { userId } = socket.data;
    socket.join(userRoom(userId));

    // Join every conversation this user already belongs to, so messages delivered to
    // `conversationRoom` reach them regardless of which page they currently have open — not just
    // when they happen to have that exact thread mounted. `conversation:join` below stays as a
    // defensive fallback (e.g. a membership added mid-session before a reconnect).
    void conversationRepository.listMyConversationRows(userId).then((rows) => {
      for (const row of rows) socket.join(conversationRoom(row.id));
    });

    socket.on("conversation:join", async (payload: { conversationId?: string }, ack?: (ok: boolean) => void) => {
      const conversationId = payload?.conversationId;
      if (!conversationId) {
        ack?.(false);
        return;
      }

      const membership = await conversationRepository.findMembership(conversationId, userId);
      if (!membership) {
        ack?.(false);
        return;
      }

      socket.join(conversationRoom(conversationId));
      ack?.(true);
    });

    socket.on("conversation:leave", (payload: { conversationId?: string }) => {
      if (payload?.conversationId) {
        socket.leave(conversationRoom(payload.conversationId));
      }
    });

    socket.on("typing:start", (payload: { conversationId?: string }) => {
      if (!payload?.conversationId) return;
      socket.to(conversationRoom(payload.conversationId)).emit("typing:start", { conversationId: payload.conversationId, userId });
    });

    socket.on("typing:stop", (payload: { conversationId?: string }) => {
      if (!payload?.conversationId) return;
      socket.to(conversationRoom(payload.conversationId)).emit("typing:stop", { conversationId: payload.conversationId, userId });
    });
  });

  logger.info("Socket.IO server initialized");
}

/**
 * Real-time pushes are a courtesy layer on top of the REST API, which already returns the
 * authoritative response — so a not-yet-initialized (or not-running, e.g. in tests) socket server
 * is a silent no-op rather than a failure that could take down an otherwise-successful write.
 */
export const realtime = {
  messageCreated(conversationId: string, message: PublicMessage): void {
    io?.to(conversationRoom(conversationId)).emit("message:new", message);
  },

  messageUpdated(conversationId: string, message: PublicMessage): void {
    io?.to(conversationRoom(conversationId)).emit("message:updated", message);
  },

  messageDeleted(conversationId: string, messageId: string): void {
    io?.to(conversationRoom(conversationId)).emit("message:deleted", { conversationId, messageId });
  },

  messageRead(conversationId: string, userId: string, readAt: Date): void {
    io?.to(conversationRoom(conversationId)).emit("message:read", { conversationId, userId, readAt });
  },

  /**
   * A user was added to a DM/channel — joins their already-connected sockets to the new
   * conversation room (so they start receiving its messages immediately, without waiting for a
   * reconnect) and notifies them so their conversation list updates live.
   */
  conversationCreated(memberUserId: string, conversationId: string): void {
    io?.in(userRoom(memberUserId)).socketsJoin(conversationRoom(conversationId));
    io?.to(userRoom(memberUserId)).emit("conversation:new", { conversationId });
  },
};
