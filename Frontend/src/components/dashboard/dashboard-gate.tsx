"use client";

import { useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { Spinner } from "@/components/ui/spinner";
import { useAuth } from "@/lib/auth/auth-context";
import { DashboardShell } from "./dashboard-shell";

/** Blocks the dashboard behind auth: redirects to /login if there's no valid session. */
export function DashboardGate({ children }: { children: ReactNode }) {
  const { status } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") router.replace("/login");
  }, [status, router]);

  if (status !== "authenticated") {
    return (
      <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
        <Spinner label="Loading your workspace…" />
      </div>
    );
  }

  return <DashboardShell>{children}</DashboardShell>;
}
