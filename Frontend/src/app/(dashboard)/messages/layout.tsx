"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { ConversationListPane } from "@/components/messages/conversation-list-pane";
import { cn } from "@/lib/cn";

export default function MessagesLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isListOnly = pathname === "/messages";
  const activeId = pathname.split("/").pop();

  return (
    <div className="mx-auto flex h-[calc(100vh-6rem)] max-w-6xl gap-4">
      <div className={cn("w-full shrink-0 md:w-80", !isListOnly && "hidden md:block")}>
        <ConversationListPane activeId={isListOnly ? undefined : activeId} />
      </div>
      <div className={cn("min-w-0 flex-1", isListOnly && "hidden md:block")}>{children}</div>
    </div>
  );
}
