"use client";

import { createContext, useContext, useEffect, useMemo, type ReactNode } from "react";
import { io, type Socket } from "socket.io-client";
import { useAuth } from "../auth/auth-context";
import { WS_BASE_URL } from "../config";

const SocketContext = createContext<Socket | null>(null);

/**
 * One Socket.IO connection shared for the whole authenticated session, re-established whenever the
 * access token changes (login, logout, or a silent refresh). `useSocket()` returns `null` until
 * it's connected — consumers should treat a null socket as "real-time updates aren't live yet".
 *
 * The instance itself is built with `useMemo` (a pure construction, not yet connected) so the
 * effect only ever does the imperative connect/disconnect side effect — it never needs to push the
 * instance into state.
 */
export function SocketProvider({ children }: { children: ReactNode }) {
  const { accessToken, status } = useAuth();

  const socket = useMemo(() => {
    if (status !== "authenticated" || !accessToken) return null;
    return io(WS_BASE_URL, {
      auth: { token: accessToken },
      transports: ["websocket"],
      autoConnect: false,
    });
  }, [status, accessToken]);

  useEffect(() => {
    if (!socket) return;

    socket.connect();
    return () => {
      socket.disconnect();
    };
  }, [socket]);

  return <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>;
}

export function useSocket(): Socket | null {
  return useContext(SocketContext);
}
