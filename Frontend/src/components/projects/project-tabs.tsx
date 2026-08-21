"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";

export function ProjectTabs({ projectId }: { projectId: string }) {
  const pathname = usePathname();
  const tabs = [
    { href: `/projects/${projectId}`, label: "Overview" },
    { href: `/projects/${projectId}/tasks`, label: "Tasks" },
    { href: `/projects/${projectId}/members`, label: "Members" },
    { href: `/projects/${projectId}/comments`, label: "Comments" },
  ];

  return (
    <div className="flex gap-1 border-b border-zinc-200 dark:border-zinc-800">
      {tabs.map((tab) => {
        const active = pathname === tab.href;
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={cn(
              "border-b-2 px-3 pb-2.5 text-sm font-medium transition-colors",
              active
                ? "border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
                : "border-transparent text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
            )}
          >
            {tab.label}
          </Link>
        );
      })}
    </div>
  );
}
