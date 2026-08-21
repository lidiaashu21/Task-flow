"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Spinner } from "@/components/ui/spinner";
import { getAccessToken } from "@/lib/auth/session";

/**
 * The root route has no UI of its own — it just routes to the right place based on whether a
 * session token exists locally. The dashboard re-validates that token for real; this is only a
 * fast, offline redirect so signed-in users don't see the login screen flash first.
 */
export default function Home() {
  const router = useRouter();

  useEffect(() => {
    router.replace(getAccessToken() ? "/dashboard" : "/login");
  }, [router]);

  return (
    <div className="flex min-h-full flex-1 items-center justify-center bg-zinc-50 dark:bg-black">
      <Spinner label="Loading TaskFlow…" />
    </div>
  );
}
