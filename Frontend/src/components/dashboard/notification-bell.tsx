"use client";

import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useAuth } from "@/lib/auth/auth-context";
import { useSocket } from "@/lib/socket/socket-provider";

interface AppNotification {
  id: string;
  title: string;
  body: string;
  link: string;
  createdAt: string;
  read: boolean;
}

interface ServerNotification {
  title: string;
  body: string;
  link: string;
  createdAt: string;
}

interface IncomingMessage {
  conversationId: string;
  body: string;
  isDeleted: boolean;
  sender: { id: string; name: string };
}

const MAX_STORED = 30;

function timeAgo(iso: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(iso).getTime()) / 1000));
  if (seconds < 60) return "just now";
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`;
  return `${Math.floor(seconds / 86400)}d ago`;
}

function loadStored(storageKey: string): AppNotification[] {
  try {
    const raw = localStorage.getItem(storageKey);
    return raw ? (JSON.parse(raw) as AppNotification[]) : [];
  } catch {
    return [];
  }
}

/** Bell in the dashboard header: live notifications (assigned tasks, task changes, comments, messages). */
export function NotificationBell() {
  const { user } = useAuth();
  // Keyed by user so each account gets its own persisted list, loaded once on mount.
  return user ? <NotificationBellInner key={user.id} userId={user.id} /> : null;
}

function NotificationBellInner({ userId }: { userId: string }) {
  const socket = useSocket();
  const pathname = usePathname();
  const pathnameRef = useRef(pathname);
  const [open, setOpen] = useState(false);
  const storageKey = `taskflow:notifications:${userId}`;
  const [items, setItems] = useState<AppNotification[]>(() => loadStored(storageKey));
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    pathnameRef.current = pathname;
  }, [pathname]);

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(items));
    } catch {
      // Persistence is a convenience only.
    }
  }, [items, storageKey]);

  const push = useCallback((n: Omit<AppNotification, "id" | "read">) => {
    const item: AppNotification = { ...n, id: `${n.createdAt}-${Math.random().toString(36).slice(2)}`, read: false };
    setItems((prev) => [item, ...prev].slice(0, MAX_STORED));
    toast(n.title, { description: n.body });
  }, []);

  useEffect(() => {
    if (!socket) return;

    const onNotification = (n: ServerNotification) => push(n);
    const onMessage = (m: IncomingMessage) => {
      if (m.sender.id === userId || m.isDeleted) return;
      // Already looking at this conversation — no need to notify.
      if (pathnameRef.current.includes(m.conversationId)) return;
      push({
        title: `New message from ${m.sender.name}`,
        body: m.body.length > 80 ? `${m.body.slice(0, 80)}…` : m.body,
        link: `/messages`,
        createdAt: new Date().toISOString(),
      });
    };

    socket.on("notification", onNotification);
    socket.on("message:new", onMessage);
    return () => {
      socket.off("notification", onNotification);
      socket.off("message:new", onMessage);
    };
  }, [socket, userId, push]);

  useEffect(() => {
    if (!open) return;
    function onClick(event: MouseEvent) {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  const unread = items.filter((i) => !i.read).length;

  function markAllRead() {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        className="relative rounded-md p-2.5 text-zinc-600 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800"
      >
        <Bell className="h-7 w-7" />
        {unread > 0 && (
          <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-red-600 px-1 text-[10px] font-semibold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 z-50 mt-2 w-80 max-w-[90vw] rounded-lg border border-zinc-200 solid-white bg-white shadow-lg">
          <div className="flex items-center justify-between border-b border-zinc-200 px-3 py-2 dark:border-zinc-800">
            <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Notifications</span>
            {unread > 0 && (
              <button onClick={markAllRead} className="text-xs text-blue-600 hover:underline dark:text-blue-400">
                Mark all read
              </button>
            )}
          </div>
          <ul className="max-h-96 overflow-y-auto">
            {items.length === 0 ? (
              <li className="px-3 py-6 text-center text-sm text-zinc-500">You&apos;re all caught up.</li>
            ) : (
              items.map((item) => (
                <li key={item.id}>
                  <Link
                    href={item.link}
                    onClick={() => {
                      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
                      setOpen(false);
                    }}
                    className="flex gap-2 border-b border-zinc-100 px-3 py-2.5 last:border-0 hover:bg-zinc-50 dark:border-zinc-900 dark:hover:bg-zinc-900"
                  >
                    <span
                      className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.read ? "bg-transparent" : "bg-blue-600"}`}
                    />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-medium text-zinc-900 dark:text-zinc-50">{item.title}</span>
                      <span className="block truncate text-sm text-zinc-600 dark:text-zinc-400">{item.body}</span>
                      <span className="block text-xs text-zinc-400">{timeAgo(item.createdAt)}</span>
                    </span>
                  </Link>
                </li>
              ))
            )}
          </ul>
        </div>
      )}
    </div>
  );
}
