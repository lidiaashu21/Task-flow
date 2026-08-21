import type { Metadata } from "next";
import Link from "next/link";
import { Suspense } from "react";
import { Spinner } from "@/components/ui/spinner";
import { AcceptInvitationView } from "./accept-invitation-view";

export const metadata: Metadata = {
  title: "Join project · TaskFlow",
};

export default function AcceptInvitationPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 px-4 py-12 dark:bg-black">
      <Link href="/" className="mb-8 flex items-center gap-2">
        <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-blue-600 text-base font-bold text-white">
          T
        </span>

        <span className="text-lg font-semibold text-zinc-900 dark:text-zinc-50">
          TaskFlow
        </span>
      </Link>

      <div className="w-full max-w-sm">
        <Suspense fallback={<Spinner label="Loading invitation…" />}>
          <AcceptInvitationView />
        </Suspense>
      </div>
    </div>
  );
}
